'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useAuthStore } from './auth-store';

// ─── Auth ────────────────────────────────────────────────────────────────

export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await api.post('/auth/login', { email, password });
      return res.data;
    },
    onSuccess: (data) => {
      // Extract access token from cookies — the backend sets HTTP-only cookies,
      // but also returns user data. We store the user in Zustand.
      setAuth(data.user, 'cookie-based');
      queryClient.invalidateQueries({ queryKey: ['me'] });
      // Lazily establish the Socket.io connection now that we're authenticated
      if (typeof window !== 'undefined') {
        import('./socket').then(({ getSocket }) => getSocket()).catch(() => {});
      }
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

// ─── Users ───────────────────────────────────────────────────────────────

export function useUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const res = await api.get('/users', { params });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      firstName: string;
      lastName: string;
      role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
      password?: string;
      mustChangePassword?: boolean;
      isActive?: boolean;
      bio?: string;
    }) => {
      const res = await api.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: {
      firstName?: string;
      lastName?: string;
      role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
      isActive?: boolean;
      bio?: string;
      profilePicture?: string;
      mustChangePassword?: boolean;
    } }) => {
      const res = await api.patch(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data.user;
    },
    retry: 1,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      profilePicture?: string;
    }) => {
      const res = await api.patch('/users/me', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ─── Courses ─────────────────────────────────────────────────────────────

export function useCourses(params?: { page?: number; limit?: number; search?: string; category?: string; difficulty?: string; status?: string }) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: async () => {
      const res = await api.get('/courses', { params });
      return res.data;
    },
  });
}

export function useCourse(id: string | null) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await api.get(`/courses/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
      duration?: number;
      difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
      language?: string;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    }) => {
      const res = await api.post('/courses', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// ─── Self-Service: Publish / Archive / Self-Enroll ───────────────────────

export function usePublishCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      const res = await api.patch(`/courses/${courseId}/publish`);
      return res.data;
    },
    onSuccess: (_data, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useArchiveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      const res = await api.patch(`/courses/${courseId}/archive`);
      return res.data;
    },
    onSuccess: (_data, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useSelfEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      const res = await api.post(`/courses/${courseId}/self-enroll`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

// ─── Modules & Content (course authoring) ────────────────────────────────

export function useCreateModule(courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; order?: number }) => {
      const res = await api.post(`/courses/${courseId}/modules`, data);
      return res.data;
    },
    onSuccess: () => {
      if (courseId) queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useUpdateModule(courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ moduleId, data }: { moduleId: string; data: { title?: string; description?: string; order?: number } }) => {
      const res = await api.patch(`/courses/modules/${moduleId}`, data);
      return res.data;
    },
    onSuccess: () => {
      if (courseId) queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useDeleteModule(courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (moduleId: string) => {
      await api.delete(`/courses/modules/${moduleId}`);
    },
    onSuccess: () => {
      if (courseId) queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useCreateContent(courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ moduleId, data }: { moduleId: string; data: {
      type: 'PAGE' | 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'ASSIGNMENT' | 'EXTERNAL_LINK';
      title: string;
      description?: string;
      videoUrl?: string;
      fileUrl?: string;
      externalUrl?: string;
      duration?: number;
      order?: number;
      isPublished?: boolean;
    } }) => {
      const res = await api.post(`/courses/modules/${moduleId}/contents`, data);
      return res.data;
    },
    onSuccess: () => {
      if (courseId) queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useDeleteContent(courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => {
      await api.delete(`/courses/contents/${contentId}`);
    },
    onSuccess: () => {
      if (courseId) queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useUpdateContent(courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentId, data }: { contentId: string; data: {
      title?: string;
      description?: string;
      contentJson?: unknown;
      videoUrl?: string;
      fileUrl?: string;
      externalUrl?: string;
      duration?: number;
      isPublished?: boolean;
    } }) => {
      const res = await api.patch(`/courses/contents/${contentId}`, data);
      return res.data;
    },
    onSuccess: () => {
      if (courseId) queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

// ─── Content Moderation (admin post-moderation) ──────────────────────────

export function useFlaggedContent(params?: { type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['flagged-content', params],
    queryFn: async () => {
      const res = await api.get('/content/flagged', { params });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useModerateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentId, action, notes }: { contentId: string; action: 'APPROVE' | 'ARCHIVE' | 'REMOVE'; notes?: string }) => {
      const res = await api.patch(`/content/${contentId}/moderate`, { action, notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged-content'] });
    },
  });
}

// ─── Enrollments ─────────────────────────────────────────────────────────

export function useStudentDashboard() {
  return useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res = await api.get('/enrollments/dashboard/student');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: async () => {
      const res = await api.get('/enrollments/dashboard/teacher');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useEnrollments(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['enrollments', params],
    queryFn: async () => {
      const res = await api.get('/enrollments', { params });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

// ─── Quizzes ─────────────────────────────────────────────────────────────

export function useQuizzes(params?: { page?: number; limit?: number; search?: string; status?: string; contentId?: string }) {
  return useQuery({
    queryKey: ['quizzes', params],
    queryFn: async () => {
      const res = await api.get('/quizzes', { params });
      return res.data;
    },
  });
}

// Fetch quizzes for multiple contentIds in parallel — returns one query per contentId
export function useQuizzesForContents(contentIds: string[]) {
  // Use a single meta-query that fetches all quizzes and filters client-side
  return useQuery({
    queryKey: ['quizzes-for-contents', contentIds],
    queryFn: async () => {
      if (contentIds.length === 0) return { data: [] as any[], byContent: {} as Record<string, any> };
      const res = await api.get('/quizzes', { params: { limit: 100 } });
      const all = (res.data?.data ?? []) as any[];
      // Build lookup: contentId → quiz
      const byContent: Record<string, any> = {};
      for (const q of all) {
        if (q.contentId) byContent[q.contentId] = q;
      }
      return { data: all, byContent };
    },
    enabled: contentIds.length > 0,
  }) as any;
}

export function useQuiz(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await api.get(`/quizzes/${quizId}`);
      return res.data;
    },
    enabled: !!quizId,
  });
}

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quizId, enrollmentId }: { quizId: string; enrollmentId: string }) => {
      const res = await api.post(`/quizzes/${quizId}/attempts/start`, { enrollmentId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
    },
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ attemptId, answers, timeSpent }: { attemptId: string; answers: Record<string, unknown>; timeSpent: number }) => {
      const res = await api.post(`/quizzes/attempts/${attemptId}/submit`, { answers, timeSpent });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempt', variables.attemptId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempt-results', variables.attemptId] });
    },
  });
}

export function useAttemptResults(attemptId: string | null) {
  return useQuery({
    queryKey: ['quiz-attempt-results', attemptId],
    queryFn: async () => {
      const res = await api.get(`/quizzes/attempts/${attemptId}/results`);
      return res.data;
    },
    enabled: !!attemptId,
  });
}

// ─── Grading Escalation (Step 4) ─────────────────────────────────────────

export function useAdminOverrideGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ attemptId, newScore, reason }: { attemptId: string; newScore: number; reason: string }) => {
      const res = await api.patch(`/quizzes/attempts/${attemptId}/admin-grade`, { newScore, reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempt-results'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
    },
  });
}

export function useEscalateGrade() {
  return useMutation({
    mutationFn: async ({ attemptId, reason }: { attemptId: string; reason: string }) => {
      const res = await api.post(`/quizzes/attempts/${attemptId}/escalate`, { reason });
      return res.data;
    },
  });
}

export function useGradeDisputes(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['grade-disputes', params],
    queryFn: async () => {
      const res = await api.get('/quizzes/disputes', { params });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ disputeId, resolution, status, newScore }: { disputeId: string; resolution: string; status: 'RESOLVED' | 'ESCALATED'; newScore?: number }) => {
      const res = await api.patch(`/quizzes/disputes/${disputeId}/resolve`, { resolution, status, newScore });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-disputes'] });
    },
  });
}

// ─── Assignments ─────────────────────────────────────────────────────────

export function useAssignments(params?: { page?: number; limit?: number; search?: string; status?: string; contentId?: string }) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: async () => {
      const res = await api.get('/assignments', { params });
      return res.data;
    },
  });
}

// Fetch assignments for multiple contentIds in parallel — single meta-query with client-side filter
export function useAssignmentsForContents(contentIds: string[]) {
  return useQuery({
    queryKey: ['assignments-for-contents', contentIds],
    queryFn: async () => {
      if (contentIds.length === 0) return { data: [] as any[], byContent: {} as Record<string, any> };
      const res = await api.get('/assignments', { params: { limit: 100 } });
      const all = (res.data?.data ?? []) as any[];
      const byContent: Record<string, any> = {};
      for (const a of all) {
        if (a.contentId) byContent[a.contentId] = a;
      }
      return { data: all, byContent };
    },
    enabled: contentIds.length > 0,
  }) as any;
}

export function useAssignment(assignmentId: string | null) {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const res = await api.get(`/assignments/${assignmentId}`);
      return res.data;
    },
    enabled: !!assignmentId,
  });
}

export function useSubmissions(assignmentId: string | null) {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: async () => {
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      return res.data;
    },
    enabled: !!assignmentId,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, enrollmentId, content }: { assignmentId: string; enrollmentId: string; content: { text?: string; files?: unknown[]; links?: string[] } }) => {
      const res = await api.post(`/assignments/${assignmentId}/submissions`, { enrollmentId, content });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', variables.assignmentId] });
    },
  });
}

// Upload a single file to Cloudinary via the backend's /assignments/upload endpoint.
// Returns the file metadata (public_id, secure_url, original_filename, size, format)
// that should be included in the submission's content.files array.
export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/assignments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.file as {
        public_id: string;
        secure_url: string;
        original_filename: string;
        size: number;
        format?: string;
      };
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, data }: { submissionId: string; data: {
      grade: number;
      feedback?: string;
      revisionRequested?: boolean;
      revisionComments?: string;
    } }) => {
      const res = await api.post(`/assignments/submissions/${submissionId}/grade`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useRequestRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, comments }: { submissionId: string; comments: string }) => {
      const res = await api.post(`/assignments/submissions/${submissionId}/revision`, { comments });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

// ─── Peer Reviews ────────────────────────────────────────────────────────

export function useMyPeerReviews() {
  return useQuery({
    queryKey: ['peer-reviews-my'],
    queryFn: async () => {
      const res = await api.get('/assignments/peer-reviews/my');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useReceivedPeerReviews(assignmentId: string | null) {
  return useQuery({
    queryKey: ['peer-reviews-received', assignmentId],
    queryFn: async () => {
      const res = await api.get(`/assignments/${assignmentId}/peer-reviews/my-received`);
      return res.data;
    },
    enabled: !!assignmentId,
  });
}

export function useAssignPeerReviews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string }) => {
      const res = await api.post(`/assignments/${assignmentId}/peer-reviews/assign`, {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-reviews-my'] });
    },
  });
}

export function useSubmitPeerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, data }: { reviewId: string; data: { score?: number; feedback?: string; comments?: Record<string, unknown> } }) => {
      const res = await api.patch(`/assignments/peer-reviews/${reviewId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-reviews-my'] });
    },
  });
}

// ─── Quiz Authoring (teacher) ────────────────────────────────────────────

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      contentId?: string;
      timeLimit?: number;
      passingScore?: number;
      maxAttempts?: number;
      shuffleQuestions?: boolean;
      showFeedback?: boolean;
      showCorrectAnswers?: boolean;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    }) => {
      const res = await api.post('/quizzes', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quizId, data }: { quizId: string; data: Record<string, unknown> }) => {
      const res = await api.patch(`/quizzes/${quizId}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quizId: string) => {
      await api.delete(`/quizzes/${quizId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}

export function useAddQuestion(quizId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTIPLE' | 'TRUE_FALSE' | 'FILL_IN_BLANK' | 'SHORT_ANSWER' | 'ESSAY';
      questionText: string;
      points?: number;
      options?: any;
      correctAnswer?: any;
      explanation?: string;
    }) => {
      const res = await api.post(`/quizzes/${quizId}/questions`, data);
      return res.data;
    },
    onSuccess: () => {
      if (quizId) queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
    },
  });
}

export function useDeleteQuestion(quizId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: string) => {
      await api.delete(`/quizzes/questions/${questionId}`);
    },
    onSuccess: () => {
      if (quizId) queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
    },
  });
}

// ─── Notification Preferences ────────────────────────────────────────────

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const res = await api.get('/notifications/preferences');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: string;
      channel: 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS';
      enabled: boolean;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
    }) => {
      const res = await api.patch('/notifications/preferences', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}

// ─── Notifications ───────────────────────────────────────────────────────

export function useNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const res = await api.get('/notifications', { params });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
    refetchInterval: 30000, // Poll every 30s for new notifications
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Discussions ─────────────────────────────────────────────────────────

export function useDiscussions(params?: { courseId?: string; page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['discussions', params],
    queryFn: async () => {
      const res = await api.get('/discussions', { params });
      return res.data;
    },
  });
}

export function useCreateDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; content: string; courseId?: string }) => {
      const res = await api.post('/discussions', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

export function useDiscussion(discussionId: string | null) {
  return useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: async () => {
      const res = await api.get(`/discussions/${discussionId}`);
      return res.data;
    },
    enabled: !!discussionId,
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ discussionId, content, parentId }: { discussionId: string; content: string; parentId?: string }) => {
      const res = await api.post(`/discussions/${discussionId}/replies`, { content, parentId });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussion', variables.discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

export function useUpvoteDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (discussionId: string) => {
      const res = await api.post(`/discussions/${discussionId}/upvote`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussion'] });
    },
  });
}

export function useDeleteDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (discussionId: string) => {
      await api.delete(`/discussions/${discussionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

export function useMarkBestAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ discussionId, replyId }: { discussionId: string; replyId: string }) => {
      const res = await api.post(`/discussions/${discussionId}/best-answer/${replyId}`);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussion', variables.discussionId] });
    },
  });
}

// ─── Auth: Change Password ───────────────────────────────────────────────

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) => {
      const res = await api.post('/auth/change-password', { oldPassword, newPassword });
      return res.data;
    },
  });
}

// ─── Audit Logs ──────────────────────────────────────────────────────────

export function useAuditLogs(params?: { page?: number; limit?: number; action?: string }) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const res = await api.get('/audit/logs', { params });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

// ─── Quiz Analytics ──────────────────────────────────────────────────────

export function useQuizAnalytics(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-analytics', quizId],
    queryFn: async () => {
      const res = await api.get(`/quizzes/${quizId}/analytics`);
      return res.data;
    },
    enabled: !!quizId,
  });
}

// ─── Messages ────────────────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/messages/conversations');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useMessages(groupId: string | null) {
  return useQuery({
    queryKey: ['messages', groupId],
    queryFn: async () => {
      const res = await api.get(`/messages/${groupId}`);
      return res.data;
    },
    enabled: !!groupId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { receiverId?: string; groupId?: string; content: string }) => {
      const res = await api.post('/messages', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

// ─── Announcements ───────────────────────────────────────────────────────

export function useAnnouncements(params?: { courseId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: async () => {
      const res = await api.get('/announcements', { params });
      return res.data;
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      courseId?: string;
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      scheduledAt?: string;
      expiresAt?: string;
    }) => {
      const res = await api.post('/announcements', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/announcements/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

// ─── Gamification ────────────────────────────────────────────────────────

export function useUserLevel() {
  return useQuery({
    queryKey: ['user-level'],
    queryFn: async () => {
      const res = await api.get('/gamification/level');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useUserBadges() {
  return useQuery({
    queryKey: ['user-badges'],
    queryFn: async () => {
      const res = await api.get('/gamification/badges');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useLeaderboard(params?: { scope?: string; period?: string; limit?: number }) {
  return useQuery({
    queryKey: ['leaderboard', params],
    queryFn: async () => {
      const res = await api.get('/gamification/leaderboard', { params });
      return res.data;
    },
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const res = await api.get('/gamification/streak');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

// ─── Certificates ────────────────────────────────────────────────────────

export function useMyCertificates() {
  return useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const res = await api.get('/certificates/mine');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

// ─── Admin / Reports ─────────────────────────────────────────────────────

export function usePlatformDashboard() {
  return useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboards/platform');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

// ─── Settings ────────────────────────────────────────────────────────────

export function useSettings(category?: string) {
  return useQuery({
    queryKey: ['settings', category],
    queryFn: async () => {
      const res = await api.get('/settings', { params: { category } });
      return res.data;
    },
  });
}

export function useBatchUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Array<{ key: string; value: unknown; category?: string; description?: string }>) => {
      const res = await api.patch('/settings/batch', { settings });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { key: string; value: unknown; category?: string; description?: string }) => {
      const res = await api.patch('/settings', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useMaintenanceStatus() {
  return useQuery({
    queryKey: ['maintenance-status'],
    queryFn: async () => {
      const res = await api.get('/maintenance/status');
      return res.data;
    },
  });
}

export function useEnableMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { message: string; whitelist?: string[] }) => {
      const res = await api.post('/maintenance/enable', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-status'] });
    },
  });
}

export function useDisableMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/maintenance/disable');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-status'] });
    },
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const res = await api.get('/email-templates');
      return res.data;
    },
  });
}

export function useGradingScales() {
  return useQuery({
    queryKey: ['grading-scales'],
    queryFn: async () => {
      const res = await api.get('/grading-scales');
      return res.data;
    },
  });
}

// ─── Health ──────────────────────────────────────────────────────────────

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get('/health');
      return res.data;
    },
    refetchInterval: 60000, // Check every minute
  });
}
