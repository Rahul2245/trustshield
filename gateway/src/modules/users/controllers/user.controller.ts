import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';

export class UserController {

  // ─────────────────────────────────────────────────────────────
  // GET OWN PROFILE
  // ─────────────────────────────────────────────────────────────
  public getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await UserModel.findById(userId).select('-password');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // UPDATE PROFILE
  // ─────────────────────────────────────────────────────────────
  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const allowed = ['bio', 'avatar', 'coverImage', 'socialLinks'];
      const updates: Record<string, unknown> = {};
      allowed.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const user = await UserModel.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
      res.status(200).json({ success: true, message: 'Profile updated', data: user });
    } catch (error) {
      next(error);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // GET PUBLIC PROFILE BY ID
  // ─────────────────────────────────────────────────────────────
  public getPublicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await UserModel.findById(req.params.id)
        .select('-password -socialLinks');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
