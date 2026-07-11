import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { CommentModel } from '../models/comment.model';
import { PostModel } from '../../posts/models/post.model';
import { rabbitMQClient } from '../../../infrastructure/rabbitmq/connection';
import { logger } from '../../../infrastructure/logger/logger';
import { AdminService } from '../../admin/services/admin.service';
import { UserModel } from '../../users/models/user.model';
import { AppError } from '../../../core/errors/AppError';

const adminService = new AdminService();

type CommentWithReplies = InstanceType<typeof CommentModel> & { replies: CommentWithReplies[] };

export class CommentController {

  // ─────────────────────────────────────────────────────────────
  // CREATE COMMENT — publishes to RabbitMQ (CRITICAL: preserve)
  // ─────────────────────────────────────────────────────────────
  public createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await UserModel.findById(req.user?.id || req.body.authorId);
      if (user?.isUnderInvestigation) {
          throw new AppError("Your account is under investigation for suspicious activity. You cannot post comments.", 403, "FORBIDDEN");
      }

      const { content, postId, parentCommentId, authorId } = req.body;

      // Determine depth
      let depth = 0;
      if (parentCommentId) {
        const parent = await CommentModel.findById(parentCommentId).select('depth');
        depth = parent ? Math.min((parent.depth || 0) + 1, 5) : 0;
      }

      const comment = new CommentModel({
        content,
        author: req.user?.id || authorId,
        post: postId,
        parentComment: parentCommentId || null,
        depth,
        status: 'PENDING'
      });

      await comment.save();

      // Increment post commentCount
      await PostModel.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

      const correlationId = uuidv4();
      const userId = comment.author.toString();

      // ── PUBLISH TO RABBITMQ (do NOT remove) ──────────────────
      const mqPayload = {
        eventId: comment._id.toString(),
        eventType: 'NEW_COMMENT',
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
        logger.error(err, `Failed to publish comment ${comment._id} to RabbitMQ`)
      );
      // ─────────────────────────────────────────────────────────

      // Local heuristic fallback
      setImmediate(async () => {
        try {
          const spamPatterns = /free crypto|airdrop|click here|claim now|urgent|phishing|malicious/i;
          const hatePatterns = /hate|disgusting|kick out|kill|racist/i;

          let riskScore = 5;
          let action: 'ALLOW' | 'MONITOR' | 'SHADOW' | 'BLOCK' = 'ALLOW';

          if (spamPatterns.test(content)) { riskScore = 92; action = 'BLOCK'; }
          else if (hatePatterns.test(content)) { riskScore = 75; action = 'SHADOW'; }

          const status = action === 'ALLOW' ? 'APPROVED' : action === 'BLOCK' ? 'REJECTED' : 'PENDING';
          await CommentModel.findByIdAndUpdate(comment._id, {
            status,
            isFlagged: action !== 'ALLOW',
            threatScore: riskScore,
            aiVerdict: action === 'BLOCK' || action === 'SHADOW',
          });

          if (action !== 'ALLOW') {
            await adminService.processAiWebhook({
              event_id: comment._id.toString(),
              event_type: 'new_comment',
              correlation_id: correlationId,
              user_id: userId,
              risk_score: riskScore,
              action,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err) {
          logger.error(err as Error, `Heuristic analysis failed for comment ${comment._id}`);
        }
      });

      const populated = await comment.populate('author', 'email avatar');
      res.status(202).json({
        success: true,
        message: 'Comment created and pending AI validation',
        data: populated
      });
    } catch (error) {
      next(error);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // GET THREADED COMMENTS — nested tree for a post
  // ─────────────────────────────────────────────────────────────
  public getCommentsByPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { postId } = req.params;
      const threaded = req.query.threaded !== 'false';

      const allComments = await CommentModel.find({ post: postId, status: 'APPROVED' })
        .populate('author', 'email avatar bio')
        .sort({ createdAt: 1 })
        .lean() as (typeof CommentModel.prototype & { replies?: unknown[] })[];

      if (!threaded) {
        res.status(200).json({ success: true, data: allComments });
        return;
      }

      // Build nested tree
      const commentMap = new Map<string, CommentWithReplies>();
      const roots: CommentWithReplies[] = [];

      allComments.forEach(c => {
        (c as CommentWithReplies).replies = [];
        commentMap.set(c._id.toString(), c as CommentWithReplies);
      });

      allComments.forEach(c => {
        const parent = (c as CommentWithReplies & { parentComment?: { toString(): string } }).parentComment;
        if (parent) {
          const parentNode = commentMap.get(parent.toString());
          if (parentNode) {
            parentNode.replies.push(c as CommentWithReplies);
          }
        } else {
          roots.push(c as CommentWithReplies);
        }
      });

      res.status(200).json({ success: true, data: roots });
    } catch (error) {
      next(error);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // LIKE COMMENT
  // ─────────────────────────────────────────────────────────────
  public likeComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const comment = await CommentModel.findById(req.params.id);
      if (!comment) {
        res.status(404).json({ success: false, message: 'Comment not found' });
        return;
      }

      const userObjId = new mongoose.Types.ObjectId(userId);
      const alreadyLiked = comment.likes.some(id => id.equals(userObjId));

      if (alreadyLiked) {
        comment.likes = comment.likes.filter(id => !id.equals(userObjId));
      } else {
        comment.likes.push(userObjId);
      }

      await comment.save();
      res.status(200).json({
        success: true,
        data: { likes: comment.likes.length, liked: !alreadyLiked }
      });
    } catch (error) {
      next(error);
    }
  };
}

export const commentController = new CommentController();
