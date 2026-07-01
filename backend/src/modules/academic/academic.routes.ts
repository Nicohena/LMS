// src/modules/academic/academic.routes.ts
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import {
  createAcademicYearController, getAcademicYearsController, getCurrentAcademicYearController,
  createGradeController, getGradesController,
  createSubjectController, getSubjectsController,
  createSectionController, getSectionsController, getSectionStudentsController, getSectionTeachersController,
  assignTeacherController, getSectionSubjectsController,
  assignStudentController, getStudentSectionsController, getTeacherSectionsController,
  removeStudentFromSectionController,
} from './academic.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// --- Academic Years ---
router.post('/academic-years', authorize('ADMIN'), createAcademicYearController);
router.get('/academic-years', getAcademicYearsController);
router.get('/academic-years/current', getCurrentAcademicYearController);

// --- Grades ---
router.post('/grades', authorize('ADMIN'), createGradeController);
router.get('/grades', getGradesController);

// --- Subjects ---
router.post('/subjects', authorize('ADMIN'), createSubjectController);
router.get('/subjects', getSubjectsController);

// --- Sections ---
router.post('/sections', authorize('ADMIN'), createSectionController);
router.get('/sections', getSectionsController);
router.get('/sections/:id/students', getSectionStudentsController);
router.get('/sections/:id/teachers', getSectionTeachersController);

// --- Section-Subjects (teacher assignment) ---
router.post('/section-subjects', authorize('ADMIN'), assignTeacherController);
router.get('/section-subjects', getSectionSubjectsController);

// --- Student-Sections (student enrollment) ---
router.post('/student-sections', authorize('ADMIN'), assignStudentController);
router.get('/users/:id/sections', getStudentSectionsController);
router.get('/users/:id/teacher-sections', getTeacherSectionsController);
router.delete('/users/:id/sections/:sectionId', authorize('ADMIN'), removeStudentFromSectionController);

export default router;
