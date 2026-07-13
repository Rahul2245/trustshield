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
const user_model_1 = require("../../users/models/user.model");
const organization_model_1 = require("../../organizations/models/organization.model");
const AppError_1 = require("../../../core/errors/AppError");
const adminService = new admin_service_1.AdminService();
class PostController {
    // ─────────────────────────────────────────────────────────────
    // CREATE POST — CRITICAL: must stay PENDING + publish to MQ
    // ─────────────────────────────────────────────────────────────
    createPost = async (req, res, next) => {
        try {
            const user = await user_model_1.UserModel.findById(req.user?.id || req.body.authorId);
            if (!user) {
                throw new AppError_1.AppError("User not found or unauthenticated.", 401, "UNAUTHORIZED");
            }
            if (user.isUnderInvestigation) {
                throw new AppError_1.AppError("Your account is under investigation for suspicious activity. You cannot post.", 403, "FORBIDDEN");
            }
            if (req.body.organizationId) {
                const org = await organization_model_1.OrganizationModel.findById(req.body.organizationId);
                if (!org) {
                    throw new AppError_1.AppError("Community not found.", 404, "NOT_FOUND");
                }
                const isMember = org.members.some(id => id.toString() === user._id.toString());
                const isOwner = org.ownerId.toString() === user._id.toString();
                if (!isMember && !isOwner) {
                    throw new AppError_1.AppError("You must join this community before posting in it.", 403, "FORBIDDEN");
                }
            }
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
                    await adminService.processAiWebhook({
                        event_id: post._id.toString(),
                        event_type: 'NEW_POST',
                        correlation_id: correlationId,
                        user_id: userId,
                        risk_score: riskScore,
                        action,
                        timestamp: new Date().toISOString(),
                    });
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
            const query = { author: userId };
            if (req.query.orgId) {
                if (req.query.orgId === 'global') {
                    query.organization = null;
                }
                else {
                    query.organization = req.query.orgId;
                }
            }
            const [posts, total] = await Promise.all([
                post_model_1.PostModel.find(query)
                    .populate('organization', 'name slug avatarImage')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                post_model_1.PostModel.countDocuments(query)
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
    // ─────────────────────────────────────────────────────────────
    // GET FEED — Sort by Hot, New, Top
    // ─────────────────────────────────────────────────────────────
    getFeed = async (req, res, next) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, parseInt(req.query.limit) || 20);
            const skip = (page - 1) * limit;
            const sortType = req.query.sort || 'hot'; // 'hot', 'new', 'top'
            let query = { status: 'APPROVED' };
            if (req.query.orgId) {
                if (req.query.orgId === 'global') {
                    query.organization = null;
                }
                else {
                    query.organization = req.query.orgId;
                }
            }
            else {
                // "All Posts" feed: Global + Joined Communities
                const userOrgs = [];
                if (req.user?.id) {
                    const { OrganizationModel } = require('../../organizations/models/organization.model');
                    const orgs = await OrganizationModel.find({
                        $or: [{ members: req.user.id }, { ownerId: req.user.id }]
                    }).select('_id').lean();
                    userOrgs.push(...orgs.map((o) => o._id));
                }
                query.$or = [
                    { organization: null },
                    { organization: { $in: userOrgs } }
                ];
            }
            if (req.query.topic) {
                query.$text = { $search: req.query.topic };
            }
            let sortObj = { createdAt: -1 };
            if (sortType === 'top') {
                sortObj = { score: -1, createdAt: -1 };
            }
            else if (sortType === 'hot') {
                // Basic hot algorithm approximation: higher score + newer
                sortObj = { score: -1, createdAt: -1 };
            }
            const [posts, total] = await Promise.all([
                post_model_1.PostModel.find(query)
                    .populate('author', 'email avatar bio')
                    .populate('organization', 'name slug avatarImage')
                    .sort(sortObj)
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
    // TOGGLE VOTE (Reddit style)
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
            const post = await post_model_1.PostModel.findById(req.params.id);
            if (!post) {
                res.status(404).json({ success: false, message: 'Post not found' });
                return;
            }
            const userObjId = new mongoose_1.default.Types.ObjectId(userId);
            const hasUpvoted = post.upvotes.some(id => id.equals(userObjId));
            const hasDownvoted = post.downvotes.some(id => id.equals(userObjId));
            // Reset both arrays for this user
            post.upvotes = post.upvotes.filter(id => !id.equals(userObjId));
            post.downvotes = post.downvotes.filter(id => !id.equals(userObjId));
            let currentVote = null;
            if (type === 'up' && !hasUpvoted) {
                post.upvotes.push(userObjId);
                currentVote = 'up';
            }
            else if (type === 'down' && !hasDownvoted) {
                post.downvotes.push(userObjId);
                currentVote = 'down';
            }
            post.score = post.upvotes.length - post.downvotes.length;
            await post.save();
            res.status(200).json({
                success: true,
                data: {
                    upvotes: post.upvotes.length,
                    downvotes: post.downvotes.length,
                    score: post.score,
                    voted: currentVote
                }
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // GET TRENDING TOPICS
    // ─────────────────────────────────────────────────────────────
    getTrendingTopics = async (req, res, next) => {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const pipeline = [
                // 1. Filter posts in the last 7 days
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo }
                    }
                },
                // 2. Extract words starting with '#' or tags
                {
                    $project: {
                        tags: 1,
                        hashtags: {
                            $regexFindAll: {
                                input: "$content",
                                regex: /#[a-zA-Z0-9_]+/
                            }
                        }
                    }
                },
                // 3. Map hashtags regex match to string array and merge with tags
                {
                    $project: {
                        allTopics: {
                            $concatArrays: [
                                { $ifNull: ["$tags", []] },
                                {
                                    $map: {
                                        input: "$hashtags",
                                        as: "match",
                                        in: "$$match.match"
                                    }
                                }
                            ]
                        }
                    }
                },
                // 4. Unwind to process each topic separately
                { $unwind: "$allTopics" },
                // 5. Normalize topic (remove leading # and lowercase, then add # back for consistency)
                {
                    $project: {
                        topic: {
                            $concat: [
                                "#",
                                {
                                    $replaceAll: {
                                        input: { $toLower: "$allTopics" },
                                        find: "#",
                                        replacement: ""
                                    }
                                }
                            ]
                        }
                    }
                },
                // 6. Group and sum occurrences
                {
                    $group: {
                        _id: "$topic",
                        count: { $sum: 1 }
                    }
                },
                // 7. Sort by highest count
                { $sort: { count: -1 } },
                // 8. Limit to top 10
                { $limit: 10 },
                // 9. Format output
                {
                    $project: {
                        _id: 0,
                        topic: "$_id",
                        count: 1
                    }
                }
            ];
            const topics = await post_model_1.PostModel.aggregate(pipeline);
            res.status(200).json({
                success: true,
                data: topics
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // REPORT POST
    // ─────────────────────────────────────────────────────────────
    reportPost = async (req, res, next) => {
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
            const { reason } = req.body;
            if (!reason) {
                res.status(400).json({ success: false, message: 'Reason is required' });
                return;
            }
            const adminServiceInstance = new admin_service_1.AdminService();
            await adminServiceInstance.createUserReport(post._id.toString(), userId, reason, post.author.toString());
            res.status(200).json({ success: true, message: 'Post reported successfully' });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.PostController = PostController;
exports.postController = new PostController();
//# sourceMappingURL=post.controller.js.map