// src/modules/academic/section-content.routes.ts
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import {
  createSectionContentController, getSectionContentsController, getSectionContentByIdController,
  updateSectionContentController, deleteSectionContentController,
  createSectionQuizController, getSectionQuizzesController,
  createSectionAssignmentController, getSectionAssignmentsController,
} from './section-content.controller';
import {
  getTeacherDashboardController, getStudentDashboardController, getAdminSchoolDashboardController,
} from './dashboard.controller';

const router = Router();
router.use(authenticate);

// --- Section Content (TEACHER create/edit, STUDENT read own sections, ADMIN all) ---
router.post('/section-content', authorize('TEACHER'), createSectionContentController);
router.get('/section-content', getSectionContentsController);
router.get('/section-content/:id', getSectionContentByIdController);
router.patch('/section-content/:id', authorize('TEACHER'), updateSectionContentController);
router.delete('/section-content/:id', authorize('TEACHER'), deleteSectionContentController);

// --- Section Quizzes ---
router.post('/section-quizzes', authorize('TEACHER'), createSectionQuizController);
router.get('/section-quizzes', getSectionQuizzesController);

// --- Section Assignments ---
router.post('/section-assignments', authorize('TEACHER'), createSectionAssignmentController);
router.get('/section-assignments', getSectionAssignmentsController);

// --- Dashboards ---
router.get('/teacher/dashboard', authorize('TEACHER', 'ADMIN'), getTeacherDashboardController);
router.get('/student/dashboard', authorize('STUDENT'), getStudentDashboardController);
router.get('/admin/school-dashboard', authorize('ADMIN'), getAdminSchoolDashboardController);

export default router;
