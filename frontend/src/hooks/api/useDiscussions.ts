'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

export function useUpdateDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ discussionId, data }: { discussionId: string; data: { title?: string; content?: string } }) => {
      const res = await api.patch(`/discussions/${discussionId}`, data);
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

export function useDeleteReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (replyId: string) => {
      await api.delete(`/discussions/replies/${replyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussion'] });
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
