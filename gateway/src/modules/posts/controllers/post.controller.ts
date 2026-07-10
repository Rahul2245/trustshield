import { Request, Response, NextFunction } from 'express';
import { PostModel } from '../models/post.model';
import { rabbitMQClient } from '../../../infrastructure/rabbitmq/connection';
import { logger } from '../../../infrastructure/logger/logger';

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

      // Push to RabbitMQ for AI validation
      const payload = {
        eventId: post._id.toString(),
        eventType: 'NEW_POST',
        userId: post.author.toString(),
        email: "unknown@example.com", // Fetch if possible or leave dummy
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'unknown',
        correlationId: require('crypto').randomUUID(),
        requestId: require('crypto').randomUUID(),
        metadata: {
          burstVelocity: 0,
          targetRecipientRatio: 0,
          uriHyperlinkDensity: 0,
          sessionDwellDuration: 0,
          payloadText: post.content
        },
        timestamp: new Date().toISOString()
      };

      await rabbitMQClient.publishThreatEvent(payload);
      logger.info(`Post ${post._id} sent to AI validation queue`);

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
