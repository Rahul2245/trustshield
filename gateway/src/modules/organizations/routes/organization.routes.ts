import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { authMiddleware } from '../../../app/middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', organizationController.getOrganizations);
router.get('/:id', organizationController.getOrganizationById);
router.get('/:id/posts', organizationController.getOrganizationPosts);

// Auth-required routes
router.post('/', authMiddleware, organizationController.createOrganization);
router.post('/:id/join', authMiddleware, organizationController.joinOrganization);
router.post('/:id/leave', authMiddleware, organizationController.leaveOrganization);

export default router;
