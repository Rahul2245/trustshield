"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationController = exports.OrganizationController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const organization_model_1 = require("../models/organization.model");
const post_model_1 = require("../../posts/models/post.model");
class OrganizationController {
    // ─────────────────────────────────────────────────────────────
    // LIST ALL ORGS — paginated
    // ─────────────────────────────────────────────────────────────
    getOrganizations = async (req, res, next) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, parseInt(req.query.limit) || 20);
            const skip = (page - 1) * limit;
            const search = req.query.search;
            const query = {};
            if (search) {
                query.$text = { $search: search };
            }
            const [orgs, total] = await Promise.all([
                organization_model_1.OrganizationModel.find(query)
                    .populate('ownerId', 'email avatar')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                organization_model_1.OrganizationModel.countDocuments(query)
            ]);
            // Add member count
            const enriched = orgs.map(org => ({
                ...org,
                memberCount: org.members.length
            }));
            res.status(200).json({
                success: true,
                data: { items: enriched, total, page, limit }
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // GET ORG BY ID or SLUG
    // ─────────────────────────────────────────────────────────────
    getOrganizationById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(id);
            const org = await organization_model_1.OrganizationModel
                .findOne(isObjectId ? { _id: id } : { slug: id })
                .populate('ownerId', 'email avatar');
            if (!org) {
                res.status(404).json({ success: false, message: 'Organization not found' });
                return;
            }
            res.status(200).json({
                success: true,
                data: { ...org.toObject(), memberCount: org.members.length }
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // CREATE ORG (auth required)
    // ─────────────────────────────────────────────────────────────
    createOrganization = async (req, res, next) => {
        try {
            const { name, description, rules, bannerImage, avatarImage, tags, isPrivate } = req.body;
            const ownerId = req.user?.id;
            if (!ownerId) {
                res.status(401).json({ success: false, message: 'Authentication required' });
                return;
            }
            // Generate slug from name
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const org = new organization_model_1.OrganizationModel({
                name,
                slug,
                description,
                ownerId,
                members: [ownerId], // owner is always a member
                rules: rules || [],
                bannerImage: bannerImage || null,
                avatarImage: avatarImage || null,
                tags: tags || [],
                isPrivate: isPrivate || false
            });
            await org.save();
            res.status(201).json({ success: true, message: 'Organization created', data: org });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // JOIN ORG (auth required)
    // ─────────────────────────────────────────────────────────────
    joinOrganization = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required' });
                return;
            }
            const org = await organization_model_1.OrganizationModel.findById(req.params.id);
            if (!org) {
                res.status(404).json({ success: false, message: 'Organization not found' });
                return;
            }
            const userObjId = new mongoose_1.default.Types.ObjectId(userId);
            const alreadyMember = org.members.some(id => id.equals(userObjId));
            if (!alreadyMember) {
                org.members.push(userObjId);
                await org.save();
            }
            res.status(200).json({
                success: true,
                message: alreadyMember ? 'Already a member' : 'Joined successfully',
                data: { memberCount: org.members.length, isMember: true }
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // LEAVE ORG (auth required)
    // ─────────────────────────────────────────────────────────────
    leaveOrganization = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required' });
                return;
            }
            const org = await organization_model_1.OrganizationModel.findById(req.params.id);
            if (!org) {
                res.status(404).json({ success: false, message: 'Organization not found' });
                return;
            }
            // Owner cannot leave
            if (org.ownerId.equals(new mongoose_1.default.Types.ObjectId(userId))) {
                res.status(400).json({ success: false, message: 'Owner cannot leave. Transfer ownership first.' });
                return;
            }
            const userObjId = new mongoose_1.default.Types.ObjectId(userId);
            org.members = org.members.filter(id => !id.equals(userObjId));
            await org.save();
            res.status(200).json({
                success: true,
                message: 'Left organization',
                data: { memberCount: org.members.length, isMember: false }
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ─────────────────────────────────────────────────────────────
    // GET ORG POSTS — approved posts for this org
    // ─────────────────────────────────────────────────────────────
    getOrganizationPosts = async (req, res, next) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, parseInt(req.query.limit) || 20);
            const skip = (page - 1) * limit;
            const [posts, total] = await Promise.all([
                post_model_1.PostModel.find({ organization: req.params.id, status: 'APPROVED' })
                    .populate('author', 'email avatar bio')
                    .populate('organization', 'name slug avatarImage')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                post_model_1.PostModel.countDocuments({ organization: req.params.id, status: 'APPROVED' })
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
exports.OrganizationController = OrganizationController;
exports.organizationController = new OrganizationController();
//# sourceMappingURL=organization.controller.js.map