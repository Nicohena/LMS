'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

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

export function useDataExport() {
  return useQuery({
    queryKey: ['data-export'],
    queryFn: async () => {
      const res = await api.post('/audit/export');
      return res.data;
    },
    enabled: false, // Only run when explicitly triggered
  });
}
