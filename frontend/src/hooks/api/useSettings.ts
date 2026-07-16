'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

export function useBackupDatabase() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/settings/backup');
      return res.data;
    },
  });
}

export function useRestoreDatabase() {
  return useMutation({
    mutationFn: async (data: { backupId: string }) => {
      const res = await api.post('/settings/restore', data);
      return res.data;
    },
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get('/health');
      return res.data;
    },
    refetchInterval: 60000, // Check every minute
  });
}

export function useClearCache() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/settings/cache/clear');
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
    queryKey: ['grading-templates'],
    queryFn: async () => {
      const res = await api.get('/grading-scales');
      return res.data;
    },
  });
}
