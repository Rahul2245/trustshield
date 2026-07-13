"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentController = exports.CommentController = void 0;
const uuid_1 = require("uuid");
const mongoose_1 = __importDefault(require("mongoose"));
const comment_model_1 = require("../models/comment.model");
const post_model_1 = require("../../posts/models/post.model");
const connection_1 = require("../../../infrastructure/rabbitmq/connection");
const logger_1 = require("../../../infrastructure/logger/logger");
const admin_service_1 = require("../../admin/services/admin.service");
const user_model_1 = require("../../users/models/user.model");
const AppError_1 = require("../../../core/errors/AppError");
const adminService = new admin_service_1.AdminService();
class CommentController {
    // ─────────────────────────────────────────────────────────────
    // CREATE COMMENT — publishes to RabbitMQ (CRITICAL: preserve)
    // ─────────────────────────────────────────────────────────────
    createComment = async (req, res, next) => {
        try {
            const user = await user_model_1.UserModel.findById(req.user?.id || req.body.authorId);
            if (user?.isUnderInvestigation) {
                throw new AppError_1.AppError("Your account is under investigation for suspicious activity. You cannot post comments.", 403, "FORBIDDEN");
            }
            const { content, postId, parentCommentId, authorId } = req.body;
            // Determine depth
            let depth = 0;
            if (parentCommentId) {
                const parent = await comment_model_1.CommentModel.findById(parentCommentId).select('depth');
                depth = parent ? Math.min((parent.depth || 0) + 1, 5) : 0;
            }
            const comment = new comment_model_1.CommentModel({
                content,
                author: req.user?.id || authorId,
                post: postId,
                parentComment: parentCommentId || null,
                depth,
                status: 'PENDING'
            });
            await comment.save();
            // Increment post commentCount
            await post_model_1.PostModel.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
            const correlationId = (0, uuid_1.v4)();
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
                requestId: (0, uuid_1.v4)(),
                metadata: {
                    burstVelocity: 0,
                    targetRecipientRatio: 0,
                    uriHyperlinkDensity: (content.match(/https?:\/\//g) || []).length,
                    sessionDwellDuration: 0,
                    payloadText: content
                },
                timestamp: new Date().toISOString()
            };
            connection_1.rabbitMQClient.publishThreatEvent(mqPayload).catch(err => logger_1.logger.error(err, `Failed to publish comment ${comment._id} to RabbitMQ`));
            // ─────────────────────────────────────────────────────────
            // Local heuristic fallback
            setImmediate(async () => {
                try {
                    const spamPatterns = /free crypto|airdrop|click here|claim now|urgent|phishing|malicious/i;
                    const hatePatterns = /hate|disgusting|kick out|kill|racist/i;
                    let riskScore = 5;
                    let action = 'ALLOW';
                    if (spamPatterns.test(content)) {
                        riskScore = 92;
                        action = 'BLOCK';
                    }
                    else if (hatePatterns.test(content)) {
                        riskScore = 75;
                        action = 'SHADOW';
                    }
                    const status = action === 'ALLOW' ? 'APPROVED' : action === 'BLOCK' ? 'REJECTED' : 'PENDING';
                    await comment_model_1.CommentModel.findByIdAndUpdate(comment._id, {
                        status,
                        isFlagged: action !== 'ALLOW',
                        threatScore: riskScore,
                        aiVerdict: action === 'BLOCK' || action === 'SHADOW',
                    });
                    await adminService.processAiWebhook({
                        event_id: comment._id.toString(),
                        event_type: 'NEW_COMMENT',
                        correlation_id: correlationId,
                        user_id: userId,
                        risk_score: riskScore,
                        action,
                        timestamp: new Date().toISOString(),
                    });
                }
                catch (err) {
                    logger_1.logger.error(err, `Heuristic analysis failed for comment ${comment._id}`);
                }
            });
            const populated = await comment.populate('author', 'email avatar');
            res.status(202).json({
                success: true,
                message: 'Comment created and pending AI validation',
                data: populated
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // GET THREADED COMMENTS — nested tree for a post
    // ─────────────────────────────────────────────────────────────
    getCommentsByPost = async (req, res, next) => {
        try {
            const { postId } = req.params;
            const threaded = req.query.threaded !== 'false';
            const allComments = await comment_model_1.CommentModel.find({ post: postId, status: 'APPROVED' })
                .populate('author', 'email avatar bio')
                .sort({ createdAt: 1 })
                .lean();
            if (!threaded) {
                res.status(200).json({ success: true, data: allComments });
                return;
            }
            // Build nested tree
            const commentMap = new Map();
            const roots = [];
            allComments.forEach(c => {
                c.replies = [];
                commentMap.set(c._id.toString(), c);
            });
            allComments.forEach(c => {
                const parent = c.parentComment;
                if (parent) {
                    const parentNode = commentMap.get(parent.toString());
                    if (parentNode) {
                        parentNode.replies.push(c);
                    }
                }
                else {
                    roots.push(c);
                }
            });
            res.status(200).json({ success: true, data: roots });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // TOGGLE VOTE
    // ─────────────────────────────────────────────────────────────
    toggleVote = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.body.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required' });
                return;
            }
            const { type } = req.body; // 'up' or 'down'
            if (type !== 'up' && type !== 'down') {
                res.status(400).json({ success: false, message: 'Invalid vote type. Use "up" or "down".' });
                return;
            }
            const comment = await comment_model_1.CommentModel.findById(req.params.id);
            if (!comment) {
                res.status(404).json({ success: false, message: 'Comment not found' });
                return;
            }
            const userObjId = new mongoose_1.default.Types.ObjectId(userId);
            const hasUpvoted = comment.upvotes.some(id => id.equals(userObjId));
            const hasDownvoted = comment.downvotes.some(id => id.equals(userObjId));
            comment.upvotes = comment.upvotes.filter(id => !id.equals(userObjId));
            comment.downvotes = comment.downvotes.filter(id => !id.equals(userObjId));
            let currentVote = null;
            if (type === 'up' && !hasUpvoted) {
                comment.upvotes.push(userObjId);
                currentVote = 'up';
            }
            else if (type === 'down' && !hasDownvoted) {
                comment.downvotes.push(userObjId);
                currentVote = 'down';
            }
            comment.score = comment.upvotes.length - comment.downvotes.length;
            await comment.save();
            res.status(200).json({
                success: true,
                data: {
                    upvotes: comment.upvotes.length,
                    downvotes: comment.downvotes.length,
                    score: comment.score,
                    voted: currentVote
                }
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.CommentController = CommentController;
exports.commentController = new CommentController();
//# sourceMappingURL=comment.controller.js.map