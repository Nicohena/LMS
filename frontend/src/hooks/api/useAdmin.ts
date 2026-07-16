'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

// ─── Admin ───────────────────────────────────────────────────────────────

export function useAdminRoles() {
  return useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await api.get('/admin/roles');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useCreateAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; permissions: string[] }) => {
      const res = await api.post('/admin/roles', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
  });
}

export function useDeleteAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      await api.delete(`/admin/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
  });
}

export function useAssignAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const res = await api.post(`/admin/users/${userId}/role`, { roleId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
  });
}

export function useRemoveAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}/role`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
    },
  });
}

export function useAdmins() {
  return useQuery({
    queryKey: ['admin-admins'],
    queryFn: async () => {
      const res = await api.get('/admin/admins');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useQualityReport() {
  return useQuery({
    queryKey: ['quality-report'],
    queryFn: async () => {
      const res = await api.get('/admin/quality/reports');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useRecalculateQuality() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/quality/recalculate', {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-report'] });
    },
  });
}

export function useFlagCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, flag }: { courseId: string; flag: string }) => {
      const res = await api.patch(`/admin/quality/courses/${courseId}/flag`, { flag });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-report'] });
    },
  });
}

export function useUnflagCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, flag }: { courseId: string; flag: string }) => {
      const res = await api.patch(`/admin/quality/courses/${courseId}/unflag`, { flag });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-report'] });
    },
  });
}

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

export function useAutoEnrollRules() {
  return useQuery({
    queryKey: ['auto-enroll-rules'],
    queryFn: async () => {
      const res = await api.get('/admin/auto-enrollment/rules');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useCreateAutoEnrollRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; ruleType: string; ruleConfig: any; courseId: string }) => {
      const res = await api.post('/admin/auto-enrollment/rules', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-enroll-rules'] });
    },
  });
}

export function useDeleteAutoEnrollRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId: string) => {
      await api.delete(`/admin/auto-enrollment/rules/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-enroll-rules'] });
    },
  });
}

export function useTriggerAutoEnroll() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/auto-enrollment/trigger', {});
      return res.data;
    },
  });
}

export function useEscalations(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['escalations', params],
    queryFn: async () => {
      const res = await api.get('/escalations', { params });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useCreateEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { submissionId?: string; attemptId?: string; reason: string }) => {
      const url = data.submissionId ? `/submissions/${data.submissionId}/escalate` : '/escalations';
      const res = await api.post(url, { reason: data.reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
    },
  });
}

export function useTeacherResolveEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ escalationId, action, notes, newGrade }: { escalationId: string; action: 'RESOLVE' | 'FORWARD'; notes: string; newGrade?: number }) => {
      const res = await api.patch(`/escalations/${escalationId}/resolve`, { action, notes, newGrade });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
    },
  });
}

export function useAdminResolveEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ escalationId, resolution, newGrade }: { escalationId: string; resolution: string; newGrade?: number }) => {
      const res = await api.patch(`/escalations/${escalationId}/admin-resolve`, { resolution, newGrade });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
    },
  });
}

export function usePlatformDashboard() {
  return useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboards/platform');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
    refetchInterval: 30000, // Auto-refresh every 30s
  });
}

export function useAdminAlerts() {
  return useQuery({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const res = await api.get('/dashboards/alerts');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
    refetchInterval: 30000,
  });
}

export function useRecentActivity(limit: number = 15) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const res = await api.get('/dashboards/activity', { params: { limit } });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
    refetchInterval: 30000,
  });
}

export function useAdminSchoolDashboard() {
  return useQuery({
    queryKey: ['admin-school-dashboard'],
    queryFn: async () => {
      const res = await api.get('/school/admin/school-dashboard');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
    refetchInterval: 30000,
  });
}
