'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

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
