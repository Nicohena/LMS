'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

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
    mutationFn: async ({ quizId, enrollmentId, password, studentName, studentId }: { quizId: string; enrollmentId: string; password?: string; studentName?: string; studentId?: string }) => {
      const res = await api.post(`/quizzes/${quizId}/attempts/start`, { enrollmentId, password, studentName, studentId });
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

export function useManualGradeAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attemptId, grades }: { attemptId: string; grades: Array<{ questionId: string; pointsAwarded: number; feedback?: string }> }) => {
      const res = await api.patch(`/quizzes/attempts/${attemptId}/grade`, { grades });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate the attempt results so the detail panel refetches
      qc.invalidateQueries({ queryKey: ['quiz-attempt-results', variables.attemptId] });
      // Also invalidate the attempts list so the summary table updates
      qc.invalidateQueries({ queryKey: ['quiz-attempts'] });
    },
  });
}

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

export function useUpdateQuestion(quizId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, data }: { questionId: string; data: any }) => {
      const res = await api.patch(`/quizzes/questions/${questionId}`, data);
      return res.data;
    },
    onSuccess: () => {
      if (quizId) qc.invalidateQueries({ queryKey: ['quiz', quizId] });
    },
  });
}

export function useQuizAttempts(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: async () => {
      const res = await api.get(`/quizzes/${quizId}/attempts`);
      return res.data;
    },
    enabled: !!quizId,
  });
}

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
    mutationFn: async ({ quizId: qId, data }: { quizId: string; data: {
      type: string;
      questionText: string;
      points?: number;
      options?: any;
      correctAnswer?: any;
      explanation?: string;
    } }) => {
      const res = await api.post(`/quizzes/${qId}/questions`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      if (variables.quizId) queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] });
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
