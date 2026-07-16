'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

// ─── Academic Structure ──────────────────────────────────────────────────

export function useAcademicYears(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['academic-years', params],
    queryFn: async () => {
      const res = await api.get('/academic/academic-years');
      return res.data;
    },
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) => {
      const res = await api.post('/academic/academic-years', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-years'] }),
  });
}

export function useUpdateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; startDate?: string; endDate?: string; isCurrent?: boolean } }) => {
      const res = await api.patch(`/academic/academic-years/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-years'] }),
  });
}

export function useDeleteAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/academic/academic-years/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-years'] }),
  });
}

export function useGrades(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['grades', params],
    queryFn: async () => {
      const res = await api.get('/academic/grades');
      return res.data;
    },
  });
}

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; level: number }) => {
      const res = await api.post('/academic/grades', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grades'] }),
  });
}

export function useUpdateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; level?: number } }) => {
      const res = await api.patch(`/academic/grades/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grades'] }),
  });
}

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/academic/grades/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grades'] }),
  });
}

export function useSubjects(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: async () => {
      const res = await api.get('/academic/subjects');
      return res.data;
    },
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; code?: string; description?: string }) => {
      const res = await api.post('/academic/subjects', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; code?: string; description?: string } }) => {
      const res = await api.patch(`/academic/subjects/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/academic/subjects/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

export function useSections(params?: { gradeId?: string; academicYearId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['sections', params],
    queryFn: async () => {
      const res = await api.get('/academic/sections', { params });
      return res.data;
    },
  });
}

export function useSection(id: string | null) {
  return useQuery({
    queryKey: ['section', id],
    queryFn: async () => {
      const res = await api.get(`/academic/sections/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; gradeId: string; academicYearId: string; capacity?: number }) => {
      const res = await api.post('/academic/sections', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections'] }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; capacity?: number } }) => {
      const res = await api.patch(`/academic/sections/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections'] }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/academic/sections/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections'] }),
  });
}

export function useSectionCourses(sectionId: string | null) {
  return useQuery({
    queryKey: ['section-courses', sectionId],
    queryFn: async () => {
      const res = await api.get(`/academic/sections/${sectionId}/courses`);
      return res.data;
    },
    enabled: !!sectionId,
  });
}

export function useAddCourseToSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, courseId }: { sectionId: string; courseId: string }) => {
      const res = await api.post(`/academic/sections/${sectionId}/courses`, { courseId });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-courses'] });
    },
  });
}

export function useRemoveCourseFromSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, courseId }: { sectionId: string; courseId: string }) => {
      await api.delete(`/academic/sections/${sectionId}/courses/${courseId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-courses'] });
    },
  });
}

export function useTimetable(sectionId: string | null) {
  return useQuery({
    queryKey: ['section-timetable', sectionId],
    queryFn: async () => {
      const res = await api.get(`/school/sections/${sectionId}/timetable`);
      return res.data;
    },
    enabled: !!sectionId,
  });
}

export function useCreateTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { sectionId: string; dayOfWeek: string; startTime: string; endTime: string; subjectId?: string; teacherId?: string }) => {
      const res = await api.post('/school/timetables', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-timetable'] });
      qc.invalidateQueries({ queryKey: ['student-timetable'] });
      qc.invalidateQueries({ queryKey: ['teacher-timetable'] });
    },
  });
}

export function useUpdateTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { dayOfWeek?: string; startTime?: string; endTime?: string; subjectId?: string; teacherId?: string } }) => {
      const res = await api.patch(`/school/timetables/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-timetable'] });
      qc.invalidateQueries({ queryKey: ['student-timetable'] });
      qc.invalidateQueries({ queryKey: ['teacher-timetable'] });
    },
  });
}

export function useDeleteTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/timetables/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-timetable'] });
      qc.invalidateQueries({ queryKey: ['student-timetable'] });
    },
  });
}

export function useBulkCreateTimetableSlots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { sectionId: string; entries: any[] }) => {
      const res = await api.post('/school/timetables/batch', data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['section-timetable', variables.sectionId] });
      qc.invalidateQueries({ queryKey: ['student-timetable'] });
      qc.invalidateQueries({ queryKey: ['teacher-timetable'] });
    },
  });
}

export function useMyTimetable() {
  return useQuery({
    queryKey: ['student-timetable'],
    queryFn: async () => {
      const res = await api.get('/school/student/timetable');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useTeacherTimetable() {
  return useQuery({
    queryKey: ['teacher-timetable'],
    queryFn: async () => {
      const res = await api.get('/school/teacher/timetable');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useCurrentAcademicYear() {
  return useQuery({
    queryKey: ['academic-year-current'],
    queryFn: async () => {
      const res = await api.get('/academic/academic-years/current');
      return res.data;
    },
  });
}

export function useSectionStudents(sectionId: string | null) {
  return useQuery({
    queryKey: ['section-students', sectionId],
    queryFn: async () => {
      const res = await api.get(`/academic/sections/${sectionId}/students`);
      return res.data;
    },
    enabled: !!sectionId,
  });
}

export function useSectionSubjects(filters?: { sectionId?: string; teacherId?: string }) {
  return useQuery({
    queryKey: ['section-subjects', filters],
    queryFn: async () => {
      const res = await api.get('/academic/section-subjects', { params: filters });
      return res.data;
    },
  });
}

export function useAssignTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { sectionId: string; subjectId: string; teacherId: string }) => {
      const res = await api.post('/academic/section-subjects', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-subjects'] });
    },
  });
}

export function useAssignStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { studentId: string; sectionId: string; academicYearId: string }) => {
      const res = await api.post('/academic/student-sections', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-students'] });
      qc.invalidateQueries({ queryKey: ['student-sections'] });
    },
  });
}

export function useRemoveStudentFromSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, sectionId }: { studentId: string; sectionId: string }) => {
      const res = await api.delete(`/academic/users/${studentId}/sections/${sectionId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-students'] });
      qc.invalidateQueries({ queryKey: ['student-sections'] });
    },
  });
}

export function useUserSections(userId: string | null) {
  return useQuery({
    queryKey: ['student-sections', userId],
    queryFn: async () => {
      const res = await api.get(`/academic/users/${userId}/sections`);
      return res.data;
    },
    enabled: !!userId,
  });
}

export function useTeacherSections(userId: string | null) {
  return useQuery({
    queryKey: ['teacher-sections', userId],
    queryFn: async () => {
      const res = await api.get(`/academic/users/${userId}/teacher-sections`);
      return res.data;
    },
    enabled: !!userId,
  });
}

export function useSectionContent(filters?: { sectionSubjectId?: string }) {
  return useQuery({
    queryKey: ['section-content', filters],
    queryFn: async () => {
      const res = await api.get('/school/section-content', { params: filters });
      return res.data;
    },
  });
}

export function useSectionQuizzes(filters?: { sectionSubjectId?: string }) {
  return useQuery({
    queryKey: ['section-quizzes', filters],
    queryFn: async () => {
      const res = await api.get('/school/section-quizzes', { params: filters });
      return res.data;
    },
  });
}

export function useSectionAssignments(filters?: { sectionSubjectId?: string }) {
  return useQuery({
    queryKey: ['section-assignments', filters],
    queryFn: async () => {
      const res = await api.get('/school/section-assignments', { params: filters });
      return res.data;
    },
  });
}

export function useTeacherSchoolDashboard() {
  return useQuery({
    queryKey: ['teacher-school-dashboard'],
    queryFn: async () => {
      const res = await api.get('/school/teacher/dashboard');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
    refetchInterval: 30000,
  });
}

export function useStudentSchoolDashboard() {
  return useQuery({
    queryKey: ['student-school-dashboard'],
    queryFn: async () => {
      const res = await api.get('/school/student/dashboard');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
    refetchInterval: 30000,
  });
}

export function useSectionTimetable(sectionId: string | null) {
  return useQuery({
    queryKey: ['section-timetable', sectionId],
    queryFn: async () => {
      const res = await api.get(`/school/sections/${sectionId}/timetable`);
      return res.data;
    },
    enabled: !!sectionId,
  });
}

export function useStudentTimetable() {
  return useQuery({
    queryKey: ['student-timetable'],
    queryFn: async () => {
      const res = await api.get('/school/student/timetable');
      return res.data;
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
}

export function useCreateTimetableBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { sectionId: string; entries: any[] }) => {
      const res = await api.post('/school/timetables/batch', data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['section-timetable', variables.sectionId] });
      qc.invalidateQueries({ queryKey: ['student-timetable'] });
      qc.invalidateQueries({ queryKey: ['teacher-timetable'] });
    },
  });
}

export function useDeleteTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school/timetables/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-timetable'] });
      qc.invalidateQueries({ queryKey: ['student-timetable'] });
    },
  });
}
