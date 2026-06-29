// test/quizzes.test.ts
// Tests for the quiz & assessment module: create, questions, attempt, grade.

import request from 'supertest';
import {
  app, loginAsAdmin, loginAsTeacher, loginAsStudent,
  authGet, authPost, authPatch, authDelete,
  getTeacher, getTestCourse, getTestEnrollment,
} from './helpers';
import { prisma } from '../src/lib/prisma';

describe('Quizzes Module', () => {
  let quizId: string;
  let mcqQuestionId: string;
  let essayQuestionId: string;
  let attemptId: string;

  describe('POST /api/v1/quizzes (create quiz)', () => {
    it('should create a quiz as teacher', async () => {
      const teacherCookies = await loginAsTeacher();
      const course = await getTestCourse();

      // Get a content item to link the quiz to
      const courseDetail = await request(app).get(`/api/v1/courses/${course!.id}`);
      const contentId = courseDetail.body.course.modules[0].contents[0].id;

      const res = await authPost('/api/v1/quizzes', teacherCookies, {
        contentId,
        title: 'Test Quiz',
        description: 'A test quiz',
        passingScore: 70,
        maxAttempts: 2,
        showCorrectAnswers: true,
        showFeedback: true,
        status: 'PUBLISHED',
        timeLimit: 30,
      });

      expect(res.status).toBe(201);
      expect(res.body.quiz).toBeDefined();
      expect(res.body.quiz.title).toBe('Test Quiz');
      expect(res.body.quiz.status).toBe('PUBLISHED');
      quizId = res.body.quiz.id;
    });

    it('should block students from creating quizzes (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authPost('/api/v1/quizzes', studentCookies, {
        title: 'Hack Quiz',
      });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/quizzes/:quizId/questions (add questions)', () => {
    it('should add an MCQ-Single question', async () => {
      const teacherCookies = await loginAsTeacher();
      const res = await authPost(`/api/v1/quizzes/${quizId}/questions`, teacherCookies, {
        type: 'MULTIPLE_CHOICE_SINGLE',
        questionText: 'What is 2+2?',
        options: { A: '3', B: '4', C: '5', D: '6' },
        correctAnswer: 'B',
        points: 2,
      });

      expect(res.status).toBe(201);
      expect(res.body.question.type).toBe('MULTIPLE_CHOICE_SINGLE');
      mcqQuestionId = res.body.question.id;
    });

    it('should add a TRUE_FALSE question', async () => {
      const teacherCookies = await loginAsTeacher();
      const res = await authPost(`/api/v1/quizzes/${quizId}/questions`, teacherCookies, {
        type: 'TRUE_FALSE',
        questionText: 'The sky is blue.',
        correctAnswer: false,
        points: 1,
      });

      expect(res.status).toBe(201);
    });

    it('should add an ESSAY question', async () => {
      const teacherCookies = await loginAsTeacher();
      const res = await authPost(`/api/v1/quizzes/${quizId}/questions`, teacherCookies, {
        type: 'ESSAY',
        questionText: 'Explain photosynthesis.',
        points: 5,
      });

      expect(res.status).toBe(201);
      essayQuestionId = res.body.question.id;
    });

    it('should block students from adding questions (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authPost(`/api/v1/quizzes/${quizId}/questions`, studentCookies, {
        type: 'TRUE_FALSE',
        questionText: 'Hack?',
        correctAnswer: true,
      });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/quizzes/:quizId (get quiz)', () => {
    it('should get quiz with questions (correctAnswer hidden for students)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authGet(`/api/v1/quizzes/${quizId}`, studentCookies);

      expect(res.status).toBe(200);
      expect(res.body.quiz.title).toBe('Test Quiz');
      expect(res.body.questions).toBeDefined();
      expect(res.body.questions.length).toBe(3);
      // correctAnswer should NOT be present for students
      res.body.questions.forEach((q: any) => {
        expect(q.correctAnswer).toBeUndefined();
      });
    });

    it('should show correctAnswer for teacher', async () => {
      const teacherCookies = await loginAsTeacher();
      const res = await authGet(`/api/v1/quizzes/${quizId}`, teacherCookies);

      expect(res.status).toBe(200);
      // Teacher sees correctAnswer
      const mcq = res.body.questions.find((q: any) => q.type === 'MULTIPLE_CHOICE_SINGLE');
      expect(mcq.correctAnswer).toBe('B');
    });
  });

  describe('POST /api/v1/quizzes/:quizId/attempts/start (start attempt)', () => {
    it('should start an attempt as student', async () => {
      const studentCookies = await loginAsStudent();
      const enrollment = await getTestEnrollment();

      const res = await authPost(`/api/v1/quizzes/${quizId}/attempts/start`, studentCookies, {
        enrollmentId: enrollment!.id,
      });

      expect(res.status).toBe(201);
      expect(res.body.attempt.status).toBe('IN_PROGRESS');
      attemptId = res.body.attempt.id;
    });
  });

  describe('PATCH /api/v1/quizzes/attempts/:attemptId/progress (save progress)', () => {
    it('should save draft progress', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authPatch(
        `/api/v1/quizzes/attempts/${attemptId}/progress`,
        studentCookies,
        { answers: { [mcqQuestionId]: 'B' }, timeSpent: 60 },
      );

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/quizzes/attempts/:attemptId/submit (submit + auto-grade)', () => {
    it('should submit attempt and auto-grade objective questions', async () => {
      const studentCookies = await loginAsStudent();

      // Get all question IDs
      const quizRes = await authGet(`/api/v1/quizzes/${quizId}`, studentCookies);
      const questions = quizRes.body.questions;
      const tfQuestionId = questions.find((q: any) => q.type === 'TRUE_FALSE').id;

      const res = await authPost(
        `/api/v1/quizzes/attempts/${attemptId}/submit`,
        studentCookies,
        {
          answers: {
            [mcqQuestionId]: 'B',     // correct
            [tfQuestionId]: false,     // correct (sky is blue = true, student says false = incorrect)
            [essayQuestionId]: 'Photosynthesis is the process...', // pending manual grading
          },
          timeSpent: 300,
        },
      );

      expect(res.status).toBe(200);
      expect(res.body.attempt.status).toBe('COMPLETED');
      expect(res.body.attempt.score).toBeDefined();
      expect(res.body.results.hasUngradedManual).toBe(true); // essay pending

      // Check per-question results
      const mcqResult = res.body.results.questions.find((q: any) => q.questionId === mcqQuestionId);
      expect(mcqResult.isCorrect).toBe(true);
      expect(mcqResult.pointsAwarded).toBe(2);
    });
  });

  describe('GET /api/v1/quizzes/:quizId/analytics', () => {
    it('should return quiz analytics for teacher', async () => {
      const teacherCookies = await loginAsTeacher();
      const res = await authGet(`/api/v1/quizzes/${quizId}/analytics`, teacherCookies);

      expect(res.status).toBe(200);
      expect(res.body.analytics.totalAttempts).toBeGreaterThan(0);
      expect(res.body.analytics.questionAnalysis).toBeDefined();
    });

    it('should block students from analytics (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authGet(`/api/v1/quizzes/${quizId}/analytics`, studentCookies);
      expect(res.status).toBe(403);
    });
  });
});
