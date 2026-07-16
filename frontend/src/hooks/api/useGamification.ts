'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

// ─── Gamification ────────────────────────────────────────────────────────

export function useMyGamification() {
  return useQuery({
    queryKey: ['user-level'],
    queryFn: async () => {
      const res = await api.get('/gamification/level');
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

export function useBadges() {
  return useQuery({
    queryKey: ['user-badges'],
    queryFn: async () => {
      const res = await api.get('/gamification/badges');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useXPHistory(limit: number = 20) {
  return useQuery({
    queryKey: ['xp-history', limit],
    queryFn: async () => {
      const res = await api.get('/gamification/xp/history', { params: { limit } });
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
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

// Legacy aliases for backward compatibility
export const useUserLevel = useMyGamification;
export const useUserBadges = useBadges;
