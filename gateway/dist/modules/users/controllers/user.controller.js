"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_model_1 = require("../models/user.model");
class UserController {
    // ─────────────────────────────────────────────────────────────
    // GET OWN PROFILE
    // ─────────────────────────────────────────────────────────────
    getMyProfile = async (req, res, next) => {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }
            const user = await user_model_1.UserModel.findById(userId).select('-password');
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            res.status(200).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // UPDATE PROFILE
    // ─────────────────────────────────────────────────────────────
    updateProfile = async (req, res, next) => {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }
            const allowed = ['bio', 'avatar', 'coverImage', 'socialLinks'];
            const updates = {};
            allowed.forEach(field => {
                if (req.body[field] !== undefined)
                    updates[field] = req.body[field];
            });
            const user = await user_model_1.UserModel.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
            res.status(200).json({ success: true, message: 'Profile updated', data: user });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // GET PUBLIC PROFILE BY ID
    // ─────────────────────────────────────────────────────────────
    getPublicProfile = async (req, res, next) => {
        try {
            const user = await user_model_1.UserModel.findById(req.params.id)
                .select('-password -socialLinks');
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            res.status(200).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=user.controller.js.map