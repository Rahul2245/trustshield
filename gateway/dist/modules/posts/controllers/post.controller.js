"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postController = exports.PostController = void 0;
const uuid_1 = require("uuid");
const mongoose_1 = __importDefault(require("mongoose"));
const post_model_1 = require("../models/post.model");
const connection_1 = require("../../../infrastructure/rabbitmq/connection");
const logger_1 = require("../../../infrastructure/logger/logger");
const admin_service_1 = require("../../admin/services/admin.service");
const adminService = new admin_service_1.AdminService();
class PostController {
    // ─────────────────────────────────────────────────────────────
    // CREATE POST — CRITICAL: must stay PENDING + publish to MQ
    // ─────────────────────────────────────────────────────────────
    createPost = async (req, res, next) => {
        try {
            const post = new post_model_1.PostModel({
                content: req.body.content,
                author: req.user?.id || req.body.authorId,
                organization: req.body.organizationId || null,
                tags: req.body.tags || [],
                media: req.body.media || [],
                status: 'PENDING' // CRITICAL: always PENDING
            });
            await post.save();
            const correlationId = (0, uuid_1.v4)();
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
            connection_1.rabbitMQClient.publishThreatEvent(mqPayload).catch(err => logger_1.logger.error(err, `Failed to publish post ${post._id} to RabbitMQ`));
            // ─────────────────────────────────────────────────────────
            // Local heuristic fallback (mirrors AI Worker when offline)
            setImmediate(async () => {
                try {
                    const spamPatterns = /free crypto|airdrop|click here|claim now|urgent|phishing|hack|malicious/i;
                    const hatePatterns = /hate|disgusting|kick out|kill|racist/i;
                    let riskScore = 10;
                    let action = 'ALLOW';
                    if (spamPatterns.test(content)) {
                        riskScore = 92;
                        action = 'BLOCK';
                    }
                    else if (hatePatterns.test(content)) {
                        riskScore = 78;
                        action = 'SHADOW';
                    }
                    else if (/https?:\/\//.test(content)) {
                        riskScore = 35;
                        action = 'MONITOR';
                    }
                    const status = action === 'ALLOW' ? 'APPROVED' : action === 'BLOCK' ? 'REJECTED' : 'PENDING';
                    await post_model_1.PostModel.findByIdAndUpdate(post._id, {
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
                }
                catch (err) {
                    logger_1.logger.error(err, `Heuristic analysis failed for post ${post._id}`);
                }
            });
            res.status(202).json({
                success: true,
                message: 'Post created and pending AI validation',
                data: post
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // GET POSTS — paginated feed of APPROVED posts
    // ─────────────────────────────────────────────────────────────
    getPosts = async (req, res, next) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, parseInt(req.query.limit) || 20);
            const skip = (page - 1) * limit;
            const query = { status: 'APPROVED' };
            if (req.query.orgId)
                query.organization = req.query.orgId;
            const [posts, total] = await Promise.all([
                post_model_1.PostModel.find(query)
                    .populate('author', 'email avatar bio')
                    .populate('organization', 'name slug avatarImage')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                post_model_1.PostModel.countDocuments(query)
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
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // GET SINGLE POST
    // ─────────────────────────────────────────────────────────────
    getPostById = async (req, res, next) => {
        try {
            const post = await post_model_1.PostModel.findById(req.params.id)
                .populate('author', 'email avatar bio')
                .populate('organization', 'name slug avatarImage');
            if (!post) {
                res.status(404).json({ success: false, message: 'Post not found' });
                return;
            }
            res.status(200).json({ success: true, data: post });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // UPVOTE
    // ─────────────────────────────────────────────────────────────
    upvotePost = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.body.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required' });
                return;
            }
            const post = await post_model_1.PostModel.findById(req.params.id);
            if (!post) {
                res.status(404).json({ success: false, message: 'Post not found' });
                return;
            }
            const userObjId = new mongoose_1.default.Types.ObjectId(userId);
            const alreadyUpvoted = post.upvotes.some(id => id.equals(userObjId));
            if (alreadyUpvoted) {
                // Toggle off
                post.upvotes = post.upvotes.filter(id => !id.equals(userObjId));
            }
            else {
                post.upvotes.push(userObjId);
                // Remove from downvotes if present
                post.downvotes = post.downvotes.filter(id => !id.equals(userObjId));
            }
            await post.save();
            res.status(200).json({
                success: true,
                data: { upvotes: post.upvotes.length, downvotes: post.downvotes.length, voted: !alreadyUpvoted ? 'up' : null }
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // DOWNVOTE
    // ─────────────────────────────────────────────────────────────
    downvotePost = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.body.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required' });
                return;
            }
            const post = await post_model_1.PostModel.findById(req.params.id);
            if (!post) {
                res.status(404).json({ success: false, message: 'Post not found' });
                return;
            }
            const userObjId = new mongoose_1.default.Types.ObjectId(userId);
            const alreadyDownvoted = post.downvotes.some(id => id.equals(userObjId));
            if (alreadyDownvoted) {
                post.downvotes = post.downvotes.filter(id => !id.equals(userObjId));
            }
            else {
                post.downvotes.push(userObjId);
                post.upvotes = post.upvotes.filter(id => !id.equals(userObjId));
            }
            await post.save();
            res.status(200).json({
                success: true,
                data: { upvotes: post.upvotes.length, downvotes: post.downvotes.length, voted: !alreadyDownvoted ? 'down' : null }
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // MY POSTS — includes PENDING for the author's own view
    // ─────────────────────────────────────────────────────────────
    getMyPosts = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.query.userId;
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, parseInt(req.query.limit) || 20);
            const skip = (page - 1) * limit;
            const [posts, total] = await Promise.all([
                post_model_1.PostModel.find({ author: userId })
                    .populate('organization', 'name slug avatarImage')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                post_model_1.PostModel.countDocuments({ author: userId })
            ]);
            res.status(200).json({
                success: true,
                data: { items: posts, total, page, limit, hasMore: skip + posts.length < total }
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.PostController = PostController;
exports.postController = new PostController();
//# sourceMappingURL=post.controller.js.map