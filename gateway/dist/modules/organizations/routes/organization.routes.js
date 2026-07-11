"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organization_controller_1 = require("../controllers/organization.controller");
const auth_middleware_1 = require("../../../app/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', organization_controller_1.organizationController.getOrganizations);
router.get('/:id', organization_controller_1.organizationController.getOrganizationById);
router.get('/:id/posts', organization_controller_1.organizationController.getOrganizationPosts);
// Auth-required routes
router.post('/', auth_middleware_1.authMiddleware, organization_controller_1.organizationController.createOrganization);
router.post('/:id/join', auth_middleware_1.authMiddleware, organization_controller_1.organizationController.joinOrganization);
router.delete('/:id/leave', auth_middleware_1.authMiddleware, organization_controller_1.organizationController.leaveOrganization);
exports.default = router;
//# sourceMappingURL=organization.routes.js.map