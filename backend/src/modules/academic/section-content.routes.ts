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

// --- Timetable (Weekly Class Schedule) ---
import {
  createTimetableEntryController, createTimetableBatchController,
  getTimetableBySectionController, getStudentTimetableController,
  getTeacherTimetableController,
  deleteTimetableEntryController, deleteTimetableBySectionController,
} from './timetable.controller';

// Admin creates timetable entries
router.post('/timetables', authorize('ADMIN'), createTimetableEntryController);
router.post('/timetables/batch', authorize('ADMIN'), createTimetableBatchController);
// Get timetable for a specific section (admin/teacher)
router.get('/sections/:sectionId/timetable', getTimetableBySectionController);
// Get current student's timetable
router.get('/student/timetable', authorize('STUDENT'), getStudentTimetableController);
// Get current teacher's timetable
router.get('/teacher/timetable', authorize('TEACHER', 'ADMIN'), getTeacherTimetableController);
// Delete
router.delete('/timetables/:id', authorize('ADMIN'), deleteTimetableEntryController);
router.delete('/sections/:sectionId/timetable', authorize('ADMIN'), deleteTimetableBySectionController);
