import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PostModel } from '../models/post.model';
import { rabbitMQClient } from '../../../infrastructure/rabbitmq/connection';
import { logger } from '../../../infrastructure/logger/logger';
import { AdminService } from '../../admin/services/admin.service';

const adminService = new AdminService();

export class PostController {
  
  public async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Create pending post
      const post = new PostModel({
        content: req.body.content,
        author: req.user?._id || req.body.authorId, // Fallback if auth middleware isn't fully active in this mockup
        tags: req.body.tags || [],
        media: req.body.media || [],
        status: 'PENDING'
      });
      
      await post.save();

      const correlationId = uuidv4();
      const userId = post.author.toString();
      const content = post.content;

      // Push to RabbitMQ for AI validation (async, non-blocking)
      const mqPayload = {
        eventId: post._id.toString(),
        eventType: 'NEW_POST',
        userId,
        email: req.user?.email || 'community@user.org',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'unknown',
        correlationId,
        requestId: uuidv4(),
        metadata: {
          burstVelocity: 0,
          targetRecipientRatio: 0,
          uriHyperlinkDensity: 0,
          sessionDwellDuration: 0,
          payloadText: content
        },
        timestamp: new Date().toISOString()
      };

      rabbitMQClient.publishThreatEvent(mqPayload).catch(err =>
        logger.error(err, `Failed to publish post ${post._id} to RabbitMQ`)
      );

      // === DIRECT ALERT SIMULATION ===
      // Since the AI Worker may not be running, we perform a local heuristic
      // analysis and directly create alerts. This mirrors what the AI worker
      // webhook would do once the AI Worker is online.
      setImmediate(async () => {
        try {
          const spamPatterns = /free crypto|airdrop|click here|claim now|urgent|phishing|hack|malicious/i;
          const hatePatterns = /hate|disgusting|kick out|kill|racist/i;

          let riskScore = 10;
          let action: 'ALLOW' | 'MONITOR' | 'SHADOW' | 'BLOCK' = 'ALLOW';

          if (spamPatterns.test(content)) {
            riskScore = 92;
            action = 'BLOCK';
          } else if (hatePatterns.test(content)) {
            riskScore = 78;
            action = 'SHADOW';
          } else if (content.includes('http://') || content.includes('https://')) {
            riskScore = 45;
            action = 'MONITOR';
          }

          // Update post status based on analysis
          const status = action === 'ALLOW' ? 'APPROVED' : action === 'BLOCK' ? 'REJECTED' : 'PENDING';
          await PostModel.findByIdAndUpdate(post._id, {
            status,
            isFlagged: action !== 'ALLOW',
            threatScore: riskScore,
            aiVerdict: action === 'BLOCK' || action === 'SHADOW',
          });

          // Only create an alert if content is suspicious
          if (action !== 'ALLOW') {
            await adminService.processAiWebhook({
              event_id: post._id.toString(),
              event_type: 'new_post',
              correlation_id: correlationId,
              user_id: userId,
              risk_score: riskScore,
              action,
              timestamp: new Date().toISOString(),
            });
            logger.info(`Alert created for post ${post._id} with action ${action}`);
          }
        } catch (err) {
          logger.error(err as Error, `Failed to create alert for post ${post._id}`);
        }
      });

      res.status(202).json({
        success: true,
        message: 'Post created and pending AI validation',
        data: post
      });
    } catch (error) {
      next(error);
    }
  }

  public async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const posts = await PostModel.find({ status: 'APPROVED' })
        .populate('author', 'email avatar')
        .sort({ createdAt: -1 })
        .limit(50);
        
      res.status(200).json({
        success: true,
        data: posts
      });
    } catch (error) {
      next(error);
    }
  }
}

export const postController = new PostController();
