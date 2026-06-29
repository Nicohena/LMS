// src/modules/users/user.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import {
  createUserController,
  getUsersController,
  getUserController,
  updateUserController,
  deleteUserController,
  bulkImportController,
  bulkExportController,
  getProfileController,
  updateProfileController,
  userServiceErrorHandler,
} from './user.controller';
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  userQuerySchema,
} from './user.schemas';

// ---------------------------------------------------------------------------
// Multer upload config (must be defined before routes that use it)
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(), // keep file in memory; bulk imports are small
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB cap
  },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/json' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv') ||
      file.originalname.toLowerCase().endsWith('.json');
    if (ok) cb(null, true);
    else cb(new Error('Only .csv or .json files are allowed.'));
  },
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const router = Router();

// All user routes require authentication.
router.use(authenticate);

// --- Self-service routes (registered FIRST so /me doesn't collide with /:id) ---

router.get('/me', getProfileController);
router.patch('/me', validate({ body: updateProfileSchema }), updateProfileController);

// --- Admin-only routes ---

// Bulk routes — registered before /:id so the path matches correctly.
router.post(
  '/bulk/import',
  authorize('ADMIN'),
  upload.single('file'),
  bulkImportController,
);
router.get(
  '/bulk/export',
  authorize('ADMIN'),
  validate({ query: userQuerySchema }),
  bulkExportController,
);

// CRUD
router.post(
  '/',
  authorize('ADMIN'),
  validate({ body: createUserSchema }),
  createUserController,
);
router.get(
  '/',
  authorize('ADMIN'),
  validate({ query: userQuerySchema }),
  getUsersController,
);
router.get('/:id', authorize('ADMIN'), getUserController);
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate({ body: updateUserSchema }),
  updateUserController,
);
router.delete('/:id', authorize('ADMIN'), deleteUserController);

// Service error handler — converts UserServiceError to HTTP responses.
router.use(userServiceErrorHandler);

export default router;
