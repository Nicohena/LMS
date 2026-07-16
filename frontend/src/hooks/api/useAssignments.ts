'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      instructions?: string;
      contentId?: string;
      dueDate?: string;
      maxPoints?: number;
      type?: string;
      difficulty?: string;
      category?: string;
      requiresFileUpload?: boolean;
      allowedFileTypes?: string[];
      maxFileSizeMB?: number;
      maxFiles?: number;
      allowResubmissions?: boolean;
      maxResubmissions?: number;
      allowDrafts?: boolean;
      allowLateSubmissions?: boolean;
      latePenaltyPercentage?: number;
      passingMarks?: number;
      weightPercentage?: number;
      minWordCount?: number;
      maxWordCount?: number;
      estimatedTime?: number;
      tags?: string[];
      status?: string;
    }) => {
      const res = await api.post('/assignments', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
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

export function useGetPlagiarismReport(submissionId: string | null) {
  return useQuery({
    queryKey: ['plagiarism-report', submissionId],
    queryFn: async () => {
      const res = await api.get(`/assignments/submissions/${submissionId}/plagiarism`);
      return res.data;
    },
    enabled: !!submissionId,
  });
}

export function useRunPlagiarismCheck(submissionId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/assignments/submissions/${submissionId}/plagiarism/run`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plagiarism-report', submissionId] });
    },
  });
}

export function useGetSubmissionAnalytics(submissionId: string | null) {
  return useQuery({
    queryKey: ['submission-analytics', submissionId],
    queryFn: async () => {
      const res = await api.get(`/assignments/submissions/${submissionId}/analytics`);
      return res.data;
    },
    enabled: !!submissionId,
  });
}

export function useBulkGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, grades }: { assignmentId: string; grades: Array<{ submissionId: string; grade: number; feedback?: string }> }) => {
      const res = await api.post(`/assignments/${assignmentId}/bulk-grade`, { grades });
      return res.data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['submissions', v.assignmentId] });
    },
  });
}

export function useExportGrades(assignmentId: string | null) {
  return useQuery({
    queryKey: ['export-grades', assignmentId],
    queryFn: async () => {
      const res = await api.get(`/assignments/${assignmentId}/grades/export`);
      return res.data;
    },
    enabled: false, // Only run when explicitly triggered
  });
}

// Workflow operations
export function usePublishAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post(`/assignments/${assignmentId}/publish`);
      return res.data;
    },
    onSuccess: (_d, assignmentId) => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    },
  });
}

export function useScheduleAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, publishDate }: { assignmentId: string; publishDate: string }) => {
      const res = await api.post(`/assignments/${assignmentId}/schedule`, { publishDate });
      return res.data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', v.assignmentId] });
    },
  });
}

export function useCloseAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post(`/assignments/${assignmentId}/close`);
      return res.data;
    },
    onSuccess: (_d, assignmentId) => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    },
  });
}

export function useReopenAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post(`/assignments/${assignmentId}/reopen`);
      return res.data;
    },
    onSuccess: (_d, assignmentId) => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    },
  });
}

export function useArchiveAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post(`/assignments/${assignmentId}/archive`);
      return res.data;
    },
    onSuccess: (_d, assignmentId) => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    },
  });
}

export function useRestoreAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post(`/assignments/${assignmentId}/restore`);
      return res.data;
    },
    onSuccess: (_d, assignmentId) => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    },
  });
}

export function useDuplicateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post(`/assignments/${assignmentId}/duplicate`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

// Analytics
export function useGradeDistribution(assignmentId: string | null) {
  return useQuery({
    queryKey: ['assignment-grade-distribution', assignmentId],
    queryFn: async () => {
      const res = await api.get(`/assignments/${assignmentId}/grades/distribution`);
      return res.data;
    },
    enabled: !!assignmentId,
  });
}

export function useSubmissionStats(assignmentId: string | null) {
  return useQuery({
    queryKey: ['assignment-submission-stats', assignmentId],
    queryFn: async () => {
      const res = await api.get(`/assignments/${assignmentId}/submissions/stats`);
      return res.data;
    },
    enabled: !!assignmentId,
  });
}

// Resources
export function useAssignmentResources(assignmentId: string | null) {
  return useQuery({
    queryKey: ['assignment-resources', assignmentId],
    queryFn: async () => {
      const res = await api.get(`/assignments/${assignmentId}/resources`);
      return res.data;
    },
    enabled: !!assignmentId,
  });
}

export function useUploadResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, data }: { assignmentId: string; data: { title: string; description?: string; fileUrl: string; fileType?: string; fileSize?: number; originalFilename?: string; publicId?: string } }) => {
      const res = await api.post(`/assignments/${assignmentId}/resources`, data);
      return res.data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['assignment-resources', v.assignmentId] });
    },
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await api.delete(`/assignments/resources/${resourceId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment-resources'] });
    },
  });
}

// Audit logs
export function useAssignmentAuditLogs(assignmentId: string | null, params?: { action?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['assignment-audit-logs', assignmentId, params],
    queryFn: async () => {
      const res = await api.get(`/assignments/${assignmentId}/audit-logs`, { params });
      return res.data;
    },
    enabled: !!assignmentId,
  });
}

// Rubric templates
export function useRubricTemplates(search?: string) {
  return useQuery({
    queryKey: ['rubric-templates', search],
    queryFn: async () => {
      const res = await api.get('/assignments/rubric-templates', { params: { search } });
      return res.data;
    },
  });
}

export function useCreateRubricTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; criteria: any; totalPoints?: number }) => {
      const res = await api.post('/assignments/rubric-templates', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rubric-templates'] });
    },
  });
}

export function useApplyRubricTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, assignmentId }: { templateId: string; assignmentId: string }) => {
      const res = await api.post(`/assignments/rubric-templates/${templateId}/apply/${assignmentId}`);
      return res.data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['assignment', v.assignmentId] });
    },
  });
}
