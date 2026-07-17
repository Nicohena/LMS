// Shared types, constants, and utilities extracted from page.tsx
// These are used by multiple components throughout the app.

import {
  LayoutDashboard, BookOpen, FileText, FileQuestion, Route, Layers,
  Plus, BookMarked, MessageSquare, Bell, BarChart3, Users, Award,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ─── Types ─────────────────────────────────────────────────────────────────
export type View = 'login' | 'verify-certificate' | 'dashboard' | 'catalog' | 'my-courses' | 'my-sections' | 'academic-management' | 'course-detail' | 'quiz' | 'quiz-results' | 'assignment' | 'discussions' | 'discussion-detail' | 'announcements' | 'admin' | 'audit' | 'users' | 'gamification' | 'course-create' | 'settings' | 'messages' | 'profile';

export interface Course {
  id: string; title: string; description: string; instructor: string;
  category: string; difficulty: string; duration: string; lessons: number;
  students: number; rating: number; progress?: number; thumbnail: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: number; title: string; lessons: { id: number; title: string; type: string; duration: string; completed: boolean }[];
}

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  view?: View;
  roles: Role[];
}

// ─── Constants ────────────────────────────────────────────────────────────
export const navItems: NavItem[] = [
  { label: 'Home', icon: LayoutDashboard, view: 'dashboard', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { label: 'Catalog', icon: Layers, view: 'catalog', roles: ['TEACHER', 'STUDENT'] },
  { label: 'Assignments', icon: FileText, view: 'assignment', roles: ['STUDENT'] },
  { label: 'Quizzes', icon: FileQuestion, view: 'quiz', roles: ['STUDENT'] },
  { label: 'Certificates', icon: Award, view: 'gamification', roles: ['STUDENT'] },
  { label: 'My Sections', icon: Layers, view: 'my-sections', roles: ['TEACHER'] },
  { label: 'My Courses', icon: BookMarked, view: 'my-courses', roles: ['TEACHER'] },
  { label: 'Create Course', icon: Plus, view: 'course-create', roles: ['TEACHER'] },
  { label: 'Assignments', icon: FileText, view: 'assignment', roles: ['TEACHER'] },
  { label: 'Quizzes', icon: FileQuestion, view: 'quiz', roles: ['TEACHER'] },
  { label: 'Discussions', icon: MessageSquare, view: 'discussions', roles: ['TEACHER', 'STUDENT'] },
  { label: 'Announcements', icon: Bell, view: 'announcements', roles: ['TEACHER', 'STUDENT'] },
  { label: 'Messages', icon: MessageSquare, view: 'messages', roles: ['TEACHER', 'STUDENT'] },
  { label: 'Academic Structure', icon: Layers, view: 'academic-management', roles: ['ADMIN'] },
  { label: 'Admin Panel', icon: BarChart3, view: 'admin', roles: ['ADMIN'] },
  { label: 'Users', icon: Users, view: 'users', roles: ['ADMIN'] },
  { label: 'Audit Logs', icon: FileText, view: 'audit', roles: ['ADMIN'] },
];

export const stats = [
  { label: 'Course', value: '12', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50', trend: '+2' },
  { label: 'Page', value: '48', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+5' },
  { label: 'Assignment', value: '7', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50', trend: '+1' },
  { label: 'Quiz', value: '15', icon: FileQuestion, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+3' },
  { label: 'Learning Path', value: '4', icon: Route, color: 'text-violet-600', bg: 'bg-violet-50', trend: '+1' },
];

export const categories = ['All', 'Design', 'Programming', 'Business', 'Data Science', 'Marketing'];
export const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

// ─── Helper: download data as CSV ────────────────────────────────────────
export function downloadCSV(filename: string, rows: Record<string, any>[], headers?: string[]) {
  if (rows.length === 0) { toast({ title: 'No data', description: 'No data to export.', variant: 'destructive' }); return; }
  const cols = headers ?? Object.keys(rows[0]);
  const csv = [
    cols.join(','),
    ...rows.map((r) => cols.map((c) => {
      const v = r[c];
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
    }).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Helper: format deadline countdown ───────────────────────────────────
export function formatDeadline(due: Date | null): { text: string; color: string } {
  if (!due) return { text: 'No deadline', color: 'text-slate-400' };
  const now = new Date();
  const ms = due.getTime() - now.getTime();
  if (ms < 0) return { text: 'Overdue', color: 'text-red-500' };
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 7) return { text: `${days} days left`, color: 'text-emerald-600' };
  if (days > 1) return { text: `${days}d ${hours}h left`, color: 'text-amber-600' };
  if (days === 1) return { text: `${days}d ${hours}h left`, color: 'text-orange-600' };
  if (hours > 0) return { text: `${hours}h left`, color: 'text-red-500' };
  const mins = Math.floor(ms / 60000);
  return { text: `${mins}m left`, color: 'text-red-600' };
}

// ─── Assignment status badge config ──────────────────────────────────────
export const ASSIGNMENT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:     { label: 'Draft',     bg: 'bg-slate-100',  text: 'text-slate-600' },
  SCHEDULED: { label: 'Scheduled', bg: 'bg-amber-50',   text: 'text-amber-600' },
  PUBLISHED: { label: 'Published', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  OPEN:      { label: 'Open',      bg: 'bg-blue-50',    text: 'text-blue-600' },
  CLOSED:    { label: 'Closed',    bg: 'bg-red-50',     text: 'text-red-600' },
  ARCHIVED:  { label: 'Archived',  bg: 'bg-slate-100',  text: 'text-slate-400' },
};
