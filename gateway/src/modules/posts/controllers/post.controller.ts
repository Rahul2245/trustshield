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
        event_id: post._id.toString(),
        event_type: 'new_post',
        user_id: post.author.toString(),
        payload_text: post.content,
        timestamp: new Date().toISOString()
      };

      await rabbitMQClient.publishMessage('security.threat_analysis_queue', payload);
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
