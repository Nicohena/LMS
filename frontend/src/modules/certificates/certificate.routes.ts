// src/modules/certificates/certificate.routes.ts
import { Router } from 'express';
import { authenticate, optionalAuth } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import {
  createTemplateController,
  updateTemplateController,
  deleteTemplateController,
  getTemplatesController,
  issueCertificateController,
  bulkIssueController,
  getMyCertificatesController,
  getCertificateController,
  verifyCertificateController,
  revokeCertificateController,
  certificateErrorHandler,
} from './certificate.controller';
import {
  createCertificateTemplateSchema,
  updateCertificateTemplateSchema,
  issueCertificateSchema,
  bulkIssueSchema,
  revokeCertificateSchema,
} from './certificate.schemas';

const router = Router();

// Public verification (no auth required)
router.get('/verify', verifyCertificateController);

// Authenticated routes
router.use(authenticate);

// Get my certificates (any authenticated user)
router.get('/mine', getMyCertificatesController);

// Get single certificate (owner or admin/teacher)
router.get('/:certificateId', getCertificateController);

// Admin/teacher-only routes
router.post('/templates', authorize('ADMIN'), validate({ body: createCertificateTemplateSchema }), createTemplateController);
router.patch('/templates/:templateId', authorize('ADMIN'), validate({ body: updateCertificateTemplateSchema }), updateTemplateController);
router.delete('/templates/:templateId', authorize('ADMIN'), deleteTemplateController);
router.get('/templates', authorize('ADMIN', 'TEACHER'), getTemplatesController);

router.post('/issue', authorize('ADMIN', 'TEACHER'), validate({ body: issueCertificateSchema }), issueCertificateController);
router.post('/bulk-issue', authorize('ADMIN'), validate({ body: bulkIssueSchema }), bulkIssueController);
router.post('/:certificateId/revoke', authorize('ADMIN'), validate({ body: revokeCertificateSchema }), revokeCertificateController);

router.use(certificateErrorHandler);

export default router;
