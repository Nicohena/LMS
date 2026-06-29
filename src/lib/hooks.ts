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

export function useQuizzes(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['quizzes', params],
    queryFn: async () => {
      const res = await api.get('/quizzes', { params });
      return res.data;
    },
  });
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

// ─── Assignments ─────────────────────────────────────────────────────────

export function useAssignments(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: async () => {
      const res = await api.get('/assignments', { params });
      return res.data;
    },
  });
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

export function useAuditLogs(params?: { page?: number; limit?: number; entityType?: string }) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const res = await api.get('/audit/logs', { params });
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
