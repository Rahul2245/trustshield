import { Request, Response, NextFunction } from 'express';
import { CommentModel } from '../models/comment.model';
import { rabbitMQClient } from '../../../infrastructure/rabbitmq/connection';
import { logger } from '../../../infrastructure/logger/logger';

export class CommentController {
  
  public async createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const comment = new CommentModel({
        content: req.body.content,
        author: req.user?._id || req.body.authorId,
        post: req.body.postId,
        parentComment: req.body.parentCommentId,
        status: 'PENDING'
      });
      
      await comment.save();

      // Push to RabbitMQ for AI validation
      const payload = {
        event_id: comment._id.toString(),
        event_type: 'new_comment',
        user_id: comment.author.toString(),
        payload_text: comment.content,
        timestamp: new Date().toISOString()
      };

      await rabbitMQClient.publishMessage('security.threat_analysis_queue', payload);
      logger.info(`Comment ${comment._id} sent to AI validation queue`);

      res.status(202).json({
        success: true,
        message: 'Comment created and pending AI validation',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  public async getCommentsByPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const comments = await CommentModel.find({ post: postId, status: 'APPROVED' })
        .populate('author', 'email avatar')
        .sort({ createdAt: 1 });
        
      res.status(200).json({
        success: true,
        data: comments
      });
    } catch (error) {
      next(error);
    }
  }
}

export const commentController = new CommentController();
