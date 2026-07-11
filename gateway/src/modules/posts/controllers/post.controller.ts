import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { PostModel } from '../models/post.model';
import { rabbitMQClient } from '../../../infrastructure/rabbitmq/connection';
import { logger } from '../../../infrastructure/logger/logger';
import { AdminService } from '../../admin/services/admin.service';
import { UserModel } from '../../users/models/user.model';
import { AppError } from '../../../core/errors/AppError';

const adminService = new AdminService();

export class PostController {

  // ─────────────────────────────────────────────────────────────
  // CREATE POST — CRITICAL: must stay PENDING + publish to MQ
  // ─────────────────────────────────────────────────────────────
  public createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await UserModel.findById(req.user?.id || req.body.authorId);
      if (user?.isUnderInvestigation) {
          throw new AppError("Your account is under investigation for suspicious activity. You cannot post.", 403, "FORBIDDEN");
      }
      const post = new PostModel({
        content: req.body.content,
        author: req.user?.id || req.body.authorId,
        organization: req.body.organizationId || null,
        tags: req.body.tags || [],
        media: req.body.media || [],
        status: 'PENDING'  // CRITICAL: always PENDING
      });

      await post.save();

      const correlationId = uuidv4();
      const userId = post.author.toString();
      const content = post.content;

      // ── PUBLISH TO RABBITMQ (do NOT remove) ──────────────────
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
          uriHyperlinkDensity: (content.match(/https?:\/\//g) || []).length,
          sessionDwellDuration: 0,
          payloadText: content
        },
        timestamp: new Date().toISOString()
      };
      rabbitMQClient.publishThreatEvent(mqPayload).catch(err =>
        logger.error(err, `Failed to publish post ${post._id} to RabbitMQ`)
      );
      // ─────────────────────────────────────────────────────────

      // Local heuristic fallback (mirrors AI Worker when offline)
      setImmediate(async () => {
        try {
          const spamPatterns = /free crypto|airdrop|click here|claim now|urgent|phishing|hack|malicious/i;
          const hatePatterns = /hate|disgusting|kick out|kill|racist/i;

          let riskScore = 10;
          let action: 'ALLOW' | 'MONITOR' | 'SHADOW' | 'BLOCK' = 'ALLOW';

          if (spamPatterns.test(content)) { riskScore = 92; action = 'BLOCK'; }
          else if (hatePatterns.test(content)) { riskScore = 78; action = 'SHADOW'; }
          else if (/https?:\/\//.test(content)) { riskScore = 35; action = 'MONITOR'; }

          const status = action === 'ALLOW' ? 'APPROVED' : action === 'BLOCK' ? 'REJECTED' : 'PENDING';
          await PostModel.findByIdAndUpdate(post._id, {
            status,
            isFlagged: action !== 'ALLOW',
            threatScore: riskScore,
            aiVerdict: action === 'BLOCK' || action === 'SHADOW',
          });

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
          }
        } catch (err) {
          logger.error(err as Error, `Heuristic analysis failed for post ${post._id}`);
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
  };

  // ─────────────────────────────────────────────────────────────
  // GET POSTS — paginated feed of APPROVED posts
  // ─────────────────────────────────────────────────────────────
  public getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = { status: 'APPROVED' };
      if (req.query.orgId) query.organization = req.query.orgId;

      const [posts, total] = await Promise.all([
        PostModel.find(query)
          .populate('author', 'email avatar bio')
          .populate('organization', 'name slug avatarImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        PostModel.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        data: {
          items: posts,
          total,
          page,
          limit,
          hasMore: skip + posts.length < total
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // GET SINGLE POST
  // ─────────────────────────────────────────────────────────────
  public getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await PostModel.findById(req.params.id)
        .populate('author', 'email avatar bio')
        .populate('organization', 'name slug avatarImage');

      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }
      res.status(200).json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // UPVOTE
  // ─────────────────────────────────────────────────────────────
  public upvotePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const post = await PostModel.findById(req.params.id);
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }

      const userObjId = new mongoose.Types.ObjectId(userId);
      const alreadyUpvoted = post.upvotes.some(id => id.equals(userObjId));

      if (alreadyUpvoted) {
        // Toggle off
        post.upvotes = post.upvotes.filter(id => !id.equals(userObjId));
      } else {
        post.upvotes.push(userObjId);
        // Remove from downvotes if present
        post.downvotes = post.downvotes.filter(id => !id.equals(userObjId));
      }

      await post.save();
      res.status(200).json({
        success: true,
        data: { upvotes: post.upvotes.length, downvotes: post.downvotes.length, voted: !alreadyUpvoted ? 'up' : null }
      });
    } catch (error) {
      next(error);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DOWNVOTE
  // ─────────────────────────────────────────────────────────────
  public downvotePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const post = await PostModel.findById(req.params.id);
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }

      const userObjId = new mongoose.Types.ObjectId(userId);
      const alreadyDownvoted = post.downvotes.some(id => id.equals(userObjId));

      if (alreadyDownvoted) {
        post.downvotes = post.downvotes.filter(id => !id.equals(userObjId));
      } else {
        post.downvotes.push(userObjId);
        post.upvotes = post.upvotes.filter(id => !id.equals(userObjId));
      }

      await post.save();
      res.status(200).json({
        success: true,
        data: { upvotes: post.upvotes.length, downvotes: post.downvotes.length, voted: !alreadyDownvoted ? 'down' : null }
      });
    } catch (error) {
      next(error);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MY POSTS — includes PENDING for the author's own view
  // ─────────────────────────────────────────────────────────────
  public getMyPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || req.query.userId;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        PostModel.find({ author: userId })
          .populate('organization', 'name slug avatarImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        PostModel.countDocuments({ author: userId })
      ]);

      res.status(200).json({
        success: true,
        data: { items: posts, total, page, limit, hasMore: skip + posts.length < total }
      });
    } catch (error) {
      next(error);
    }
  };
}

export const postController = new PostController();
