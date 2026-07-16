'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

// ─── Courses ─────────────────────────────────────────────────────────────

export function useCourses(params?: { page?: number; limit?: number; search?: string; category?: string; difficulty?: string; status?: string; mine?: boolean }) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: async () => {
      const res = await api.get('/courses', { params });
      return res.data;
    },
  });
}

/**
 * Returns only the current viewer's own courses (requires ADMIN or TEACHER).
 * Equivalent to useCourses({ mine: true, limit: 100 }).
 */
export function useMyCourses(params?: { search?: string; status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['courses', 'mine', params],
    queryFn: async () => {
      const res = await api.get('/courses', { params: { mine: true, limit: params?.limit ?? 100, search: params?.search, status: params?.status } });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
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
