'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, BookOpen, FileText, GraduationCap, Award, Settings,
  Bell, Search, Calendar, ChevronRight, ChevronLeft, Menu, X, LogOut, MessageSquare,
  Layers, Star, FileQuestion, Route, Crown, TrendingUp, ArrowUpRight,
  Plus, Filter, PlayCircle, Sparkles, Clock, Users, CheckCircle2,
  AlertCircle, Lock, Mail, Eye, EyeOff, ArrowLeft, BookMarked,
  Video, File, Link2, ChevronDown, MoreHorizontal, Zap, CircleDot,
  Upload, Pin, BarChart3, Trash2, UserPlus, Edit,
  Download, Trophy, Target, Flame, Medal, BadgeCheck,
  Check, GripVertical, Image,
} from 'lucide-react';
import { cn, getInitials, formatDate, timeAgo } from '@/lib/utils';
import { useLogin, useLogout, useMyProfile, useUpdateMyProfile, useCourses, useMyCourses, useCourse, useCreateCourse, usePublishCourse, useArchiveCourse, useSelfEnroll, useCreateModule, useUpdateModule, useDeleteModule, useCreateContent, useDeleteContent, useUpdateContent, useFlaggedContent, useModerateContent, useQualityReport, useRecalculateQuality, useFlagCourse, useUnflagCourse, useAdminRoles, useCreateAdminRole, useDeleteAdminRole, useAssignAdminRole, useAdmins, useRemoveAdminRole, useStudentDashboard, useTeacherDashboard, usePlatformDashboard, useAdminAlerts, useRecentActivity, useUsers, useCreateUser, useUpdateUser, useDeleteUser, useDiscussions, useCreateDiscussion, useDiscussion, useCreateReply, useUpvoteDiscussion, useDeleteDiscussion, useMarkBestAnswer, useChangePassword, useAuditLogs, useQuizAnalytics, useAdminOverrideGrade, useEscalateGrade, useGradeDisputes, useResolveDispute, useEscalations, useTeacherResolveEscalation, useAdminResolveEscalation, useAutoEnrollRules, useCreateAutoEnrollRule, useDeleteAutoEnrollRule, useTriggerAutoEnroll, useConversations, useMessages, useSendMessage, useUserLevel, useUserBadges, useLeaderboard, useMyCertificates, useStreak, useSettings, useBatchUpdateSettings, useMaintenanceStatus, useEnableMaintenance, useDisableMaintenance, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useMarkAnnouncementRead, useQuizzes, useQuizzesForContents, useQuiz, useStartQuizAttempt, useSubmitQuizAttempt, useAttemptResults, useCreateQuiz, useUpdateQuiz, useDeleteQuiz, useAddQuestion, useDeleteQuestion, useAssignments, useAssignmentsForContents, useAssignment, useSubmissions, useCreateSubmission, useUploadFile, useGradeSubmission, useRequestRevision, useMyPeerReviews, useAssignPeerReviews, useSubmitPeerReview, useReceivedPeerReviews, useNotificationPreferences, useUpdateNotificationPreference, useEnrollments, useAcademicYears, useCurrentAcademicYear, useGrades, useSubjects, useSections, useSectionStudents, useSectionSubjects, useCreateAcademicYear, useCreateGrade, useCreateSubject, useCreateSection, useAssignTeacher, useAssignStudent, useRemoveStudentFromSection, useUserSections, useTeacherSections, useSectionContent, useSectionQuizzes, useSectionAssignments, useTeacherSchoolDashboard, useStudentSchoolDashboard, useAdminSchoolDashboard, useXPHistory, useStudentTimetable, useTeacherTimetable, useSectionTimetable, useCreateTimetableBatch, useDeleteTimetableEntry } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from "@/hooks/use-toast";
import { getSocket } from '@/lib/socket';
import { RichTextEditor, RichTextRenderer } from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────
type View = 'login' | 'verify-certificate' | 'dashboard' | 'catalog' | 'my-courses' | 'my-sections' | 'academic-management' | 'course-detail' | 'quiz' | 'quiz-results' | 'assignment' | 'discussions' | 'discussion-detail' | 'announcements' | 'admin' | 'audit' | 'users' | 'gamification' | 'course-create' | 'settings' | 'messages' | 'profile';

interface Course {
  id: string; title: string; description: string; instructor: string;
  category: string; difficulty: string; duration: string; lessons: number;
  students: number; rating: number; progress?: number; thumbnail: string;
  modules?: Module[];
}

interface Module {
  id: number; title: string; lessons: { id: number; title: string; type: string; duration: string; completed: boolean }[];
}

// ─── Mock Data ─────────────────────────────────────────────────────────────
type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  view?: View;
  roles: Role[]; // which roles can see this item
}
const navItems: NavItem[] = [
  // ── Shared ──
  { label: 'Home', icon: LayoutDashboard, view: 'dashboard', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },

  // ── Student ──
  { label: 'Catalog', icon: Layers, view: 'catalog', roles: ['TEACHER', 'STUDENT'] },
  { label: 'Assignments', icon: FileText, view: 'assignment', roles: ['STUDENT'] },
  { label: 'Quizzes', icon: FileQuestion, view: 'quiz', roles: ['STUDENT'] },
  { label: 'Certificates', icon: Award, view: 'gamification', roles: ['STUDENT'] },

  // ── Teacher ──
  { label: 'My Sections', icon: Layers, view: 'my-sections', roles: ['TEACHER'] },
  { label: 'My Courses', icon: BookMarked, view: 'my-courses', roles: ['TEACHER'] },
  { label: 'Create Course', icon: Plus, view: 'course-create', roles: ['TEACHER'] },
  { label: 'Assignments', icon: FileText, view: 'assignment', roles: ['TEACHER'] },
  { label: 'Quizzes', icon: FileQuestion, view: 'quiz', roles: ['TEACHER'] },

  // ── Communication (teacher + student) ──
  { label: 'Discussions', icon: MessageSquare, view: 'discussions', roles: ['TEACHER', 'STUDENT'] },
  { label: 'Announcements', icon: Bell, view: 'announcements', roles: ['TEACHER', 'STUDENT'] },
  { label: 'Messages', icon: MessageSquare, view: 'messages', roles: ['TEACHER', 'STUDENT'] },

  // ── Admin ──
  { label: 'Academic Structure', icon: Layers, view: 'academic-management', roles: ['ADMIN'] },
  { label: 'Admin Panel', icon: BarChart3, view: 'admin', roles: ['ADMIN'] },
  { label: 'Users', icon: Users, view: 'users', roles: ['ADMIN'] },
  { label: 'Audit Logs', icon: FileText, view: 'audit', roles: ['ADMIN'] },
];

const stats = [
  { label: 'Course', value: '12', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50', trend: '+2' },
  { label: 'Page', value: '48', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+5' },
  { label: 'Assignment', value: '7', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50', trend: '+1' },
  { label: 'Quiz', value: '15', icon: FileQuestion, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+3' },
  { label: 'Learning Path', value: '4', icon: Route, color: 'text-violet-600', bg: 'bg-violet-50', trend: '+1' },
];

const mostIssuedContent = [
  { id: 1, title: 'Introduction to UX Design', type: 'Page', views: 1248, trend: 12 },
  { id: 2, title: 'Wireframing Assignment', type: 'Assignment', views: 892, trend: 8 },
  { id: 3, title: 'Design Principles Quiz', type: 'Quiz', views: 756, trend: -3 },
  { id: 4, title: 'Color Theory Basics', type: 'Page', views: 634, trend: 15 },
  { id: 5, title: 'Final Project Brief', type: 'Assignment', views: 521, trend: 5 },
];

const assignmentStats = [
  { name: 'Submitted', count: 142, color: '#4F46E5' },
  { name: 'Pending', count: 28, color: '#F59E0B' },
  { name: 'Graded', count: 98, color: '#10B981' },
  { name: 'Overdue', count: 12, color: '#EF4444' },
];

const learningContentStatus = [
  { name: 'Passed', value: 45, color: '#10B981' },
  { name: 'Failed', value: 8, color: '#EF4444' },
  { name: 'Overdue', value: 5, color: '#F59E0B' },
  { name: 'In Progress', value: 32, color: '#4F46E5' },
  { name: 'Not Started', value: 15, color: '#CBD5E1' },
];

const topLearners = [
  { id: 1, name: 'Sarah Chen', points: 4850, rank: 1, avatar: 'SC', courses: 8 },
  { id: 2, name: 'Mike Rodriguez', points: 4120, rank: 2, avatar: 'MR', courses: 6 },
  { id: 3, name: 'Emily Davis', points: 3890, rank: 3, avatar: 'ED', courses: 7 },
  { id: 4, name: 'James Park', points: 3240, rank: 4, avatar: 'JP', courses: 5 },
  { id: 5, name: 'Lisa Wang', points: 2980, rank: 5, avatar: 'LW', courses: 4 },
];

const quizGrading = [
  { id: 1, title: 'UI Design Principles', questions: 20, submissions: 45, pending: 12 },
  { id: 2, title: 'Color Theory Fundamentals', questions: 15, submissions: 38, pending: 8 },
  { id: 3, title: 'Typography Basics', questions: 10, submissions: 52, pending: 15 },
];

const catalogCourses: Course[] = [
  { id: 'mock-1', title: 'UI Design Fundamentals', description: 'Master the principles of user interface design from wireframing to prototyping.', instructor: 'Sarah Chen', category: 'Design', difficulty: 'Beginner', duration: '12h 30m', lessons: 48, students: 1248, rating: 4.8, thumbnail: 'bg-gradient-to-br from-violet-500 to-violet-500', progress: 75, modules: [
    { id: 1, title: 'Introduction', lessons: [
      { id: 1, title: 'Welcome to UI Design', type: 'video', duration: '5:30', completed: true },
      { id: 2, title: 'Course Overview', type: 'page', duration: '3:00', completed: true },
    ]},
    { id: 2, title: 'Sec 1: Step by Step Usability Principles', lessons: [
      { id: 3, title: 'Usability Heuristics', type: 'video', duration: '12:45', completed: true },
      { id: 4, title: 'Design Systems', type: 'page', duration: '8:00', completed: false },
      { id: 5, title: 'Quiz: Principles', type: 'quiz', duration: '15:00', completed: false },
    ]},
    { id: 3, title: 'Sec 2: Wireframing Techniques', lessons: [
      { id: 6, title: 'Low-Fidelity Wireframes', type: 'video', duration: '18:20', completed: false },
      { id: 7, title: 'Assignment: Wireframe', type: 'assignment', duration: '2:00:00', completed: false },
    ]},
  ]},
  { id: 'mock-2', title: 'Advanced TypeScript', description: 'Deep dive into TypeScript generics, conditional types, and utility types.', instructor: 'Mike Rodriguez', category: 'Programming', difficulty: 'Advanced', duration: '18h 45m', lessons: 62, students: 892, rating: 4.9, thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-500', progress: 40 },
  { id: 'mock-3', title: 'Project Management Essentials', description: 'Learn Agile, Scrum, and Kanban methodologies for effective project delivery.', instructor: 'Emily Davis', category: 'Business', difficulty: 'Intermediate', duration: '8h 15m', lessons: 32, students: 634, rating: 4.7, thumbnail: 'bg-gradient-to-br from-violet-500 to-orange-500', progress: 90 },
  { id: 'mock-4', title: 'Data Science with Python', description: 'From Pandas to Machine Learning — master data science fundamentals.', instructor: 'James Park', category: 'Data Science', difficulty: 'Intermediate', duration: '24h 00m', lessons: 85, students: 521, rating: 4.6, thumbnail: 'bg-gradient-to-br from-emerald-500 to-teal-500', progress: 15 },
  { id: 'mock-5', title: 'Digital Marketing Mastery', description: 'SEO, content marketing, social media strategy, and paid advertising.', instructor: 'Lisa Wang', category: 'Marketing', difficulty: 'Beginner', duration: '10h 30m', lessons: 40, students: 387, rating: 4.5, thumbnail: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  { id: 'mock-6', title: 'Cloud Architecture', description: 'AWS, Azure, GCP — design scalable cloud-native applications.', instructor: 'David Kim', category: 'Programming', difficulty: 'Advanced', duration: '20h 00m', lessons: 55, students: 445, rating: 4.8, thumbnail: 'bg-gradient-to-br from-slate-600 to-slate-800' },
];

const categories = ['All', 'Design', 'Programming', 'Business', 'Data Science', 'Marketing'];
const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

// ─── Helper: download data as CSV ────────────────────────────────────────
function downloadCSV(filename: string, rows: Record<string, any>[], headers?: string[]) {
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

// ─── Sidebar (icon-only, narrow design) ──────────────────────────────────
function Sidebar({ open, onClose, currentView, onNavigate, isCollapsed, onToggleCollapse }: { open: boolean; onClose: () => void; currentView: View; onNavigate: (v: View) => void; isCollapsed: boolean; onToggleCollapse: () => void }) {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'STUDENT') as Role;
  const logoutMutation = useLogout();
  const { data: notifData } = useNotifications({ limit: 1, unreadOnly: true });
  const hasUnread = (notifData?.data ?? []).length > 0;
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Guest';
  const initials = user ? getInitials(displayName) : 'G';
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  const bottomItems: { icon: typeof Users; view?: View; label: string; roles: Role[]; onClick?: () => void }[] = [
    { icon: Users, view: 'profile', label: 'Profile', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { icon: Settings, view: 'settings', label: 'Settings', roles: ['ADMIN'] },
    { icon: LogOut, label: 'Logout', roles: ['ADMIN', 'TEACHER', 'STUDENT'], onClick: () => logoutMutation.mutate() },
  ];
  const visibleBottomItems = bottomItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen transform border-r border-slate-200 bg-white transition-all duration-300 lg:translate-x-0',
        isCollapsed ? 'w-16' : 'w-60',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo + App Name + Collapse Toggle */}
        <div className={cn('flex h-16 items-center gap-2.5 border-b border-slate-100', isCollapsed ? 'justify-center px-2' : 'px-5')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500 shadow-sm">
            <span className="text-lg font-bold text-white">L</span>
          </div>
          {!isCollapsed && <span className="flex-1 text-lg font-bold text-slate-900">LMS</span>}
          {!isCollapsed && (
            <button onClick={onToggleCollapse} title="Collapse sidebar" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        {isCollapsed && (
          <button onClick={onToggleCollapse} title="Expand sidebar" className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-600">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 px-2 pt-2 pb-4 overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {!isCollapsed && <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>}
          {visibleNavItems.map((item) => {
            const isActive = item.view === currentView;
            const showNotifDot = item.label === 'Announcements' && hasUnread;
            return (
              <button
                key={item.label}
                onClick={() => { if (item.view) onNavigate(item.view); onClose(); }}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'group flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-violet-50 text-violet-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-violet-500' : 'text-slate-400 group-hover:text-slate-600')} strokeWidth={2} />
                {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!isCollapsed && showNotifDot && <span className="h-2 w-2 rounded-full bg-red-500" />}
                {isCollapsed && showNotifDot && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 px-2 py-3">
          {visibleBottomItems.map((item) => {
            const isActive = item.view === currentView;
            return (
              <button
                key={item.label}
                onClick={() => { if (item.onClick) item.onClick(); else if (item.view) onNavigate(item.view); onClose(); }}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'group flex w-full items-center rounded-lg text-sm font-medium transition-all duration-200',
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                  isActive ? 'bg-violet-50 text-violet-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <item.icon className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-600" strokeWidth={2} />
                {!isCollapsed && item.label}
              </button>
            );
          })}
          {/* User Profile */}
          <button
            onClick={() => { onNavigate('profile'); onClose(); }}
            title={isCollapsed ? displayName : undefined}
            className={cn('mt-2 flex w-full items-center rounded-lg transition-all hover:bg-slate-50', isCollapsed ? 'justify-center p-2' : 'gap-3 p-2')}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-sm font-bold text-white">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-400">{roleLabel}</p>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

function Header({ onMenuClick, onNavigate, currentView, onSelectCourse }: { onMenuClick: () => void; onNavigate: (v: View) => void; currentView: View; onSelectCourse: (id: string) => void }) {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'STUDENT') as Role;
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const { data: notifData } = useNotifications({ limit: 20 });
  const markReadMut = useMarkNotificationRead();
  const markAllReadMut = useMarkAllNotificationsRead();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { data: searchData } = useCourses({ limit: 10, search: searchQuery || undefined });
  const searchResults = ((searchData?.data ?? []) as any[]).slice(0, 5);
  const allNotifications = (notifData?.data ?? []) as any[];
  const unreadCount = allNotifications.filter((n: any) => !n.isRead).length;
  const headerLinks: { label: string; view: View; roles: Role[] }[] = [
    { label: 'Home', view: 'dashboard', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { label: 'Catalog', view: 'catalog', roles: ['TEACHER', 'STUDENT'] },
    { label: 'Create Course', view: 'course-create', roles: ['TEACHER'] },
    { label: 'Admin', view: 'admin', roles: ['ADMIN'] },
  ];
  const visibleHeaderLinks = headerLinks.filter((l) => l.roles.includes(role));
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Guest';
  const initials = user ? getInitials(displayName) : 'G';
  const roleLabel = user?.role.toLowerCase() ?? 'visitor';

  const handleMarkAllRead = () => { markAllReadMut.mutate(); };
  const handleMarkOneRead = (id: string) => { markReadMut.mutate(id); };

  // Subscribe to real-time notification pushes from the backend via Socket.io
  useEffect(() => {
    let socket: any = null;
    let cancelled = false;
    (async () => {
      const { getSocket } = await import('@/lib/socket');
      socket = getSocket();
      if (!socket || cancelled) return;
      const onNotification = () => {
        // Invalidate the notifications query so the bell badge + dropdown refresh
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };
      socket.on('notification', onNotification);
      return () => { socket.off('notification', onNotification); };
    })();
    return () => { cancelled = true; };
  }, [queryClient]);

  const handleSelectSearchResult = (id: string) => {
    onSelectCourse(id);
    setSearchQuery('');
    setShowSearch(false);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
      <nav className="hidden items-center gap-1 md:flex">
        {visibleHeaderLinks.map((link) => (
          <button key={link.label} onClick={() => onNavigate(link.view)} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', link.view === currentView ? 'bg-violet-50 text-violet-600' : 'text-slate-600 hover:bg-slate-100')}>{link.label}</button>
        ))}
      </nav>
      <div className="relative hidden flex-1 md:block lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
          onFocus={() => setShowSearch(true)}
          onBlur={() => setTimeout(() => setShowSearch(false), 200)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        {showSearch && searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg">
            {searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Search className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                <p className="text-sm text-slate-500">No courses found for "{searchQuery}"</p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {searchResults.length} course{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectSearchResult(c.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                      <BookOpen className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-slate-900">{c.title}</p>
                      <p className="truncate text-xs text-slate-400">{c.category ?? 'General'} · {c.difficulty ? c.difficulty.charAt(0) + c.difficulty.slice(1).toLowerCase() : 'Beginner'}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </button>
                ))}
                <button
                  onClick={() => { onNavigate('catalog'); setShowSearch(false); setSearchQuery(''); }}
                  className="block w-full border-t border-slate-200 px-3 py-2.5 text-center text-xs font-medium text-violet-600 hover:bg-slate-50"
                >
                  View all results in catalog
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="ml-auto flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} disabled={markAllReadMut.isPending} className="text-xs font-medium text-violet-600 hover:text-violet-700">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {allNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-sm text-slate-500">You're all caught up!</p>
                      <p className="mt-0.5 text-xs text-slate-400">No notifications yet.</p>
                    </div>
                  ) : (
                    allNotifications.slice(0, 10).map((n: any) => (
                      <button
                        key={n.id}
                        onClick={() => !n.isRead && handleMarkOneRead(n.id)}
                        className={cn('flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50', !n.isRead && 'bg-violet-50/40')}
                      >
                        <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-violet-500')} />
                        <div className="flex-1 overflow-hidden">
                          <p className={cn('text-sm', n.isRead ? 'font-medium text-slate-700' : 'font-semibold text-slate-900')}>{n.title}</p>
                          {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>}
                          <p className="mt-1 text-[10px] text-slate-400">{n.createdAt ? timeAgo(n.createdAt) : ''}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {allNotifications.length > 0 && (
                  <button
                    onClick={() => { setShowNotifs(false); onNavigate('announcements'); }}
                    className="block w-full border-t border-slate-200 px-4 py-2.5 text-center text-xs font-medium text-violet-600 hover:bg-slate-50"
                  >
                    View all announcements
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="hidden text-right md:block"><p className="text-sm font-semibold text-slate-900">{displayName}</p><p className="text-xs capitalize text-slate-500">{roleLabel}</p></div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">{initials}</div>
          <button onClick={() => logoutMutation.mutate()} title="Logout" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}

// ─── Certificate Verification View (public, no auth required) ────────────
function CertificateVerificationView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [certNumber, setCertNumber] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const api = require('@/lib/api').default;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certNumber.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get('/certificates/verify', { params: { referenceNumber: certNumber.trim() } });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify certificate. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <button onClick={() => onNavigate('login')} className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600">
            <ArrowLeft className="h-4 w-4" />Back to Login
          </button>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-600">
            <BadgeCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Certificate Verification</h1>
          <p className="mt-1 text-sm text-slate-500">Enter a certificate reference number to verify its authenticity</p>
        </div>

        {/* Search form */}
        <Card className="border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certNumber" className="text-sm font-medium text-slate-700">Certificate Reference Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="certNumber"
                  type="text"
                  placeholder="e.g., CERT-2026-3826"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-slate-400">The reference number appears on the certificate (format: CERT-YYYY-XXXX)</p>
            </div>
            <Button type="submit" disabled={loading || !certNumber.trim()} className="w-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
              {loading ? 'Verifying…' : 'Verify Certificate'}
            </Button>
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </form>
        </Card>

        {/* Result */}
        {result && (
          <Card className={cn('mt-6 border-2 p-6 shadow-sm', result.valid ? 'border-emerald-300' : 'border-red-300')}>
            <div className="flex flex-col items-center text-center">
              {/* Status icon */}
              <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', result.valid ? 'bg-emerald-100' : 'bg-red-100')}>
                {result.valid ? (
                  <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                ) : (
                  <X className="h-9 w-9 text-red-500" />
                )}
              </div>

              {/* Status text */}
              <h2 className={cn('text-xl font-bold', result.valid ? 'text-emerald-700' : 'text-red-600')}>
                {result.valid ? 'Certificate Verified ✓' : 'Verification Failed'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{result.reason}</p>

              {/* Certificate details */}
              {result.certificate && (
                <div className="mt-6 w-full space-y-3 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-slate-100 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Recipient</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {result.certificate.user?.firstName} {result.certificate.user?.lastName}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-100 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Course</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {result.certificate.course?.title ?? result.certificate.quiz?.title ?? '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-100 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Reference Number</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{result.certificate.referenceNumber}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Issue Date</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {result.certificate.issuedAt ? formatDate(result.certificate.issuedAt) : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-100 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
                      <p className="mt-1">
                        <Badge className={cn(
                          'hover:opacity-90',
                          result.certificate.status === 'ISSUED' ? 'bg-emerald-50 text-emerald-600' :
                          result.certificate.status === 'REVOKED' ? 'bg-red-50 text-red-600' :
                          'bg-slate-100 text-slate-500'
                        )}>
                          {result.certificate.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-100 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Expiry Date</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {result.certificate.expiryDate ? formatDate(result.certificate.expiryDate) : 'No expiry'}
                      </p>
                    </div>
                  </div>

                  {/* View certificate link */}
                  {result.certificate.certificateUrl && result.certificate.certificateUrl.startsWith('http') && (
                    <a
                      href={result.certificate.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm font-medium text-violet-600 hover:bg-violet-100"
                    >
                      <Download className="h-4 w-4" />
                      View / Download Certificate
                    </a>
                  )}
                </div>
              )}

              {/* Verification footer */}
              <div className="mt-6 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-400">
                <BadgeCheck className="h-4 w-4 text-violet-400" />
                Verified via Trenning LMS Certificate Verification System
              </div>
            </div>
          </Card>
        )}

        {/* Info section */}
        {!result && !loading && (
          <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <BadgeCheck className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">About Certificate Verification</p>
                <p className="mt-1 text-xs text-blue-700">
                  Every certificate issued by Trenning LMS has a unique reference number (e.g., CERT-2026-3826).
                  Enter it above to verify that the certificate is authentic, valid, and has not been revoked.
                  This public verification page can be used by employers, institutions, or anyone who needs to
                  confirm a certificate's authenticity.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Login Page ──────────────────────────────────────────────────────────
function LoginPage({ onLogin, onNavigate }: { onLogin: () => void; onNavigate?: (v: View) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('admin@lms.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => onLogin(),
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          setError(axiosErr.response?.data?.message || axiosErr.message || 'Login failed. Make sure the backend is running on port 5000.');
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600"><GraduationCap className="h-7 w-7 text-white" /></div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Trenning</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue learning</p>
        </div>
        <Card className="border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="email" type="email" placeholder="ricky@trenning.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <button type="button" onClick={() => toast({ title: 'Password Reset', description: 'Please contact your administrator or use Change Password from Profile.' })} className="text-xs font-medium text-violet-600 hover:text-violet-700">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
              <Label htmlFor="remember" className="text-sm text-slate-600">Remember me for 30 days</Label>
            </div>
            <Button type="submit" disabled={loginMutation.isPending} className="w-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </form>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or continue with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.41 2.13-1.23 2.93-.86.84-1.9 1.32-3.13 1.2-.03-1.06.39-2.06 1.18-2.86.8-.82 2.07-1.44 3.18-1.27zM20.94 17.1c-.27.62-.59 1.19-.96 1.72-.51.73-.93 1.23-1.25 1.51-.5.46-1.03.69-1.6.71-.41 0-.9-.12-1.47-.36-.57-.24-1.1-.36-1.58-.36-.5 0-1.04.12-1.62.36-.58.24-1.05.37-1.41.38-.55.02-1.09-.22-1.62-.72-.34-.3-.78-.82-1.31-1.56-.57-.79-1.04-1.72-1.41-2.78-.39-1.14-.59-2.25-.59-3.32 0-1.23.27-2.29.8-3.18.42-.72.98-1.29 1.68-1.71.7-.42 1.46-.64 2.27-.66.42 0 .98.13 1.67.39.69.26 1.14.39 1.33.39.15 0 .66-.15 1.53-.46.82-.29 1.51-.41 2.07-.36 1.53.12 2.68.72 3.44 1.8-1.37.83-2.04 1.99-2.02 3.48.02 1.16.43 2.12 1.24 2.88.37.35.78.62 1.24.81-.1.28-.2.56-.31.82z"/></svg>
              Apple
            </button>
          </div>
        </Card>
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account? <button onClick={() => toast({ title: 'Sign Up', description: 'Please contact your administrator to create an account.' })} className="font-semibold text-violet-600 hover:text-violet-700">Sign up free</button>
        </p>
        {onNavigate && (
          <p className="mt-3 text-center text-xs text-slate-400">
            <button onClick={() => onNavigate('verify-certificate')} className="text-slate-500 hover:text-violet-600">
              🔍 Verify a Certificate
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard View (dispatches by role) ─────────────────────────────────
function DashboardView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'STUDENT') as Role;
  if (role === 'ADMIN') return <AdminDashboardHomeView onNavigate={onNavigate} />;
  if (role === 'TEACHER') return <TeacherDashboardHomeView onNavigate={onNavigate} />;
  return <StudentDashboardHomeView onNavigate={onNavigate} />;
}

// ─── Student Dashboard Home ──────────────────────────────────────────────
function StudentDashboardHomeView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const { data: studentData, isLoading } = useStudentDashboard();
  const { data: leaderboardData } = useLeaderboard({ limit: 5 });
  const { data: schoolData } = useStudentSchoolDashboard();
  const { data: timetableData } = useStudentTimetable();
  const firstName = user?.firstName ?? 'Learner';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {action && <button onClick={onAction} className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700">{action}<ChevronRight className="h-3.5 w-3.5" /></button>}
    </div>
  );

  const stats = studentData?.stats;
  const avgProgress = Math.round(stats?.averageProgress ?? 0);
  const liveStats = [
    { label: 'Enrolled', value: String(stats?.enrollments?.total ?? 0), icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Active', value: String(stats?.enrollments?.active ?? 0), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: String(stats?.enrollments?.completed ?? 0), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Badges', value: String(stats?.gamification?.badges ?? 0), icon: Award, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  const liveTopLearners = (leaderboardData?.entries ?? []).map((e: any) => ({
    id: e.userId, name: e.displayName, points: e.totalXP, rank: e.rank,
    avatar: getInitials(e.displayName), level: e.level,
  }));

  if (isLoading) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading your dashboard…</div></main>;
  }

  const upcoming = (studentData?.upcomingDeadlines ?? []) as any[];
  const recent = (studentData?.recentActivity ?? []) as any[];
  const studentSections = (schoolData?.sections ?? []) as any[];
  const timetable = (timetableData?.schedule ?? {}) as Record<string, any[]>;

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  // Extract grade + section info from schoolData
  const primarySection = studentSections[0]?.section;

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">
            {primarySection ? (
              <>You are in <span className="font-semibold text-violet-600">{primarySection.grade?.name}</span> · Section <span className="font-semibold text-violet-600">{primarySection.name}</span> · {primarySection.academicYear?.name}</>
            ) : (
              <>Welcome to your learning dashboard</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'My Courses', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50', view: 'catalog' as View },
            { label: 'My Assignments', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', view: 'assignment' as View },
            { label: 'Take a Quiz', icon: FileQuestion, color: 'text-emerald-600', bg: 'bg-emerald-50', view: 'quiz' as View },
            { label: 'Certificates', icon: Award, color: 'text-violet-600', bg: 'bg-violet-50', view: 'gamification' as View },
          ].map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.view)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-violet-200 hover:shadow-md">
              <div className={cn('flex h-6 w-6 items-center justify-center rounded', a.bg)}><a.icon className={cn('h-3.5 w-3.5', a.color)} /></div>{a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {liveStats.map((stat) => (
          <Card key={stat.label} className="border border-slate-200 p-4 shadow-sm rounded-xl">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.bg)}><stat.icon className={cn('h-5 w-5', stat.color)} /></div>
              <div><p className="text-xs font-medium text-slate-500">{stat.label}</p><p className="text-xl font-bold text-slate-900">{stat.value}</p></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Overall Progress Card with circular indicator */}
      <Card className="mb-6 border border-slate-200 p-5 shadow-sm rounded-xl">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#C2A7FA" strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - avgProgress / 100)} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-slate-900">{avgProgress}%</span>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-base font-semibold text-slate-900">Overall Learning Progress</h3>
            <p className="mt-1 text-sm text-slate-500">You have completed {stats?.enrollments?.completed ?? 0} out of {stats?.enrollments?.total ?? 0} courses. Keep up the great work!</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-amber-500" />Level {stats?.gamification?.level ?? 1}</span>
              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-violet-500" />{(stats?.gamification?.totalXP ?? 0).toLocaleString()} XP</span>
              <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-500" />{stats?.gamification?.currentStreak ?? 0} day streak</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* My Subjects (school-based) - shows grade, section, subjects, teacher names */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="My Subjects & Teachers" action="View sections" onAction={() => onNavigate('my-sections')} />
            {studentSections.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No sections assigned yet. Contact your administrator.</p>
            ) : (
              <div className="space-y-3">
                {studentSections.map((ss: any) => (
                  <div key={ss.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">{ss.section?.name}</Badge>
                      <span className="text-xs text-slate-400">{ss.section?.grade?.name} · {ss.section?.academicYear?.name}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(ss.section?.sectionSubjects ?? []).map((subj: any) => (
                        <div key={subj.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50"><BookOpen className="h-4 w-4 text-violet-600" /></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{subj.subject?.name}</p>
                            <p className="text-xs text-slate-500">
                              {subj.teacher ? `${subj.teacher.firstName} ${subj.teacher.lastName}` : <span className="text-amber-600">No teacher assigned</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-0.5"><FileText className="h-3 w-3" />{subj._count?.sectionContents ?? 0}</span>
                            <span className="flex items-center gap-0.5"><FileQuestion className="h-3 w-3" />{subj._count?.sectionQuizzes ?? 0}</span>
                            <span className="flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" />{subj._count?.sectionAssignments ?? 0}</span>
                          </div>
                        </div>
                      ))}
                      {(ss.section?.sectionSubjects ?? []).length === 0 && (
                        <p className="text-xs text-slate-400">No subjects assigned to this section yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Weekly Class Schedule (Timetable) */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="Weekly Class Schedule" />
            {Object.values(timetable).every((v: any[]) => v.length === 0) ? (
              <p className="py-4 text-center text-sm text-slate-400">No schedule has been set up yet. Your administrator will create the weekly timetable.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-2 py-2 text-left font-medium">Period</th>
                      {days.map(day => (
                        <th key={day} className={cn('px-2 py-2 text-center font-medium', today === day && 'text-violet-600')}>{day.charAt(0) + day.slice(1).toLowerCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Get all unique periods across all days
                      const allPeriods = new Set<number>();
                      for (const day of days) {
                        (timetable[day] ?? []).forEach((e: any) => allPeriods.add(e.period));
                      }
                      const sortedPeriods = Array.from(allPeriods).sort((a, b) => a - b);
                      return sortedPeriods.map(period => (
                        <tr key={period} className="border-b border-slate-50">
                          <td className="px-2 py-2 text-slate-400">P{period}</td>
                          {days.map(day => {
                            const entry = (timetable[day] ?? []).find((e: any) => e.period === period);
                            if (!entry) return <td key={day} className="px-2 py-2 text-center text-slate-300">—</td>;
                            if (entry.breakType) return <td key={day} className="px-2 py-2 text-center"><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{entry.breakType === 'SHORT_BREAK' ? 'Break' : 'Lunch'}</span></td>;
                            return (
                              <td key={day} className="px-1 py-1">
                                <div className={cn('rounded-lg p-1.5', today === day ? 'bg-violet-50' : 'bg-slate-50')}>
                                  <p className="font-medium text-slate-900">{entry.subjectName ?? entry.sectionSubject?.subject?.name ?? 'N/A'}</p>
                                  <p className="text-[10px] text-slate-400">{entry.startTime}-{entry.endTime}</p>
                                  {entry.teacherName && <p className="text-[10px] text-violet-500">{entry.teacherName}</p>}
                                  {entry.room && <p className="text-[10px] text-slate-400">Room {entry.room}</p>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Upcoming deadlines */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="Upcoming deadlines" action="View assignments" onAction={() => onNavigate('assignment')} />
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No upcoming deadlines. You're all caught up! 🎉</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((d: any) => (
                  <div key={d.assignmentId} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50"><Clock className="h-4 w-4 text-amber-600" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{d.title}</p>
                      <p className="text-xs text-slate-500">{d.courseTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-xs font-semibold', d.daysUntilDue <= 3 ? 'text-red-600' : 'text-slate-600')}>{d.daysUntilDue === 0 ? 'Today' : d.daysUntilDue === 1 ? 'Tomorrow' : `in ${d.daysUntilDue} days`}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(d.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent XP activity */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="Recent activity" action="View all" onAction={() => onNavigate('gamification')} />
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No recent activity. Start a course to earn XP!</p>
            ) : (
              <div className="space-y-1">
                {recent.map((a: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50"><Zap className="h-3.5 w-3.5 text-violet-600" /></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{a.description}</p>
                      <p className="text-xs text-slate-400">{timeAgo(a.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Gamification summary */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="Your progress" action="Details" onAction={() => onNavigate('gamification')} />
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-2xl font-bold text-white">{stats?.gamification?.level ?? 1}</div>
              <div>
                <p className="text-xs font-medium text-slate-500">Level {stats?.gamification?.level ?? 1}</p>
                <p className="text-2xl font-bold text-slate-900">{(stats?.gamification?.totalXP ?? 0).toLocaleString()} XP</p>
                <p className="text-xs text-slate-500">{stats?.gamification?.badges ?? 0} badges earned</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3">
              <Flame className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs font-medium text-amber-700">Current streak</p>
                <p className="text-sm font-bold text-amber-900">{stats?.gamification?.currentStreak ?? 0} day{(stats?.gamification?.currentStreak ?? 0) === 1 ? '' : 's'}</p>
              </div>
            </div>
          </Card>

          {/* Top learners */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="Top learners" action="See all" onAction={() => onNavigate('gamification')} />
            <div className="space-y-1">
              {(liveTopLearners.length > 0 ? liveTopLearners : topLearners.slice(0, 5)).map((learner) => (
                <div key={learner.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', learner.rank === 1 ? 'bg-amber-100 text-amber-700' : learner.rank === 2 ? 'bg-slate-200 text-slate-600' : learner.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400')}>{learner.rank}</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">{learner.avatar}</div>
                  <div className="flex-1"><p className="text-sm font-medium text-slate-900">{learner.name}</p><p className="text-xs text-slate-400">Level {learner.level ?? learner.courses}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-violet-600">{learner.points.toLocaleString()}</p><p className="text-[10px] text-slate-400">XP</p></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

function TeacherDashboardHomeView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const { data: teacherData, isLoading, isError } = useTeacherDashboard();
  const { data: myCoursesData } = useMyCourses({ limit: 5 });
  const { data: schoolData } = useTeacherSchoolDashboard();
  const firstName = user?.firstName ?? 'Teacher';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {action && <button onClick={onAction} className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700">{action}<ChevronRight className="h-3.5 w-3.5" /></button>}
    </div>
  );

  const stats = teacherData?.stats;
  const liveStats = [
    { label: 'My Courses', value: String(stats?.totalCourses ?? 0), icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total Students', value: String(stats?.totalStudents ?? 0), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Progress', value: `${Math.round(stats?.averageProgress ?? 0)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'At-Risk Students', value: String(stats?.atRiskStudents?.length ?? 0), icon: AlertCircle, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  if (isLoading) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading your teacher dashboard…</div></main>;
  }
  if (isError) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">Failed to load your dashboard. Please try again.</div></main>;
  }

  const myCourses = (myCoursesData?.data ?? []) as any[];
  const courseStats = (stats?.courses ?? []) as any[];
  const atRisk = (stats?.atRiskStudents ?? []) as any[];

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">
            You teach <span className="font-semibold text-violet-600">{stats?.totalCourses ?? 0} courses</span> with <span className="font-semibold text-violet-600">{stats?.totalStudents ?? 0} students</span> enrolled.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onNavigate('course-create')} className="bg-violet-600 text-white hover:bg-violet-700"><Plus className="mr-1.5 h-4 w-4" />New Course</Button>
          <Button onClick={() => onNavigate('my-courses')} variant="outline" className="border-slate-200 text-slate-600"><BookMarked className="mr-1.5 h-4 w-4" />My Courses</Button>
          <Button onClick={() => onNavigate('assignment')} variant="outline" className="border-slate-200 text-slate-600"><FileText className="mr-1.5 h-4 w-4" />Grade</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {liveStats.map((stat) => (
          <Card key={stat.label} className="border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.bg)}><stat.icon className={cn('h-5 w-5', stat.color)} /></div>
              <div><p className="text-xs font-medium text-slate-500">{stat.label}</p><p className="text-xl font-bold text-slate-900">{stat.value}</p></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* My courses performance */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="Your courses" action="Manage all" onAction={() => onNavigate('my-courses')} />
            {courseStats.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">You haven&apos;t created any courses yet. Click &quot;New Course&quot; to get started.</p>
            ) : (
              <div className="space-y-2">
                {courseStats.map((c: any) => (
                  <div key={c.id} className="rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{c.title}</p>
                      <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">{c.enrolledCount} students</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{c.completedCount} completed</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-blue-500" />{Math.round(c.averageProgress)}% avg</span>
                      {c.atRiskCount > 0 && <span className="flex items-center gap-1 text-violet-600"><AlertCircle className="h-3 w-3" />{c.atRiskCount} at-risk</span>}
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.round(c.averageProgress)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* My Teaching Assignments (school-based) */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="My Teaching Assignments" action="View all" onAction={() => onNavigate('my-sections')} />
            {(schoolData?.sectionSubjects ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No teaching assignments yet. Contact your administrator.</p>
            ) : (
              <div className="space-y-2">
                {(schoolData?.sectionSubjects ?? []).slice(0, 5).map((ts: any) => (
                  <div key={ts.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50"><BookOpen className="h-4 w-4 text-violet-600" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{ts.subject.name}</p>
                      <p className="text-xs text-slate-500">{ts.section.name} · {ts.section.grade.name}</p>
                    </div>
                    <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">{ts.studentCount} students</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* At-risk students */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="At-risk students" />
            {atRisk.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No at-risk students. Everyone is making good progress! 👍</p>
            ) : (
              <div className="space-y-2">
                {atRisk.slice(0, 5).map((s: any) => (
                  <div key={s.userId + s.courseId} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">{getInitials(`${s.firstName} ${s.lastName}`)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-slate-500">{s.courseTitle} · enrolled {s.daysSinceEnrollment}d ago</p>
                    </div>
                    <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">{Math.round(s.progressPercentage)}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Quick actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Create new course', icon: Plus, view: 'course-create' as View, color: 'text-violet-600 bg-violet-50' },
                { label: 'Manage my courses', icon: BookMarked, view: 'my-courses' as View, color: 'text-blue-600 bg-blue-50' },
                { label: 'Create a quiz', icon: FileQuestion, view: 'quiz' as View, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Grade assignments', icon: FileText, view: 'assignment' as View, color: 'text-violet-600 bg-violet-50' },
                { label: 'Browse catalog', icon: Layers, view: 'catalog' as View, color: 'text-slate-600 bg-slate-100' },
              ].map((action) => (
                <button key={action.label} onClick={() => onNavigate(action.view)} className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm font-medium text-slate-700 transition-all hover:border-violet-200 hover:bg-slate-50">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', action.color)}><action.icon className="h-4 w-4" /></div>
                  {action.label}
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </Card>

          {/* School structure summary */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Teaching Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total sections</span>
                <span className="font-bold text-slate-900">{schoolData?.stats?.totalSections ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total subjects</span>
                <span className="font-bold text-slate-900">{schoolData?.stats?.totalSubjects ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total students</span>
                <span className="font-bold text-slate-900">{schoolData?.stats?.totalStudents ?? stats?.totalStudents ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Content items</span>
                <span className="font-bold text-slate-900">{schoolData?.stats?.totalContent ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Quizzes</span>
                <span className="font-bold text-slate-900">{schoolData?.stats?.totalQuizzes ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assignments</span>
                <span className="font-bold text-slate-900">{schoolData?.stats?.totalAssignments ?? 0}</span>
              </div>
              {(schoolData?.upcomingDeadlines ?? []).length > 0 && (
                <div className="border-t border-slate-100 pt-2">
                  <p className="mb-1 text-xs font-medium text-slate-500">Upcoming deadlines</p>
                  {(schoolData?.upcomingDeadlines ?? []).slice(0, 3).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 line-clamp-1">{d.title}</span>
                      <span className="text-violet-600">{d.subject}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

// ─── Admin Dashboard Home (Step 10 — Real-time) ──────────────────────────
function AdminDashboardHomeView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data: platformData, isLoading, isError } = usePlatformDashboard();
  const { data: alerts } = useAdminAlerts();
  const { data: activity } = useRecentActivity(8);
  const { data: schoolData } = useAdminSchoolDashboard();
  const firstName = user?.firstName ?? 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real-time WebSocket: when a platform-stats-update or activity-update event
  // arrives, invalidate the relevant queries so the dashboard refreshes
  // immediately (no need to wait for the 30s polling interval).
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onStatsUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['platform-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      setLastUpdate(new Date());
    };
    const onActivityUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      setLastUpdate(new Date());
    };
    socket.on('platform-stats-update', onStatsUpdate);
    socket.on('activity-update', onActivityUpdate);
    return () => {
      socket.off('platform-stats-update', onStatsUpdate);
      socket.off('activity-update', onActivityUpdate);
    };
  }, [queryClient]);

  const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {action && <button onClick={onAction} className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700">{action}<ChevronRight className="h-3.5 w-3.5" /></button>}
    </div>
  );

  const stats = platformData?.stats;

  const platformStats = [
    { label: 'Total Users', value: String(stats?.users?.total ?? 0), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', trend: `+${stats?.users?.newThisWeek ?? 0} this week` },
    { label: 'Courses', value: String(stats?.courses?.total ?? 0), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', trend: `${stats?.courses?.published ?? 0} published` },
    { label: 'Enrollments', value: String(stats?.enrollments?.total ?? 0), icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `+${stats?.enrollments?.newThisWeek ?? 0} this week` },
    { label: 'Certificates', value: String(stats?.engagement?.certificatesIssued ?? 0), icon: Award, color: 'text-violet-600', bg: 'bg-violet-50', trend: '' },
    { label: 'Quiz Attempts', value: String(stats?.engagement?.quizAttempts ?? 0), icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', trend: '' },
    { label: 'Submissions', value: String(stats?.engagement?.assignmentSubmissions ?? 0), icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50', trend: '' },
  ];

  // Active users metrics (DAU/WAU/MAU)
  const activeUsersStats = [
    { label: 'Daily Active', value: stats?.users?.dailyActive ?? 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Weekly Active', value: stats?.users?.weeklyActive ?? 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Monthly Active', value: stats?.users?.monthlyActive ?? 0, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  // Alerts counters
  const alertItems = [
    { label: 'Escalations', value: alerts?.pendingEscalations ?? 0, color: 'text-violet-600 bg-violet-50', icon: AlertCircle },
    { label: 'Flagged', value: alerts?.flaggedContent ?? 0, color: 'text-red-600 bg-red-50', icon: AlertCircle },
    { label: 'Low Quality', value: alerts?.lowQualityCourses ?? 0, color: 'text-red-600 bg-red-50', icon: TrendingUp },
    { label: 'At-Risk Students', value: alerts?.atRiskStudents ?? 0, color: 'text-violet-600 bg-violet-50', icon: Users },
    { label: 'Grade Disputes', value: alerts?.openGradeDisputes ?? 0, color: 'text-violet-600 bg-violet-50', icon: FileQuestion },
  ].filter(i => i.value > 0);

  const userDistribution = [
    { name: 'Students', value: stats?.users?.students ?? 0, color: '#4F46E5' },
    { name: 'Teachers', value: stats?.users?.teachers ?? 0, color: '#10B981' },
    { name: 'Admins', value: stats?.users?.admins ?? 0, color: '#F59E0B' },
  ];
  const totalUsers = stats?.users?.total ?? 0;

  const activities = (activity?.data ?? []) as any[];
  const iconForType = (type: string) => {
    switch (type) {
      case 'user_registered': return { icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' };
      case 'course_created': return { icon: Plus, color: 'text-violet-600 bg-violet-50' };
      case 'enrollment': return { icon: GraduationCap, color: 'text-blue-600 bg-blue-50' };
      case 'submission': return { icon: FileText, color: 'text-violet-600 bg-violet-50' };
      case 'certificate_issued': return { icon: Award, color: 'text-violet-600 bg-violet-50' };
      default: return { icon: Bell, color: 'text-slate-600 bg-slate-50' };
    }
  };
  const labelForType = (type: string, data: any) => {
    switch (type) {
      case 'user_registered': return `New user: ${data.name} (${data.role})`;
      case 'course_created': return `New course: ${data.title}`;
      case 'enrollment': return `${data.student} enrolled in ${data.course}`;
      case 'submission': return `${data.student} submitted ${data.assignment}`;
      case 'certificate_issued': return `Certificate issued: ${data.student} — ${data.course}`;
      default: return type;
    }
  };

  if (isLoading) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading admin dashboard…</div></main>;
  }
  if (isError) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">Failed to load dashboard data. Please check your connection and try again.</div></main>;
  }

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            Platform overview
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Live · updated {timeAgo(lastUpdate.toISOString())}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onNavigate('users')} variant="outline" className="border-slate-200 text-slate-600"><UserPlus className="mr-1.5 h-4 w-4" />Users</Button>
          <Button onClick={() => onNavigate('admin')} variant="outline" className="border-slate-200 text-slate-600"><BarChart3 className="mr-1.5 h-4 w-4" />Full Admin Panel</Button>
          <Button onClick={() => onNavigate('settings')} variant="outline" className="border-slate-200 text-slate-600"><Settings className="mr-1.5 h-4 w-4" />Settings</Button>
        </div>
      </div>

      {/* Real-time alerts */}
      {alertItems.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
          <span className="mr-2 flex items-center gap-1.5 text-xs font-semibold text-violet-700">
            <AlertCircle className="h-4 w-4" />Active alerts:
          </span>
          {alertItems.map((item) => (
            <div key={item.label} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium', item.color)}>
              <item.icon className="h-3.5 w-3.5" />{item.value} {item.label}
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {platformStats.map((stat) => (
          <Card key={stat.label} className="border border-slate-200 p-4 shadow-sm">
            <div className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-lg', stat.bg)}>
              <stat.icon className={cn('h-4 w-4', stat.color)} />
            </div>
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="text-lg font-bold text-slate-900">{stat.value}</p>
            {stat.trend && <p className="text-[10px] text-slate-400">{stat.trend}</p>}
          </Card>
        ))}
      </div>

      {/* Active users row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {activeUsersStats.map((stat) => (
          <Card key={stat.label} className="border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
              </div>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.bg)}><stat.icon className={cn('h-5 w-5', stat.color)} /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* User distribution chart */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <SectionHeader title="User distribution" action="Manage users" onAction={() => onNavigate('users')} />
            <div className="flex items-center gap-6">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                      {userDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-slate-900">{totalUsers.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Total</p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {userDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Active users</span>
                    <span className="font-semibold text-emerald-600">{stats?.users?.active ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">New this month</span>
                    <span className="font-semibold text-violet-600">+{stats?.users?.newThisMonth ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent activity feed */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
                <p className="text-xs text-slate-400">Live feed · WebSocket + 30s polling</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Live
              </span>
            </div>
            {activities.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No recent activity in the last 7 days.</p>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 8).map((a: any, idx: number) => {
                  const { icon: Icon, color } = iconForType(a.type);
                  return (
                    <div key={idx} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{labelForType(a.type, a.data)}</p>
                        <p className="text-xs text-slate-400">{timeAgo(a.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Quick actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Manage Users', icon: Users, view: 'users' as View, color: 'text-violet-600 bg-violet-50' },
                { label: 'Review Content', icon: AlertCircle, view: 'admin' as View, color: 'text-red-600 bg-red-50' },
                { label: 'Audit Logs', icon: FileText, view: 'audit' as View, color: 'text-violet-600 bg-violet-50' },
                { label: 'Settings', icon: Settings, view: 'settings' as View, color: 'text-slate-600 bg-slate-100' },
                { label: 'Full Admin Panel', icon: BarChart3, view: 'admin' as View, color: 'text-violet-600 bg-violet-50' },
              ].map((action) => (
                <button key={action.label} onClick={() => onNavigate(action.view)} className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm font-medium text-slate-700 transition-all hover:border-violet-200 hover:bg-slate-50">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', action.color)}><action.icon className="h-4 w-4" /></div>
                  {action.label}
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </Card>

          {/* System status */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-900">System status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Courses published</span>
                <span className="font-semibold text-slate-900">{stats?.courses?.published ?? 0} / {stats?.courses?.total ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Active enrollments</span>
                <span className="font-semibold text-emerald-600">{stats?.enrollments?.active ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Completed enrollments</span>
                <span className="font-semibold text-slate-900">{stats?.enrollments?.completed ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dropped enrollments</span>
                <span className="font-semibold text-red-600">{stats?.enrollments?.dropped ?? 0}</span>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total modules</span>
                  <span className="font-semibold text-slate-900">{stats?.content?.totalModules ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total content items</span>
                  <span className="font-semibold text-slate-900">{stats?.content?.totalContent ?? 0}</span>
                </div>
              </div>
            </div>
          </Card>
          {/* School structure (school-based) */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">School Structure</h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('my-sections')} className="text-violet-600 hover:bg-violet-50">Manage</Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Academic Years</p>
                <p className="text-xl font-bold text-slate-900">{schoolData?.stats?.academicYears ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Grades</p>
                <p className="text-xl font-bold text-slate-900">{schoolData?.stats?.grades ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Sections</p>
                <p className="text-xl font-bold text-slate-900">{schoolData?.stats?.sections ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Subjects</p>
                <p className="text-xl font-bold text-slate-900">{schoolData?.stats?.subjects ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Teacher Assignments</p>
                <p className="text-xl font-bold text-slate-900">{schoolData?.stats?.sectionSubjects ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Student Assignments</p>
                <p className="text-xl font-bold text-slate-900">{schoolData?.stats?.studentSections ?? 0}</p>
              </div>
            </div>
            {(schoolData?.stats?.unassignedSectionSubjects ?? 0) > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-violet-50 p-2 text-xs text-violet-700">
                <AlertCircle className="h-4 w-4" />
                {schoolData.stats.unassignedSectionSubjects} section-subjects have no teacher assigned
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}



// ─── Catalog View (role-aware) ───────────────────────────────────────────
function CatalogView({ onSelectCourse, onNavigate }: { onSelectCourse: (id: string) => void; onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'STUDENT') as Role;
  const isStudent = role === 'STUDENT';
  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Popular');
  // Students: show only their enrolled courses (from student dashboard)
  // Teachers/Admins: show all visible courses
  const { data: coursesData, isLoading, isError } = useCourses({ limit: 50, search: searchQuery || undefined, status: isStudent ? 'PUBLISHED' : undefined });
  const { data: studentData } = useStudentDashboard();
  const enrollMut = useSelfEnroll();

  // For students: filter to only show enrolled courses
  const enrolledCourseIds = isStudent
    ? new Set((studentData?.courses ?? []).map((c: any) => c.course?.id).filter(Boolean))
    : null;

  // Normalize API courses into the shape expected by the UI
  const allApiCourses: Course[] = (coursesData?.data ?? []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description ?? 'No description available.',
    instructor: c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : 'Unknown',
    category: c.category ?? 'General',
    difficulty: c.difficulty ? c.difficulty.charAt(0) + c.difficulty.slice(1).toLowerCase() : 'Beginner',
    duration: c.duration ?? '—',
    lessons: c.moduleCount ?? 0,
    students: 0,
    rating: 0,
    thumbnail: 'bg-gradient-to-br from-violet-500 to-violet-500',
    status: c.status,
    createdBy: c.createdBy?.id,
  }));

  // Students: only show courses they're enrolled in
  const apiCourses = isStudent && enrolledCourseIds
    ? allApiCourses.filter(c => enrolledCourseIds.has(c.id))
    : allApiCourses;

  // For students: merge progress from studentData
  if (isStudent && studentData?.courses) {
    apiCourses.forEach(c => {
      const enrollment = studentData.courses.find((ec: any) => ec.course?.id === c.id);
      if (enrollment) {
        (c as any).progress = Math.round(enrollment.progressPercentage ?? 0);
      }
    });
  }

  const filtered = apiCourses.filter(c => {
    const catMatch = selectedCategory === 'All' || c.category === selectedCategory;
    const diffMatch = selectedDifficulty === 'All Levels' || c.difficulty === selectedDifficulty;
    return catMatch && diffMatch;
  });

  // Role-aware title/subtitle
  const heading = isStudent ? 'My Courses' : isTeacher ? 'Browse Courses' : 'All Courses';
  const subtitle = isStudent
    ? `You have ${apiCourses.length} courses assigned to you`
    : isTeacher
      ? `Browse ${apiCourses.length} courses — visit "My Courses" to manage your own`
      : `Platform total: ${apiCourses.length} courses`;

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Catalog</span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">{heading}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
        <div className="flex items-center gap-2">
          {isTeacher && (
            <Button onClick={() => onNavigate('my-courses')} variant="outline" className="border-slate-200 text-slate-600">
              <BookMarked className="mr-1.5 h-4 w-4" />My Courses
            </Button>
          )}
          {isTeacher && (
            <Button onClick={() => onNavigate('course-create')} className="bg-violet-600 text-white hover:bg-violet-700">
              <Plus className="mr-1.5 h-4 w-4" />New Course
            </Button>
          )}
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><Filter className="h-4 w-4" />Filters</button>
          <div className="relative">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-600 focus:outline-none">
              <option>Popular</option><option>Newest</option><option>Highest Rated</option><option>Most Enrolled</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="mb-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Category</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors', selectedCategory === cat ? 'bg-violet-50 text-violet-600 font-medium' : 'text-slate-600 hover:bg-slate-50')}>
                    {cat}
                    {selectedCategory === cat && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Difficulty</h3>
              <div className="space-y-1">
                {difficulties.map((diff) => (
                  <button key={diff} onClick={() => setSelectedDifficulty(diff)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors', selectedDifficulty === diff ? 'bg-violet-50 text-violet-600 font-medium' : 'text-slate-600 hover:bg-slate-50')}>
                    {diff}
                    {selectedDifficulty === diff && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Course Grid */}
        <div className="lg:col-span-3">
          <div className="mb-3 text-sm text-slate-500">{filtered.length} courses found</div>
          {isLoading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading courses…</div>}
          {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">Failed to load courses. Is the backend running on port 5000?</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => {
              const isOwn = user && (course as any).createdBy === user.id;
              return (
              <Card key={course.id} className="group cursor-pointer overflow-hidden border border-slate-200 shadow-sm transition-all hover:shadow-md" onClick={() => onSelectCourse(course.id)}>
                {/* Thumbnail */}
                <div className={cn('relative h-36', course.thumbnail)}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90"><PlayCircle className="h-6 w-6 text-violet-600" /></div>
                  </div>
                  <Badge className="absolute left-3 top-3 bg-white/90 text-slate-700 hover:bg-white">{course.category}</Badge>
                  {/* Role-aware status badges */}
                  <div className="absolute right-3 top-3 flex gap-1">
                    {(isTeacher || isAdmin) && (course as any).status && (
                      <Badge className={cn(
                        (course as any).status === 'PUBLISHED' ? 'bg-emerald-500 text-white hover:bg-emerald-500' :
                        (course as any).status === 'DRAFT' ? 'bg-violet-500 text-white hover:bg-violet-500' :
                        'bg-slate-500 text-white hover:bg-slate-500'
                      )}>{(course as any).status}</Badge>
                    )}
                    {isOwn && <Badge className="bg-violet-600 text-white hover:bg-violet-600">Yours</Badge>}
                  </div>
                  {course.progress !== undefined && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-white"><span>Progress</span><span>{course.progress}%</span></div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: `${course.progress}%` }} /></div>
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs text-slate-400">{course.difficulty}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-0.5 text-xs text-slate-400"><Clock className="h-3 w-3" />{course.duration}</span>
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-slate-900 group-hover:text-violet-600">{course.title}</h3>
                  <p className="mb-3 line-clamp-2 text-xs text-slate-500">{course.description}</p>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-600">{course.instructor.split(' ').map(n => n[0]).join('')}</div>
                      <span className="text-xs text-slate-500">{course.instructor}</span>
                    </div>
                    {/* Role-aware actions */}
                    {isStudent ? (
                      <Badge className={cn(
                        'text-xs',
                        (course as any).progress !== undefined && (course as any).progress === 100
                          ? 'bg-emerald-50 text-emerald-600'
                          : (course as any).progress !== undefined && (course as any).progress > 0
                            ? 'bg-violet-50 text-violet-600'
                            : 'bg-slate-100 text-slate-500'
                      )}>
                        {(course as any).progress !== undefined && (course as any).progress === 100
                          ? 'Completed'
                          : (course as any).progress !== undefined && (course as any).progress > 0
                            ? `${(course as any).progress}% Complete`
                            : 'Not Started'}
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-violet-400 text-violet-400" /><span className="font-semibold text-slate-700">{course.rating}</span></div>
                    )}
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── My Courses View (Teacher/Admin — manage own courses) ─────────────────
function MyCoursesView({ onSelectCourse, onNavigate }: { onSelectCourse: (id: string) => void; onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'STUDENT') as Role;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const { data, isLoading, isError } = useMyCourses({ search: searchQuery || undefined, status: statusFilter !== 'ALL' ? statusFilter : undefined });
  const publishMut = usePublishCourse();
  const archiveMut = useArchiveCourse();

  const courses: any[] = data?.data ?? [];

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">Published</Badge>;
      case 'DRAFT': return <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">Draft</Badge>;
      case 'ARCHIVED': return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100">Archived</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">My Courses</span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            {role === 'TEACHER'
              ? <>Manage the courses you teach — <span className="font-semibold text-violet-600">{courses.length}</span> total.</>
              : <>All courses on the platform (admin view) — <span className="font-semibold text-violet-600">{courses.length}</span> total.</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onNavigate('course-create')} className="bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="mr-1.5 h-4 w-4" />New Course
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-5 border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search my courses…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', statusFilter === s ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading your courses…</div>}
      {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">Failed to load your courses.</div>}
      {!isLoading && !isError && courses.length === 0 && (
        <Card className="border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-700">No courses yet</h3>
          <p className="mt-1 text-sm text-slate-500">You haven&apos;t created any courses. Click &quot;New Course&quot; to get started.</p>
          <Button onClick={() => onNavigate('course-create')} className="mt-4 bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="mr-1.5 h-4 w-4" />Create your first course
          </Button>
        </Card>
      )}

      {/* Course table */}
      {courses.length > 0 && (
        <Card className="border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="px-4 py-3 text-left font-medium">Course</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Difficulty</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button onClick={() => onSelectCourse(c.id)} className="text-left">
                        <p className="font-medium text-slate-900 hover:text-violet-600">{c.title}</p>
                        <p className="line-clamp-1 text-xs text-slate-500">{c.description ?? 'No description'}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-slate-600">{c.category ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.difficulty ? c.difficulty.charAt(0) + c.difficulty.slice(1).toLowerCase() : '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => onSelectCourse(c.id)} className="h-7 border-slate-200 px-2 text-xs">
                          <Edit className="mr-1 h-3 w-3" />Edit
                        </Button>
                        {c.status === 'DRAFT' && (
                          <Button size="sm" variant="outline" disabled={publishMut.isPending} onClick={() => publishMut.mutate(c.id)} className="h-7 border-emerald-200 px-2 text-xs text-emerald-700 hover:bg-emerald-50">
                            <CheckCircle2 className="mr-1 h-3 w-3" />Publish
                          </Button>
                        )}
                        {c.status !== 'ARCHIVED' && (
                          <Button size="sm" variant="outline" disabled={archiveMut.isPending} onClick={() => archiveMut.mutate(c.id)} className="h-7 border-slate-200 px-2 text-xs text-slate-600 hover:bg-slate-50">
                            <Trash2 className="mr-1 h-3 w-3" />Archive
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}

// ─── My Sections View (School-based: students see their sections, teachers see assigned sections) ──
// ─── Academic Structure Management (Admin) ───────────────────────────────
// ── Schedule Tab (Admin creates weekly timetable) ──
function ScheduleTab() {
  const { data: sectionsData } = useSections();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const { data: timetableData } = useSectionTimetable(selectedSection);
  const { data: ssData } = useSectionSubjects(selectedSection ? { sectionId: selectedSection } : {});
  const createBatch = useCreateTimetableBatch();
  const [entries, setEntries] = useState<any[]>([]);

  const sections = (sectionsData?.data ?? []) as any[];
  const sectionSubjects = (ssData?.data ?? []) as any[];
  const timetable = (timetableData?.schedule ?? {}) as Record<string, any[]>;
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  const handleSave = () => {
    if (!selectedSection || entries.length === 0) return;
    createBatch.mutate({ sectionId: selectedSection, entries }, {
      onSuccess: () => { toast({ title: 'Schedule saved', description: 'Weekly timetable has been updated.' }); setEntries([]); },
      onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save schedule.', variant: 'destructive' }),
    });
  };

  const addEntry = () => {
    setEntries([...entries, { day: 'MONDAY', period: entries.length + 1, startTime: '08:00', endTime: '08:45', sectionSubjectId: '', room: '' }]);
  };

  return (
    <div className="space-y-4">
      <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Weekly Class Schedule</h2>
        <div className="mb-4">
          <Label className="mb-1.5 block text-xs text-slate-600">Select Section</Label>
          <select value={selectedSection ?? ''} onChange={(e) => setSelectedSection(e.target.value || null)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Select section...</option>
            {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.grade?.name})</option>)}
          </select>
        </div>

        {selectedSection && (
          <>
            {/* Existing timetable */}
            {!Object.values(timetable).every((v: any[]) => v.length === 0) && (
              <div className="mb-4 overflow-x-auto">
                <p className="mb-2 text-xs font-semibold text-slate-500">Current Schedule</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-2 py-1 text-left">Period</th>
                      {days.map(d => <th key={d} className="px-2 py-1 text-center">{d.charAt(0) + d.slice(1).toLowerCase()}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const allPeriods = new Set<number>();
                      for (const day of days) (timetable[day] ?? []).forEach((e: any) => allPeriods.add(e.period));
                      return Array.from(allPeriods).sort((a, b) => a - b).map(period => (
                        <tr key={period} className="border-b border-slate-50">
                          <td className="px-2 py-1 text-slate-400">P{period}</td>
                          {days.map(day => {
                            const e = (timetable[day] ?? []).find((x: any) => x.period === period);
                            if (!e) return <td key={day} className="px-2 py-1 text-center text-slate-300">—</td>;
                            if (e.breakType) return <td key={day} className="px-2 py-1 text-center"><span className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">{e.breakType === 'SHORT_BREAK' ? 'Break' : 'Lunch'}</span></td>;
                            return <td key={day} className="px-1 py-1"><div className="rounded bg-slate-50 p-1"><p className="font-medium text-slate-900">{e.subjectName}</p><p className="text-[10px] text-slate-400">{e.startTime}-{e.endTime}</p>{e.teacherName && <p className="text-[10px] text-violet-500">{e.teacherName}</p>}</div></td>;
                          })}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add entries */}
            <div className="border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Add Schedule Entries</p>
                <Button size="sm" onClick={addEntry} variant="outline" className="border-slate-200 text-slate-600"><Plus className="mr-1 h-3 w-3" />Add Entry</Button>
              </div>
              {entries.length > 0 && (
                <div className="space-y-2">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 p-2">
                      <select value={entry.day} onChange={(e) => { const n = [...entries]; n[idx].day = e.target.value; setEntries(n); }} className="rounded border border-slate-200 px-2 py-1 text-xs">
                        {days.map(d => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
                      </select>
                      <input type="number" value={entry.period} onChange={(e) => { const n = [...entries]; n[idx].period = Number(e.target.value); setEntries(n); }} placeholder="P#" className="w-12 rounded border border-slate-200 px-1 py-1 text-xs" />
                      <input type="time" value={entry.startTime} onChange={(e) => { const n = [...entries]; n[idx].startTime = e.target.value; setEntries(n); }} className="rounded border border-slate-200 px-1 py-1 text-xs" />
                      <input type="time" value={entry.endTime} onChange={(e) => { const n = [...entries]; n[idx].endTime = e.target.value; setEntries(n); }} className="rounded border border-slate-200 px-1 py-1 text-xs" />
                      <select value={entry.sectionSubjectId} onChange={(e) => { const n = [...entries]; n[idx].sectionSubjectId = e.target.value; setEntries(n); }} className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs">
                        <option value="">Select subject...</option>
                        {sectionSubjects.map((ss: any) => <option key={ss.id} value={ss.id}>{ss.subject?.name} ({ss.teacher ? ss.teacher.firstName + ' ' + ss.teacher.lastName : 'No teacher'})</option>)}
                      </select>
                      <input value={entry.room} onChange={(e) => { const n = [...entries]; n[idx].room = e.target.value; setEntries(n); }} placeholder="Room" className="w-16 rounded border border-slate-200 px-1 py-1 text-xs" />
                      <button onClick={() => setEntries(entries.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <Button size="sm" onClick={handleSave} disabled={createBatch.isPending} className="bg-violet-600 text-white hover:bg-violet-700">{createBatch.isPending ? 'Saving...' : 'Save Schedule'}</Button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function AcademicManagementView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [activeTab, setActiveTab] = useState<'years' | 'grades' | 'subjects' | 'sections' | 'schedule'>('sections');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const tabs = [
    { id: 'sections' as const, label: 'Sections', icon: Layers },
    { id: 'grades' as const, label: 'Grades', icon: BookOpen },
    { id: 'subjects' as const, label: 'Subjects', icon: BookMarked },
    { id: 'years' as const, label: 'Academic Years', icon: Calendar },
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
  ];

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Academic Structure</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Academic Structure Management</h1>
        <p className="mt-1 text-sm text-slate-500">Create sections, assign students and teachers, manage the school hierarchy.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'years' && <AcademicYearsTab />}
      {activeTab === 'grades' && <GradesTab />}
      {activeTab === 'subjects' && <SubjectsTab />}
      {activeTab === 'schedule' && <ScheduleTab />}
      {activeTab === 'sections' && (
        <SectionsTab
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
        />
      )}
    </main>
  );
}

// ── Academic Years Tab ──
function AcademicYearsTab() {
  const { data, isLoading } = useAcademicYears();
  const createMut = useCreateAcademicYear();
  const [showForm, setShowForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);

  const years = (data?.data ?? []) as any[];

  const handleCreate = () => {
    if (!name || !startDate || !endDate) return;
    createMut.mutate({ name, startDate, endDate, isCurrent }, {
      onSuccess: () => { setShowForm(false); setName(''); setStartDate(''); setEndDate(''); setIsCurrent(false); toast({ title: 'Academic year created', description: `${name} has been created.` }); },
      onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create academic year.', variant: 'destructive' }),
    });
  };

  return (
    <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Academic Years</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white hover:bg-violet-700">
          <Plus className="mr-1.5 h-4 w-4" />{showForm ? 'Cancel' : 'New Year'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-slate-600">Name (e.g. 2026-2027)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="2026-2027" />
            </div>
            <div>
              <Label className="text-xs text-slate-600">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-slate-600">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="rounded" />
                Set as current year
              </label>
            </div>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={createMut.isPending} className="mt-3 bg-violet-600 text-white hover:bg-violet-700">
            {createMut.isPending ? 'Creating...' : 'Create Academic Year'}
          </Button>
        </div>
      )}

      {isLoading && <p className="py-4 text-center text-sm text-slate-400">Loading...</p>}
      {!isLoading && years.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No academic years yet.</p>}

      <div className="space-y-2">
        {years.map((y: any) => (
          <div key={y.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
            <button className="flex flex-1 items-center gap-3 text-left" onClick={() => setSelectedYear(selectedYear === y.id ? null : y.id)}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50"><Calendar className="h-5 w-5 text-violet-600" /></div>
              <div>
                <p className="text-sm font-medium text-slate-900 hover:text-violet-600">{y.name}</p>
                <p className="text-xs text-slate-500">{formatDate(y.startDate)} - {formatDate(y.endDate)}</p>
              </div>
            </button>
            {y.isCurrent && <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">Current</Badge>}
          </div>
        ))}
      </div>

      {/* Sections in selected academic year */}
      {selectedYear && (
        <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Sections in this Academic Year</h3>
          <AcademicYearSections academicYearId={selectedYear} />
        </div>
      )}
    </Card>
  );
}

// ── Helper: Sections in an Academic Year ──
function AcademicYearSections({ academicYearId }: { academicYearId: string }) {
  const { data, isLoading } = useSections({ academicYearId });
  const sections = (data?.data ?? []) as any[];
  if (isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (sections.length === 0) return <p className="text-sm text-slate-400">No sections in this academic year.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((s: any) => (
        <div key={s.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <span className="font-semibold text-violet-600">{s.name}</span>
          <span className="text-xs text-slate-400">{s.grade?.name}</span>
          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">{s._count?.studentSections ?? 0} students</Badge>
        </div>
      ))}
    </div>
  );
}

// ── Helper: Sections in a Grade ──
function GradeSections({ gradeId, gradeName }: { gradeId: string; gradeName: string }) {
  const { data, isLoading } = useSections({ gradeId });
  const sections = (data?.data ?? []) as any[];
  if (isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (sections.length === 0) return <p className="text-sm text-slate-400">No sections in {gradeName}.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((s: any) => (
        <div key={s.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <span className="font-semibold text-violet-600">{s.name}</span>
          <span className="text-xs text-slate-400">{s.academicYear?.name}</span>
          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">{s._count?.studentSections ?? 0} students</Badge>
        </div>
      ))}
    </div>
  );
}

// ── Helper: Sections teaching a Subject ──
function SubjectSections({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
  const { data, isLoading } = useSectionSubjects({} as any);
  // Filter client-side by subjectId — useSectionSubjects doesn't accept subjectId filter
  // so we fetch all and filter
  const allSS = (data?.data ?? []) as any[];
  const filtered = allSS.filter((ss: any) => ss.subjectId === subjectId);
  if (isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (filtered.length === 0) return <p className="text-sm text-slate-400">{subjectName} is not assigned to any section yet.</p>;
  return (
    <div className="space-y-2">
      {filtered.map((ss: any) => (
        <div key={ss.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-600">{ss.section?.name}</span>
            <span className="text-xs text-slate-400">{ss.section?.grade?.name} · {ss.section?.academicYear?.name}</span>
          </div>
          <div className="text-xs text-slate-500">
            {ss.teacher ? `${ss.teacher.firstName} ${ss.teacher.lastName}` : <span className="text-violet-600">No teacher</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Grades Tab ──
function GradesTab() {
  const { data, isLoading } = useGrades();
  const createMut = useCreateGrade();
  const [showForm, setShowForm] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');

  const grades = (data?.data ?? []) as any[];

  const handleCreate = () => {
    if (!name || !level) return;
    createMut.mutate({ name, level: Number(level) }, {
      onSuccess: () => { setShowForm(false); setName(''); setLevel(''); toast({ title: 'Grade created', description: `${name} has been created.` }); },
      onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create grade.', variant: 'destructive' }),
    });
  };

  return (
    <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Grade Levels</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white hover:bg-violet-700">
          <Plus className="mr-1.5 h-4 w-4" />{showForm ? 'Cancel' : 'New Grade'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-slate-600">Name (e.g. Grade 9)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Grade 9" />
            </div>
            <div>
              <Label className="text-xs text-slate-600">Level (numeric, e.g. 9)</Label>
              <Input type="number" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="9" />
            </div>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={createMut.isPending} className="mt-3 bg-violet-600 text-white hover:bg-violet-700">
            {createMut.isPending ? 'Creating...' : 'Create Grade'}
          </Button>
        </div>
      )}

      {isLoading && <p className="py-4 text-center text-sm text-slate-400">Loading...</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {grades.map((g: any) => (
          <button
            key={g.id}
            onClick={() => setSelectedGrade(selectedGrade === g.id ? null : g.id)}
            className={cn(
              'rounded-lg border p-4 text-center transition-all',
              selectedGrade === g.id ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-slate-200 hover:border-violet-200 hover:shadow-sm'
            )}
          >
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100"><BookOpen className="h-6 w-6 text-violet-600" /></div>
            <p className="text-sm font-semibold text-slate-900">{g.name}</p>
            <p className="text-xs text-slate-400">{g._count?.sections ?? 0} sections</p>
          </button>
        ))}
      </div>

      {/* Sections in selected grade */}
      {selectedGrade && (
        <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Sections in this Grade</h3>
          <GradeSections gradeId={selectedGrade} gradeName={grades.find(g => g.id === selectedGrade)?.name ?? ''} />
        </div>
      )}
    </Card>
  );
}

// ── Subjects Tab ──
function SubjectsTab() {
  const { data, isLoading } = useSubjects();
  const createMut = useCreateSubject();
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const subjects = (data?.data ?? []) as any[];

  const handleCreate = () => {
    if (!name) return;
    createMut.mutate({ name, code: code || undefined }, {
      onSuccess: () => { setShowForm(false); setName(''); setCode(''); toast({ title: 'Subject created', description: `${name} has been created.` }); },
      onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create subject.', variant: 'destructive' }),
    });
  };

  return (
    <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Subjects</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white hover:bg-violet-700">
          <Plus className="mr-1.5 h-4 w-4" />{showForm ? 'Cancel' : 'New Subject'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-slate-600">Name (e.g. Mathematics)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" />
            </div>
            <div>
              <Label className="text-xs text-slate-600">Code (optional, e.g. MATH)</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MATH" />
            </div>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={createMut.isPending} className="mt-3 bg-violet-600 text-white hover:bg-violet-700">
            {createMut.isPending ? 'Creating...' : 'Create Subject'}
          </Button>
        </div>
      )}

      {isLoading && <p className="py-4 text-center text-sm text-slate-400">Loading...</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {subjects.map((s: any) => (
          <button
            key={s.id}
            onClick={() => setSelectedSubject(selectedSubject === s.id ? null : s.id)}
            className={cn(
              'rounded-lg border p-3 text-center transition-all',
              selectedSubject === s.id ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-200 hover:shadow-sm'
            )}
          >
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><BookMarked className="h-5 w-5 text-blue-600" /></div>
            <p className="text-sm font-semibold text-slate-900">{s.name}</p>
            {s.code && <p className="text-xs text-slate-400">{s.code}</p>}
            <p className="text-[10px] text-slate-400">{s._count?.sectionSubjects ?? 0} assignments</p>
          </button>
        ))}
      </div>

      {/* Section-subjects for selected subject */}
      {selectedSubject && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Sections teaching this Subject</h3>
          <SubjectSections subjectId={selectedSubject} subjectName={subjects.find(s => s.id === selectedSubject)?.name ?? ''} />
        </div>
      )}
    </Card>
  );
}

// ── Sections Tab (the main one — create sections, view students/teachers, assign) ──
function SectionsTab({ selectedSectionId, onSelectSection }: { selectedSectionId: string | null; onSelectSection: (id: string | null) => void }) {
  const { data: sectionsData, isLoading } = useSections();
  const { data: gradesData } = useGrades();
  const { data: ayData } = useCurrentAcademicYear();
  const createMut = useCreateSection();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [capacity, setCapacity] = useState('40');

  const sections = (sectionsData?.data ?? []) as any[];
  const grades = (gradesData?.data ?? []) as any[];
  const ay = ayData?.academicYear;

  const handleCreate = () => {
    if (!name || !gradeId || !ay) return;
    createMut.mutate({ name, gradeId, academicYearId: ay.id, capacity: Number(capacity) }, {
      onSuccess: () => { setShowForm(false); setName(''); setCapacity('40'); toast({ title: 'Section created', description: `Section ${name} has been created.` }); },
      onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create section.', variant: 'destructive' }),
    });
  };

  // If a section is selected, show the detail view
  if (selectedSectionId) {
    return <SectionDetailView sectionId={selectedSectionId} onBack={() => onSelectSection(null)} />;
  }

  return (
    <div className="space-y-4">
      <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Sections</h2>
            <p className="text-xs text-slate-500">{ay ? `Academic Year: ${ay.name}` : 'No current academic year set'}</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} disabled={!ay} className="bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="mr-1.5 h-4 w-4" />{showForm ? 'Cancel' : 'New Section'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs text-slate-600">Section Name (e.g. 9A)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="9A" />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Grade</Label>
                <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Select grade...</option>
                  {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Capacity</Label>
                <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
            </div>
            <Button size="sm" onClick={handleCreate} disabled={createMut.isPending} className="mt-3 bg-violet-600 text-white hover:bg-violet-700">
              {createMut.isPending ? 'Creating...' : 'Create Section'}
            </Button>
          </div>
        )}

        {isLoading && <p className="py-4 text-center text-sm text-slate-400">Loading...</p>}
        {!isLoading && sections.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No sections yet. Create one to get started.</p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s: any) => (
            <button
              key={s.id}
              onClick={() => onSelectSection(s.id)}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-violet-600">{s.name}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.grade?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Students</p>
                <p className="text-lg font-bold text-slate-900">{s._count?.studentSections ?? 0}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Section Detail View (students + teachers + assignment forms) ──
function SectionDetailView({ sectionId, onBack }: { sectionId: string; onBack: () => void }) {
  const { data: sectionsData } = useSections();
  const { data: studentsData, isLoading: studentsLoading } = useSectionStudents(sectionId);
  const { data: ssData, isLoading: ssLoading } = useSectionSubjects({ sectionId });
  const { data: usersData } = useUsers({ limit: 100 });
  const { data: subjectsData } = useSubjects();
  const assignStudentMut = useAssignStudent();
  const assignTeacherMut = useAssignTeacher();
  const removeStudentMut = useRemoveStudentFromSection();
  const { data: ayData } = useCurrentAcademicYear();

  const section = (sectionsData?.data ?? []).find((s: any) => s.id === sectionId);
  const students = (studentsData?.data ?? []) as any[];
  const sectionSubjects = (ssData?.data ?? []) as any[];
  const allUsers = (usersData?.data ?? []) as any[];
  const allSubjects = (subjectsData?.data ?? []) as any[];
  const ay = ayData?.academicYear;

  // Form state
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const availableStudents = allUsers.filter((u: any) => u.role === 'STUDENT');
  const availableTeachers = allUsers.filter((u: any) => u.role === 'TEACHER');

  const handleAssignStudent = () => {
    if (!selectedStudentId || !ay) return;
    assignStudentMut.mutate({ studentId: selectedStudentId, sectionId, academicYearId: ay.id }, {
      onSuccess: () => { setSelectedStudentId(''); toast({ title: 'Student assigned', description: 'Student has been added to this section.' }); },
      onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to assign student.', variant: 'destructive' }),
    });
  };

  const handleAssignTeacher = () => {
    if (!selectedTeacherId || !selectedSubjectId) return;
    assignTeacherMut.mutate({ sectionId, subjectId: selectedSubjectId, teacherId: selectedTeacherId }, {
      onSuccess: () => { setSelectedTeacherId(''); setSelectedSubjectId(''); toast({ title: 'Teacher assigned', description: 'Teacher has been assigned to this subject.' }); },
      onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to assign teacher.', variant: 'destructive' }),
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    
    removeStudentMut.mutate({ studentId, sectionId }, {
      onSuccess: () => toast({ title: 'Student removed', description: 'Student has been removed from this section.' }),
      onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to remove student.', variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="border-slate-200"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{section?.name ?? 'Section'}</h2>
          <p className="text-sm text-slate-500">{section?.grade?.name} · {section?.academicYear?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students column */}
        <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Students ({students.length})</h3>
          </div>

          {/* Assign student form */}
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <Label className="mb-1 text-xs text-slate-600">Assign student to this section</Label>
            <div className="flex gap-2">
              <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Select student...</option>
                {availableStudents.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
              </select>
              <Button size="sm" onClick={handleAssignStudent} disabled={!selectedStudentId || assignStudentMut.isPending} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {assignStudentMut.isPending ? '...' : 'Add'}
              </Button>
            </div>
          </div>

          {studentsLoading && <p className="py-4 text-center text-sm text-slate-400">Loading...</p>}
          {!studentsLoading && students.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No students assigned.</p>}

          <div className="space-y-2">
            {students.map((ss: any) => (
              <div key={ss.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">{getInitials(`${ss.student.firstName} ${ss.student.lastName}`)}</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{ss.student.firstName} {ss.student.lastName}</p>
                    <p className="text-xs text-slate-400">{ss.student.email}</p>
                  </div>
                </div>
                <button onClick={() => handleRemoveStudent(ss.student.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Teachers / Subjects column */}
        <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Subjects & Teachers ({sectionSubjects.length})</h3>
          </div>

          {/* Assign teacher form */}
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
            <Label className="mb-1 text-xs text-slate-600">Assign teacher to a subject</Label>
            <div className="space-y-2">
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Select subject...</option>
                {allSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex gap-2">
                <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Select teacher...</option>
                  {availableTeachers.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
                <Button size="sm" onClick={handleAssignTeacher} disabled={!selectedTeacherId || !selectedSubjectId || assignTeacherMut.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
                  {assignTeacherMut.isPending ? '...' : 'Assign'}
                </Button>
              </div>
            </div>
          </div>

          {ssLoading && <p className="py-4 text-center text-sm text-slate-400">Loading...</p>}
          {!ssLoading && sectionSubjects.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No subjects assigned yet.</p>}

          <div className="space-y-2">
            {sectionSubjects.map((ss: any) => (
              <div key={ss.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50"><BookMarked className="h-4 w-4 text-blue-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{ss.subject?.name}</p>
                    <p className="text-xs text-slate-400">{ss.teacher ? `${ss.teacher.firstName} ${ss.teacher.lastName}` : <span className="text-violet-600">No teacher assigned</span>}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


function MySectionsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'STUDENT') as Role;
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isAdmin = role === 'ADMIN';

  // Students: their assigned sections
  // Teachers: their assigned section-subjects
  // Admins: all sections (with student/teacher counts)
  const { data: studentSectionsData, isLoading: studentLoading } = useUserSections(isStudent ? user?.id : null);
  const { data: teacherSectionsData, isLoading: teacherLoading } = useTeacherSections(isTeacher ? user?.id : null);
  const { data: allSectionsData, isLoading: adminLoading } = useSections();
  const { data: gradesData } = useGrades();

  const studentSections = (studentSectionsData?.data ?? []) as any[];
  const teacherSections = (teacherSectionsData?.data ?? []) as any[];
  const allSections = (allSectionsData?.data ?? []) as any[];
  const loading = isStudent ? studentLoading : isTeacher ? teacherLoading : adminLoading;

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">My Sections</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {isStudent ? 'My Sections' : isTeacher ? 'My Teaching Assignments' : 'All Sections'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isStudent
            ? 'Your assigned sections and subjects for this academic year'
            : isTeacher
              ? 'Sections and subjects you are assigned to teach'
              : 'All sections across the platform'}
        </p>
      </div>

      {loading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading…</div>}

      {/* Student view: sections with subjects */}
      {isStudent && !loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {studentSections.length === 0 && (
            <Card className="border border-dashed border-slate-300 p-8 text-center">
              <Layers className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-700">No sections assigned</h3>
              <p className="mt-1 text-sm text-slate-500">Contact your administrator to be assigned to a section.</p>
            </Card>
          )}
          {studentSections.map((ss: any) => (
            <Card key={ss.id} className="border border-slate-200 p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{ss.section.name}</h3>
                  <p className="text-sm text-slate-500">{ss.section.grade.name} · {ss.section.academicYear.name}</p>
                </div>
                <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">{ss.section.sectionSubjects?.length ?? 0} subjects</Badge>
              </div>
              <div className="space-y-2">
                {(ss.section.sectionSubjects ?? []).map((subj: any) => (
                  <div key={subj.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50"><BookOpen className="h-4 w-4 text-violet-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{subj.subject.name}</p>
                        <p className="text-xs text-slate-500">{subj.teacher ? `${subj.teacher.firstName} ${subj.teacher.lastName}` : 'No teacher assigned'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{subj._count?.sectionContents ?? 0}</span>
                      <span className="flex items-center gap-1"><FileQuestion className="h-3 w-3" />{subj._count?.sectionQuizzes ?? 0}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{subj._count?.sectionAssignments ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Teacher view: section-subjects */}
      {isTeacher && !loading && (
        <div className="space-y-4">
          {teacherSections.length === 0 && (
            <Card className="border border-dashed border-slate-300 p-8 text-center">
              <BookMarked className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-700">No teaching assignments</h3>
              <p className="mt-1 text-sm text-slate-500">Contact your administrator to be assigned to teach a section-subject.</p>
            </Card>
          )}
          {teacherSections.map((ts: any) => (
            <Card key={ts.id} className="border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100"><BookOpen className="h-6 w-6 text-violet-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{ts.subject.name}</h3>
                    <p className="text-sm text-slate-500">{ts.section.name} · {ts.section.grade.name} · {ts.section.academicYear.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Students</p>
                    <p className="font-bold text-slate-900">{ts.section._count?.studentSections ?? 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Content</p>
                    <p className="font-bold text-slate-900">{ts._count?.sectionContents ?? 0}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Admin view: all sections */}
      {isAdmin && !loading && (
        <Card className="border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="px-4 py-3 text-left font-medium">Section</th>
                  <th className="px-4 py-3 text-left font-medium">Grade</th>
                  <th className="px-4 py-3 text-left font-medium">Academic Year</th>
                  <th className="px-4 py-3 text-right font-medium">Students</th>
                  <th className="px-4 py-3 text-right font-medium">Subjects</th>
                  <th className="px-4 py-3 text-right font-medium">Capacity</th>
                </tr>
              </thead>
              <tbody>
                {allSections.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.grade?.name}</td>
                    <td className="px-4 py-3 text-slate-500">{s.academicYear?.name}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{s._count?.studentSections ?? 0}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{s._count?.sectionSubjects ?? 0}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{s.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}

// ─── Page Content Editor (rich text for PAGE-type content) ───────────────
function PageContentEditor({ courseId, contentId, canAuthor }: { courseId: string; contentId: string; canAuthor: boolean }) {
  const { data: courseData } = useCourse(courseId || null);
  const updateContent = useUpdateContent(courseId || null);
  const [markdown, setMarkdown] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'idle' | 'success' | 'error'; msg?: string }>({ type: 'idle' });

  // Find the content in the course data
  const apiModules = (courseData as any)?.course?.modules ?? (courseData as any)?.modules ?? [];
  const allContents = apiModules.flatMap((m: any) => m.contents ?? []);
  const content = allContents.find((c: any) => c.id === contentId);

  // Load markdown from contentJson when content changes
  useEffect(() => {
    if (content?.contentJson) {
      const cj = content.contentJson as any;
      if (typeof cj === 'string') {
        setMarkdown(cj);
      } else if (cj?.type === 'markdown' && typeof cj.content === 'string') {
        setMarkdown(cj.content);
      } else {
        setMarkdown('');
      }
    } else {
      setMarkdown('');
    }
    setVideoUrl(content?.videoUrl ?? '');
    setExternalUrl(content?.externalUrl ?? '');
    setFileUrl(content?.fileUrl ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, content?.contentJson, content?.videoUrl, content?.externalUrl, content?.fileUrl]);

  const handleSave = () => {
    setSaveStatus({ type: 'idle' });
    const updateData: any = {};
    if (content?.type === 'PAGE') {
      updateData.contentJson = { type: 'markdown', content: markdown, updatedAt: new Date().toISOString() };
    } else if (content?.type === 'VIDEO' && videoUrl !== undefined) {
      updateData.videoUrl = videoUrl || undefined;
    } else if (content?.type === 'EXTERNAL_LINK' && externalUrl !== undefined) {
      updateData.externalUrl = externalUrl || undefined;
    } else if (content?.type === 'DOCUMENT' && fileUrl !== undefined) {
      updateData.fileUrl = fileUrl || undefined;
    }
    updateContent.mutate(
      { contentId, data: updateData },
      {
        onSuccess: () => {
          setSaveStatus({ type: 'success', msg: 'Content saved.' });
          setIsEditing(false);
          toast({ title: 'Content saved', description: 'Your changes have been saved.' });
          setTimeout(() => setSaveStatus({ type: 'idle' }), 3000);
        },
        onError: (err: any) => { setSaveStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to save.' }); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save.', variant: 'destructive' }); },
      },
    );
  };

  if (!content) {
    return <p className="text-sm text-slate-400">Content not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{content.title}</h3>
          <p className="text-xs text-slate-400">Page content · {markdown.length} characters</p>
        </div>
        {canAuthor && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-slate-200 text-slate-600">
            <Edit className="mr-1.5 h-3.5 w-3.5" />Edit Content
          </Button>
        )}
      </div>

      {saveStatus.type === 'success' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">{saveStatus.msg}</div>
      )}
      {saveStatus.type === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{saveStatus.msg}</div>
      )}

      {canAuthor && isEditing ? (
        <div className="space-y-3">
          {content.type === 'PAGE' && (
            <RichTextEditor value={markdown} onChange={setMarkdown} placeholder="Write your lesson content here. Supports markdown: **bold**, *italic*, # headings, - lists, > quotes, [links](url)..." />
          )}
          {content.type === 'VIDEO' && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Video URL (YouTube, Vimeo, or direct MP4 link)</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              {videoUrl && (
                <div className="mt-2 aspect-video overflow-hidden rounded-lg bg-slate-900">
                  {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? (
                    <iframe src={videoUrl.replace('watch?v=', 'embed/')} className="h-full w-full" allowFullScreen />
                  ) : (
                    <video src={videoUrl} controls className="h-full w-full" />
                  )}
                </div>
              )}
            </div>
          )}
          {content.type === 'EXTERNAL_LINK' && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">External URL</Label>
              <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
              {externalUrl && (
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline">
                  <Link2 className="h-3.5 w-3.5" />Test link
                </a>
              )}
            </div>
          )}
          {content.type === 'DOCUMENT' && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Document URL (PDF, DOCX, etc.)</Label>
              <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://.../document.pdf" />
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline">
                  <File className="h-3.5 w-3.5" />View document
                </a>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setIsEditing(false); setSaveStatus({ type: 'idle' }); }} className="border-slate-200 text-slate-600">Cancel</Button>
            <Button onClick={handleSave} disabled={updateContent.isPending} className="bg-violet-600 text-white hover:bg-violet-700">
              {updateContent.isPending ? 'Saving...' : 'Save Content'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
          {content.type === 'PAGE' && (markdown.trim() ? <RichTextRenderer content={markdown} /> : <p className="text-sm italic text-slate-400">{canAuthor ? 'No content yet. Click "Edit Content" to add lesson material.' : 'No content available for this lesson yet.'}</p>)}
          {content.type === 'VIDEO' && videoUrl && (
            <div className="aspect-video overflow-hidden rounded-lg bg-slate-900">
              {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? (
                <iframe src={videoUrl.replace('watch?v=', 'embed/')} className="h-full w-full" allowFullScreen />
              ) : (
                <video src={videoUrl} controls className="h-full w-full" />
              )}
            </div>
          )}
          {content.type === 'VIDEO' && !videoUrl && <p className="text-sm italic text-slate-400">{canAuthor ? 'No video URL set. Click "Edit Content" to add one.' : 'No video available.'}</p>}
          {content.type === 'EXTERNAL_LINK' && externalUrl && (
            <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-600 hover:bg-violet-100">
              <Link2 className="h-4 w-4" />Open external resource
            </a>
          )}
          {content.type === 'EXTERNAL_LINK' && !externalUrl && <p className="text-sm italic text-slate-400">{canAuthor ? 'No URL set. Click "Edit Content" to add one.' : 'No link available.'}</p>}
          {content.type === 'DOCUMENT' && fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-100">
              <File className="h-4 w-4" />View document
            </a>
          )}
          {content.type === 'DOCUMENT' && !fileUrl && <p className="text-sm italic text-slate-400">{canAuthor ? 'No document URL set. Click "Edit Content" to add one.' : 'No document available.'}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Course Detail View ──────────────────────────────────────────────────
function CourseDetailView({ courseId, onNavigate, onSelectQuiz, onSelectAssignment }: { courseId: string; onNavigate: (v: View) => void; onSelectQuiz?: (id: string) => void; onSelectAssignment?: (id: string) => void }) {
  const { data: courseData, isLoading } = useCourse(courseId || null);
  const authUser = useAuthStore((s) => s.user);
  const canAuthor = authUser?.role === 'TEACHER';
  const isStudent = authUser?.role === 'STUDENT';
  const publishMut = usePublishCourse();
  const archiveMut = useArchiveCourse();
  const selfEnrollMut = useSelfEnroll();
  const createModuleMut = useCreateModule(courseId || null);
  const deleteModuleMut = useDeleteModule(courseId || null);
  const createContentMut = useCreateContent(courseId || null);
  const deleteContentMut = useDeleteContent(courseId || null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [showAddContent, setShowAddContent] = useState<string | null>(null); // module ID
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentType, setNewContentType] = useState<'PAGE' | 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'ASSIGNMENT' | 'EXTERNAL_LINK'>('PAGE');
  const [authorErr, setAuthorErr] = useState('');
  // Normalize the API response into our Course shape; fall back to first mock for layout
  const apiCourse = courseData as any;
  // Collect all content IDs from the course so we can look up quizzes/assignments attached to them
  const apiModules = (apiCourse?.course?.modules ?? apiCourse?.modules ?? []) as any[];
  const allContentIds = apiModules.flatMap((m: any) =>
    ((m.contents ?? m.lessons ?? []) as any[]).map((c: any) => c.id).filter(Boolean) as string[],
  );
  // Fetch all quizzes and assignments (single meta-query each, with client-side filter by contentId)
  const quizzesForContents = useQuizzesForContents(allContentIds);
  const assignmentsForContents = useAssignmentsForContents(allContentIds);
  const quizByContent: Record<string, string> = (quizzesForContents?.data?.byContent ?? {}) as any;
  const assignmentByContent: Record<string, string> = (assignmentsForContents?.data?.byContent ?? {}) as any;
  // Convert to contentId → quizId/assignmentId maps
  const quizIdByContent: Record<string, string> = {};
  for (const [cid, q] of Object.entries(quizByContent)) quizIdByContent[cid] = (q as any).id;
  const assignmentIdByContent: Record<string, string> = {};
  for (const [cid, a] of Object.entries(assignmentByContent)) assignmentIdByContent[cid] = (a as any).id;

  const course: Course = apiCourse ? {
    id: apiCourse.id ?? apiCourse.course?.id ?? '',
    title: apiCourse.title ?? apiCourse.course?.title ?? 'Course',
    description: apiCourse.description ?? apiCourse.course?.description ?? 'No description available.',
    instructor: apiCourse.createdBy ? `${apiCourse.createdBy.firstName} ${apiCourse.createdBy.lastName}` : (apiCourse.course?.createdBy ? `${apiCourse.course.createdBy.firstName} ${apiCourse.course.createdBy.lastName}` : 'Unknown'),
    category: apiCourse.category ?? 'General',
    difficulty: apiCourse.difficulty ? apiCourse.difficulty.charAt(0) + apiCourse.difficulty.slice(1).toLowerCase() : 'Beginner',
    duration: apiCourse.duration ?? '—',
    lessons: apiCourse.moduleCount ?? 0,
    students: 0,
    rating: 0,
    thumbnail: 'bg-gradient-to-br from-violet-500 to-violet-500',
    modules: apiModules.map((m: any, mi: number) => ({
      id: m.id ?? mi,
      title: m.title ?? `Module ${mi + 1}`,
      lessons: (m.contents ?? m.lessons ?? []).map((l: any, li: number) => ({
        id: l.id ?? li,
        title: l.title ?? 'Untitled',
        // Normalize: API returns 'VIDEO', 'PAGE', 'QUIZ', 'ASSIGNMENT' (uppercase); convert to lowercase for icon lookup
        type: (l.type ?? 'video').toLowerCase(),
        duration: l.duration ?? '—',
        completed: false,
      })),
    })),
  } : catalogCourses[0];
  const [activeLesson, setActiveLesson] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeModule, setActiveModule] = useState(0);

  const lessonTypeIcons: Record<string, typeof Video> = {
    video: Video, page: File, quiz: FileQuestion, assignment: FileText,
  };

  // Helper: handle clicking a lesson — if quiz/assignment type and a corresponding entity exists, navigate
  const handleLessonClick = (moduleId: number, lessonIdx: number, lesson: { id: number | string; type: string }) => {
    setActiveModule(moduleId);
    setActiveLesson(lessonIdx);
    const contentId = String(lesson.id);
    if (lesson.type === 'quiz' && onSelectQuiz && quizIdByContent[contentId]) {
      onSelectQuiz(quizIdByContent[contentId]);
    } else if (lesson.type === 'assignment' && onSelectAssignment && assignmentIdByContent[contentId]) {
      onSelectAssignment(assignmentIdByContent[contentId]);
    }
  };

  const handleCreateModule = () => {
    setAuthorErr('');
    if (!newModuleTitle.trim()) {
      setAuthorErr('Module title is required.');
      return;
    }
    createModuleMut.mutate(
      { title: newModuleTitle },
      {
        onSuccess: () => { setNewModuleTitle(''); setShowAddModule(false); toast({ title: 'Module created', description: 'New module added to course.' }); },
        onError: (err: any) => { setAuthorErr(err.response?.data?.message || 'Failed to create module.'); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create module.', variant: 'destructive' }); },
      },
    );
  };

  const handleCreateContent = (moduleId: string) => {
    setAuthorErr('');
    if (!newContentTitle.trim()) {
      setAuthorErr('Content title is required.');
      return;
    }
    createContentMut.mutate(
      { moduleId, data: { title: newContentTitle, type: newContentType, isPublished: true } },
      {
        onSuccess: () => {
          setNewContentTitle('');
          setShowAddContent(null);
          toast({ title: 'Content created', description: `${newContentType.charAt(0) + newContentType.slice(1).toLowerCase()} content added.` });
        },
        onError: (err: any) => { setAuthorErr(err.response?.data?.message || 'Failed to create content.'); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create content.', variant: 'destructive' }); },
      },
    );
  };

  const handleDeleteModule = (moduleId: string) => {
    
    deleteModuleMut.mutate(moduleId, {
      onSuccess: () => toast({ title: 'Module deleted', description: 'The module and its content have been removed.' }),
      onError: () => toast({ title: 'Error', description: 'Failed to delete module.', variant: 'destructive' }),
    });
  };

  const handleDeleteContent = (contentId: string) => {
    
    deleteContentMut.mutate(contentId, {
      onSuccess: () => toast({ title: 'Content deleted', description: 'The content has been removed.' }),
      onError: () => toast({ title: 'Error', description: 'Failed to delete content.', variant: 'destructive' }),
    });
  };

  const completedLessons = course.modules?.reduce((acc, m) => acc + m.lessons.filter(l => l.completed).length, 0) || 0;
  const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || 0;

  if (isLoading) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading course…</div></main>;
  }

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('catalog')} className="hover:text-slate-700">Catalog</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">{course.title}</span>
      </div>

      <button onClick={() => onNavigate('catalog')} className="mb-4 flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700">
        <ArrowLeft className="h-4 w-4" />Back to Catalog
      </button>

      {/* Course Hero */}
      <Card className={cn('relative mb-6 overflow-hidden border-0 p-8 shadow-md', course.thumbnail)}>
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-white/20 text-white hover:bg-white/20">{course.category}</Badge>
            <Badge className="bg-white/20 text-white hover:bg-white/20">{course.difficulty}</Badge>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">{course.title}</h1>
          <p className="mb-4 max-w-2xl text-sm text-white/80">{course.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">{course.instructor.split(' ').map(n => n[0]).join('')}</div>
              <span>{course.instructor}</span>
            </div>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-violet-300 text-violet-300" />{course.rating}</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.students.toLocaleString()} students</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{course.lessons} lessons</span>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={() => {
              const activeLessonObj = course.modules?.[activeModule]?.lessons?.[activeLesson];
              if (activeLessonObj) handleLessonClick(activeModule, activeLesson, activeLessonObj);
            }} className="bg-white text-violet-600 hover:bg-white/90"><PlayCircle className="mr-2 h-4 w-4" />Continue Learning</Button>
            <Button variant="outline" onClick={() => setIsFavorite(!isFavorite)} className={cn('border-white/30 text-white hover:bg-white/10', isFavorite && 'bg-white/20')}>
              {isFavorite ? <><Star className="mr-1.5 h-4 w-4 fill-violet-300 text-violet-300" />Favorited</> : <><Star className="mr-1.5 h-4 w-4" />Add to Favorites</>}
            </Button>
            {/* Self-service: teachers can publish/archive their own courses */}
            {canAuthor && (apiCourse?.course?.status ?? apiCourse?.status) === 'DRAFT' && (
              <Button onClick={() => publishMut.mutate(courseId, { onSuccess: () => toast({ title: 'Course published', description: 'Students can now see this course.' }), onError: () => toast({ title: 'Error', variant: 'destructive' }) })} disabled={publishMut.isPending} className="bg-violet-500 text-white hover:bg-violet-600">
                {publishMut.isPending ? 'Publishing…' : 'Publish Now'}
              </Button>
            )}
            {canAuthor && (apiCourse?.course?.status ?? apiCourse?.status) === 'PUBLISHED' && (
              <Button onClick={() => { archiveMut.mutate(courseId, { onSuccess: () => toast({ title: 'Course archived', description: 'Students will no longer see this course.' }), onError: () => toast({ title: 'Error', variant: 'destructive' }) }); }} disabled={archiveMut.isPending} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                {archiveMut.isPending ? 'Archiving…' : 'Archive'}
              </Button>
            )}
            {/* Students can self-enroll */}
            {!canAuthor && !isStudent && (
              <Button onClick={() => selfEnrollMut.mutate(courseId)} disabled={selfEnrollMut.isPending} className="bg-emerald-500 text-white hover:bg-emerald-600">
                {selfEnrollMut.isPending ? 'Enrolling…' : 'Enroll Now'}
              </Button>
            )}
          </div>
          {course.progress !== undefined && (
            <div className="mt-4 max-w-xs">
              <div className="mb-1 flex items-center justify-between text-xs text-white/80"><span>Your Progress</span><span>{course.progress}%</span></div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${course.progress}%` }} /></div>
            </div>
          )}
        </div>
      </Card>

      {/* Two-column: Content + Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Content Area */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                {(() => { const Icon = lessonTypeIcons[course.modules?.[activeModule]?.lessons[activeLesson]?.type || 'video'] || Video; return <Icon className="h-5 w-5 text-violet-600" />; })()}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">{course.modules?.[activeModule]?.lessons[activeLesson]?.title}</h2>
                <p className="text-xs text-slate-400">{course.modules?.[activeModule]?.title} · {course.modules?.[activeModule]?.lessons[activeLesson]?.duration}</p>
              </div>
            </div>

            {/* If active lesson is a linked quiz/assignment, show a launch card */}
            {(() => {
              const activeLessonObj = course.modules?.[activeModule]?.lessons?.[activeLesson];
              if (!activeLessonObj) return null;
              const contentId = String(activeLessonObj.id);
              if (activeLessonObj.type === 'quiz' && quizIdByContent[contentId]) {
                return (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"><FileQuestion className="h-7 w-7 text-emerald-600" /></div>
                    <p className="text-base font-semibold text-slate-900">Ready to test your knowledge?</p>
                    <p className="mt-1 text-sm text-slate-500">This lesson is a quiz. Click below to start your attempt.</p>
                    <Button onClick={() => onSelectQuiz?.(quizIdByContent[contentId])} className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700">
                      <FileQuestion className="mr-1.5 h-4 w-4" />Start Quiz
                    </Button>
                  </div>
                );
              }
              if (activeLessonObj.type === 'assignment' && assignmentIdByContent[contentId]) {
                return (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-violet-200 bg-violet-50/50 p-8 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100"><FileText className="h-7 w-7 text-violet-600" /></div>
                    <p className="text-base font-semibold text-slate-900">Ready to submit your work?</p>
                    <p className="mt-1 text-sm text-slate-500">This lesson is an assignment. Click below to view instructions and submit.</p>
                    <Button onClick={() => onSelectAssignment?.(assignmentIdByContent[contentId])} className="mt-4 bg-violet-600 text-white hover:bg-violet-700">
                      <FileText className="mr-1.5 h-4 w-4" />Open Assignment
                    </Button>
                  </div>
                );
              }
              // Default: video placeholder + tabs
              // For PAGE content, show rich text editor (teacher) or rendered content (student)
              if (activeLessonObj.type === 'page') {
                return <PageContentEditor courseId={courseId} contentId={contentId} canAuthor={canAuthor} />;
              }
              return (
                <>
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-900">
                    <div className="text-center">
                      <PlayCircle className="mx-auto h-16 w-16 text-white/30" />
                      <p className="mt-2 text-sm text-white/50">Video content will appear here</p>
                    </div>
                  </div>
                  {/* Content tabs */}
                  <div className="mt-5 flex gap-1 border-b border-slate-200">
                    {['Overview', 'Resources', 'Discussion'].map((tab, i) => (
                      <button key={tab} className={cn('border-b-2 px-3 py-2 text-sm font-medium transition-colors', i === 0 ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>{tab}</button>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    <p>In this lesson, you&apos;ll learn the fundamental concepts and practical applications. The content includes video explanations, interactive examples, and hands-on exercises to reinforce your understanding.</p>
                    <p className="mt-3">By the end of this lesson, you will be able to:</p>
                    <ul className="mt-2 space-y-1.5">
                      {['Understand core design principles', 'Apply usability heuristics to real projects', 'Create effective wireframes', 'Evaluate interface designs for improvements'].map((item) => (
                        <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{item}</li>
                      ))}
                    </ul>
                  </div>
                </>
              );
            })()}
          </Card>
        </div>

        {/* Course Sidebar — Table of Contents */}
        <div>
          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Course Content</h3>
                  <p className="mt-0.5 text-xs text-slate-400">{completedLessons}/{totalLessons} lessons completed</p>
                </div>
                {canAuthor && (
                  <button onClick={() => setShowAddModule(true)} title="Add module" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-violet-600" style={{ width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-2">
              {course.modules?.map((module, mIdx) => (
                <div key={module.id} className="mb-2">
                  <div className="flex items-center">
                    <button onClick={() => setActiveModule(mIdx)} className="flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50">
                      <span className="text-sm font-semibold text-slate-900">{module.title}</span>
                      <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', mIdx === activeModule && 'rotate-180')} />
                    </button>
                    {canAuthor && (
                      <div className="flex gap-0.5 pr-1">
                        <button onClick={() => setShowAddContent(String(module.id))} title="Add content" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-violet-600"><Plus className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteModule(String(module.id))} title="Delete module" className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                  {mIdx === activeModule && (
                    <div className="mt-1 space-y-0.5 pl-2">
                      {module.lessons.map((lesson, lIdx) => {
                        const Icon = lessonTypeIcons[lesson.type] || Video;
                        const hasLinkedEntity = (lesson.type === 'quiz' && quizIdByContent[String(lesson.id)]) || (lesson.type === 'assignment' && assignmentIdByContent[String(lesson.id)]);
                        return (
                          <div key={lesson.id} className={cn('group flex items-center rounded-lg', mIdx === activeModule && lIdx === activeLesson ? 'bg-violet-50' : 'hover:bg-slate-50')}>
                            <button
                              onClick={() => handleLessonClick(mIdx, lIdx, lesson)}
                              className={cn('flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors')}
                              title={hasLinkedEntity ? `Open ${lesson.type}` : undefined}
                            >
                              <div className={cn('flex h-5 w-5 items-center justify-center rounded-full', lesson.completed ? 'bg-emerald-100' : 'bg-slate-100')}>
                                {lesson.completed ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Icon className={cn('h-3 w-3', lesson.type === 'quiz' || lesson.type === 'assignment' ? 'text-violet-500' : 'text-slate-400')} />}
                              </div>
                              <div className="flex-1">
                                <p className={cn('text-xs', mIdx === activeModule && lIdx === activeLesson ? 'font-medium text-violet-600' : 'text-slate-600')}>{lesson.title}</p>
                              </div>
                              {hasLinkedEntity && <ChevronRight className="h-3 w-3 text-violet-400" />}
                              <span className="text-[10px] text-slate-400">{lesson.duration}</span>
                            </button>
                            {canAuthor && (
                              <button onClick={() => handleDeleteContent(String(lesson.id))} title="Delete content" className="mr-2 rounded p-1 text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {canAuthor && (
                        <button onClick={() => setShowAddContent(String(module.id))} className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500 hover:border-violet-300 hover:text-violet-600">
                          <Plus className="h-3 w-3" />Add content
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {canAuthor && course.modules && course.modules.length === 0 && (
                <button onClick={() => setShowAddModule(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-500 hover:border-violet-300 hover:text-violet-600">
                  <Plus className="h-4 w-4" />Add first module
                </button>
              )}
            </div>
          </Card>

          {/* Completion section */}
          <Card className="mt-4 border border-slate-200 p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Completion</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5">
                <Award className="h-4 w-4 text-violet-500" />
                <span className="text-xs text-slate-600">Certificate of Completion</span>
                <span className="ml-auto text-[10px] font-medium text-slate-400">Locked</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5">
                <Crown className="h-4 w-4 text-violet-500" />
                <span className="text-xs text-slate-600">500 XP on completion</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5">
                <Star className="h-4 w-4 text-violet-500" />
                <span className="text-xs text-slate-600">Design Master Badge</span>
                <span className="ml-auto text-[10px] font-medium text-slate-400">Locked</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Module Modal */}
      {showAddModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Module</h2>
              <button onClick={() => setShowAddModule(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Module Title *</Label>
                <Input value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="e.g., Module 2: Advanced Topics" />
              </div>
              {authorErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{authorErr}</div>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddModule(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={handleCreateModule} disabled={createModuleMut.isPending} className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                  {createModuleMut.isPending ? 'Creating…' : 'Create Module'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Content Modal */}
      {showAddContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Content</h2>
              <button onClick={() => setShowAddContent(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Content Title *</Label>
                <Input value={newContentTitle} onChange={(e) => setNewContentTitle(e.target.value)} placeholder="e.g., Introduction to UX" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Content Type</Label>
                <select value={newContentType} onChange={(e) => setNewContentType(e.target.value as any)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-violet-500 focus:outline-none">
                  <option value="PAGE">Page (rich text)</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="EXTERNAL_LINK">External Link</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  {newContentType === 'QUIZ' && 'After creating this content, you can attach quiz questions via the Quizzes page.'}
                  {newContentType === 'ASSIGNMENT' && 'After creating this content, you can configure the assignment via the Assignments page.'}
                  {newContentType === 'VIDEO' && 'You can add the video URL after creation.'}
                </p>
              </div>
              {authorErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{authorErr}</div>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddContent(null)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={() => handleCreateContent(showAddContent)} disabled={createContentMut.isPending} className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                  {createContentMut.isPending ? 'Creating…' : 'Create Content'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

// ─── Quiz View ───────────────────────────────────────────────────────────
function QuizView({ quizId, onNavigate, onSelectQuiz, onSubmitted }: { quizId: string; onNavigate: (v: View) => void; onSelectQuiz: (id: string) => void; onSubmitted: (attemptId: string) => void }) {
  // If no quizId is provided, show a listing of available quizzes
  if (!quizId) {
    return <QuizListView onNavigate={onNavigate} onSelectQuiz={onSelectQuiz} />;
  }
  return <QuizRunner quizId={quizId} onNavigate={onNavigate} onSubmitted={onSubmitted} />;
}

// ─── Quiz List View ──────────────────────────────────────────────────────
function QuizListView({ onNavigate, onSelectQuiz }: { onNavigate: (v: View) => void; onSelectQuiz: (id: string) => void }) {
  const authUser = useAuthStore((s) => s.user);
  const isTeacher = authUser?.role === 'TEACHER';
  const { data, isLoading, isError } = useQuizzes({ limit: 50, status: isTeacher ? undefined : 'PUBLISHED' });
  const deleteQuizMut = useDeleteQuiz();
  const updateQuizMut = useUpdateQuiz();
  const [showCreate, setShowCreate] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const allQuizzes = (data?.data ?? []) as any[];
  // Teachers only see quizzes they created (exclude ARCHIVED)
  const quizzes = isTeacher
    ? allQuizzes.filter((q: any) => (q.createdBy === authUser?.id || q.createdBy?.id === authUser?.id) && q.status !== 'ARCHIVED')
    : allQuizzes.filter((q: any) => q.status !== 'ARCHIVED');

  const handleDelete = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    deleteQuizMut.mutate(quizId, {
      onSuccess: () => {
        toast({ title: 'Quiz deleted', description: 'The quiz has been removed.' });
        // Immediately remove from cache so UI updates without waiting for refetch
        queryClient.setQueryData(['quizzes', { limit: 50, status: isTeacher ? undefined : 'PUBLISHED' }], (oldData: any) => {
          if (!oldData?.data) return oldData;
          return { ...oldData, data: oldData.data.filter((q: any) => q.id !== quizId) };
        });
        queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      },
      onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete quiz.', variant: 'destructive' }),
    });
  };

  const handleTogglePublish = (e: React.MouseEvent, quizId: string, currentStatus: string) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    updateQuizMut.mutate(
      { quizId, data: { status: newStatus } },
      {
        onSuccess: () => { toast({ title: newStatus === 'PUBLISHED' ? 'Quiz published' : 'Quiz unpublished', description: newStatus === 'PUBLISHED' ? 'Students can now see this quiz.' : 'Quiz hidden from students.' }); queryClient.invalidateQueries({ queryKey: ['quizzes'] }); },
        onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update status.', variant: 'destructive' }),
      },
    );
  };

  const handleEdit = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    setEditingQuizId(quizId);
  };

  return (
    <main className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Quizzes</span>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isTeacher ? 'All Quizzes' : 'Available Quizzes'}</h1>
          <p className="mt-1 text-sm text-slate-500">{quizzes.length} {isTeacher ? 'total' : 'published'} quizzes</p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowCreate(true)} className="bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="mr-1.5 h-4 w-4" />Create Quiz
          </Button>
        )}
      </div>
      {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">Failed to load quizzes.</div>}
      {isLoading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading quizzes...</div>}
      {!isLoading && !isError && quizzes.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {isTeacher ? 'No quizzes yet. Click "Create Quiz" to get started.' : 'No quizzes available yet.'}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quizzes.map((q: any) => (
          <Card key={q.id} className="group border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md">
            {/* Top row: icon + status badges + actions */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50" onClick={() => onSelectQuiz(q.id)}><FileQuestion className="h-5 w-5 text-emerald-600" /></div>
              <div className="flex items-center gap-1.5">
                {isTeacher && q.status && (
                  <Badge className={cn('text-[10px]', q.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>{q.status === 'PUBLISHED' ? 'Published' : 'Draft'}</Badge>
                )}
                <Badge className="bg-slate-100 text-slate-500 text-[10px]">{q.questionCount ?? 0} Q</Badge>
              </div>
            </div>
            {/* Title + description - clickable for students */}
            <div className={cn(!isTeacher && 'cursor-pointer')} onClick={() => !isTeacher && onSelectQuiz(q.id)}>
              <h3 className="text-sm font-semibold text-slate-900">{q.title}</h3>
              {q.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{q.description}</p>}
            </div>
            {/* Quiz info */}
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{q.timeLimit ?? 15} min</span>
              <span className="flex items-center gap-1"><Target className="h-3 w-3" />Pass: {q.passingScore}%</span>
              <span className="flex items-center gap-1"><Route className="h-3 w-3" />{q.maxAttempts} tries</span>
            </div>
            {/* Teacher action buttons */}
            {isTeacher && (
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <Button size="sm" variant="outline" onClick={() => onSelectQuiz(q.id)} className="border-slate-200 text-slate-600 text-xs">
                  <PlayCircle className="mr-1 h-3 w-3" />Preview
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => handleEdit(e, q.id)} className="border-slate-200 text-slate-600 text-xs">
                  <Edit className="mr-1 h-3 w-3" />Edit
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => handleTogglePublish(e, q.id, q.status)}
                  disabled={updateQuizMut.isPending}
                  className={cn('ml-auto text-xs', q.status === 'PUBLISHED' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-500 text-white hover:bg-emerald-600')}
                >
                  {q.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </Button>
                <button onClick={(e) => handleDelete(e, q.id)} title="Delete" className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create Quiz Modal */}
      {showCreate && <QuizEditorModal onClose={() => { setShowCreate(false); queryClient.invalidateQueries({ queryKey: ['quizzes'] }); }} />}

      {/* Edit existing quiz */}
      {editingQuizId && <QuizEditorModal quizId={editingQuizId} onClose={() => { setEditingQuizId(null); queryClient.invalidateQueries({ queryKey: ['quizzes'] }); }} />}
    </main>
  );
}

// ─── Quiz Editor Modal (create quiz + add questions) ─────────────────────

// ─── Quiz Editor Modal (supports all 10 question types) ──────────────────
// ─── Hotspot Editor — draw zones on image by clicking and dragging ──────
function HotspotEditor({ imageUrl, onImageUrlChange, zones, onZonesChange }: {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  zones: { x: number; y: number; w: number; h: number; label: string; isCorrect: boolean }[];
  onZonesChange: (zones: { x: number; y: number; w: number; h: number; label: string; isCorrect: boolean }[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawRectRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingLabel, setEditingLabel] = useState<number | null>(null);

  const getPercent = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageUrl.trim()) return;
    e.preventDefault();
    const pos = getPercent(e);
    isDrawingRef.current = true;
    drawStartRef.current = pos;
    setIsDrawing(true);
    // Show the draw rect immediately at click point
    if (drawRectRef.current) {
      drawRectRef.current.style.display = 'block';
      drawRectRef.current.style.left = pos.x + '%';
      drawRectRef.current.style.top = pos.y + '%';
      drawRectRef.current.style.width = '0%';
      drawRectRef.current.style.height = '0%';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !drawStartRef.current) return;
    const pos = getPercent(e);
    const x = Math.min(drawStartRef.current.x, pos.x);
    const y = Math.min(drawStartRef.current.y, pos.y);
    const w = Math.abs(pos.x - drawStartRef.current.x);
    const h = Math.abs(pos.y - drawStartRef.current.y);
    // Update the draw rect DIRECTLY via ref (no state update needed — instant visual feedback)
    if (drawRectRef.current) {
      drawRectRef.current.style.left = x + '%';
      drawRectRef.current.style.top = y + '%';
      drawRectRef.current.style.width = w + '%';
      drawRectRef.current.style.height = h + '%';
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawing(false);
    // Hide draw rect
    if (drawRectRef.current) {
      drawRectRef.current.style.display = 'none';
    }
    // Calculate final rect from the start position
    if (drawStartRef.current && drawRectRef.current) {
      const w = parseFloat(drawRectRef.current.style.width);
      const h = parseFloat(drawRectRef.current.style.height);
      const x = parseFloat(drawRectRef.current.style.left);
      const y = parseFloat(drawRectRef.current.style.top);
      if (w > 3 && h > 3) {
        onZonesChange([...zones, { x, y, w, h, label: 'Zone ' + (zones.length + 1) }]);
      }
    }
    drawStartRef.current = null;
  };

  return (
    <div className="space-y-3">
      {/* Image URL */}
      <div>
        <Label className="mb-1.5 block text-xs text-slate-500">Image URL *</Label>
        <Input
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="text-sm"
        />
        {imageUrl.trim() && (
          <p className="mt-1 text-xs text-violet-500">↓ Click and drag on the image below to draw zones</p>
        )}
        {!imageUrl.trim() && (
          <button
            type="button"
            onClick={() => onImageUrlChange('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800')}
            className="mt-1 text-xs text-violet-500 underline hover:text-violet-700"
          >
            Or try a sample image
          </button>
        )}
      </div>

      {/* Image with drawing area */}
      {imageUrl.trim() && (
        <div
          ref={containerRef}
          className="relative w-full cursor-crosshair overflow-hidden rounded-lg border-2 border-dashed border-violet-300 bg-slate-50 select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ minHeight: '200px' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Hotspot"
            className="pointer-events-none block h-auto w-full"
            style={{ display: 'block' }}
            draggable={false}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              // Show fallback text
              const fallback = document.createElement('div');
              fallback.className = 'flex h-[200px] w-full items-center justify-center text-sm text-slate-400';
              fallback.textContent = 'Could not load image. Check the URL and try again.';
              img.parentElement?.appendChild(fallback);
            }}
          />

          {/* Existing zones */}
          {zones.map((zone, idx) => (
            <div
              key={idx}
              className={cn('absolute border-2 transition-colors', zone.isCorrect ? 'border-emerald-500 bg-emerald-500/20' : 'border-violet-500 bg-violet-500/20 hover:bg-violet-500/30')}
              style={{ left: zone.x + '%', top: zone.y + '%', width: zone.w + '%', height: zone.h + '%' }}
            >
              <span className={cn('absolute left-1 top-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white', zone.isCorrect ? 'bg-emerald-600' : 'bg-violet-600')}>
                {zone.label || ('Zone ' + (idx + 1))}
              </span>
              {zone.isCorrect && (
                <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onZonesChange(zones.filter((_, i) => i !== idx)); }}
                className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Drawing preview rectangle — controlled via ref for instant updates */}
          <div
            ref={drawRectRef}
            className="pointer-events-none absolute border-2 border-dashed border-violet-500 bg-violet-400/20"
            style={{ display: 'none', left: '0%', top: '0%', width: '0%', height: '0%' }}
          />
        </div>
      )}

      {/* Zone list */}
      {zones.length > 0 && (
        <div className="rounded-lg border border-slate-100 p-3">
          <p className="mb-2 text-xs font-medium text-slate-500">Zones ({zones.length})</p>
          <div className="space-y-1.5">
            {zones.map((zone, idx) => (
              <div key={idx} className={cn('flex items-center gap-2 rounded-lg border p-1.5', zone.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100')}>
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold', zone.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600')}>{idx + 1}</span>
                {editingLabel === idx ? (
                  <input
                    type="text"
                    value={zone.label}
                    autoFocus
                    onChange={(e) => { const n = [...zones]; n[idx] = { ...n[idx], label: e.target.value }; onZonesChange(n); }}
                    onBlur={() => setEditingLabel(null)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setEditingLabel(null); }}
                    className="flex-1 rounded border border-violet-300 px-2 py-0.5 text-xs"
                    placeholder="Zone label"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingLabel(idx)}
                    className="flex-1 text-left text-xs text-slate-600 hover:text-violet-600"
                  >
                    {zone.label || ('Zone ' + (idx + 1))}
                    <span className="ml-2 text-slate-400">{Math.round(zone.x)},{Math.round(zone.y)} ({Math.round(zone.w)}x{Math.round(zone.h)})</span>
                  </button>
                )}
                {/* Correct answer toggle */}
                <button
                  type="button"
                  onClick={() => { const n = [...zones]; n[idx] = { ...n[idx], isCorrect: !n[idx].isCorrect }; onZonesChange(n); }}
                  title={zone.isCorrect ? 'Correct answer (click to remove)' : 'Mark as correct answer'}
                  className={cn('flex h-6 w-6 items-center justify-center rounded transition-colors', zone.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => onZonesChange(zones.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions when no image */}
      {!imageUrl.trim() && (
        <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
          <Image className="mb-2 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">Paste an image URL above to start drawing zones</p>
        </div>
      )}
    </div>
  );
}

function QuizEditorModal({ onClose, quizId: existingQuizId }: { onClose: () => void; quizId?: string }) {
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const addQuestion = useAddQuestion(existingQuizId ?? null);
  const deleteQuestion = useDeleteQuestion(existingQuizId ?? null);
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(existingQuizId ?? null);
  const { data: existingQuizData, refetch: refetchQuiz } = useQuiz(createdQuizId ?? existingQuizId ?? null);
  const authUser = useAuthStore((s) => s.user);
  const { data: teacherSectionsData } = useTeacherSections(authUser?.id ?? null);
  const teacherSectionSubjects = (teacherSectionsData?.data ?? []) as any[];

  // Step 1: Quiz details form | Step 2: Question editor
  const [step, setStep] = useState<'details' | 'editor'>(existingQuizId ? 'editor' : 'details');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('15');
  const [passingScore, setPassingScore] = useState('60');
  const [maxAttempts, setMaxAttempts] = useState('3');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSectionSubjectId, setSelectedSectionSubjectId] = useState('');
  const [publishStatus, setPublishStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  // Question editing state
  const [qType, setQType] = useState<string>('MULTIPLE_CHOICE_SINGLE');
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState('1');
  const [qExplanation, setQExplanation] = useState('');
  const [qRequired, setQRequired] = useState(true);
  const [qEstimate, setQEstimate] = useState('2');
  const [qError, setQError] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);

  // Answer state
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qCorrectIdxs, setQCorrectIdxs] = useState<number[]>([]);
  const [qBlanks, setQBlanks] = useState<string[]>(['']);
  const [qMatchingPairs, setQMatchingPairs] = useState<{ left: string; right: string }[]>([{ left: '', right: '' }, { left: '', right: '' }]);
  const [qSortItems, setQSortItems] = useState<string[]>(['', '']);
  const [qTextAnswer, setQTextAnswer] = useState('');
  const [qHotspotImage, setQHotspotImage] = useState('');
  const [qHotspotZones, setQHotspotZones] = useState<{ x: number; y: number; w: number; h: number; label: string; isCorrect: boolean }[]>([]);
  const [qHotspotTool, setQHotspotTool] = useState<'point' | 'rectangle' | 'freeform'>('rectangle');

  const quiz = (existingQuizData as any)?.quiz;
  const existingQuestions = ((existingQuizData as any)?.questions ?? []) as any[];

  const questionTypeLabels: Record<string, { label: string; shortLabel: string; icon: any }> = {
    MULTIPLE_CHOICE_SINGLE: { label: 'Multiple Choice', shortLabel: 'Multiple choice', icon: CheckCircle2 },
    MULTIPLE_CHOICE_MULTIPLE: { label: 'Multiple Response', shortLabel: 'Multiple response', icon: CheckCircle2 },
    TRUE_FALSE: { label: 'True / False', shortLabel: 'True/False', icon: CircleDot },
    FILL_IN_BLANK: { label: 'Fill in the Blank', shortLabel: 'Fill in the Blank', icon: Edit },
    MATCHING: { label: 'Matching', shortLabel: 'Matching', icon: ArrowLeft },
    SORTING: { label: 'Reorder', shortLabel: 'Reorder', icon: GripVertical },
    SHORT_ANSWER: { label: 'Short Answer', shortLabel: 'Short Answer', icon: FileText },
    ESSAY: { label: 'Essay', shortLabel: 'Essay', icon: FileText },
    FILE_UPLOAD: { label: 'File Upload', shortLabel: 'File Upload', icon: Upload },
    HOTSPOT: { label: 'Hotspot', shortLabel: 'Hotspot', icon: Target },
  };

  const resetQuestionForm = () => {
    setQText(''); setQExplanation(''); setQError('');
    setQOptions(['', '', '', '']); setQCorrectIdx(0); setQCorrectIdxs([]);
    setQBlanks(['']); setQMatchingPairs([{ left: '', right: '' }, { left: '', right: '' }]);
    setQSortItems(['', '']); setQTextAnswer(''); setQHotspotImage(''); setQHotspotZones([]);
    setEditingQuestionIdx(null);
  };

  const loadQuestionForEdit = (q: any, idx: number) => {
    setEditingQuestionIdx(idx);
    setQType(q.type);
    setQText(q.questionText || '');
    setQPoints(String(q.points || 1));
    setQExplanation(q.explanation || '');
    // Load answers based on type
    if (q.type === 'MULTIPLE_CHOICE_SINGLE' || q.type === 'MULTIPLE_CHOICE_MULTIPLE') {
      const opts = (q.options || []).map((o: any) => o.text || '');
      setQOptions(opts.length >= 2 ? opts : ['', '', '', '']);
      if (q.type === 'MULTIPLE_CHOICE_SINGLE') {
        const correctIdx = (q.options || []).findIndex((o: any) => o.isCorrect);
        setQCorrectIdx(correctIdx >= 0 ? correctIdx : 0);
      } else {
        const correctIdxs = (q.options || []).map((o: any, i: number) => o.isCorrect ? i : -1).filter((i: number) => i >= 0);
        setQCorrectIdxs(correctIdxs);
      }
    } else if (q.type === 'TRUE_FALSE') {
      setQCorrectIdx(q.correctAnswer === true ? 0 : 1);
    } else if (q.type === 'FILL_IN_BLANK') {
      const ans = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      setQBlanks(ans.filter(Boolean).length > 0 ? ans : ['']);
    } else if (q.type === 'MATCHING') {
      const pairs = q.options?.pairs || [];
      setQMatchingPairs(pairs.length >= 2 ? pairs : [{ left: '', right: '' }, { left: '', right: '' }]);
    } else if (q.type === 'SORTING') {
      const items = q.options?.items || q.correctAnswer || [];
      setQSortItems(items.length >= 2 ? items : ['', '']);
    } else if (q.type === 'SHORT_ANSWER' || q.type === 'ESSAY') {
      setQTextAnswer(q.correctAnswer || '');
    }
  };

  const handleCreate = () => {
    setError('');
    if (!title.trim()) { setError('Title is required.'); return; }
    createQuiz.mutate(
      { title, description: description.trim() || undefined, timeLimit: Number(timeLimit) || 15, passingScore: Number(passingScore) || 60, maxAttempts: Number(maxAttempts) || 3, status: 'DRAFT' },
      {
        onSuccess: (data: any) => {
          const id = data?.quiz?.id ?? data?.id;
          setCreatedQuizId(id);
          setStep('editor');
          toast({ title: 'Quiz created', description: 'Now add questions below.' });
        },
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to create quiz.'),
      },
    );
  };

  const handlePublish = () => {
    if (!createdQuizId) return;
    const newStatus = publishStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    updateQuiz.mutate(
      { quizId: createdQuizId, data: { status: newStatus } },
      {
        onSuccess: () => {
          setPublishStatus(newStatus);
          toast({ title: newStatus === 'PUBLISHED' ? 'Quiz published' : 'Quiz unpublished', description: newStatus === 'PUBLISHED' ? 'Students can now see this quiz.' : 'Quiz is now hidden from students.' });
          if (createdQuizId) refetchQuiz();
        },
        onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update status.', variant: 'destructive' }),
      },
    );
  };

  const buildQuestionData = (): { options: any; correctAnswer: any } | null => {
    switch (qType) {
      case 'MULTIPLE_CHOICE_SINGLE': {
        const filled = qOptions.filter((o) => o.trim());
        if (filled.length < 2) { setQError('Provide at least 2 options.'); return null; }
        return { options: qOptions.map((text, idx) => ({ text: text.trim(), isCorrect: idx === qCorrectIdx })), correctAnswer: qOptions[qCorrectIdx]?.trim() || null };
      }
      case 'MULTIPLE_CHOICE_MULTIPLE': {
        const filled = qOptions.filter((o) => o.trim());
        if (filled.length < 2) { setQError('Provide at least 2 options.'); return null; }
        if (qCorrectIdxs.length === 0) { setQError('Select at least one correct answer.'); return null; }
        return { options: qOptions.map((text, idx) => ({ text: text.trim(), isCorrect: qCorrectIdxs.includes(idx) })), correctAnswer: qCorrectIdxs.map((idx) => qOptions[idx]?.trim()).filter(Boolean) };
      }
      case 'TRUE_FALSE':
        return { options: [{ text: 'True', isCorrect: qCorrectIdx === 0 }, { text: 'False', isCorrect: qCorrectIdx === 1 }], correctAnswer: qCorrectIdx === 0 };
      case 'FILL_IN_BLANK': {
        const filled = qBlanks.filter((b) => b.trim());
        if (filled.length === 0) { setQError('Provide at least one answer.'); return null; }
        return { options: null, correctAnswer: filled.length === 1 ? filled[0] : filled };
      }
      case 'MATCHING': {
        const valid = qMatchingPairs.filter((p) => p.left.trim() && p.right.trim());
        if (valid.length < 2) { setQError('Provide at least 2 pairs.'); return null; }
        const correctAnswer: Record<string, string> = {};
        valid.forEach((p) => { correctAnswer[p.left.trim()] = p.right.trim(); });
        return { options: { pairs: valid.map(p => ({ left: p.left.trim(), right: p.right.trim() })) }, correctAnswer };
      }
      case 'SORTING': {
        const filled = qSortItems.filter((s) => s.trim());
        if (filled.length < 2) { setQError('Provide at least 2 items.'); return null; }
        return { options: { items: filled }, correctAnswer: filled };
      }
      case 'SHORT_ANSWER':
      case 'ESSAY':
        return { options: null, correctAnswer: qTextAnswer.trim() || null };
      case 'FILE_UPLOAD':
        return { options: null, correctAnswer: null };
      case 'HOTSPOT': {
        if (!qHotspotImage.trim()) { setQError('Provide an image URL.'); return null; }
        if (qHotspotZones.length === 0) { setQError('Add at least one hotspot zone.'); return null; }
        const correctZones = qHotspotZones.filter((z) => z.isCorrect);
        if (correctZones.length === 0) { setQError('Mark at least one zone as correct (click the checkmark).'); return null; }
        return { options: { imageUrl: qHotspotImage, zones: qHotspotZones.map((z) => ({ x: z.x, y: z.y, w: z.w, h: z.h, label: z.label })) }, correctAnswer: correctZones.map((z) => z.label) };
      }
      default:
        setQError('Unsupported type.'); return null;
    }
  };

  const handleAddQuestion = () => {
    setQError('');
    if (!qText.trim()) { setQError('Question text is required.'); return; }
    if (!createdQuizId) { setQError('Create the quiz first.'); return; }
    const qData = buildQuestionData();
    if (!qData) return;
    addQuestion.mutate(
      { quizId: createdQuizId!, data: { type: qType as any, questionText: qText, points: Number(qPoints) || 1, options: qData.options, correctAnswer: qData.correctAnswer, explanation: qExplanation.trim() || undefined } },
      {
        onSuccess: () => {
          resetQuestionForm();
          toast({ title: 'Question added', description: 'The question appears in the sidebar.' });
          if (createdQuizId) refetchQuiz();
        },
        onError: (err: any) => setQError(err.response?.data?.message || 'Failed to add.'),
      },
    );
  };

  const handleDeleteQuestion = (qId: string) => {
    deleteQuestion.mutate(qId, {
      onSuccess: () => { toast({ title: 'Question deleted' }); if (createdQuizId) refetchQuiz(); if (editingQuestionIdx !== null) resetQuestionForm(); },
      onError: () => toast({ title: 'Error', variant: 'destructive' }),
    });
  };

  const CurrentTypeIcon = questionTypeLabels[qType]?.icon || CheckCircle2;

  // Update publishStatus when quiz loads
  useEffect(() => {
    if (quiz?.status) setPublishStatus(quiz.status);
  }, [quiz?.status]);

  // ─── STEP 1: QUIZ DETAILS ───────────────────────────────────────
  if (step === 'details') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-900">Create new Quiz</h2>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
              <Button onClick={handleCreate} disabled={createQuiz.isPending} className="bg-violet-600 px-6 text-white hover:bg-violet-700">{createQuiz.isPending ? 'Creating...' : 'Continue'}</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-blue-200 to-blue-300 p-4">
                <FileQuestion className="h-16 w-16 text-blue-600" />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">Quiz thumbnail</p>
            </div>
            <div className="space-y-4 md:col-span-2">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Quiz Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Chapter 1 Quiz" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Select Class *</Label>
                <select value={selectedSectionSubjectId} onChange={(e) => setSelectedSectionSubjectId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700">
                  <option value="">Select your assigned class...</option>
                  {teacherSectionSubjects.map((ss: any) => <option key={ss.id} value={ss.id}>{ss.subject?.name} - {ss.section?.name} ({ss.section?.grade?.name})</option>)}
                </select>
                {teacherSectionSubjects.length === 0 && <p className="mt-1 text-xs text-amber-600">No teaching assignments. Contact admin.</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="mb-1.5 block text-sm font-medium text-slate-700">Duration (min)</Label><Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} /></div>
                <div><Label className="mb-1.5 block text-sm font-medium text-slate-700">Pass (%)</Label><Input type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} /></div>
                <div><Label className="mb-1.5 block text-sm font-medium text-slate-700">Attempts</Label><Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} /></div>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Description</Label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Let your learner know a little about the quiz" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700" />
                <p className="mt-1 text-right text-xs text-slate-400">{description.length}/400</p>
              </div>
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 2: QUESTION EDITOR (full-screen two-column) ───────────
  return (
    <div className="fixed inset-0 z-50 bg-slate-50">
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          <span className="text-sm font-medium text-slate-700">{quiz?.title || title}</span>
          <Badge className={cn('text-xs', publishStatus === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>{publishStatus === 'PUBLISHED' ? 'Published' : 'Draft'}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)} className="border-slate-200 text-slate-600"><PlayCircle className="mr-1.5 h-4 w-4" />Preview</Button>
          <Button onClick={handlePublish} disabled={updateQuiz.isPending} className={cn('text-white', publishStatus === 'PUBLISHED' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-violet-600 hover:bg-violet-700')}>
            {updateQuiz.isPending ? 'Updating...' : publishStatus === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Left Sidebar — Question List */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Questions</span>
            <button onClick={() => resetQuestionForm()} className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100" title="New question"><Plus className="h-4 w-4" /></button>
          </div>

          {existingQuestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center">
              <FileQuestion className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-xs text-slate-400">No questions yet. Add your first question on the right.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {existingQuestions.map((q: any, idx: number) => {
                const QIcon = questionTypeLabels[q.type]?.icon || FileQuestion;
                const isActive = editingQuestionIdx === idx;
                return (
                  <div key={q.id} className={cn('group flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-all', isActive ? 'border-violet-300 bg-violet-50' : 'border-slate-100 hover:bg-slate-50')} onClick={() => loadQuestionForEdit(q, idx)}>
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold', isActive ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-500')}>{idx + 1}</div>
                    <QIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-slate-700">{q.questionText}</p>
                      <p className="text-[10px] text-slate-400">{questionTypeLabels[q.type]?.shortLabel || q.type}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3 text-slate-300 hover:text-red-500" /></button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Result Screen at bottom */}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 text-slate-400">
              <Trophy className="h-4 w-4" />
              <div className="flex-1">
                <p className="text-xs font-medium">Result Screen</p>
                <p className="text-[10px]">Set passed/failed message</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Main Editing Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl">
            {/* Question Type Selector + Required toggle */}
            <div className="mb-4 flex items-center justify-between">
              <div className="relative">
                <button onClick={() => setShowTypeDropdown(!showTypeDropdown)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-violet-300">
                  <CurrentTypeIcon className="h-4 w-4 text-violet-500" />
                  {questionTypeLabels[qType]?.label || 'Select Type'}
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {showTypeDropdown && (
                  <div className="absolute z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {Object.entries(questionTypeLabels).map(([val, info]) => (
                      <button key={val} onClick={() => { setQType(val); resetQuestionForm(); setQType(val); setShowTypeDropdown(false); }} className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50', qType === val ? 'bg-violet-50 text-violet-600' : 'text-slate-700')}>
                        <info.icon className="h-4 w-4" />
                        {info.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Required</span>
                <button onClick={() => setQRequired(!qRequired)} className={cn('relative h-5 w-9 rounded-full transition-colors', qRequired ? 'bg-emerald-500' : 'bg-slate-300')}>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform', qRequired ? 'left-4' : 'left-0.5')} />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <Label className="mb-1.5 block text-xs text-slate-500">{editingQuestionIdx !== null ? 'Question ' + (editingQuestionIdx + 1) + '*' : 'New Question*'}</Label>
              <textarea value={qText} onChange={(e) => setQText(e.target.value)} rows={3} placeholder="Type your question here..." className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400" />
            </div>

            {/* Answer Options */}
            <div className="mb-4">
              <Label className="mb-2 block text-xs text-slate-500">Answers</Label>
              {(qType === 'MULTIPLE_CHOICE_SINGLE' || qType === 'MULTIPLE_CHOICE_MULTIPLE') && (
                <div className="space-y-2">
                  {qOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button onClick={() => qType === 'MULTIPLE_CHOICE_SINGLE' ? setQCorrectIdx(idx) : setQCorrectIdxs(qCorrectIdxs.includes(idx) ? qCorrectIdxs.filter(i => i !== idx) : [...qCorrectIdxs, idx])} className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', (qType === 'MULTIPLE_CHOICE_SINGLE' ? idx === qCorrectIdx : qCorrectIdxs.includes(idx)) ? 'border-violet-600 bg-violet-600' : 'border-slate-300')}>
                        {(qType === 'MULTIPLE_CHOICE_SINGLE' ? idx === qCorrectIdx : qCorrectIdxs.includes(idx)) && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </button>
                      <Input value={opt} onChange={(e) => { const n = [...qOptions]; n[idx] = e.target.value; setQOptions(n); }} placeholder={'Option ' + (idx + 1)} className="text-sm" />
                      {qOptions.length > 2 && <button onClick={() => setQOptions(qOptions.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><X className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setQOptions([...qOptions, ''])} className="text-xs text-violet-600 hover:underline">+ Add answer</button>
                </div>
              )}
              {qType === 'TRUE_FALSE' && (
                <div className="flex gap-3">
                  {[0, 1].map(idx => (
                    <button key={idx} onClick={() => setQCorrectIdx(idx)} className={cn('flex-1 rounded-lg border-2 p-4 text-center text-sm font-medium transition-all', qCorrectIdx === idx ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>{idx === 0 ? 'True' : 'False'}</button>
                  ))}
                </div>
              )}
              {qType === 'FILL_IN_BLANK' && (
                <div className="space-y-2">
                  {qBlanks.map((blank, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input value={blank} onChange={(e) => { const n = [...qBlanks]; n[idx] = e.target.value; setQBlanks(n); }} placeholder={'Correct answer ' + (idx + 1)} className="text-sm" />
                      {qBlanks.length > 1 && <button onClick={() => setQBlanks(qBlanks.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><X className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setQBlanks([...qBlanks, ''])} className="text-xs text-violet-600 hover:underline">+ Add correct answer</button>
                </div>
              )}
              {qType === 'MATCHING' && (
                <div className="space-y-2">
                  {qMatchingPairs.map((pair, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input value={pair.left} onChange={(e) => { const n = [...qMatchingPairs]; n[idx] = { ...n[idx], left: e.target.value }; setQMatchingPairs(n); }} placeholder="Left" className="text-sm" />
                      <span className="text-slate-400">{'\u2194'}</span>
                      <Input value={pair.right} onChange={(e) => { const n = [...qMatchingPairs]; n[idx] = { ...n[idx], right: e.target.value }; setQMatchingPairs(n); }} placeholder="Right" className="text-sm" />
                      {qMatchingPairs.length > 2 && <button onClick={() => setQMatchingPairs(qMatchingPairs.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><X className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setQMatchingPairs([...qMatchingPairs, { left: '', right: '' }])} className="text-xs text-violet-600 hover:underline">+ Add pair</button>
                </div>
              )}
              {qType === 'SORTING' && (
                <div className="space-y-2">
                  {qSortItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-slate-300" />
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">{idx + 1}</span>
                      <Input value={item} onChange={(e) => { const n = [...qSortItems]; n[idx] = e.target.value; setQSortItems(n); }} placeholder={'Item ' + (idx + 1)} className="text-sm" />
                      {qSortItems.length > 2 && <button onClick={() => setQSortItems(qSortItems.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><X className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setQSortItems([...qSortItems, ''])} className="text-xs text-violet-600 hover:underline">+ Add item</button>
                </div>
              )}
              {(qType === 'SHORT_ANSWER' || qType === 'ESSAY') && (
                <textarea value={qTextAnswer} onChange={(e) => setQTextAnswer(e.target.value)} rows={qType === 'ESSAY' ? 4 : 2} placeholder="Reference answer (for manual grading)" className="w-full rounded-lg border border-slate-200 p-3 text-sm" />
              )}
              {qType === 'FILE_UPLOAD' && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">Students will upload a file. Requires manual grading.</div>
              )}
              {qType === 'HOTSPOT' && (
                <HotspotEditor
                  imageUrl={qHotspotImage}
                  onImageUrlChange={setQHotspotImage}
                  zones={qHotspotZones}
                  onZonesChange={setQHotspotZones}
                />
              )}
            </div>

            {/* Scoring */}
            <div className="mb-4 flex items-center gap-6 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <Input type="number" value={qEstimate} onChange={(e) => setQEstimate(e.target.value)} className="w-16 text-sm" />
                <span className="text-xs text-slate-500">Mins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <Input type="number" value={qPoints} onChange={(e) => setQPoints(e.target.value)} className="w-16 text-sm" />
                <span className="text-xs text-slate-500">Points</span>
              </div>
            </div>

            {/* Explanation */}
            <div className="mb-4">
              <Label className="mb-1.5 block text-xs text-slate-500">Explanation (optional)</Label>
              <Input value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Shown after answering" className="text-sm" />
            </div>

            {qError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{qError}</div>}

            {/* Add/Update Question Button */}
            <Button onClick={handleAddQuestion} disabled={addQuestion.isPending} className="w-full bg-violet-600 py-2.5 text-white hover:bg-violet-700">
              {addQuestion.isPending ? 'Adding...' : editingQuestionIdx !== null ? 'Update Question' : '+ Add Question'}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h3 className="text-lg font-bold text-slate-900">Preview: {quiz?.title || title}</h3>
              <button onClick={() => setShowPreview(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              {existingQuestions.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No questions to preview. Add questions first.</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">{existingQuestions.length} questions | Time: {quiz?.timeLimit || timeLimit} min | Pass: {quiz?.passingScore || passingScore}%</p>
                  {existingQuestions.map((q: any, idx: number) => (
                    <div key={q.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">{idx + 1}</span>
                        <Badge className="bg-slate-100 text-slate-600 text-[10px]">{questionTypeLabels[q.type]?.shortLabel || q.type}</Badge>
                      </div>
                      <p className="mb-2 text-sm font-medium text-slate-900">{q.questionText}</p>
                      {(() => {
                        const opts = q.options;
                        // MCQ / True-False: options is array of {text, isCorrect}
                        if (Array.isArray(opts)) {
                          return opts.map((opt: any, i: number) => (
                            <div key={i} className={cn('flex items-center gap-2 rounded border p-2 text-sm', opt.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200')}>
                              <div className={cn('h-4 w-4 rounded-full border-2', opt.isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300')} />
                              {opt.text}
                              {opt.isCorrect && <Badge className="ml-auto bg-emerald-100 text-emerald-600 text-[10px]">Correct</Badge>}
                            </div>
                          ));
                        }
                        // Matching: options is {pairs: [{left, right}]}
                        if (opts && typeof opts === 'object' && opts.pairs) {
                          return (
                            <div className="space-y-1">
                              {opts.pairs.map((p: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm">
                                  <span className="font-medium text-slate-700">{p.left}</span>
                                  <span className="text-slate-400">{'→'}</span>
                                  <span className="text-emerald-600">{p.right}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        // Sorting: options is {items: [...]}
                        if (opts && typeof opts === 'object' && opts.items) {
                          return (
                            <div className="flex flex-wrap gap-1">
                              {opts.items.map((item: string, i: number) => (
                                <span key={i} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm">{i + 1}. {item}</span>
                              ))}
                            </div>
                          );
                        }
                        // Fill-in-blank / Short answer / Essay / File upload
                        if (q.correctAnswer) {
                          return <p className="text-sm text-slate-600">Answer: {String(q.correctAnswer)}</p>;
                        }
                        // Hotspot or no options
                        if (opts && typeof opts === 'object' && opts.imageUrl) {
                          return <p className="text-sm text-slate-600">Hotspot on image: {opts.imageUrl}</p>;
                        }
                        return <p className="text-xs text-slate-400">No preview available for this type.</p>;
                      })()}
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => setShowPreview(false)} className="mt-4 w-full bg-violet-600 text-white hover:bg-violet-700">Close Preview</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizRunner({ quizId, onNavigate, onSubmitted }: { quizId: string; onNavigate: (v: View) => void; onSubmitted: (attemptId: string) => void }) {
  const authUser = useAuthStore((s) => s.user);
  const isTeacher = authUser?.role === 'ADMIN' || authUser?.role === 'TEACHER';
  const { data: quizData, isLoading } = useQuiz(quizId || null);
  const { data: enrollmentsData } = useEnrollments({ status: 'ACTIVE' });
  const { data: analyticsData } = useQuizAnalytics(isTeacher ? (quizId || null) : null);
  const startAttempt = useStartQuizAttempt();
  const submitAttempt = useSubmitQuizAttempt();

  const quiz = (quizData as any)?.quiz;
  const questions = ((quizData as any)?.questions ?? []) as any[];

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [attemptId, setAttemptId] = useState<string>('');
  const [startTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>((quiz?.timeLimit ?? 15) * 60);
  const [error, setError] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  // Drag-and-drop state for sorting/matching
  const [draggedItem, setDraggedItem] = useState<{ type: string; idx: number } | null>(null);
  const [draggedMatch, setDraggedMatch] = useState<string | null>(null);

  useEffect(() => { if (quiz?.timeLimit) setTimeLeft(quiz.timeLimit * 60); }, [quiz?.timeLimit]);
  useEffect(() => { if (!attemptId || timeLeft <= 0) return; const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000); return () => clearTimeout(t); }, [attemptId, timeLeft]);
  useEffect(() => { if (attemptId && timeLeft === 0 && !showSubmit) handleSubmit(); /* eslint-disable-next-line */ }, [timeLeft, attemptId]);
  useEffect(() => { if (attemptId) { setCurrentQ(0); setAnswers({}); } }, [attemptId]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to go to next question or submit
  useEffect(() => {
    if (!attemptId) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentQ === questions.length - 1) setShowSubmit(true);
        else setCurrentQ(Math.min(questions.length - 1, currentQ + 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [attemptId, currentQ, questions.length]);
  // Initialize shuffled order for SORTING questions when question loads
  useEffect(() => {
    if (!attemptId || questions.length === 0) return;
    const q = questions[currentQ];
    if (q?.type === "SORTING" && !answers[q.id]) {
      const correct = (q.correctAnswer as string[]) ?? [];
      const shuffled = correct.slice().sort(() => Math.random() - 0.5);
      setAnswers((prev) => ({ ...prev, [q.id]: shuffled }));
    }
  }, [currentQ, attemptId]);

  const enrollments = (enrollmentsData?.data ?? []) as any[];
  const matchingEnrollment = enrollments[0];

  const handleStart = () => {
    if (!matchingEnrollment) { setError('No active enrollment found.'); return; }
    setError('');
    startAttempt.mutate({ quizId, enrollmentId: matchingEnrollment.id }, { onSuccess: (data) => setAttemptId(data.attempt.id), onError: (err: any) => setError(err.response?.data?.message || 'Failed to start attempt') });
  };

  const handleSubmit = () => {
    if (!attemptId) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    submitAttempt.mutate({ attemptId, answers, timeSpent }, { onSuccess: () => { setShowSubmit(false); onSubmitted(attemptId); }, onError: (err: any) => { setError(err.response?.data?.message || 'Failed to submit'); setShowSubmit(false); } });
  };

  const answered = Object.keys(answers).length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (isLoading) return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading quiz…</div></main>;
  if (!quiz) return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-violet-200 bg-violet-50 p-8 text-center"><AlertCircle className="mx-auto mb-3 h-10 w-10 text-violet-500" /><p className="text-sm font-medium text-violet-700">Quiz not found.</p><Button variant="outline" onClick={() => onNavigate('quiz')} className="mt-4 border-violet-200 text-violet-700"><ArrowLeft className="mr-1.5 h-4 w-4 inline"/>Back to Quizzes</Button></div></main>;

  // Pre-attempt screen (unchanged)
  if (!attemptId) {
    return (
      <main className="mx-auto max-w-3xl p-4 lg:p-6">
        <div className="mb-4 flex items-center gap-2"><button onClick={() => onNavigate('quiz')} className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"><ArrowLeft className="h-4 w-4" />Back to Quizzes</button></div>
        <Card className="border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50"><FileQuestion className="h-7 w-7 text-violet-600" /></div>
            <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
            {quiz.description && <p className="mt-2 max-w-md text-sm text-slate-500">{quiz.description}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><FileQuestion className="h-3.5 w-3.5" />{quiz.questionCount ?? questions.length} questions</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{quiz.timeLimit ?? 15} min</span>
              <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" />Pass: {quiz.passingScore}%</span>
              <span className="flex items-center gap-1"><Route className="h-3.5 w-3.5" />Max attempts: {quiz.maxAttempts}</span>
            </div>
            {quiz.instructions && <div className="mt-6 w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-600"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Instructions</p>{quiz.instructions}</div>}
            {error && <div className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            {!isTeacher && <Button onClick={handleStart} disabled={startAttempt.isPending || !matchingEnrollment} className="mt-6 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">{startAttempt.isPending ? 'Starting…' : matchingEnrollment ? 'Start Quiz' : 'No active enrollment'}</Button>}
            {!matchingEnrollment && !isTeacher && <p className="mt-2 text-xs text-violet-600">You need an active enrollment to take this quiz.</p>}
            {isTeacher && analyticsData && (
              <div className="mt-6 w-full border-t border-slate-200 pt-4 text-left">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Quiz Analytics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-100 p-3 text-center"><p className="text-2xl font-bold text-violet-600">{(analyticsData as any)?.totalAttempts ?? 0}</p><p className="text-xs text-slate-400">Total Attempts</p></div>
                  <div className="rounded-lg border border-slate-100 p-3 text-center"><p className="text-2xl font-bold text-emerald-600">{(analyticsData as any)?.passRate != null ? `${(analyticsData as any).passRate}%` : '—'}</p><p className="text-xs text-slate-400">Pass Rate</p></div>
                  <div className="rounded-lg border border-slate-100 p-3 text-center"><p className="text-2xl font-bold text-violet-600">{(analyticsData as any)?.averageScore != null ? `${(analyticsData as any).averageScore}%` : '—'}</p><p className="text-xs text-slate-400">Avg Score</p></div>
                </div>
                {quiz?.status === 'DRAFT' && <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700">⚠️ This quiz is a <strong>Draft</strong>. Students cannot see it until published.</div>}
              </div>
            )}
          </div>
        </Card>
      </main>
    );
  }

  if (questions.length === 0) return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-violet-200 bg-violet-50 p-8 text-center text-sm text-violet-700">This quiz has no questions yet.</div></main>;

  const currentQuestion = questions[currentQ];
  const qType = currentQuestion.type;
  const options: any[] = currentQuestion.options ?? [];

  // Drag-and-drop handlers for sorting
  const handleDragStart = (type: string, idx: number) => setDraggedItem({ type, idx });
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (type: string, targetIdx: number) => {
    if (!draggedItem || draggedItem.type !== type) return;
    const currentAnswer = (answers[currentQuestion.id] as any[]) ?? [];
    if (type === 'sort') {
      const newArr = [...currentAnswer];
      const [moved] = newArr.splice(draggedItem.idx, 1);
      newArr.splice(targetIdx, 0, moved);
      setAnswers({ ...answers, [currentQuestion.id]: newArr });
    }
    setDraggedItem(null);
  };

  // Render question input based on type
  const renderQuestionInput = () => {
    switch (qType) {
      case 'MULTIPLE_CHOICE_SINGLE':
      case 'TRUE_FALSE': {
        const opts = qType === 'TRUE_FALSE' ? [{ text: 'True' }, { text: 'False' }] : options;
        return (
          <div className="space-y-2">
            {opts.map((opt, idx) => {
              const optValue = qType === 'TRUE_FALSE' ? opt.text === 'True' : opt.text;
              const selected = answers[currentQuestion.id] === optValue;
              return (
                <button key={idx} onClick={() => setAnswers({ ...answers, [currentQuestion.id]: optValue })} className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all', selected ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}>
                  <input type="radio" checked={selected} readOnly className="h-4 w-4 accent-violet-600" />
                  <span className={cn(selected && 'font-medium text-violet-900')}>{opt.text}</span>
                </button>
              );
            })}
          </div>
        );
      }
      case 'MULTIPLE_CHOICE_MULTIPLE': {
        const selected = (answers[currentQuestion.id] as string[]) ?? [];
        return (
          <div className="space-y-2">
            {options.map((opt, idx) => {
              const isSelected = selected.includes(opt.text);
              return (
                <button key={idx} onClick={() => setAnswers({ ...answers, [currentQuestion.id]: isSelected ? selected.filter((s) => s !== opt.text) : [...selected, opt.text] })} className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all', isSelected ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}>
                  <input type="checkbox" checked={isSelected} readOnly className="h-4 w-4 accent-violet-600" />
                  <span className={cn(isSelected && 'font-medium text-violet-900')}>{opt.text}</span>
                </button>
              );
            })}
          </div>
        );
      }
      case 'FILL_IN_BLANK': {
        const correctBlanks = Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer];
        const userBlanks = (answers[currentQuestion.id] as string[]) ?? new Array(correctBlanks.length).fill('');
        return (
          <div className="space-y-3">
            {correctBlanks.map((_: any, idx: number) => (
              <div key={idx}><Label className="mb-1 block text-xs text-slate-500">Blank {idx + 1}</Label><Input value={userBlanks[idx] ?? ''} onChange={(e) => { const n = [...userBlanks]; n[idx] = e.target.value; setAnswers({ ...answers, [currentQuestion.id]: n }); }} placeholder="Type your answer..." className="text-sm" /></div>
            ))}
          </div>
        );
      }
      case 'MATCHING': {
        // options.pairs = [{left, right}], correctAnswer = {left: right}
        const pairs = options?.pairs ?? [];
        const rightItems = pairs.map((p: any) => p.right).sort(() => Math.random() - 0.5); // shuffled
        const userMatches = (answers[currentQuestion.id] as Record<string, string>) ?? {};
        return (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Drag items from the right column to match with the left column.</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Left column — fixed */}
              <div className="space-y-2">
                {pairs.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <span className="font-medium text-slate-700">{p.left}</span>
                    <Badge className={cn('ml-2', userMatches[p.left] ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-400')}>{userMatches[p.left] ?? '?'}</Badge>
                  </div>
                ))}
              </div>
              {/* Right column — draggable items */}
              <div className="space-y-2">
                {rightItems.map((item: string, idx: number) => {
                  const used = Object.values(userMatches).includes(item);
                  return (
                    <div
                      key={idx}
                      draggable={!used}
                      onDragStart={() => setDraggedMatch(item)}
                      onDragEnd={() => setDraggedMatch(null)}
                      onClick={() => {
                        // Also support click-to-assign: find first unmatched left item
                        const unmatched = pairs.find((p: any) => !userMatches[p.left]);
                        if (unmatched) setAnswers({ ...answers, [currentQuestion.id]: { ...userMatches, [unmatched.left]: item } });
                      }}
                      className={cn('cursor-grab rounded-lg border p-3 text-sm font-medium transition-all active:cursor-grabbing', used ? 'border-slate-100 bg-slate-50 text-slate-300 line-through' : 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 hover:shadow-sm', draggedMatch === item && 'opacity-50')}
                    >
                      <GripVertical className="mr-1.5 inline h-3.5 w-3.5 text-slate-400" />{item}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Drop zones for left items */}
            <div className="space-y-1.5">
              {pairs.map((p: any, idx: number) => (
                <div
                  key={idx}
                  onDragOver={handleDragOver}
                  onDrop={() => { if (draggedMatch) setAnswers({ ...answers, [currentQuestion.id]: { ...userMatches, [p.left]: draggedMatch } }); }}
                  onClick={() => { // Click left item to clear
                    if (userMatches[p.left]) { const n = { ...userMatches }; delete n[p.left]; setAnswers({ ...answers, [currentQuestion.id]: n }); }
                  }}
                  className={cn('flex items-center gap-2 rounded-lg border-2 border-dashed p-2 text-xs cursor-pointer', userMatches[p.left] ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-violet-300')}
                >
                  <span className="font-medium text-slate-600">{p.left}</span>
                  <span className="text-slate-400">→</span>
                  <span className={cn('font-medium', userMatches[p.left] ? 'text-emerald-600' : 'text-slate-300')}>{userMatches[p.left] ?? 'Drop here or click right item'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'SORTING': {
        const correctItems = (currentQuestion.correctAnswer as string[]) ?? [];
        const userOrder = (answers[currentQuestion.id] as string[]) ?? correctItems.slice().sort(() => Math.random() - 0.5); // shuffled initial
        // Shuffled order initialized via useEffect when question loads
        return (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Drag the items to arrange them in the correct order.</p>
            {userOrder.map((item: string, idx: number) => (
              <div
                key={idx}
                draggable
                onDragStart={() => handleDragStart('sort', idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('sort', idx)}
                className={cn('flex cursor-grab items-center gap-3 rounded-lg border-2 border-slate-200 bg-white p-3 text-sm font-medium transition-all hover:border-violet-300 active:cursor-grabbing', draggedItem?.type === 'sort' && draggedItem.idx === idx && 'opacity-50')}
              >
                <GripVertical className="h-4 w-4 text-slate-400" />
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">{idx + 1}</span>
                {item}
              </div>
            ))}
          </div>
        );
      }
      case 'SHORT_ANSWER':
        return <div><Label className="mb-1.5 block text-xs text-slate-500">Your Answer</Label><Input value={(answers[currentQuestion.id] as string) ?? ''} onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })} placeholder="Type your answer..." className="text-sm" /></div>;
      case 'ESSAY':
        return <div><Label className="mb-1.5 block text-xs text-slate-500">Your Essay</Label><textarea value={(answers[currentQuestion.id] as string) ?? ''} onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })} rows={6} placeholder="Write your essay..." className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700 focus:border-violet-500 focus:outline-none" /></div>;
      case 'FILE_UPLOAD':
        return <div><Label className="mb-1.5 block text-xs text-slate-500">Upload your file</Label><div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center"><Upload className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">Click to upload or drag and drop</p><input type="file" className="mt-2 text-xs text-slate-400" onChange={(e) => { const f = e.target.files?.[0]; if (f) setAnswers({ ...answers, [currentQuestion.id]: { fileName: f.name, fileSize: f.size } }); }} /></div></div>;
      case 'HOTSPOT': {
        const zones = options?.zones ?? [];
        const userZone = (answers[currentQuestion.id] as string) ?? null;
        return (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Click on the correct area of the image to select your answer.</p>
            {options?.imageUrl ? (
              <div className="relative inline-block w-full overflow-hidden rounded-lg border-2 border-slate-200 cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={options.imageUrl}
                  alt="Hotspot question"
                  className="block h-auto w-full select-none"
                  draggable={false}
                  style={{ pointerEvents: 'none' }}
                />
                {/* Zone overlays — visible with subtle border so students know where to click */}
                {zones.map((z: any, idx: number) => {
                  const isSelected = userZone === z.label;
                  return (
                    <div
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setAnswers({ ...answers, [currentQuestion.id]: z.label }); }}
                      className={cn(
                        'absolute cursor-pointer border-2 transition-all',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/30'
                          : 'border-violet-400/50 bg-violet-400/10 hover:bg-violet-400/20'
                      )}
                      style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
                    >
                      {isSelected && (
                        <div className="flex h-full items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No image available for this question.</p>
            )}
            {userZone && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-600">Selected: {userZone}</span>
                <button onClick={() => { const n = { ...answers }; delete n[currentQuestion.id]; setAnswers(n); }} className="ml-auto text-xs text-slate-400 hover:text-red-500">Clear</button>
              </div>
            )}
          </div>
        );
      }
      default:
        return <p className="text-sm text-slate-400">Unsupported question type.</p>;
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2"><button onClick={() => onNavigate('quiz')} className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"><ArrowLeft className="h-4 w-4" />Back to Quizzes</button></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {/* Quiz Header Bar — matches Trenning reference */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-amber-900">?</div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Question {currentQ + 1} of {questions.length}</p>
                <p className="text-xs text-slate-400">{quiz.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFocusMode(!focusMode)} className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', focusMode ? 'border-violet-300 bg-violet-50 text-violet-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
                <Zap className="h-3.5 w-3.5" />Focus Mode
              </button>
              <div className={cn('flex items-center gap-1.5 rounded px-2 py-1.5', timeLeft < 300 ? 'bg-red-100' : 'bg-black')}>
                <Clock className={cn('h-3.5 w-3.5', timeLeft < 300 ? 'text-red-500' : 'text-white/50')} />
                <span className={cn('font-mono text-sm font-semibold tabular-nums', timeLeft < 300 ? 'text-red-600' : 'text-white')}>{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</span>
              </div>
            </div>
          </div>
          {/* Question Card — matches Trenning reference */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Question header */}
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Question {currentQ + 1} of {questions.length}</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{currentQuestion.questionText}</h2>
              <p className="mt-1 text-xs text-slate-400">
                {currentQuestion.type === 'MULTIPLE_CHOICE_MULTIPLE' && 'Select all correct answers! (Answer can be more than one)'}
                {currentQuestion.type === 'MULTIPLE_CHOICE_SINGLE' && 'Select the correct answer'}
                {currentQuestion.type === 'TRUE_FALSE' && 'Select True or False'}
                {currentQuestion.type === 'FILL_IN_BLANK' && 'Type the correct answer in the blank(s)'}
                {currentQuestion.type === 'MATCHING' && 'Drag the answer to match with the correct item'}
                {currentQuestion.type === 'SORTING' && 'Drag and drop to arrange in the correct order'}
                {currentQuestion.type === 'SHORT_ANSWER' && 'Write your answer below'}
                {currentQuestion.type === 'ESSAY' && 'Write your essay below'}
                {currentQuestion.type === 'FILE_UPLOAD' && 'Upload your file below'}
                {currentQuestion.type === 'HOTSPOT' && 'Click on the correct area in the image'}
              </p>
            </div>
            {/* Answer area */}
            {renderQuestionInput()}
            {/* I'm not sure checkbox */}
            <label className="mt-5 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={answers[currentQuestion.id] === 'not_sure'} onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.checked ? 'not_sure' : undefined })} className="h-4 w-4 rounded border-slate-300 accent-violet-600 focus:ring-violet-500" />
              <span className="text-sm text-slate-500">I'm not sure about the answer yet</span>
            </label>
            {/* Navigation footer */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} className="border-slate-200 px-6 py-2 text-slate-600">Previous</Button>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-slate-400 sm:inline">Press <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium">Cmd + Enter</kbd></span>
                {currentQ === questions.length - 1 ? (
                  <Button onClick={() => setShowSubmit(true)} className="bg-violet-600 px-6 py-2 text-white hover:bg-violet-700">Submit Quiz</Button>
                ) : (
                  <Button onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))} className="bg-violet-600 px-6 py-2 text-white hover:bg-violet-700">Continue</Button>
                )}
              </div>
            </div>
            {/* Report issue */}
            <div className="mt-4 flex items-center gap-1 text-xs text-slate-400">
              <span>Have an issue with this question?</span>
              <button className="text-violet-500 underline hover:text-violet-600">Report An Issue</button>
            </div>
          </div>
        </div>
        {/* Quiz Navigation Sidebar */}
        <div>
          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-900">Quiz Navigation</h3><p className="mt-0.5 text-xs text-slate-400">{answered}/{questions.length} answered</p></div>
            <div className="grid grid-cols-5 gap-2 p-4">
              {questions.map((q, idx) => (<button key={q.id} onClick={() => setCurrentQ(idx)} className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors', idx === currentQ ? 'bg-violet-600 text-white' : answers[q.id] === 'not_sure' ? 'bg-violet-100 text-violet-700' : answers[q.id] !== undefined ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>{idx + 1}</button>))}
            </div>
            <div className="border-t border-slate-200 p-4"><Button onClick={() => setShowSubmit(true)} className="w-full bg-violet-500 text-white hover:bg-violet-600">Submit Quiz</Button></div>
          </Card>
        </div>
      </div>
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex flex-col items-center text-center"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50"><AlertCircle className="h-7 w-7 text-violet-500" /></div><h2 className="text-lg font-bold text-slate-900">Submit Quiz?</h2><p className="mt-1 text-sm text-slate-500">You have answered {answered} out of {questions.length} questions.</p>{answered < questions.length && <p className="mt-2 text-xs font-medium text-violet-600">{questions.length - answered} questions are still unanswered.</p>}{error && <p className="mt-2 text-xs text-red-600">{error}</p>}</div>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setShowSubmit(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button><Button onClick={handleSubmit} disabled={submitAttempt.isPending} className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">{submitAttempt.isPending ? 'Submitting…' : 'Finish!'}</Button></div>
          </Card>
        </div>
      )}
    </main>
  );
}


// ─── Quiz Results View ────────────────────────────────────────────────────
function QuizResultsView({ attemptId, onNavigate }: { attemptId: string; onNavigate: (v: View) => void }) {
  const { data: resultsData, isLoading } = useAttemptResults(attemptId || null);
  const results = (resultsData as any)?.results;

  if (isLoading) {
    return <main className="mx-auto max-w-4xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading results…</div></main>;
  }

  if (!results) {
    return (
      <main className="mx-auto max-w-4xl p-4 lg:p-6">
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-violet-500" />
          <p className="text-sm font-medium text-violet-700">Results not available.</p>
          <Button variant="outline" onClick={() => onNavigate('quiz')} className="mt-4 border-violet-200 text-violet-700"><ArrowLeft className="mr-1.5 h-4 w-4 inline"/>Back to Quizzes</Button>
        </div>
      </main>
    );
  }

  const score = Math.round(results.scorePercentage ?? 0);
  const correct = (results.questions ?? []).filter((q: any) => q.isCorrect).length;
  const total = results.maxPossibleScore ?? (results.questions ?? []).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = results.passed;

  return (
    <main className="mx-auto max-w-4xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Results</span>
      </div>

      {/* Score Summary */}
      <Card className="mb-6 border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-32 w-32 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={passed ? '#10B981' : '#EF4444'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * 264} 264`} />
            </svg>
            <div>
              <p className="text-3xl font-bold text-slate-900">{score}%</p>
              <p className="text-xs text-slate-400">Score</p>
            </div>
          </div>
          <Badge className={cn('mb-2 hover:opacity-90', passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
            {passed ? <><CheckCircle2 className="mr-1 h-3 w-3" />Passed!</> : <><X className="mr-1 h-3 w-3" />Failed</>}
          </Badge>
          <h1 className="text-xl font-bold text-slate-900">Quiz Completed!</h1>
          <p className="mt-1 text-sm text-slate-500">{results.quizTitle} · {correct}/{total} correct</p>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-100 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{correct}</p>
            <p className="text-xs text-slate-400">Correct</p>
          </div>
          <div className="rounded-lg border border-slate-100 p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{total - correct}</p>
            <p className="text-xs text-slate-400">Incorrect</p>
          </div>
          <div className="rounded-lg border border-slate-100 p-3 text-center">
            <p className="text-2xl font-bold text-violet-600">{accuracy}%</p>
            <p className="text-xs text-slate-400">Accuracy</p>
          </div>
        </div>
      </Card>

      {/* Answer Review */}
      <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Answer Review</h2>
        <div className="space-y-3">
          {(results.questions ?? []).map((q: any, idx: number) => (
            <div key={q.questionId ?? idx} className={cn('rounded-lg border p-4', q.isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50')}>
              <div className="flex items-start gap-3">
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', q.isCorrect ? 'bg-emerald-100' : 'bg-red-100')}>
                  {q.isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Q{idx + 1}: {q.questionText}</p>
                  <p className="mt-1 text-xs text-slate-500">Your answer: <span className={q.isCorrect ? 'font-medium text-emerald-600' : 'font-medium text-red-500'}>{String(q.studentAnswer)}</span></p>
                  {!q.isCorrect && q.correctAnswer !== undefined && (
                    <p className="mt-0.5 text-xs text-slate-500">Correct answer: <span className="font-medium text-emerald-600">{String(q.correctAnswer)}</span></p>
                  )}
                  {q.feedback && <p className="mt-1 text-xs italic text-slate-500">{q.feedback}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={() => onNavigate('dashboard')} className="border-slate-200 text-slate-600">Back to Dashboard</Button>
        <Button onClick={() => onNavigate('catalog')} className="bg-violet-600 text-white hover:bg-violet-700">Browse More Courses</Button>
        <DisputeGradeButton attemptId={attemptId} />
      </div>
    </main>
  );
}

// ─── Assignment View ──────────────────────────────────────────────────────
function AssignmentView({ assignmentId, onNavigate, onSelectAssignment }: { assignmentId: string; onNavigate: (v: View) => void; onSelectAssignment: (id: string) => void }) {
  // If no assignmentId is provided, show a listing of available assignments
  if (!assignmentId) {
    return <AssignmentListView onNavigate={onNavigate} onSelectAssignment={onSelectAssignment} />;
  }
  return <AssignmentRunner assignmentId={assignmentId} onNavigate={onNavigate} />;
}

// ─── Assignment List View ────────────────────────────────────────────────
function AssignmentListView({ onNavigate, onSelectAssignment }: { onNavigate: (v: View) => void; onSelectAssignment: (id: string) => void }) {
  const authUser = useAuthStore((s) => s.user);
  const isTeacher = authUser?.role === 'TEACHER' || authUser?.role === 'ADMIN';
  const { data, isLoading, isError } = useAssignments({ limit: 50, status: isTeacher ? undefined : 'PUBLISHED' });
  const assignments = (data?.data ?? []) as any[];

  return (
    <main className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Assignments</span>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{isTeacher ? 'All Assignments' : 'Available Assignments'}</h1>
        <p className="mt-1 text-sm text-slate-500">{assignments.length} {isTeacher ? 'total' : 'published'} assignments · {isTeacher ? 'Manage and grade submissions' : 'Submit your work'}</p>
      </div>
      {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">Failed to load assignments.</div>}
      {isLoading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading assignments…</div>}
      {!isLoading && !isError && assignments.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {isTeacher ? 'No assignments yet. Create one from a course detail page.' : 'No assignments available yet.'}
        </div>
      )}
      <div className="space-y-3">
        {assignments.map((a: any) => {
          const due = a.dueDate ? new Date(a.dueDate) : null;
          const isOverdue = due && due < new Date();
          return (
            <Card key={a.id} className="cursor-pointer border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md" onClick={() => onSelectAssignment(a.id)}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50"><FileText className="h-5 w-5 text-violet-600" /></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                    <Badge className={cn('hover:opacity-90', isOverdue ? 'bg-red-50 text-red-600' : 'bg-violet-50 text-violet-600')}>{isOverdue ? 'Overdue' : 'Open'}</Badge>
                  </div>
                  {a.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.description}</p>}
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due: {due ? formatDate(due) : 'No deadline'}</span>
                    <span className="flex items-center gap-1"><Award className="h-3 w-3" />{a.maxPoints} pts</span>
                    {a.requiresFileUpload && <span className="flex items-center gap-1"><Upload className="h-3 w-3" />File upload</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}

// ─── Peer Review Panel (shown in AssignmentRunner for students) ──────────
function PeerReviewPanel({ assignmentId }: { assignmentId: string }) {
  const { data: myReviewsData, isLoading } = useMyPeerReviews();
  const submitReview = useSubmitPeerReview();
  const [selectedReviewId, setSelectedReviewId] = useState<string>('');
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter peer reviews for this assignment
  const allReviews = (myReviewsData?.data ?? myReviewsData?.reviews ?? []) as any[];
  const myAssignedReviews = allReviews.filter((r: any) => r.assignmentId === assignmentId || r.submission?.assignmentId === assignmentId);
  const selectedReview = myAssignedReviews.find((r: any) => r.id === selectedReviewId) ?? myAssignedReviews[0];

  useEffect(() => {
    if (selectedReview) {
      setScore(selectedReview.score != null ? String(selectedReview.score) : '');
      setFeedback(selectedReview.feedback ?? '');
      setError(''); setSuccess('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReviewId, selectedReview?.id]);

  const handleSubmit = () => {
    if (!selectedReview) return;
    setError(''); setSuccess('');
    const data: any = { feedback: feedback.trim() || undefined };
    if (score.trim()) {
      const scoreNum = Number(score);
      if (isNaN(scoreNum) || scoreNum < 0) { setError('Score must be a valid number.'); return; }
      data.score = scoreNum;
    }
    if (!data.feedback && data.score === undefined) {
      setError('Please provide a score or feedback.');
      return;
    }
    submitReview.mutate(
      { reviewId: selectedReview.id, data },
      {
        onSuccess: () => setSuccess('Peer review submitted!'),
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to submit review.'),
      },
    );
  };

  if (isLoading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Loading peer reviews…</div>;
  if (myAssignedReviews.length === 0) {
    return (
      <Card className="border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50"><Users className="h-5 w-5 text-violet-600" /></div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Peer Reviews</h3>
            <p className="text-xs text-slate-400">No peer reviews assigned to you for this assignment yet.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50"><Users className="h-5 w-5 text-violet-600" /></div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Peer Reviews ({myAssignedReviews.length})</h2>
          <p className="text-xs text-slate-400">Review your classmates' submissions</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Review list */}
        <div className="space-y-2 lg:col-span-1">
          {myAssignedReviews.map((r: any) => {
            const isSelected = (selectedReview?.id) === r.id;
            const author = r.submission?.user ?? r.reviewee;
            const authorName = author ? `${author.firstName} ${author.lastName}` : 'Unknown';
            return (
              <button key={r.id} onClick={() => setSelectedReviewId(r.id)} className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors', isSelected ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:bg-slate-50')}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">{getInitials(authorName)}</div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-slate-900">{authorName}</p>
                  <p className="text-xs text-slate-400">{r.status === 'COMPLETED' ? 'Reviewed' : 'Pending'}</p>
                </div>
                {r.status === 'COMPLETED' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
              </button>
            );
          })}
        </div>
        {/* Review form */}
        {selectedReview && (
          <div className="space-y-4 lg:col-span-2">
            <Card className="border border-slate-100 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Submission to Review</p>
              {selectedReview.submission?.content?.text && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">{selectedReview.submission.content.text}</div>
              )}
              {selectedReview.submission?.content?.files?.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {selectedReview.submission.content.files.map((f: any, i: number) => (
                    <a key={i} href={f.secure_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-xs text-slate-700 hover:bg-slate-50">
                      <File className="h-3.5 w-3.5 text-violet-500" /><span className="flex-1 truncate">{f.original_filename}</span><Download className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </Card>
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-slate-600">Score (optional, 0-100)</Label>
                <Input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g. 85" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-slate-600">Feedback</Label>
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} placeholder="Provide constructive feedback..." className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
              {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">{success}</div>}
              <Button onClick={handleSubmit} disabled={submitReview.isPending} className="bg-violet-600 text-white hover:bg-violet-700">
                {submitReview.isPending ? 'Submitting…' : 'Submit Review'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Teacher Grading Panel (shown in AssignmentRunner for ADMIN/TEACHER) ──
function TeacherGradingPanel({ assignmentId, assignment }: { assignmentId: string; assignment: any }) {
  const { data: submissionsData, isLoading } = useSubmissions(assignmentId || null);
  const gradeMut = useGradeSubmission();
  const revisionMut = useRequestRevision();
  const assignPeerReviewsMut = useAssignPeerReviews();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [revisionComments, setRevisionComments] = useState('');
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submissions = ((submissionsData as any)?.data ?? []) as any[];
  const selectedSubmission = submissions.find((s: any) => s.id === selectedSubmissionId) ?? submissions[0];

  // Sync form when selected submission changes
  useEffect(() => {
    if (selectedSubmission) {
      setGrade(selectedSubmission.grade != null ? String(selectedSubmission.grade) : '');
      setFeedback(selectedSubmission.feedback ?? '');
      setRevisionComments(selectedSubmission.revisionComments ?? '');
      setShowRevisionBox(!!selectedSubmission.revisionRequested);
      setError(''); setSuccess('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubmissionId, selectedSubmission?.id]);

  const handleGrade = () => {
    if (!selectedSubmission) return;
    setError(''); setSuccess('');
    const gradeNum = Number(grade);
    if (grade === '' || isNaN(gradeNum) || gradeNum < 0) {
      setError('Please enter a valid grade (0 or higher).');
      return;
    }
    if (gradeNum > assignment.maxPoints) {
      setError(`Grade cannot exceed max points (${assignment.maxPoints}).`);
      return;
    }
    gradeMut.mutate(
      {
        submissionId: selectedSubmission.id,
        data: {
          grade: gradeNum,
          feedback: feedback.trim() || undefined,
          revisionRequested: showRevisionBox,
          revisionComments: showRevisionBox ? revisionComments.trim() || undefined : undefined,
        },
      },
      {
        onSuccess: () => setSuccess(`Graded ${selectedSubmission.user?.firstName}'s submission: ${gradeNum}/${assignment.maxPoints}`),
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to save grade.'),
      },
    );
  };

  const handleRequestRevision = () => {
    if (!selectedSubmission) return;
    setError(''); setSuccess('');
    if (!revisionComments.trim()) {
      setError('Please enter revision comments.');
      return;
    }
    revisionMut.mutate(
      { submissionId: selectedSubmission.id, comments: revisionComments },
      {
        onSuccess: () => setSuccess(`Revision requested for ${selectedSubmission.user?.firstName}'s submission.`),
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to request revision.'),
      },
    );
  };

  const statusColors: Record<string, string> = {
    SUBMITTED: 'bg-blue-50 text-blue-600',
    GRADED: 'bg-emerald-50 text-emerald-600',
    RESUBMITTED: 'bg-violet-50 text-violet-600',
    NOT_GRADED: 'bg-slate-100 text-slate-500',
  };

  if (isLoading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading submissions…</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Submissions ({submissions.length})</h2>
            <p className="text-xs text-slate-400">Grade and provide feedback on student work</p>
          </div>
          {assignment.allowPeerReview && (
            <Button onClick={() => {
              
              assignPeerReviewsMut.mutate({ assignmentId });
            }} disabled={assignPeerReviewsMut.isPending} variant="outline" size="sm" className="border-violet-200 text-violet-700 hover:bg-violet-50">
              <Users className="mr-1.5 h-3.5 w-3.5" />{assignPeerReviewsMut.isPending ? 'Assigning…' : 'Assign Peer Reviews'}
            </Button>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">No submissions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Submission list */}
            <div className="space-y-2 lg:col-span-1">
              {submissions.map((s: any) => {
                const isSelected = (selectedSubmission?.id) === s.id;
                const studentName = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown';
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubmissionId(s.id)}
                    className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors', isSelected ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:bg-slate-50')}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">
                      {getInitials(studentName)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-slate-900">{studentName}</p>
                      <p className="text-xs text-slate-400">v{s.version} · {timeAgo(s.submittedAt)}</p>
                    </div>
                    <Badge className={cn('shrink-0 hover:opacity-90', statusColors[s.gradingStatus] || statusColors.NOT_GRADED)}>
                      {s.gradingStatus === 'NOT_GRADED' ? 'Pending' : s.gradingStatus === 'GRADED' ? `Graded: ${s.grade ?? 0}` : s.status}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Grading panel */}
            {selectedSubmission && (
              <div className="space-y-4 lg:col-span-2">
                <Card className="border border-slate-200 p-4 shadow-sm rounded-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedSubmission.user?.firstName} {selectedSubmission.user?.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{selectedSubmission.user?.email} · Submitted {timeAgo(selectedSubmission.submittedAt)}</p>
                    </div>
                    <Badge className={cn('hover:opacity-90', statusColors[selectedSubmission.gradingStatus] || statusColors.NOT_GRADED)}>
                      {selectedSubmission.gradingStatus === 'GRADED' ? `Graded: ${selectedSubmission.grade ?? 0}/${assignment.maxPoints}` : selectedSubmission.gradingStatus === 'NOT_GRADED' ? 'Pending' : selectedSubmission.status}
                    </Badge>
                  </div>

                  {/* Student's submission text */}
                  {selectedSubmission.content?.text && (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Student's Text</p>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">{selectedSubmission.content.text}</div>
                    </div>
                  )}

                  {/* Attached files */}
                  {selectedSubmission.content?.files && selectedSubmission.content.files.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Attached Files</p>
                      <div className="space-y-1.5">
                        {selectedSubmission.content.files.map((f: any, idx: number) => (
                          <a key={idx} href={f.secure_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 hover:border-violet-300 hover:bg-slate-50">
                            <File className="h-3.5 w-3.5 text-violet-500" />
                            <span className="flex-1 truncate">{f.original_filename}</span>
                            <Download className="h-3.5 w-3.5 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Existing grade/feedback */}
                  {selectedSubmission.grade != null && (
                    <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                      <p className="text-xs font-semibold text-emerald-700">Current Grade: {selectedSubmission.grade}/{assignment.maxPoints}</p>
                      {selectedSubmission.feedback && <p className="mt-1 text-xs italic text-slate-600">"{selectedSubmission.feedback}"</p>}
                      {selectedSubmission.gradedAt && <p className="mt-1 text-[10px] text-slate-400">Graded {timeAgo(selectedSubmission.gradedAt)}</p>}
                    </div>
                  )}
                </Card>

                {/* Grading form */}
                <Card className="border border-slate-200 p-4 shadow-sm rounded-xl">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Grade Submission</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium text-slate-600">Grade (out of {assignment.maxPoints})</Label>
                      <Input type="number" min="0" max={assignment.maxPoints} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder={`0 - ${assignment.maxPoints}`} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium text-slate-600">Feedback (optional)</Label>
                      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Provide feedback for the student..." className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="revision" checked={showRevisionBox} onChange={(e) => setShowRevisionBox(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-violet-600" />
                      <Label htmlFor="revision" className="text-xs font-medium text-slate-600">Request revision (student must resubmit)</Label>
                    </div>
                    {showRevisionBox && (
                      <div>
                        <Label className="mb-1.5 block text-xs font-medium text-slate-600">Revision Comments</Label>
                        <textarea value={revisionComments} onChange={(e) => setRevisionComments(e.target.value)} rows={2} placeholder="Explain what needs to be revised..." className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                      </div>
                    )}
                    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
                    {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">{success}</div>}
                    <div className="flex gap-2">
                      <Button onClick={handleGrade} disabled={gradeMut.isPending} className="bg-violet-600 text-white hover:bg-violet-700">
                        {gradeMut.isPending ? 'Saving…' : 'Save Grade'}
                      </Button>
                      {showRevisionBox && (
                        <Button onClick={handleRequestRevision} disabled={revisionMut.isPending} variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50">
                          {revisionMut.isPending ? 'Sending…' : 'Request Revision'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Assignment Runner (single assignment view) ──────────────────────────
function AssignmentRunner({ assignmentId, onNavigate }: { assignmentId: string; onNavigate: (v: View) => void }) {
  const { data: assignData, isLoading } = useAssignment(assignmentId || null);
  const { data: submissionsData } = useSubmissions(assignmentId || null);
  const { data: enrollmentsData } = useEnrollments({ status: 'ACTIVE' });
  const createSubmission = useCreateSubmission();
  const uploadFile = useUploadFile();
  const authUser = useAuthStore((s) => s.user);
  const isTeacher = authUser?.role === 'ADMIN' || authUser?.role === 'TEACHER';

  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ public_id: string; secure_url: string; original_filename: string; size: number; format?: string }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const assignment = (assignData as any)?.assignment;
  const submissions = ((submissionsData as any)?.data ?? []) as any[];
  const enrollments = ((enrollmentsData?.data ?? [])) as any[];
  // Find enrollment matching the assignment's content course; fall back to first active
  const matchingEnrollment = enrollments[0];
  const latestSubmission = submissions[0]; // submissions are sorted newest-first

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (assignment?.allowedFileTypes?.length && ext && !assignment.allowedFileTypes.includes(ext)) {
      setError(`File type ".${ext}" not allowed. Allowed: ${assignment.allowedFileTypes.join(', ')}`);
      return;
    }
    // Validate file size
    const maxSizeMB = assignment?.maxFileSizeMB ?? 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max size: ${maxSizeMB}MB.`);
      return;
    }
    // Upload to Cloudinary
    setUploadingFile(true);
    uploadFile.mutate(file, {
      onSuccess: (fileMeta) => {
        setUploadedFiles((prev) => [...prev, fileMeta]);
        setUploadingFile(false);
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Failed to upload file. Cloudinary may not be configured.');
        setUploadingFile(false);
      },
    });
  };

  const handleRemoveFile = (public_id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.public_id !== public_id));
  };

  const handleSubmit = () => {
    if (!matchingEnrollment) {
      setError('No active enrollment. Enroll in the course first.');
      return;
    }
    if (!submissionText.trim() && uploadedFiles.length === 0) {
      setError('Please add a comment or upload a file.');
      return;
    }
    setError('');
    createSubmission.mutate(
      {
        assignmentId,
        enrollmentId: matchingEnrollment.id,
        content: {
          text: submissionText.trim() || undefined,
          files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          links: [],
        },
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          setSubmissionText('');
          setUploadedFiles([]);
          setTimeout(() => onNavigate('dashboard'), 1800);
        },
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to submit assignment'),
      },
    );
  };

  if (isLoading) {
    return <main className="mx-auto max-w-5xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading assignment…</div></main>;
  }

  if (!assignment) {
    return (
      <main className="mx-auto max-w-5xl p-4 lg:p-6">
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-violet-500" />
          <p className="text-sm font-medium text-violet-700">Assignment not found.</p>
          <Button variant="outline" onClick={() => onNavigate('quiz')} className="mt-4 border-violet-200 text-violet-700"><ArrowLeft className="mr-1.5 h-4 w-4 inline"/>Back to Quizzes</Button>
        </div>
      </main>
    );
  }

  const dueDate = assignment.dueDate ? formatDate(assignment.dueDate) : 'No deadline';
  const isLate = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const statusLabel = latestSubmission ? latestSubmission.status : (isLate ? 'Overdue' : 'Pending');

  return (
    <main className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Assignment</span>
      </div>

      {/* Assignment Header */}
      <Card className="mb-6 border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge className={cn('hover:opacity-90', statusLabel === 'SUBMITTED' || statusLabel === 'GRADED' ? 'bg-emerald-50 text-emerald-600' : statusLabel === 'Overdue' ? 'bg-red-50 text-red-600' : 'bg-violet-50 text-violet-600')}>{statusLabel}</Badge>
              <span className="text-xs text-slate-400">Max points: {assignment.maxPoints}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{assignment.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Due: {dueDate}</span>
              <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{assignment.maxPoints} points</span>
              {assignment.allowResubmissions && <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Resubmissions allowed ({assignment.maxResubmissions})</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* Teachers/Admins see the grading panel; students see the submission UI */}
      {isTeacher ? (
        <TeacherGradingPanel assignmentId={assignmentId} assignment={assignment} />
      ) : (
      <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Instructions */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Instructions</h2>
            {assignment.description && <p className="mb-3 text-sm leading-relaxed text-slate-600">{assignment.description}</p>}
            {assignment.instructions && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{assignment.instructions}</div>
            )}
            {assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0 && (
              <p className="mt-3 text-xs text-slate-500">Allowed file types: {assignment.allowedFileTypes.join(', ')} · Max size: {assignment.maxFileSizeMB}MB</p>
            )}
          </Card>

          {/* Previous Submission */}
          {latestSubmission && (
            <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Your Latest Submission</h2>
              <div className="rounded-lg border border-slate-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge className={cn('hover:opacity-90', latestSubmission.status === 'GRADED' ? 'bg-emerald-50 text-emerald-600' : latestSubmission.status === 'RESUBMITTED' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600')}>{latestSubmission.status}</Badge>
                  <span className="text-xs text-slate-400">v{latestSubmission.version} · {timeAgo(latestSubmission.submittedAt)}</span>
                </div>
                {latestSubmission.content?.text && <p className="text-sm text-slate-700">{latestSubmission.content.text}</p>}
                {latestSubmission.content?.files && latestSubmission.content.files.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {latestSubmission.content.files.map((f: any, idx: number) => (
                      <a key={idx} href={f.secure_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 hover:border-violet-300 hover:bg-slate-50">
                        <File className="h-3.5 w-3.5 text-violet-500" />
                        <span className="flex-1 truncate">{f.original_filename}</span>
                        <Download className="h-3.5 w-3.5 text-slate-400" />
                      </a>
                    ))}
                  </div>
                )}
                {latestSubmission.grade !== null && latestSubmission.grade !== undefined && (
                  <p className="mt-2 text-xs font-semibold text-emerald-600">Grade: {latestSubmission.grade}/{assignment.maxPoints}</p>
                )}
                {latestSubmission.feedback && <p className="mt-1 text-xs italic text-slate-500">Feedback: {latestSubmission.feedback}</p>}
              </div>
            </Card>
          )}

          {/* Submission Form */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-4 text-base font-semibold text-slate-900">{latestSubmission ? 'Resubmit Your Work' : 'Submit Your Work'}</h2>
            {submitted ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 className="h-7 w-7 text-emerald-600" /></div>
                <p className="text-base font-semibold text-slate-900">Submission Successful!</p>
                <p className="mt-1 text-sm text-slate-500">Your assignment has been submitted. Redirecting…</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Upload */}
                {assignment.requiresFileUpload && (
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Upload File</Label>
                    <label className={cn('flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8', uploadingFile ? 'border-violet-300 bg-violet-50/50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50')}>
                      {uploadingFile ? (
                        <>
                          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                          <p className="text-sm font-medium text-violet-600">Uploading to Cloudinary…</p>
                        </>
                      ) : (
                        <>
                          <Upload className="mb-2 h-8 w-8 text-slate-400" />
                          <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                          <p className="mt-1 text-xs text-slate-400">{assignment.allowedFileTypes?.join(', ').toUpperCase() ?? 'PDF, DOCX, ZIP'} up to {assignment.maxFileSizeMB}MB</p>
                        </>
                      )}
                      <input type="file" className="hidden" onChange={handleFileUpload} accept={assignment.allowedFileTypes?.map((t: string) => `.${t}`).join(',')} disabled={uploadingFile} />
                    </label>
                    {/* Uploaded files list */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {uploadedFiles.map((f) => (
                          <div key={f.public_id} className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                              <File className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate text-sm font-medium text-slate-900">{f.original_filename}</p>
                              <p className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB · {f.format?.toUpperCase() ?? 'FILE'}</p>
                            </div>
                            <a href={f.secure_url} target="_blank" rel="noopener noreferrer" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600" title="View file">
                              <Download className="h-4 w-4" />
                            </a>
                            <button onClick={() => handleRemoveFile(f.public_id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Remove file">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Text Submission */}
                <div>
                  <Label className="mb-2 block text-sm font-medium text-slate-700">{assignment.requiresFileUpload ? 'Comments (optional)' : 'Your Submission'}</Label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    rows={6}
                    placeholder="Type your submission or add comments for your instructor..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                <Button onClick={handleSubmit} disabled={createSubmission.isPending || uploadingFile || (!submissionText.trim() && uploadedFiles.length === 0)} className="w-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                  {createSubmission.isPending ? 'Submitting…' : latestSubmission ? 'Resubmit Assignment' : 'Submit Assignment'}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar — Rubric info */}
        <div>
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Assignment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-slate-900">{statusLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max Points</span>
                <span className="font-medium text-slate-900">{assignment.maxPoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date</span>
                <span className="font-medium text-slate-900">{dueDate}</span>
              </div>
              {assignment.latePenaltyPercentage > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Late Penalty</span>
                  <span className="font-medium text-red-600">{assignment.latePenaltyPercentage}%</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Resubmissions</span>
                <span className="font-medium text-slate-900">{assignment.allowResubmissions ? `Up to ${assignment.maxResubmissions}` : 'Not allowed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Peer Review</span>
                <span className="font-medium text-slate-900">{assignment.allowPeerReview ? `Yes (${assignment.peerReviewCount} reviewers)` : 'No'}</span>
              </div>
              {assignment.submissionCount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Submissions</span>
                  <span className="font-medium text-slate-900">{assignment.submissionCount}</span>
                </div>
              )}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{assignment.maxPoints}</p>
              <p className="text-xs text-slate-400">Total Points</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Peer Review panel for students */}
      {assignment.allowPeerReview && (
        <PeerReviewPanel assignmentId={assignmentId} />
      )}
      </>
      )}
    </main>
  );
}

// ─── Discussions View ─────────────────────────────────────────────────────
function DiscussionsView({ onNavigate, onSelectDiscussion }: { onNavigate: (v: View) => void; onSelectDiscussion: (id: string) => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useDiscussions({ limit: 50 });
  const createMutation = useCreateDiscussion();

  const threads = (data?.data ?? []).map((t: any) => ({
    id: t.id,
    title: t.title,
    author: t.author ? `${t.author.firstName} ${t.author.lastName}` : 'Anonymous',
    avatar: t.author ? getInitials(`${t.author.firstName} ${t.author.lastName}`) : 'A',
    replies: t.replyCount ?? 0,
    likes: t.upvotes ?? 0,
    pinned: !!t.pinned,
    time: timeAgo(t.createdAt),
    lastReply: t.updatedAt && t.updatedAt !== t.createdAt ? `${timeAgo(t.updatedAt)}` : '',
  }));

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate(
      { title: newTitle, content: newContent },
      {
        onSuccess: () => {
          setNewTitle(''); setNewContent(''); setShowCreate(false);
        },
      },
    );
  };

  return (
    <main className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Discussions</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discussions</h1>
          <p className="mt-1 text-sm text-slate-500">{threads.length} threads · UI Design Fundamentals</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-violet-600 text-white hover:bg-violet-700">
          <Plus className="mr-1.5 h-4 w-4" />
          New Thread
        </Button>
      </div>

      {/* Thread List */}
      <div className="space-y-3">
        {threads.map((thread) => (
          <Card key={thread.id} className="cursor-pointer border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md" onClick={() => onSelectDiscussion(thread.id)}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">{thread.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {thread.pinned && <Pin className="h-3.5 w-3.5 text-violet-500" />}
                  <h3 className="text-sm font-semibold text-slate-900 hover:text-violet-600">{thread.title}</h3>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                  <span>{thread.author}</span>
                  <span>·</span>
                  <span>{thread.time}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{thread.replies} replies</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3" />{thread.likes}</span>
                </div>
                {thread.lastReply && <p className="mt-1.5 text-xs text-slate-400">Last reply by {thread.lastReply}</p>}
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          </Card>
        ))}
      </div>

      {/* Create Thread Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg border-0 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create New Thread</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-medium text-slate-700">Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What do you want to discuss?" />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium text-slate-700">Content</Label>
                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={5} placeholder="Share your thoughts..." className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={handleCreate} disabled={!newTitle.trim()} className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">Post Thread</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

// ─── Discussion Detail View ──────────────────────────────────────────────
function DiscussionDetailView({ discussionId, onNavigate }: { discussionId: string; onNavigate: (v: View) => void }) {
  const authUser = useAuthStore((s) => s.user);
  const { data, isLoading } = useDiscussion(discussionId || null);
  const createReply = useCreateReply();
  const upvoteDiscussion = useUpvoteDiscussion();
  const markBestAnswer = useMarkBestAnswer();
  const deleteDiscussion = useDeleteDiscussion();
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');

  const discussion = (data as any)?.discussion;
  const replies = ((data as any)?.replies ?? []) as any[];

  const handleReply = () => {
    setError('');
    if (!replyText.trim()) { setError('Reply cannot be empty.'); return; }
    createReply.mutate(
      { discussionId, content: replyText },
      {
        onSuccess: () => { setReplyText(''); },
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to post reply.'),
      },
    );
  };

  const handleDelete = () => {
    
    deleteDiscussion.mutate(discussionId, {
      onSuccess: () => onNavigate('discussions'),
    });
  };

  if (isLoading) {
    return <main className="mx-auto max-w-4xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading discussion…</div></main>;
  }
  if (!discussion) {
    return <main className="mx-auto max-w-4xl p-4 lg:p-6"><div className="rounded-lg border border-violet-200 bg-violet-50 p-8 text-center text-sm text-violet-700">Discussion not found.</div></main>;
  }

  const authorName = discussion.author ? `${discussion.author.firstName} ${discussion.author.lastName}` : 'Unknown';
  const isAuthor = authUser?.id === discussion.authorId;
  const canMarkBestAnswer = isAuthor || authUser?.role === 'ADMIN' || authUser?.role === 'TEACHER';

  return (
    <main className="mx-auto max-w-4xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('discussions')} className="hover:text-slate-700">Discussions</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700 truncate">{discussion.title}</span>
      </div>

      {/* Thread header */}
      <Card className="mb-6 border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-base font-semibold text-violet-600">{getInitials(authorName)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {discussion.pinned && <Pin className="h-4 w-4 text-violet-500" />}
              <h1 className="text-xl font-bold text-slate-900">{discussion.title}</h1>
            </div>
            <p className="mt-1 text-xs text-slate-400">By {authorName} · {timeAgo(discussion.createdAt)} · {discussion.views} views</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{discussion.content}</p>
            <div className="mt-4 flex items-center gap-4">
              <button onClick={() => upvoteDiscussion.mutate(discussionId)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-600">
                <Star className="h-3.5 w-3.5" />{discussion.upvotes ?? 0} upvotes
              </button>
              <span className="text-xs text-slate-400">{replies.length} repl{replies.length !== 1 ? 'ies' : 'y'}</span>
              {(isAuthor || authUser?.role === 'ADMIN') && (
                <button onClick={handleDelete} className="ml-auto text-xs text-red-500 hover:text-red-600">Delete</button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Replies */}
      <div className="mb-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Replies ({replies.length})</h2>
        {replies.length === 0 && <p className="text-sm text-slate-400">No replies yet. Be the first to respond!</p>}
        {replies.map((reply: any) => {
          const replyAuthor = reply.author ? `${reply.author.firstName} ${reply.author.lastName}` : 'Unknown';
          const isReplyAuthor = authUser?.id === reply.authorId;
          return (
            <Card key={reply.id} className={cn('border p-4 shadow-sm', reply.isBestAnswer ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200')}>
              {reply.isBestAnswer && (
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <BadgeCheck className="h-4 w-4" />Best Answer
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{getInitials(replyAuthor)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{replyAuthor}</p>
                    {reply.author?.role === 'TEACHER' && <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">Teacher</Badge>}
                    <span className="text-xs text-slate-400">· {timeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-wrap">{reply.content}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600">
                      <Star className="h-3 w-3" />{reply.upvotes ?? 0}
                    </button>
                    {canMarkBestAnswer && !reply.isBestAnswer && (
                      <button onClick={() => markBestAnswer.mutate({ discussionId, replyId: reply.id })} className="text-xs text-emerald-600 hover:text-emerald-700">
                        Mark as best answer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Reply form */}
      <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Post a Reply</h3>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={4}
          placeholder="Write your reply..."
          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        {error && <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
        <div className="mt-3 flex justify-end">
          <Button onClick={handleReply} disabled={createReply.isPending || !replyText.trim()} className="bg-violet-600 text-white hover:bg-violet-700">
            {createReply.isPending ? 'Posting…' : 'Post Reply'}
          </Button>
        </div>
      </Card>
    </main>
  );
}

// ─── Audit Logs View ─────────────────────────────────────────────────────
function AuditLogsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const { data, isLoading } = useAuditLogs({ page, limit: 25, action: actionFilter || undefined });
  const logs = (data?.data ?? []) as any[];
  const pagination = data?.pagination;

  const actionColors: Record<string, string> = {
    USER_CREATE: 'bg-emerald-50 text-emerald-600',
    USER_UPDATE: 'bg-blue-50 text-blue-600',
    USER_DELETE: 'bg-red-50 text-red-600',
    COURSE_CREATE: 'bg-emerald-50 text-emerald-600',
    COURSE_UPDATE: 'bg-blue-50 text-blue-600',
    COURSE_DELETE: 'bg-red-50 text-red-600',
    SUBMISSION_CREATE: 'bg-violet-50 text-violet-600',
    LOGIN: 'bg-slate-100 text-slate-600',
    LOGOUT: 'bg-slate-100 text-slate-600',
  };

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('admin')} className="hover:text-slate-700">Admin</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Audit Logs</span>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">{pagination?.total ?? 0} total events · GDPR-compliant activity trail</p>
      </div>

      {/* Filter */}
      <Card className="mb-4 border border-slate-200 p-3 shadow-sm">
        <div className="flex gap-2">
          <Input placeholder="Filter by action (e.g. USER_CREATE)" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="text-sm" />
        </div>
      </Card>

      {/* Logs table */}
      <Card className="border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading audit logs…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Entity</th>
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-left font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <Badge className={cn('hover:opacity-90', actionColors[log.action] || 'bg-slate-100 text-slate-500')}>{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.userId ? log.userId.slice(-8) : 'system'}</td>
                    <td className="px-4 py-3 text-slate-600">{log.entityType ?? '—'}{log.entityId ? ` (${log.entityId.slice(-6)})` : ''}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(log.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{log.context?.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="border-slate-200 text-slate-600">Previous</Button>
          <span className="text-sm text-slate-500">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="border-slate-200 text-slate-600">Next</Button>
        </div>
      )}
    </main>
  );
}

// ─── Announcements View ──────────────────────────────────────────────────
function AnnouncementsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const authUser = useAuthStore((s) => s.user);
  const canManage = authUser?.role === 'ADMIN' || authUser?.role === 'TEACHER';
  const { data, isLoading } = useAnnouncements({ limit: 50 });
  const createMut = useCreateAnnouncement();
  const deleteMut = useDeleteAnnouncement();
  const markReadMut = useMarkAnnouncementRead();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [formErr, setFormErr] = useState('');

  const announcements = (data?.data ?? []) as any[];

  const handleCreate = () => {
    setFormErr('');
    if (!newTitle.trim() || !newContent.trim()) {
      setFormErr('Title and content are required.');
      return;
    }
    createMut.mutate(
      { title: newTitle, content: newContent, priority: newPriority },
      {
        onSuccess: () => {
          setNewTitle(''); setNewContent(''); setNewPriority('NORMAL');
          setShowCreate(false);
        },
        onError: (err: any) => setFormErr(err.response?.data?.message || 'Failed to create announcement.'),
      },
    );
  };

  const handleDelete = (id: string) => {
    
    deleteMut.mutate(id);
  };

  const handleMarkRead = (id: string) => {
    markReadMut.mutate(id);
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-600',
    NORMAL: 'bg-blue-50 text-blue-600',
    HIGH: 'bg-violet-50 text-violet-600',
    URGENT: 'bg-red-50 text-red-600',
  };

  return (
    <main className="mx-auto max-w-4xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Announcements</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''} · Stay up to date</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)} className="bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="mr-1.5 h-4 w-4" />New Announcement
          </Button>
        )}
      </div>

      {isLoading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading announcements…</div>}
      {!isLoading && announcements.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No announcements yet.</p>
          {canManage && <p className="mt-1 text-xs text-slate-400">Click "New Announcement" to create your first one.</p>}
        </div>
      )}

      <div className="space-y-3">
        {announcements.map((a: any) => {
          const creator = a.creator ? `${a.creator.firstName} ${a.creator.lastName}` : 'Unknown';
          const isUnread = a.readReceipts === null || (Array.isArray(a.readReceipts) && !a.readReceipts.includes(authUser?.id));
          return (
            <Card key={a.id} className={cn('border p-5 shadow-sm transition-all', isUnread ? 'border-violet-200 bg-violet-50/30' : 'border-slate-200')}>
              <div className="flex items-start gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', priorityColors[a.priority ?? 'NORMAL'] || priorityColors.NORMAL)}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                        {isUnread && <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">New</Badge>}
                        <Badge className={cn('hover:opacity-90', priorityColors[a.priority ?? 'NORMAL'] || priorityColors.NORMAL)}>{a.priority ?? 'NORMAL'}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">By {creator} · {timeAgo(a.createdAt)}</p>
                    </div>
                    {canManage && (
                      <button onClick={() => handleDelete(a.id)} title="Delete" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{a.content}</p>
                  {isUnread && (
                    <button onClick={() => handleMarkRead(a.id)} className="mt-3 text-xs font-medium text-violet-600 hover:text-violet-700">
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Announcement Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg border-0 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">New Announcement</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Title *</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Schedule update for next week" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Content *</Label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={5}
                  placeholder="Write your announcement..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
                    <button key={p} type="button" onClick={() => setNewPriority(p)} className={cn('rounded-lg border py-2 text-xs font-medium transition-colors', p === newPriority ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{p}</button>
                  ))}
                </div>
              </div>
              {formErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{formErr}</div>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={handleCreate} disabled={createMut.isPending} className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                  {createMut.isPending ? 'Publishing…' : 'Publish'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

// ─── Dispute Grade Button (in QuizResultsView) ────────────────────────────
function DisputeGradeButton({ attemptId }: { attemptId: string }) {
  const escalateMut = useEscalateGrade();
  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEscalate = () => {
    setError(''); setSuccess('');
    if (!reason.trim()) { setError('Please provide a reason for your dispute.'); return; }
    escalateMut.mutate(
      { attemptId, reason },
      {
        onSuccess: () => { setSuccess('Grade dispute submitted! The teacher will review it.'); setReason(''); setShowDispute(false); },
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to submit dispute.'),
      },
    );
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowDispute(!showDispute)} className="border-violet-200 text-violet-700 hover:bg-violet-50">
        <AlertCircle className="mr-1.5 h-4 w-4" />Dispute Grade
      </Button>
      {showDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Dispute Grade</h2>
              <button onClick={() => setShowDispute(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-sm text-slate-500">Explain why you believe your grade is incorrect. The teacher will review your dispute.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="e.g., I believe question 3 was marked incorrectly because..." className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
            {error && <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
            {success && <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">{success}</div>}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setShowDispute(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
              <Button onClick={handleEscalate} disabled={escalateMut.isPending} className="flex-1 bg-violet-500 text-white hover:bg-violet-600">
                {escalateMut.isPending ? 'Submitting…' : 'Submit Dispute'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

// ─── Grade Disputes Section (in AdminView for teachers/admins) ───────────
function GradeDisputesSection() {
  const { data, isLoading } = useGradeDisputes({ limit: 10 });
  const resolveMut = useResolveDispute();
  const disputes = (data?.data ?? []) as any[];

  const handleResolve = (disputeId: string, status: 'RESOLVED' | 'ESCALATED') => {
    const resolution = prompt(`Resolution notes for ${status === 'RESOLVED' ? 'resolving' : 'escalating'} this dispute:`) || '';
    const newScoreStr = status === 'RESOLVED' ? prompt('New score (leave empty for no change):') : '';
    const newScore = newScoreStr && !isNaN(Number(newScoreStr)) ? Number(newScoreStr) : undefined;
    resolveMut.mutate({ disputeId, resolution, status, newScore });
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-violet-50 text-violet-600',
    UNDER_REVIEW: 'bg-blue-50 text-blue-600',
    RESOLVED: 'bg-emerald-50 text-emerald-600',
    ESCALATED: 'bg-red-50 text-red-600',
  };

  return (
    <Card className="mt-6 border border-slate-200 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Grade Disputes</h2>
          <p className="text-xs text-slate-400">Student grade escalations — review and resolve</p>
        </div>
        <Badge className={cn('hover:opacity-90', disputes.length > 0 ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600')}>
          {disputes.length} open
        </Badge>
      </div>

      {isLoading && <div className="p-4 text-center text-sm text-slate-500">Loading disputes…</div>}

      {!isLoading && disputes.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <p className="text-sm text-emerald-700">No open grade disputes.</p>
        </div>
      )}

      {disputes.length > 0 && (
        <div className="space-y-3">
          {disputes.map((d: any) => (
            <div key={d.id} className="rounded-lg border border-violet-200 bg-violet-50/30 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <AlertCircle className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{d.user?.firstName} {d.user?.lastName}</p>
                    <Badge className={cn('hover:opacity-90', statusColors[d.status] || statusColors.OPEN)}>{d.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{d.reason}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Quiz: {d.attempt?.quiz?.title ?? 'Unknown'} · Score: {d.attempt?.scorePercentage ?? '?'}% · {timeAgo(d.createdAt)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleResolve(d.id, 'RESOLVED')} disabled={resolveMut.isPending} className="bg-emerald-500 text-white hover:bg-emerald-600">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Resolve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleResolve(d.id, 'ESCALATED')} disabled={resolveMut.isPending} className="border-red-200 text-red-600 hover:bg-red-50">
                      Escalate to Admin
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Admin Sub-Roles Section (delegation) ────────────────────────────────
function AdminSubRolesSection() {
  const { data: rolesData, isLoading: rolesLoading } = useAdminRoles();
  const { data: adminsData } = useAdmins();
  const createRoleMut = useCreateAdminRole();
  const deleteRoleMut = useDeleteAdminRole();
  const assignMut = useAssignAdminRole();
  const removeMut = useRemoveAdminRole();
  const [showCreate, setShowCreate] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');
  const [error, setError] = useState('');

  const roles = (rolesData?.data ?? []) as any[];
  const admins = (adminsData?.data ?? []) as any[];

  const allPermissions = [
    'USERS_VIEW', 'USERS_CREATE', 'USERS_DELETE', 'USERS_ROLE_CHANGE',
    'CONTENT_MODERATE', 'COURSE_QUALITY_MANAGE',
    'ANALYTICS_VIEW', 'ANALYTICS_EXPORT',
    'SUPPORT_IMPERSONATE', 'SYSTEM_CONFIG', 'SYSTEM_MAINTENANCE',
    'ADMIN_ROLES_MANAGE', 'ALL_ACCESS',
  ];

  const handleCreate = () => {
    setError('');
    if (!roleName.trim()) { setError('Name required.'); return; }
    createRoleMut.mutate(
      { name: roleName, description: roleDesc, permissions: selectedPerms },
      { onSuccess: () => { setRoleName(''); setRoleDesc(''); setSelectedPerms([]); setShowCreate(false); }, onError: (err: any) => setError(err.response?.data?.message || 'Failed') },
    );
  };

  const togglePerm = (perm: string) => {
    setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  const handleAssign = () => {
    setError('');
    if (!assignUserId || !assignRoleId) { setError('Select user and role.'); return; }
    assignMut.mutate({ userId: assignUserId, roleId: assignRoleId }, { onError: (err: any) => setError(err.response?.data?.message || 'Failed') });
  };

  return (
    <Card className="mt-6 border border-slate-200 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Admin Sub-Roles</h2>
          <p className="text-xs text-slate-400">Granular admin permissions — delegate responsibilities</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="bg-violet-600 text-white hover:bg-violet-700">
          <Plus className="mr-1 h-3.5 w-3.5" />New Role
        </Button>
      </div>

      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}

      {/* Create role form */}
      {showCreate && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-slate-600">Role Name</Label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g., Reports Manager" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-slate-600">Description</Label>
              <Input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="What can this role do?" />
            </div>
          </div>
          <Label className="mb-2 block text-xs font-medium text-slate-600">Permissions</Label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {allPermissions.map(p => (
              <button key={p} type="button" onClick={() => togglePerm(p)} className={cn('rounded-md border px-2 py-1 text-[10px] font-medium transition-colors', selectedPerms.includes(p) ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
                {p.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={createRoleMut.isPending} className="bg-violet-600 text-white hover:bg-violet-700">
              {createRoleMut.isPending ? 'Creating…' : 'Create Role'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)} className="border-slate-200 text-slate-600">Cancel</Button>
          </div>
        </div>
      )}

      {/* Roles list */}
      {rolesLoading && <div className="p-4 text-center text-sm text-slate-500">Loading roles…</div>}
      <div className="space-y-2">
        {roles.map((r: any) => (
          <div key={r.id} className="group rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{r.name}</p>
                {r.isSystem && <Badge className="bg-slate-100 text-slate-400 text-[10px]">System</Badge>}
                <Badge className="bg-violet-50 text-violet-600 text-[10px]">{r._count?.admins ?? 0} admin(s)</Badge>
              </div>
              {!r.isSystem && (
                <button onClick={() => deleteRoleMut.mutate(r.id)} className="rounded p-1 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {r.description && <p className="mt-0.5 text-xs text-slate-400">{r.description}</p>}
            <div className="mt-1 flex flex-wrap gap-1">
              {(r.permissions ?? []).map((p: string) => (
                <span key={p} className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">{p.replace(/_/g, ' ').toLowerCase()}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Assign role to user */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Assign Sub-Role to Admin User</h3>
        <div className="flex gap-2">
          <Input value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} placeholder="User ID" className="flex-1 text-xs" />
          <select value={assignRoleId} onChange={(e) => setAssignRoleId(e.target.value)} className="rounded-lg border border-slate-200 bg-white p-2 text-xs">
            <option value="">Select role…</option>
            {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <Button size="sm" onClick={handleAssign} disabled={assignMut.isPending} className="bg-violet-600 text-white hover:bg-violet-700">
            {assignMut.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </div>

        {/* Assigned admins */}
        {admins.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {admins.map((a: any) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-600">{getInitials(`${a.user?.firstName} ${a.user?.lastName}`)}</div>
                <span className="flex-1 text-xs text-slate-700">{a.user?.firstName} {a.user?.lastName} ({a.user?.email})</span>
                <Badge className="bg-violet-50 text-violet-600 text-[10px]">{a.role?.name}</Badge>
                <button onClick={() => removeMut.mutate(a.userId)} className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Quality Monitoring Section (admin) ──────────────────────────────────
function QualityMonitoringSection() {
  const { data, isLoading, isError } = useQualityReport();
  const recalcMut = useRecalculateQuality();
  const flagMut = useFlagCourse();
  const unflagMut = useUnflagCourse();

  const summary = data?.summary;
  const courses = (data?.courses ?? []) as any[];

  const scoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-violet-600';
    return 'text-red-600';
  };

  const scoreBg = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-violet-500';
    return 'bg-red-500';
  };

  return (
    <Card className="mt-6 border border-slate-200 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Course Quality Monitoring</h2>
          <p className="text-xs text-slate-400">Automated quality scores, flags, and teacher performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => recalcMut.mutate()} disabled={recalcMut.isPending} className="border-violet-200 text-violet-700 hover:bg-violet-50">
          <TrendingUp className="mr-1 h-3.5 w-3.5" />{recalcMut.isPending ? 'Recalculating…' : 'Recalculate All'}
        </Button>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-100 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{summary.totalCourses}</p>
            <p className="text-xs text-slate-400">Total Courses</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/30 p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.lowQualityCount}</p>
            <p className="text-xs text-slate-400">Low Quality (&lt;40)</p>
          </div>
          <div className="rounded-lg border border-violet-100 bg-violet-50/30 p-3 text-center">
            <p className="text-2xl font-bold text-violet-600">{summary.flaggedCount}</p>
            <p className="text-xs text-slate-400">Flagged</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{summary.goodQualityCount}</p>
            <p className="text-xs text-slate-400">Good Quality (70+)</p>
          </div>
        </div>
      )}

      {isLoading && <div className="p-4 text-center text-sm text-slate-500">Loading quality report…</div>}

      {!isLoading && courses.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-slate-400" />
          <p className="text-sm text-slate-500">No courses found. Click "Recalculate All" to generate quality scores.</p>
        </div>
      )}

      {courses.length > 0 && (
        <div className="space-y-2">
          {courses.slice(0, 10).map((c: any) => (
            <div key={c.id} className="group flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{c.title}</p>
                <p className="text-xs text-slate-400">
                  Teacher: {c.teacher?.firstName ?? '?'} {c.teacher?.lastName ?? ''} · {c.enrollmentCount} enrolled · {c.completedCount} completed
                </p>
                {c.qualityFlags?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.qualityFlags.map((f: string) => (
                      <Badge key={f} className="bg-red-50 text-red-600 text-[10px] hover:bg-red-50">{f.replace(/_/g, ' ').toLowerCase()}</Badge>
                    ))}
                  </div>
                )}
              </div>
              {/* Score bar */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn('h-full rounded-full', scoreBg(c.qualityScore ?? 0))} style={{ width: `${c.qualityScore ?? 0}%` }} />
                </div>
                <span className={cn('text-sm font-bold', scoreColor(c.qualityScore ?? 0))}>{Math.round(c.qualityScore ?? 0)}</span>
              </div>
              {/* Flag/unflag */}
              {c.qualityFlags?.length > 0 ? (
                <button onClick={() => unflagMut.mutate({ courseId: c.id, flag: 'LOW_QUALITY' })} className="rounded p-1 text-slate-300 opacity-0 hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100" title="Unflag">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button onClick={() => flagMut.mutate({ courseId: c.id, flag: 'ADMIN_REVIEW' })} className="rounded p-1 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100" title="Flag for review">
                  <AlertCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Auto-Enrollment Rules Section (admin) ───────────────────────────────
function AutoEnrollmentRulesSection() {
  const { data: rulesData, isLoading } = useAutoEnrollRules();
  const createRuleMut = useCreateAutoEnrollRule();
  const deleteRuleMut = useDeleteAutoEnrollRule();
  const triggerMut = useTriggerAutoEnroll();
  const { data: coursesData } = useCourses({ limit: 100 });
  const [showCreate, setShowCreate] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState('ROLE');
  const [ruleValue, setRuleValue] = useState('STUDENT');
  const [courseId, setCourseId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const rules = (rulesData?.data ?? rulesData ?? []) as any[];
  const courses = (coursesData?.data ?? []) as any[];

  const handleCreate = () => {
    setError(''); setSuccess('');
    if (!ruleName.trim() || !courseId) { setError('Name and course are required.'); return; }
    createRuleMut.mutate(
      {
        name: ruleName,
        ruleType,
        ruleConfig: ruleType === 'ROLE' ? { role: ruleValue } : { value: ruleValue },
        courseId,
      },
      {
        onSuccess: () => { setRuleName(''); setCourseId(''); setShowCreate(false); setSuccess('Rule created!'); },
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to create rule.'),
      },
    );
  };

  return (
    <Card className="mt-6 border border-slate-200 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Auto-Enrollment Rules</h2>
          <p className="text-xs text-slate-400">Automatically enroll students based on role, department, or cohort</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { triggerMut.mutate(); setSuccess('Rules triggered for all users!'); }} disabled={triggerMut.isPending} className="border-violet-200 text-violet-700 hover:bg-violet-50">
            <Zap className="mr-1 h-3.5 w-3.5" />{triggerMut.isPending ? 'Triggering…' : 'Trigger All'}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="mr-1 h-3.5 w-3.5" />New Rule
          </Button>
        </div>
      </div>

      {success && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">{success}</div>}
      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}

      {showCreate && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-slate-600">Rule Name</Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="e.g., Auto-enroll all students" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-slate-600">Rule Type</Label>
              <select value={ruleType} onChange={(e) => setRuleType(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm">
                <option value="ROLE">Role (e.g., STUDENT)</option>
                <option value="DEPARTMENT">Department</option>
                <option value="COHORT">Cohort</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-slate-600">Rule Value</Label>
              {ruleType === 'ROLE' ? (
                <select value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm">
                  <option value="STUDENT">STUDENT</option>
                  <option value="TEACHER">TEACHER</option>
                </select>
              ) : (
                <Input value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} placeholder={ruleType === 'DEPARTMENT' ? 'e.g., Engineering' : 'e.g., 2024-cohort'} />
              )}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-slate-600">Course</Label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm">
                <option value="">Select course…</option>
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={createRuleMut.isPending} className="bg-violet-600 text-white hover:bg-violet-700">
              {createRuleMut.isPending ? 'Creating…' : 'Create Rule'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)} className="border-slate-200 text-slate-600">Cancel</Button>
          </div>
        </div>
      )}

      {isLoading && <div className="p-4 text-center text-sm text-slate-500">Loading rules…</div>}

      {!isLoading && rules.length === 0 && !showCreate && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <Route className="h-5 w-5 text-slate-400" />
          <p className="text-sm text-slate-500">No auto-enrollment rules configured. Click "New Rule" to get started.</p>
        </div>
      )}

      {rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((r: any) => (
            <div key={r.id} className="group flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', r.isActive ? 'bg-violet-50' : 'bg-slate-100')}>
                <Route className={cn('h-4 w-4', r.isActive ? 'text-violet-600' : 'text-slate-400')} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{r.name}</p>
                <p className="text-xs text-slate-400">
                  Type: {r.ruleType} · Course: {r.course?.title ?? 'Unknown'} · {r.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <Badge className={cn('hover:opacity-90', r.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                {r.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <button onClick={() => deleteRuleMut.mutate(r.id)} className="rounded p-1 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Escalations Section (Student → Teacher → Admin workflow) ────────────
function EscalationsSection() {
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === 'ADMIN';
  const isTeacher = authUser?.role === 'TEACHER' || isAdmin;
  const { data, isLoading } = useEscalations({ limit: 10 });
  const teacherResolveMut = useTeacherResolveEscalation();
  const adminResolveMut = useAdminResolveEscalation();
  const escalations = (data?.data ?? []) as any[];

  const handleTeacherAction = (escalationId: string, action: 'RESOLVE' | 'FORWARD') => {
    const notes = prompt(`Notes for ${action === 'RESOLVE' ? 'resolving' : 'forwarding'} this escalation:`) || '';
    const newGradeStr = action === 'RESOLVE' ? prompt('New grade (leave empty for no change):') : '';
    const newGrade = newGradeStr && !isNaN(Number(newGradeStr)) ? Number(newGradeStr) : undefined;
    teacherResolveMut.mutate({ escalationId, action, notes, newGrade });
  };

  const handleAdminResolve = (escalationId: string) => {
    const resolution = prompt('Admin resolution notes:') || '';
    const newGradeStr = prompt('New grade (leave empty for no change):') || '';
    const newGrade = newGradeStr && !isNaN(Number(newGradeStr)) ? Number(newGradeStr) : undefined;
    adminResolveMut.mutate({ escalationId, resolution, newGrade });
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-violet-50 text-violet-600',
    TEACHER_REVIEW: 'bg-blue-50 text-blue-600',
    FORWARDED_TO_ADMIN: 'bg-red-50 text-red-600',
    RESOLVED: 'bg-emerald-50 text-emerald-600',
    ESCALATED: 'bg-red-50 text-red-600',
  };

  return (
    <Card className="mt-6 border border-slate-200 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Escalations</h2>
          <p className="text-xs text-slate-400">Student → Teacher → Admin escalation workflow</p>
        </div>
        <Badge className={cn('hover:opacity-90', escalations.length > 0 ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600')}>
          {escalations.length} {escalations.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      {isLoading && <div className="p-4 text-center text-sm text-slate-500">Loading escalations…</div>}

      {!isLoading && escalations.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <p className="text-sm text-emerald-700">No open escalations.</p>
        </div>
      )}

      {escalations.length > 0 && (
        <div className="space-y-3">
          {escalations.map((e: any) => (
            <div key={e.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', statusColors[e.status] || statusColors.OPEN)}>
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{e.user?.firstName} {e.user?.lastName}</p>
                    <Badge className={cn('hover:opacity-90', statusColors[e.status] || statusColors.OPEN)}>{e.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{e.reason}</p>
                  {e.submission && (
                    <p className="mt-1 text-xs text-slate-400">
                      Assignment: {e.submission.assignment?.title ?? 'Unknown'} · Grade: {e.submission.grade ?? 'Not graded'}
                    </p>
                  )}
                  {e.teacherNotes && <p className="mt-1 text-xs italic text-blue-600">Teacher notes: {e.teacherNotes}</p>}
                  {e.adminNotes && <p className="mt-1 text-xs italic text-red-600">Admin notes: {e.adminNotes}</p>}
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(e.createdAt)}</p>

                  <div className="mt-3 flex gap-2">
                    {/* Teacher actions */}
                    {isTeacher && e.status !== 'RESOLVED' && e.status !== 'FORWARDED_TO_ADMIN' && (
                      <>
                        <Button size="sm" onClick={() => handleTeacherAction(e.id, 'RESOLVE')} disabled={teacherResolveMut.isPending} className="bg-emerald-500 text-white hover:bg-emerald-600">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Resolve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleTeacherAction(e.id, 'FORWARD')} disabled={teacherResolveMut.isPending} className="border-red-200 text-red-600 hover:bg-red-50">
                          Forward to Admin
                        </Button>
                      </>
                    )}
                    {/* Admin actions */}
                    {isAdmin && e.status === 'FORWARDED_TO_ADMIN' && (
                      <Button size="sm" onClick={() => handleAdminResolve(e.id)} disabled={adminResolveMut.isPending} className="bg-violet-600 text-white hover:bg-violet-700">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Admin Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Admin Alerts Bar (real-time alerts) ─────────────────────────────────
function AdminAlertsBar() {
  const { data: alerts } = useAdminAlerts();
  if (!alerts || alerts.total === 0) return null;

  const items = [
    { label: 'Escalations', value: alerts.pendingEscalations, color: 'text-violet-600 bg-violet-50', icon: AlertCircle },
    { label: 'Flagged', value: alerts.flaggedContent, color: 'text-red-600 bg-red-50', icon: AlertCircle },
    { label: 'Low Quality', value: alerts.lowQualityCourses, color: 'text-red-600 bg-red-50', icon: TrendingUp },
    { label: 'At-Risk Students', value: alerts.atRiskStudents, color: 'text-violet-600 bg-violet-50', icon: Users },
    { label: 'Grade Disputes', value: alerts.openGradeDisputes, color: 'text-violet-600 bg-violet-50', icon: FileQuestion },
  ].filter(i => i.value > 0);

  if (items.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
      <span className="mr-2 flex items-center gap-1.5 text-xs font-semibold text-violet-700">
        <AlertCircle className="h-4 w-4" />Active Alerts:
      </span>
      {items.map((item) => (
        <div key={item.label} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium', item.color)}>
          <item.icon className="h-3.5 w-3.5" />
          {item.value} {item.label}
        </div>
      ))}
    </div>
  );
}

// ─── Recent Activity Feed ────────────────────────────────────────────────
function ActivityFeed() {
  const { data, isLoading } = useRecentActivity(10);
  const activities = (data?.data ?? []) as any[];

  const iconForType = (type: string) => {
    switch (type) {
      case 'user_registered': return { icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' };
      case 'course_created': return { icon: Plus, color: 'text-violet-600 bg-violet-50' };
      case 'enrollment': return { icon: GraduationCap, color: 'text-blue-600 bg-blue-50' };
      case 'submission': return { icon: FileText, color: 'text-violet-600 bg-violet-50' };
      case 'certificate_issued': return { icon: Award, color: 'text-violet-600 bg-violet-50' };
      default: return { icon: Bell, color: 'text-slate-600 bg-slate-50' };
    }
  };

  const labelForType = (type: string, data: any) => {
    switch (type) {
      case 'user_registered': return `New user: ${data.name} (${data.role})`;
      case 'course_created': return `New course: ${data.title}`;
      case 'enrollment': return `${data.student} enrolled in ${data.course}`;
      case 'submission': return `${data.student} submitted ${data.assignment}`;
      case 'certificate_issued': return `Certificate issued: ${data.student} — ${data.course}`;
      default: return type;
    }
  };

  return (
    <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
          <p className="text-xs text-slate-400">Live feed · Auto-refresh 30s</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Live
        </span>
      </div>
      {isLoading && <div className="p-4 text-center text-sm text-slate-500">Loading activity…</div>}
      {!isLoading && activities.length === 0 && <p className="text-sm text-slate-400">No recent activity.</p>}
      <div className="space-y-2">
        {activities.slice(0, 8).map((a: any, idx: number) => {
          const { icon: Icon, color } = iconForType(a.type);
          return (
            <div key={idx} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{labelForType(a.type, a.data)}</p>
                <p className="text-xs text-slate-400">{timeAgo(a.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Admin Dashboard View ─────────────────────────────────────────────────
function AdminView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const queryClient = useQueryClient();
  const { data: alerts } = useAdminAlerts();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'flagged' | 'disputes' | 'escalations' | 'rules' | 'quality' | 'roles'>('flagged');

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      setLastUpdate(new Date());
    };
    socket.on('platform-stats-update', onUpdate);
    socket.on('activity-update', onUpdate);
    return () => {
      socket.off('platform-stats-update', onUpdate);
      socket.off('activity-update', onUpdate);
    };
  }, [queryClient]);

  const tabs = [
    { id: 'flagged' as const, label: 'Flagged Content', count: alerts?.flaggedContent ?? 0, icon: AlertCircle },
    { id: 'disputes' as const, label: 'Grade Disputes', count: alerts?.openGradeDisputes ?? 0, icon: FileQuestion },
    { id: 'escalations' as const, label: 'Escalations', count: alerts?.pendingEscalations ?? 0, icon: ArrowUpRight },
    { id: 'rules' as const, label: 'Auto-Enrollment', count: null, icon: Route },
    { id: 'quality' as const, label: 'Quality', count: alerts?.lowQualityCourses ?? 0, icon: TrendingUp },
    { id: 'roles' as const, label: 'Admin Roles', count: null, icon: Crown },
  ];

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            Moderation tools
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Live · {timeAgo(lastUpdate.toISOString())}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('academic-management')} className="border-slate-200 text-slate-600"><Layers className="mr-1.5 h-4 w-4" />Academic Structure</Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('users')} className="border-slate-200 text-slate-600"><Users className="mr-1.5 h-4 w-4" />Users</Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('settings')} className="border-slate-200 text-slate-600"><Settings className="mr-1.5 h-4 w-4" />Settings</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={cn(
                'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
              )}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Active tab content — only one section visible at a time */}
      {activeTab === 'flagged' && <FlaggedContentSection />}
      {activeTab === 'disputes' && <GradeDisputesSection />}
      {activeTab === 'escalations' && <EscalationsSection />}
      {activeTab === 'rules' && <AutoEnrollmentRulesSection />}
      {activeTab === 'quality' && <QualityMonitoringSection />}
      {activeTab === 'roles' && <AdminSubRolesSection />}
    </main>
  );
}

// ─── Flagged Content Section (admin post-moderation) ─────────────────────
function FlaggedContentSection() {
  const { data, isLoading, isError } = useFlaggedContent({ limit: 10 });
  const moderateMut = useModerateContent();
  const flagged = (data?.data ?? []) as any[];

  const handleModerate = (contentId: string, action: 'APPROVE' | 'ARCHIVE' | 'REMOVE') => {
    const notes = action === 'APPROVE' ? undefined : prompt(`Notes for ${action.toLowerCase()}:`) || '';
    moderateMut.mutate({ contentId, action, notes });
  };

  return (
    <Card className="mt-6 border border-slate-200 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Flagged Content</h2>
          <p className="text-xs text-slate-400">Auto-moderation flags — review and take action</p>
        </div>
        <Badge className={cn('hover:opacity-90', flagged.length > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')}>
          {flagged.length} flagged
        </Badge>
      </div>

      {isLoading && <div className="p-4 text-center text-sm text-slate-500">Loading flagged content…</div>}

      {!isLoading && flagged.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-sm font-medium text-emerald-700">All clear!</p>
            <p className="text-xs text-emerald-600">No content has been flagged by the moderation system.</p>
          </div>
        </div>
      )}

      {flagged.length > 0 && (
        <div className="space-y-3">
          {flagged.map((c: any) => (
            <div key={c.id} className="rounded-lg border border-violet-200 bg-violet-50/30 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <AlertCircle className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                    <Badge className="bg-slate-100 text-slate-500">{c.type}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-violet-700">
                    <span className="font-medium">Flag reason:</span> {c.flagReason || 'Unknown'}
                  </p>
                  {c.qualityScore != null && (
                    <p className="text-xs text-slate-400">Quality score: {c.qualityScore}/100</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Course: {c.module?.course?.title ?? 'Unknown'} · Module: {c.module?.title ?? 'Unknown'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleModerate(c.id, 'APPROVE')} disabled={moderateMut.isPending} className="bg-emerald-500 text-white hover:bg-emerald-600">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleModerate(c.id, 'ARCHIVE')} disabled={moderateMut.isPending} className="border-violet-200 text-violet-700 hover:bg-violet-50">
                      Archive
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleModerate(c.id, 'REMOVE')} disabled={moderateMut.isPending} className="border-red-200 text-red-600 hover:bg-red-50">
                      <Trash2 className="mr-1 h-3.5 w-3.5" />Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── User Management View ─────────────────────────────────────────────────
function UsersView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [formErr, setFormErr] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [formPassword, setFormPassword] = useState('');

  const { data, isLoading, isError } = useUsers({ page: 1, limit: 50, search: search || undefined });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const apiUsers = (data?.data ?? []).map((u: any) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    role: u.role,
    status: u.isActive ? 'Active' : 'Inactive',
    courses: 0,
    joined: u.createdAt ? formatDate(u.createdAt) : '—',
    avatar: getInitials(`${u.firstName} ${u.lastName}`),
    isActive: u.isActive,
  }));

  const filtered = apiUsers.filter(u => {
    const roleMatch = roleFilter === 'All' || u.role === roleFilter;
    return roleMatch;
  });

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-50 text-red-600',
    TEACHER: 'bg-violet-50 text-violet-600',
    STUDENT: 'bg-emerald-50 text-emerald-600',
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormFirstName(''); setFormLastName(''); setFormEmail(''); setFormRole('STUDENT'); setFormPassword('');
    setFormErr('');
    setShowCreate(true);
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    const parts = u.name.split(' ');
    setFormFirstName(parts[0] ?? ''); setFormLastName(parts.slice(1).join(' ') ?? '');
    setFormEmail(u.email); setFormRole(u.role); setFormPassword('');
    setFormErr('');
    setShowCreate(true);
  };

  const handleSubmit = () => {
    setFormErr('');
    if (!formFirstName.trim() || !formLastName.trim() || !formEmail.trim()) {
      setFormErr('First name, last name, and email are required.');
      return;
    }
    if (editingUser) {
      // Update existing user
      updateUser.mutate(
        { id: editingUser.id, data: { firstName: formFirstName, lastName: formLastName, role: formRole } },
        {
          onSuccess: () => { setShowCreate(false); toast({ title: 'User updated', description: `${formFirstName} ${formLastName} has been updated.` }); },
          onError: (err: any) => { setFormErr(err.response?.data?.message || 'Failed to update user.'); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update user.', variant: 'destructive' }); },
        },
      );
    } else {
      // Create new user
      createUser.mutate(
        {
          email: formEmail,
          firstName: formFirstName,
          lastName: formLastName,
          role: formRole,
          password: formPassword || undefined,
          mustChangePassword: !!formPassword,
        },
        {
          onSuccess: () => { setShowCreate(false); toast({ title: 'User created', description: `${formFirstName} ${formLastName} has been created successfully.` }); },
          onError: (err: any) => { setFormErr(err.response?.data?.message || 'Failed to create user.'); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create user.', variant: 'destructive' }); },
        },
      );
    }
  };

  const handleToggleActive = (u: any) => {
    updateUser.mutate(
      { id: u.id, data: { isActive: !u.isActive } },
      { onSuccess: () => toast({ title: u.isActive ? 'User deactivated' : 'User activated', description: `${u.name} has been ${u.isActive ? 'deactivated' : 'activated'}.` }) }
    );
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteUser.mutate(deletingUser.id, {
      onSuccess: () => { setDeletingUser(null); toast({ title: 'User deleted', description: 'The user has been permanently deleted.' }); },
      onError: (err: any) => { setFormErr(err.response?.data?.message || 'Failed to delete user.'); setDeletingUser(null); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete user.', variant: 'destructive' }); },
    });
  };

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('admin')} className="hover:text-slate-700">Admin</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">User Management</span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">{isLoading ? 'Loading…' : `${filtered.length} users · ${apiUsers.filter(u => u.status === 'Active').length} active`}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadCSV('users.csv', apiUsers.map((u: any) => ({ Name: u.name, Email: u.email, Role: u.role, Status: u.status, Joined: u.joined })), ['Name', 'Email', 'Role', 'Status', 'Joined'])} className="border-slate-200 text-slate-600"><Download className="mr-1.5 h-4 w-4" />Export CSV</Button>
          <Button onClick={openCreate} className="bg-violet-600 text-white hover:bg-violet-700"><UserPlus className="mr-1.5 h-4 w-4" />Add User</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-1">
            {['All', 'ADMIN', 'TEACHER', 'STUDENT'].map((role) => (
              <button key={role} onClick={() => setRoleFilter(role)} className={cn('rounded-lg px-3 py-2 text-xs font-medium transition-colors', roleFilter === role ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {role === 'All' ? 'All Roles' : role}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Courses</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className='py-12 text-center text-sm text-slate-400'>No users found. {search ? 'Try a different search term.' : 'Click "New User" to create one.'}</td></tr>
              )}
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">{user.avatar}</div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('rounded-full hover:opacity-90', roleColors[user.role])}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(user)} title="Toggle active status" className="flex items-center gap-1.5">
                      <div className={cn('h-2 w-2 rounded-full', user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300')} />
                      <span className="text-xs text-slate-600 hover:text-violet-600">{user.status}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{user.courses}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{user.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(user)} title="Edit user" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => setDeletingUser(user)} title="Delete user" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingUser ? 'Edit User' : 'Create New User'}</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700">First Name</Label>
                  <Input value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="John" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700">Last Name</Label>
                  <Input value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="Doe" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Email</Label>
                <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="john@trenning.com" disabled={!!editingUser} />
                {editingUser && <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>}
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((role) => (
                    <button key={role} type="button" onClick={() => setFormRole(role)} className={cn('rounded-lg border py-2 text-xs font-medium transition-colors', role === formRole ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{role}</button>
                  ))}
                </div>
              </div>
              {!editingUser && (
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700">Password (optional)</Label>
                  <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Leave blank for auto-generated" />
                  <p className="mt-1 text-xs text-slate-400">If blank, a temporary password is generated and the user must change it on first login.</p>
                </div>
              )}
              {formErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{formErr}</div>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={handleSubmit} disabled={createUser.isPending || updateUser.isPending} className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                  {(createUser.isPending || updateUser.isPending) ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><AlertCircle className="h-7 w-7 text-red-500" /></div>
              <h2 className="text-lg font-bold text-slate-900">Delete User?</h2>
              <p className="mt-1 text-sm text-slate-500">Are you sure you want to delete <span className="font-semibold text-slate-700">{deletingUser.name}</span> ({deletingUser.email})?</p>
              <p className="mt-2 text-xs text-violet-600">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeletingUser(null)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
              <Button onClick={handleDelete} disabled={deleteUser.isPending} className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {deleteUser.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

// ─── Gamification & Certificates View ─────────────────────────────────────
function GamificationView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const { data: levelData } = useUserLevel();
  const { data: badgesData } = useUserBadges();
  const { data: leaderboardData } = useLeaderboard({ limit: 10 });
  const { data: schoolData } = useStudentSchoolDashboard();
  const { data: certData } = useMyCertificates();

  const level = (levelData as any)?.level;
  const totalXP = level?.totalXP ?? 0;
  const currentLevel = level?.level ?? 1;
  const progressPct = level?.progressToNextLevel ?? 0;

  // Combine earned badges with mock badge catalog
  const earnedBadges = (badgesData?.badges ?? []) as any[];
  const badges = [
    { id: 1, name: 'Quick Learner', icon: Zap, color: 'bg-violet-100 text-violet-600', earned: true, date: '2 days ago' },
    { id: 2, name: 'Quiz Master', icon: FileQuestion, color: 'bg-violet-100 text-violet-600', earned: true, date: '1 week ago' },
    { id: 3, name: 'Perfect Score', icon: Star, color: 'bg-violet-100 text-violet-600', earned: true, date: '3 days ago' },
    { id: 4, name: 'Course Completer', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600', earned: true, date: '2 weeks ago' },
    { id: 5, name: 'Discussion Pro', icon: MessageSquare, color: 'bg-blue-100 text-blue-600', earned: false, date: '' },
    { id: 6, name: '7-Day Streak', icon: Flame, color: 'bg-orange-100 text-orange-600', earned: true, date: 'Today' },
    { id: 7, name: 'Design Master', icon: Award, color: 'bg-pink-100 text-pink-600', earned: false, date: '' },
    { id: 8, name: 'Top 10', icon: Trophy, color: 'bg-yellow-100 text-yellow-600', earned: false, date: '' },
  ].map((b, i) => {
    const earned = i < earnedBadges.length;
    return { ...b, earned, date: earned ? (earnedBadges[i]?.awardedAt ? timeAgo(earnedBadges[i].awardedAt) : b.date) : '' };
  });

  const certificates = (certData?.data ?? certData?.certificates ?? []) as any[];
  const certList = certificates.length > 0 ? certificates.map((c: any) => ({
    id: c.id,
    title: c.course?.title ?? c.courseTitle ?? 'Course Certificate',
    issueDate: c.issuedAt ? formatDate(c.issuedAt) : '—',
    ref: c.certificateNumber ?? c.id,
    instructor: c.issuedBy?.firstName ? `${c.issuedBy.firstName} ${c.issuedBy.lastName}` : '—',
  })) : [
    { id: 1, title: 'UI Design Fundamentals', issueDate: 'Jun 15, 2024', ref: 'CERT-2024-0042', instructor: 'Sarah Chen' },
    { id: 2, title: 'Project Management Essentials', issueDate: 'May 28, 2024', ref: 'CERT-2024-0031', instructor: 'Emily Davis' },
  ];

  const leaderboard = (leaderboardData?.entries ?? []).map((e: any) => ({
    rank: e.rank,
    name: e.displayName,
    avatar: getInitials(e.displayName),
    xp: e.totalXP,
    level: e.level,
    courses: 0,
  }));
  const liveLeaderboard = leaderboard.length > 0 ? leaderboard : [
    { rank: 1, name: 'Sarah Chen', avatar: 'SC', xp: 4850, level: 12, courses: 8 },
    { rank: 2, name: 'Mike Rodriguez', avatar: 'MR', xp: 4120, level: 11, courses: 6 },
    { rank: 3, name: 'Emily Davis', avatar: 'ED', xp: 3890, level: 10, courses: 7 },
    { rank: 4, name: user ? `${user.firstName} ${user.lastName}` : 'You', avatar: user ? getInitials(`${user.firstName} ${user.lastName}`) : 'Y', xp: totalXP, level: currentLevel, courses: 0 },
    { rank: 5, name: 'Lisa Wang', avatar: 'LW', xp: 2980, level: 8, courses: 4 },
  ];

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Certificates & Achievements</span>
      </div>

      {/* XP + Level Card */}
      <Card className="mb-6 overflow-hidden border border-violet-100 bg-gradient-to-br from-violet-600 to-violet-500 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Trophy className="h-8 w-8 text-violet-300" />
            </div>
            <div>
              <p className="text-sm text-violet-100">Your Level</p>
              <p className="text-3xl font-bold text-white">Level {currentLevel}</p>
              <p className="text-xs text-violet-200">{totalXP.toLocaleString()} XP · {level?.nextLevelXP ? `${level.nextLevelXP - level.currentLevelXP} XP to Level ${currentLevel + 1}` : ''}</p>
            </div>
          </div>
          <div className="sm:w-64">
            <div className="mb-1.5 flex items-center justify-between text-xs text-violet-100">
              <span>Level {currentLevel}</span>
              <span>{Math.round(progressPct)}% to Level {currentLevel + 1}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-300 to-white" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Badges + Certificates */}
        <div className="space-y-6 lg:col-span-2">
          {/* Badges */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Badge Collection</h2>
                <p className="text-sm text-slate-500">{earnedCount} of {badges.length} badges earned</p>
              </div>
              <Medal className="h-5 w-5 text-violet-500" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badges.map((badge) => (
                <div key={badge.id} className={cn('flex flex-col items-center rounded-lg border p-4 text-center transition-all', badge.earned ? 'border-slate-200 bg-white hover:shadow-md' : 'border-dashed border-slate-200 bg-slate-50 opacity-60')}>
                  <div className={cn('mb-2 flex h-12 w-12 items-center justify-center rounded-full', badge.earned ? badge.color : 'bg-slate-200 text-slate-400')}>
                    <badge.icon className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-900">{badge.name}</p>
                  {badge.earned ? (
                    <p className="mt-0.5 text-[10px] text-slate-400">{badge.date}</p>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-slate-400">Not earned</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Certificates */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Certificates</h2>
                <p className="text-sm text-slate-500">{certificates.length} certificates earned</p>
              </div>
              <Award className="h-5 w-5 text-violet-500" />
            </div>
            <div className="space-y-3">
              {certList.map((cert) => (
                <div key={cert.id} className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:border-violet-200 hover:shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-500">
                    <BadgeCheck className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{cert.title}</p>
                    <p className="text-xs text-slate-500">Issued {cert.issueDate} · {cert.instructor}</p>
                    <p className="mt-0.5 text-[10px] font-mono text-slate-400">{cert.ref}</p>
                  </div>
                  <div className="flex gap-1">
                    {(cert as any).certificateUrl && (
                      <a href={(cert as any).certificateUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="border-slate-200 text-slate-600"><Download className="mr-1 h-3.5 w-3.5" />PDF</Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('verify-certificate')} className="text-violet-600 hover:bg-violet-50">Verify</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Leaderboard + Streaks */}
        <div className="space-y-6">
          {/* Learning Streak */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold text-slate-900">Learning Streak</h2>
            </div>
            <div className="flex items-center justify-center py-2">
              <div className="text-center">
                <p className="text-4xl font-bold text-orange-500">12</p>
                <p className="text-xs text-slate-500">days streak</p>
              </div>
            </div>
            <div className="mt-3 flex justify-center gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className={cn('h-6 w-3 rounded', i < 12 ? 'bg-orange-400' : 'bg-slate-100')} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Longest: 21 days</span>
              <span className="flex items-center gap-1"><Target className="h-3 w-3" />Goal: 30 days</span>
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Leaderboard</h2>
              <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">This Week</Badge>
            </div>
            <div className="space-y-1">
              {liveLeaderboard.map((learner) => (
                <div key={learner.rank} className={cn('flex items-center gap-3 rounded-lg px-2 py-2', learner.name === 'Ricky Fajrin' ? 'bg-violet-50' : 'hover:bg-slate-50')}>
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', learner.rank === 1 ? 'bg-violet-100 text-violet-700' : learner.rank === 2 ? 'bg-slate-200 text-slate-600' : learner.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400')}>
                    {learner.rank}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">{learner.avatar}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{learner.name}</p>
                    <p className="text-[10px] text-slate-400">Level {learner.level} · {learner.courses} courses</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-violet-600">{learner.xp.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

// ─── Course Creation Wizard View ──────────────────────────────────────────
function CourseCreateView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Design');
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [publishStatus, setPublishStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [formErr, setFormErr] = useState('');
  const [createdCourseId, setCreatedCourseId] = useState<string>('');

  const createCourse = useCreateCourse();

  const steps = [
    { num: 1, label: 'General Info' },
    { num: 2, label: 'Add Content' },
    { num: 3, label: 'Review & Publish' },
  ];

  const contentTypes = [
    { type: 'Page', icon: File, color: 'bg-blue-50 text-blue-600', desc: 'Rich text content with images, videos, and embeds' },
    { type: 'Video', icon: Video, color: 'bg-violet-50 text-violet-600', desc: 'Upload or embed video content' },
    { type: 'Quiz', icon: FileQuestion, color: 'bg-emerald-50 text-emerald-600', desc: 'Create quizzes with multiple question types' },
    { type: 'Assignment', icon: FileText, color: 'bg-violet-50 text-violet-600', desc: 'File upload or text-based assignments' },
    { type: 'Document', icon: File, color: 'bg-violet-50 text-violet-600', desc: 'Upload PDF, DOCX, or other documents' },
    { type: 'External Link', icon: Link2, color: 'bg-cyan-50 text-cyan-600', desc: 'Link to external resources' },
  ];

  const handleCreate = (status: 'DRAFT' | 'PUBLISHED') => {
    setFormErr('');
    if (!title.trim() || !description.trim()) {
      setFormErr('Title and description are required.');
      setStep(1);
      return;
    }
    createCourse.mutate(
      {
        title,
        description,
        category,
        difficulty,
        status,
      },
      {
        onSuccess: (data: any) => {
          setPublishStatus(status);
          setCreatedCourseId(data?.course?.id ?? data?.id ?? '');
        },
        onError: (err: any) => setFormErr(err.response?.data?.message || 'Failed to create course.'),
      },
    );
  };

  // Success screen after course is created
  if (createdCourseId) {
    return (
      <main className="mx-auto max-w-2xl p-4 lg:p-6">
        <Card className="border border-emerald-200 p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
            <h1 className="text-xl font-bold text-slate-900">Course {publishStatus === 'PUBLISHED' ? 'Published!' : 'Saved as Draft!'}</h1>
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{title}</span> has been {publishStatus === 'PUBLISHED' ? 'published and is now visible in the catalog' : 'saved as a draft'}. You can add modules and content to it from the course detail page.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => onNavigate('catalog')} className="border-slate-200 text-slate-600">Browse Catalog</Button>
              <Button onClick={() => onNavigate('dashboard')} className="bg-violet-600 text-white hover:bg-violet-700">Back to Dashboard</Button>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Create Course</span>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">Create New Course</h1>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors', step >= s.num ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-400')}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={cn('mt-1.5 text-xs font-medium', step >= s.num ? 'text-slate-900' : 'text-slate-400')}>{s.label}</span>
            </div>
            {idx < steps.length - 1 && <div className={cn('mx-2 h-0.5 w-12 sm:w-24', step > s.num ? 'bg-violet-600' : 'bg-slate-200')} />}
          </div>
        ))}
      </div>

      {/* Step 1: General Info */}
      {step === 1 && (
        <Card className="border border-slate-200 p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Course Information</h2>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-slate-700">Course Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Introduction to UI Design" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-slate-700">Description *</Label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Brief description of what students will learn..." className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Category</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-violet-500 focus:outline-none">
                  <option>Design</option><option>Programming</option><option>Business</option><option>Data Science</option><option>Marketing</option><option>General</option>
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Difficulty</Label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-violet-500 focus:outline-none">
                  <option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-slate-700">Thumbnail</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-6 hover:border-violet-300 hover:bg-slate-50">
                <Image className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-500">Upload thumbnail image</p>
                <p className="mt-1 text-xs text-slate-400">PNG, JPG up to 5MB · 16:9 recommended</p>
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
            {formErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{formErr}</div>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onNavigate('dashboard')} className="border-slate-200 text-slate-600">Cancel</Button>
            <Button onClick={() => setStep(2)} disabled={!title || !description} className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">Next: Add Content<ChevronRight className="ml-1.5 h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {/* Step 2: Add Content */}
      {step === 2 && (
        <Card className="border border-slate-200 p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Add Content</h2>
          <p className="mb-4 text-sm text-slate-500">You can add modules, lessons, quizzes, and assignments after the course is created. For now, just review the content types available.</p>

          <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3">
            <GripVertical className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-medium text-slate-700">Default Module 1: Introduction (auto-created)</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {contentTypes.map((ct) => (
              <div key={ct.type} className="flex cursor-not-allowed flex-col items-center rounded-lg border border-slate-200 p-4 text-center opacity-70">
                <div className={cn('mb-2 flex h-10 w-10 items-center justify-center rounded-lg', ct.color)}>
                  <ct.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-900">{ct.type}</p>
                <p className="mt-1 text-[10px] text-slate-400">{ct.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Content authoring will be available after the course is created — visit the course detail page to add modules and lessons.</p>

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="border-slate-200 text-slate-600"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button>
            <Button onClick={() => setStep(3)} className="bg-violet-600 text-white hover:bg-violet-700">Next: Review & Publish<ChevronRight className="ml-1.5 h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {/* Step 3: Review & Publish */}
      {step === 3 && (
        <Card className="border border-slate-200 p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Review & Publish</h2>
          <p className="mb-4 text-sm text-slate-500">Confirm the course details before publishing</p>

          <div className="space-y-3">
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Title</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{title || '—'}</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Description</p>
              <p className="mt-1 text-sm text-slate-700">{description || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Category</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{category}</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Difficulty</p>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{difficulty.toLowerCase()}</p>
              </div>
            </div>
          </div>

          {formErr && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{formErr}</div>}

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="border-slate-200 text-slate-600"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleCreate('DRAFT')} disabled={createCourse.isPending} className="border-slate-200 text-slate-600">
                {createCourse.isPending ? 'Saving…' : 'Save as Draft'}
              </Button>
              <Button onClick={() => handleCreate('PUBLISHED')} disabled={createCourse.isPending} className="bg-emerald-600 text-white hover:bg-emerald-700">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />{createCourse.isPending ? 'Publishing…' : 'Publish Course'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </main>
  );
}

// ─── Settings View ───────────────────────────────────────────────────────
function SettingsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [activeTab, setActiveTab] = useState('general');
  const { data: settingsData } = useSettings();
  const batchUpdate = useBatchUpdateSettings();
  const enableMaintenance = useEnableMaintenance();
  const disableMaintenance = useDisableMaintenance();
  const { data: maintenanceStatus } = useMaintenanceStatus();
  const settings = (settingsData?.settings ?? []) as any[];
  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value ?? '';
  const [siteName, setSiteName] = useState(getSetting('siteName') || 'Trenning LMS');
  const [supportEmail, setSupportEmail] = useState(getSetting('supportEmail') || 'support@trenning.com');
  const [allowReg, setAllowReg] = useState(getSetting('allowRegistration') ?? true);
  const [maintMode, setMaintMode] = useState(false);
  const [maintMsg, setMaintMsg] = useState('Platform under maintenance.');
  const [saveStatus, setSaveStatus] = useState<{ type: 'idle' | 'success' | 'error'; msg?: string }>({ type: 'idle' });

  // Keep form state in sync once settings load
  useEffect(() => {
    setSiteName(getSetting('siteName') || 'Trenning LMS');
    setSupportEmail(getSetting('supportEmail') || 'support@trenning.com');
    setAllowReg(getSetting('allowRegistration') ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsData]);

  const handleSaveGeneral = () => {
    setSaveStatus({ type: 'idle' });
    batchUpdate.mutate(
      [
        { key: 'siteName', value: siteName, category: 'general' },
        { key: 'supportEmail', value: supportEmail, category: 'general' },
        { key: 'allowRegistration', value: allowReg, category: 'auth' },
      ],
      {
        onSuccess: () => setSaveStatus({ type: 'success', msg: 'Settings saved successfully.' }),
        onError: (err: any) => setSaveStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to save settings.' }),
      },
    );
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email Templates', icon: Mail },
    { id: 'grading', label: 'Grading Scales', icon: Award },
    { id: 'academic', label: 'Academic Years', icon: Calendar },
    { id: 'maintenance', label: 'Maintenance', icon: AlertCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const emailTemplates = [
    { type: 'WELCOME', subject: 'Welcome to {{siteName}}', active: true },
    { type: 'PASSWORD_RESET', subject: 'Reset your password', active: true },
    { type: 'ASSIGNMENT_GRADED', subject: 'Assignment graded: {{title}}', active: true },
    { type: 'QUIZ_GRADED', subject: 'Quiz results: {{title}}', active: true },
    { type: 'COURSE_COMPLETED', subject: 'Congratulations! {{title}}', active: true },
    { type: 'ANNOUNCEMENT', subject: '{{title}}', active: true },
  ];

  const gradingScales = [
    { name: 'Standard A-F', type: 'percentage', isDefault: true, grades: 'A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)' },
    { name: 'GPA 4.0 Scale', type: 'gpa', isDefault: false, grades: 'A (4.0), B (3.0), C (2.0), D (1.0), F (0.0)' },
  ];

  const academicYears = [
    { name: '2025-2026', start: 'Sep 2025', end: 'Jun 2026', current: true, status: 'Active' },
    { name: '2024-2025', start: 'Sep 2024', end: 'Jun 2025', current: false, status: 'Archived' },
  ];

  return (
    <main className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Settings</span>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">Platform Settings</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        {/* Tab Sidebar */}
        <div className="sm:col-span-1">
          <Card className="border border-slate-200 p-2 shadow-sm">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </Card>
        </div>

        {/* Tab Content */}
        <div className="sm:col-span-3">
          {activeTab === 'general' && (
            <Card className="border border-slate-200 p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">General Settings</h2>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700">Site Name</Label>
                  <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700">Support Email</Label>
                  <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Allow Self-Registration</p>
                    <p className="text-xs text-slate-500">Allow new users to create accounts</p>
                  </div>
                  <button onClick={() => setAllowReg(!allowReg)} className={cn('relative h-6 w-11 rounded-full transition-colors', allowReg ? 'bg-violet-600' : 'bg-slate-300')}>
                    <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', allowReg ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </div>
                {saveStatus.type === 'success' && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{saveStatus.msg}</div>
                )}
                {saveStatus.type === 'error' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{saveStatus.msg}</div>
                )}
                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={batchUpdate.isPending} className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                    {batchUpdate.isPending ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'email' && (
            <Card className="border border-slate-200 p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Email Templates</h2>
              <div className="space-y-2">
                {emailTemplates.map((tpl) => (
                  <div key={tpl.type} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50"><Mail className="h-4 w-4 text-violet-600" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{tpl.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-400">{tpl.subject}</p>
                    </div>
                    <Badge className={cn('rounded-full', tpl.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                      {tpl.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <button onClick={() => {
                      import('@/lib/api').then(async ({ default: api }) => {
                        try {
                          const res = await api.get(`/email-templates/${tpl.type}`);
                          const template = res.data?.template ?? res.data;
                          const newSubject = prompt(`Edit subject for ${tpl.type.replace(/_/g, ' ')}:`, template?.subject ?? tpl.subject);
                          if (newSubject && newSubject !== (template?.subject ?? tpl.subject)) {
                            await api.patch(`/email-templates/${tpl.type}`, { subject: newSubject });
                            toast({ title: 'Template updated', description: 'Refresh the page to see changes.' });
                          }
                        } catch (err: any) {
                          toast({ title: 'Error', description: err.response?.data?.message || err.message, variant: 'destructive' });
                        }
                      });
                    }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600"><Edit className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'grading' && (
            <Card className="border border-slate-200 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Grading Scales</h2>
                <Button size="sm" onClick={() => {
                  const name = prompt('Enter grading scale name (e.g., "Standard A-F"):');
                  if (!name) return;
                  import('@/lib/api').then(async ({ default: api }) => {
                    try {
                      await api.post('/grading-scales', { name, type: 'PERCENTAGE', grades: [{ letter: 'A', minPercentage: 90 }, { letter: 'B', minPercentage: 80 }, { letter: 'C', minPercentage: 70 }, { letter: 'D', minPercentage: 60 }, { letter: 'F', minPercentage: 0 }] });
                      toast({ title: 'Grading scale created' });
                    } catch (err: any) { toast({ title: 'Error', description: err.response?.data?.message || err.message, variant: 'destructive' }); }
                  });
                }} className="bg-violet-600 text-white hover:bg-violet-700"><Plus className="mr-1 h-3.5 w-3.5" />Add Scale</Button>
              </div>
              <div className="space-y-3">
                {gradingScales.map((scale) => (
                  <div key={scale.name} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{scale.name}</p>
                        {scale.isDefault && <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">Default</Badge>}
                      </div>
                      <Badge className="bg-slate-100 text-slate-500">{scale.type}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{scale.grades}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'academic' && (
            <Card className="border border-slate-200 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Academic Years</h2>
                <Button size="sm" onClick={() => {
                  const name = prompt('Enter academic year name (e.g., "2026-2027"):');
                  if (!name) return;
                  const start = prompt('Start date (YYYY-MM-DD):', '2026-09-01');
                  if (!start) return;
                  const end = prompt('End date (YYYY-MM-DD):', '2027-06-30');
                  if (!end) return;
                  import('@/lib/api').then(async ({ default: api }) => {
                    try {
                      await api.post('/academic-years', { name, startDate: start, endDate: end });
                      toast({ title: 'Academic year created' });
                    } catch (err: any) { toast({ title: 'Error', description: err.response?.data?.message || err.message, variant: 'destructive' }); }
                  });
                }} className="bg-violet-600 text-white hover:bg-violet-700"><Plus className="mr-1 h-3.5 w-3.5" />Add Year</Button>
              </div>
              <div className="space-y-2">
                {academicYears.map((year) => (
                  <div key={year.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{year.name}</p>
                        {year.current && <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">Current</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{year.start} — {year.end}</p>
                    </div>
                    <Badge className={cn('rounded-full', year.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>{year.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'maintenance' && (
            <Card className="border border-slate-200 p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Maintenance Mode</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Enable Maintenance Mode</p>
                    <p className="text-xs text-slate-500">Block all non-admin access to the platform</p>
                  </div>
                  <button onClick={() => setMaintMode(!maintMode)} className={cn('relative h-6 w-11 rounded-full transition-colors', maintMode ? 'bg-red-500' : 'bg-slate-300')}>
                    <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', maintMode ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700">Maintenance Message</Label>
                  <textarea value={maintMsg} onChange={(e) => setMaintMsg(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                </div>
                <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-violet-600" />
                    <p className="text-xs text-violet-700">When enabled, only whitelisted IPs can access the platform. All other users see the maintenance message.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => {
                    if (maintMode) {
                      enableMaintenance.mutate({ message: maintMsg });
                    } else {
                      disableMaintenance.mutate();
                    }
                  }} disabled={enableMaintenance.isPending || disableMaintenance.isPending} className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                    {enableMaintenance.isPending || disableMaintenance.isPending ? 'Saving…' : 'Save Settings'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && <NotificationPreferencesTab />}
        </div>
      </div>
    </main>
  );
}

// ─── Notification Preferences Tab ────────────────────────────────────────
function NotificationPreferencesTab() {
  const { data: prefsData, isLoading } = useNotificationPreferences();
  const updatePref = useUpdateNotificationPreference();
  const [saveStatus, setSaveStatus] = useState<{ type: 'idle' | 'success' | 'error'; msg?: string }>({ type: 'idle' });

  // Preferences come as an array of { type, channel, enabled, quietHoursStart, quietHoursEnd }
  const prefs = (prefsData?.data ?? prefsData?.preferences ?? []) as any[];

  const notificationTypes = [
    { type: 'ASSIGNMENT_GRADED', label: 'Assignment Graded', desc: 'When your assignment is graded' },
    { type: 'QUIZ_GRADED', label: 'Quiz Graded', desc: 'When your quiz attempt is graded' },
    { type: 'ASSIGNMENT_POSTED', label: 'Assignment Posted', desc: 'When a new assignment is created' },
    { type: 'ASSIGNMENT_DUE', label: 'Assignment Due Soon', desc: 'Before an assignment is due' },
    { type: 'COURSE_COMPLETED', label: 'Course Completed', desc: 'When you complete a course' },
    { type: 'DISCUSSION_REPLY', label: 'Discussion Reply', desc: 'When someone replies to your discussion' },
    { type: 'ANNOUNCEMENT', label: 'Announcements', desc: 'New platform announcements' },
    { type: 'PEER_REVIEW_ASSIGNED', label: 'Peer Review Assigned', desc: 'When you are assigned to review a peer' },
    { type: 'REVISION_REQUESTED', label: 'Revision Requested', desc: 'When a teacher requests a revision' },
    { type: 'ENROLLMENT', label: 'Enrollment Confirmation', desc: 'When you are enrolled in a course' },
    { type: 'MENTION', label: 'Mentions', desc: 'When you are @mentioned' },
  ];

  const getPref = (type: string, channel: string) => prefs.find((p: any) => p.type === type && p.channel === channel);
  const isEnabled = (type: string, channel: string) => {
    const p = getPref(type, channel);
    // If no preference is set, default to enabled for IN_APP and EMAIL
    if (!p) return channel === 'IN_APP' || channel === 'EMAIL';
    return p.enabled;
  };

  const handleToggle = (type: string, channel: 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS', enabled: boolean) => {
    setSaveStatus({ type: 'idle' });
    updatePref.mutate(
      { type, channel, enabled },
      {
        onSuccess: () => setSaveStatus({ type: 'success', msg: 'Preference updated.' }),
        onError: (err: any) => setSaveStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to update.' }),
      },
    );
  };

  if (isLoading) {
    return <Card className="border border-slate-200 p-6 shadow-sm"><div className="text-center text-sm text-slate-500">Loading notification preferences…</div></Card>;
  }

  return (
    <Card className="border border-slate-200 p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Notification Preferences</h2>
        <p className="text-sm text-slate-500">Choose how you want to be notified for each event type</p>
      </div>

      {saveStatus.type === 'success' && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{saveStatus.msg}</div>
      )}
      {saveStatus.type === 'error' && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{saveStatus.msg}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="pb-3 pr-4 text-left font-medium">Event</th>
              <th className="pb-3 px-3 text-center font-medium">In-App</th>
              <th className="pb-3 px-3 text-center font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {notificationTypes.map((nt) => (
              <tr key={nt.type} className="border-b border-slate-100">
                <td className="py-3 pr-4">
                  <p className="font-medium text-slate-900">{nt.label}</p>
                  <p className="text-xs text-slate-400">{nt.desc}</p>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => handleToggle(nt.type, 'IN_APP', !isEnabled(nt.type, 'IN_APP'))}
                    className={cn('relative h-6 w-11 rounded-full transition-colors', isEnabled(nt.type, 'IN_APP') ? 'bg-violet-600' : 'bg-slate-300')}
                  >
                    <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', isEnabled(nt.type, 'IN_APP') ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => handleToggle(nt.type, 'EMAIL', !isEnabled(nt.type, 'EMAIL'))}
                    className={cn('relative h-6 w-11 rounded-full transition-colors', isEnabled(nt.type, 'EMAIL') ? 'bg-violet-600' : 'bg-slate-300')}
                  >
                    <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', isEnabled(nt.type, 'EMAIL') ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600" />
          <p className="text-xs text-blue-700">In-App notifications appear in the bell icon dropdown. Email notifications are sent to your registered email address. Changes save automatically.</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Messages View ───────────────────────────────────────────────────────
function MessagesView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [activeChat, setActiveChat] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const { data: convData } = useConversations();
  const { data: msgData } = useMessages(activeChat || null);
  const sendMutation = useSendMessage();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const conversations = (convData?.conversations ?? []).map((c: any) => ({
    id: c.id ?? c.groupId ?? c.userId,
    name: c.displayName ?? c.name ?? (c.otherUser ? `${c.otherUser.firstName} ${c.otherUser.lastName}` : 'Conversation'),
    avatar: c.displayName ? getInitials(c.displayName) : (c.otherUser ? getInitials(`${c.otherUser.firstName} ${c.otherUser.lastName}`) : 'C'),
    role: c.type ?? 'Direct',
    lastMsg: c.lastMessage?.content ?? c.lastMessage ?? '',
    time: c.lastMessage?.createdAt ? timeAgo(c.lastMessage.createdAt) : (c.updatedAt ? timeAgo(c.updatedAt) : ''),
    unread: c.unreadCount ?? 0,
    online: false,
  }));
  // Fallback mock conversations if API returns none
  const allConversations = conversations.length > 0 ? conversations : [
    { id: 'mock-1', name: 'Sarah Chen', avatar: 'SC', role: 'Teacher', lastMsg: 'Sure, I can help with that assignment', time: '2m ago', unread: 2, online: true },
    { id: 'mock-2', name: 'Mike Rodriguez', avatar: 'MR', role: 'Teacher', lastMsg: 'The quiz is due tomorrow', time: '1h ago', unread: 0, online: true },
    { id: 'mock-3', name: 'Emily Davis', avatar: 'ED', role: 'Student', lastMsg: 'Did you finish the wireframe?', time: '3h ago', unread: 1, online: false },
    { id: 'mock-4', name: 'Design Team', avatar: 'DT', role: 'Group', lastMsg: 'James: Great work everyone!', time: '1d ago', unread: 0, online: false },
    { id: 'mock-5', name: 'Lisa Wang', avatar: 'LW', role: 'Student', lastMsg: 'Thanks for the feedback!', time: '2d ago', unread: 0, online: false },
  ];
  const activeChatId = activeChat || (allConversations[0]?.id ?? '');
  const activeConv = allConversations.find(c => c.id === activeChatId);

  const apiMessages = (msgData?.messages ?? msgData?.data ?? []) as any[];
  const messages = apiMessages.map((m: any) => ({
    id: m.id,
    sender: m.sender?.firstName ? `${m.sender.firstName} ${m.sender.lastName}` : 'Them',
    text: m.content,
    time: m.createdAt ? timeAgo(m.createdAt) : '',
    isMe: m.isMine ?? false,
  }));
  // Fallback mock messages
  const allMessages = messages.length > 0 ? messages : [
    { id: 1, sender: activeConv?.name ?? 'Sarah Chen', text: "Hi! How's the assignment going?", time: '10:30 AM', isMe: false },
    { id: 2, sender: 'Me', text: "I'm working on it now. I have a question.", time: '10:32 AM', isMe: true },
    { id: 3, sender: activeConv?.name ?? 'Sarah Chen', text: 'Sure, what do you need help with?', time: '10:33 AM', isMe: false },
  ];

  // --- Socket.io real-time subscriptions ---
  useEffect(() => {
    let socket: any = null;
    let cancelled = false;
    (async () => {
      const { getSocket } = await import('@/lib/socket');
      socket = getSocket();
      if (!socket || cancelled) return;
      // Listen for incoming messages — invalidate the active chat query so it refetches
      const onMessage = (msg: any) => {
        // If the message belongs to the active chat, refetch
        const msgGroupId = msg?.groupId ?? msg?.conversationId;
        const msgSenderId = msg?.senderId ?? msg?.sender?.id;
        if (msgGroupId === activeChatId || msgSenderId) {
          queryClient.invalidateQueries({ queryKey: ['messages', activeChatId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      };
      const onTyping = (data: any) => {
        if (data?.groupId === activeChatId && data?.isTyping) {
          setRemoteTyping(true);
          // Auto-clear after 3s of no further events
          setTimeout(() => setRemoteTyping(false), 3000);
        } else if (data?.groupId === activeChatId && !data?.isTyping) {
          setRemoteTyping(false);
        }
      };
      socket.on('message', onMessage);
      socket.on('typing', onTyping);
      // Join the active conversation's room if it's a real (non-mock) ID
      if (activeChatId && !activeChatId.startsWith('mock')) {
        socket.emit('join', activeChatId);
      }
      return () => {
        socket.off('message', onMessage);
        socket.off('typing', onTyping);
        if (activeChatId && !activeChatId.startsWith('mock')) {
          socket.emit('leave', activeChatId);
        }
      };
    })();
    return () => {
      cancelled = true;
    };
  }, [activeChatId, queryClient]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate({
      content: message,
      receiverId: activeConv?.id?.startsWith('mock') ? undefined : activeConv?.id,
      groupId: activeConv?.id?.startsWith('mock') ? undefined : activeConv?.id,
    });
    setMessage('');
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  // Emit typing event when the user types
  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    // Emit typing indicator to the active group (best-effort, ignore errors)
    if (activeChatId && !activeChatId.startsWith('mock')) {
      import('@/lib/socket').then(({ getSocket }) => {
        const sock = getSocket();
        sock?.emit('typing', { groupId: activeChatId, isTyping: e.target.value.length > 0 });
      }).catch(() => {});
    }
  };

  return (
    <main className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversations List */}
      <div className="hidden w-72 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-200 p-4">
          <h1 className="text-lg font-bold text-slate-900">Messages</h1>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search conversations..." className="pl-10 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {allConversations.map((conv) => (
            <button key={conv.id} onClick={() => setActiveChat(conv.id)} className={cn('flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition-colors', activeChatId === conv.id ? 'bg-violet-50' : 'hover:bg-slate-50')}>
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">{conv.avatar}</div>
                {conv.online && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-semibold text-slate-900">{conv.name}</p>
                  <span className="ml-1 shrink-0 text-[10px] text-slate-400">{conv.time}</span>
                </div>
                <p className="text-[10px] text-slate-400">{conv.role}</p>
                <div className="mt-0.5 flex items-center justify-between">
                  <p className="truncate text-xs text-slate-500">{conv.lastMsg}</p>
                  {conv.unread > 0 && <span className="ml-1 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">{conv.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button onClick={() => onNavigate('dashboard')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 md:hidden"><ArrowLeft className="h-5 w-5" /></button>
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">{activeConv?.avatar}</div>
            {activeConv?.online && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">{activeConv?.name}</p>
            <p className="text-xs text-emerald-600">{activeConv?.online ? 'Online' : 'Offline'}</p>
          </div>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-2xl space-y-3">
            {allMessages.map((msg) => (
              <div key={msg.id} className={cn('flex', msg.isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm', msg.isMe ? 'rounded-br-md bg-violet-600 text-white' : 'rounded-bl-md bg-white text-slate-700 border border-slate-200')}>
                  <p>{msg.text}</p>
                  <p className={cn('mt-1 text-[10px]', msg.isMe ? 'text-violet-200' : 'text-slate-400')}>{msg.time}</p>
                </div>
              </div>
            ))}
            {(remoteTyping || isTyping) && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 border border-slate-200">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Plus className="h-5 w-5" /></button>
            <input
              type="text"
              value={message}
              onChange={handleType}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button onClick={handleSend} disabled={!message.trim()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:opacity-50">
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────
function ProfileView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const authUser = useAuthStore((s) => s.user);
  const { data: profile } = useMyProfile();
  const { data: levelData } = useUserLevel();
  const { data: studentData } = useStudentDashboard();
  const { data: badgesData } = useUserBadges();
  const { data: certificatesData } = useMyCertificates();
  const { data: streakData } = useStreak();
  const { data: xpHistoryData } = useXPHistory(15);
  const updateProfile = useUpdateMyProfile();
  const updateUserStore = useAuthStore((s) => s.updateUser);

  const me = profile ?? authUser;
  const level = (levelData as any)?.level;
  const totalXP = level?.totalXP ?? 0;
  const currentLevel = level?.level ?? 1;

  const fullName = me ? `${me.firstName} ${me.lastName}` : 'Guest';
  const initials = me ? getInitials(fullName) : 'G';
  const joinedDate = me?.createdAt ? formatDate(me.createdAt) : (me?.lastLogin ? formatDate(me.lastLogin) : '—');
  const roleLabel = me?.role ? me.role.toLowerCase() : 'member';

  // Edit profile state
  const [showEdit, setShowEdit] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const changePasswordMut = useChangePassword();
  const [editFirst, setEditFirst] = useState(me?.firstName ?? '');
  const [editLast, setEditLast] = useState(me?.lastName ?? '');
  const [editBio, setEditBio] = useState((me as any)?.bio ?? '');
  const [editErr, setEditErr] = useState('');

  // Sync edit form when profile loads
  useEffect(() => {
    if (me) {
      setEditFirst(me.firstName ?? '');
      setEditLast(me.lastName ?? '');
      setEditBio((me as any)?.bio ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleSaveProfile = () => {
    setEditErr('');
    if (!editFirst.trim() || !editLast.trim()) {
      setEditErr('First name and last name are required.');
      return;
    }
    updateProfile.mutate(
      { firstName: editFirst, lastName: editLast, bio: editBio },
      {
        onSuccess: (data: any) => {
          const updated = data?.user ?? data;
          if (updated) {
            updateUserStore({ firstName: updated.firstName, lastName: updated.lastName });
          }
          setShowEdit(false);
          toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
        },
        onError: (err: any) => { setEditErr(err.response?.data?.message || 'Failed to update profile.'); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update profile.', variant: 'destructive' }); },
      },
    );
  };

  const myCourses = (studentData?.courses ?? []).map((c: any) => ({
    title: c.course?.title ?? 'Untitled',
    progress: c.progressPercentage ?? 0,
    instructor: c.course?.createdBy ? `${c.course.createdBy.firstName} ${c.course.createdBy.lastName}` : '—',
    difficulty: c.course?.difficulty ? c.course.difficulty.charAt(0) + c.course.difficulty.slice(1).toLowerCase() : 'Beginner',
  }));
  const courses = myCourses;

  const earnedBadges = ((badgesData as any)?.badges ?? []).filter((b: any) => b.earnedAt);
  const certificates = ((certificatesData as any)?.certificates ?? (certificatesData as any)?.data ?? []);
  const streak = (streakData as any)?.streak;
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? currentStreak;

  const achievements = [
    { icon: Trophy, label: `Level ${currentLevel}`, sublabel: `${totalXP.toLocaleString()} XP`, color: 'bg-violet-50 text-violet-600' },
    { icon: Flame, label: `${currentStreak}-day streak`, sublabel: longestStreak > 0 ? `Longest: ${longestStreak} days` : 'Start learning today!', color: 'bg-orange-50 text-orange-600' },
    { icon: BookOpen, label: `${studentData?.stats?.enrollments?.total ?? 0} courses`, sublabel: `${studentData?.stats?.enrollments?.active ?? 0} in progress`, color: 'bg-violet-50 text-violet-600' },
    { icon: Award, label: `${certificates.length} certificates`, sublabel: certificates.length > 0 ? 'Earned' : 'None yet', color: 'bg-emerald-50 text-emerald-600' },
  ];

  const xpTransactions = ((xpHistoryData as any)?.transactions ?? (xpHistoryData as any)?.data ?? []);

  const activity = xpTransactions.map((tx: any) => ({
    type: 'xp',
    title: `${tx.source?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Activity'}: ${tx.points > 0 ? '+' : ''}${tx.points} XP`,
    time: tx.createdAt ? timeAgo(tx.createdAt) : '',
    icon: tx.points > 0 ? Zap : AlertCircle,
    color: tx.points > 0 ? 'text-violet-600' : 'text-red-500',
  }));

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'My Courses' },
    { id: 'activity', label: 'Activity' },
    { id: 'badges', label: 'Badges' },
  ];

  return (
    <main className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">My Profile</span>
      </div>

      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden border border-slate-200 shadow-sm rounded-xl">
        <div className="h-28 bg-gradient-to-r from-violet-600 to-violet-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-violet-100 text-2xl font-bold text-violet-600 shadow-lg">{initials}</div>
              <div className="pb-2">
                <h1 className="text-xl font-bold text-slate-900">{fullName}</h1>
                <p className="text-sm capitalize text-slate-500">{roleLabel} · Joined {joinedDate}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50"><Trophy className="mr-1 h-3 w-3" />Level {currentLevel}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50"><Flame className="mr-1 h-3 w-3" />{currentStreak}-day streak</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowChangePassword(true)} variant="outline" className="border-slate-200 text-slate-600"><Lock className="mr-1.5 h-4 w-4" />Change Password</Button>
              <Button onClick={() => setShowEdit(true)} variant="outline" className="border-slate-200 text-slate-600"><Edit className="mr-1.5 h-4 w-4" />Edit Profile</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Achievement Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {achievements.map((ach) => (
          <Card key={ach.label} className="border border-slate-200 p-4 shadow-sm">
            <div className={cn('mb-2 flex h-10 w-10 items-center justify-center rounded-lg', ach.color)}>
              <ach.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-slate-900">{ach.label}</p>
            <p className="text-xs text-slate-400">{ach.sublabel}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', activeTab === tab.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-900">About</h2>
            <p className="text-sm text-slate-600">{(me as any)?.bio || `No bio yet. Click "Edit Profile" to add one.`}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-500"><Mail className="h-4 w-4 text-slate-400" />{me?.email ?? '—'}</div>
              <div className="flex items-center gap-2 text-slate-500"><BookOpen className="h-4 w-4 text-slate-400" />{studentData?.stats?.enrollments?.total ?? 0} enrolled courses</div>
              <div className="flex items-center gap-2 text-slate-500"><Award className="h-4 w-4 text-slate-400" />{certificates.length} certificates earned</div>
            </div>
          </Card>
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Recent Activity</h2>
            <div className="space-y-3">
              {activity.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">No recent activity yet.</p>
              )}
              {activity.slice(0, 4).map((act, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50', act.color)}>
                    <act.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">{act.title}</p>
                    <p className="text-xs text-slate-400">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-3">
          {courses.length === 0 && (
            <Card className="border border-dashed border-slate-300 p-8 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-700">No courses yet</h3>
              <p className="mt-1 text-sm text-slate-500">You haven't enrolled in any courses yet.</p>
            </Card>
          )}
          {courses.map((course) => (
            <Card key={course.title} className="border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-400">{course.instructor} · {course.difficulty}</p>
                </div>
                <div className="ml-4 w-32">
                  <div className="mb-1 flex items-center justify-between text-xs"><span className="text-slate-400">Progress</span><span className="font-semibold text-slate-700">{course.progress}%</span></div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${course.progress}%` }} /></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
          <div className="space-y-4">
            {activity.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No recent activity. Start learning to earn XP!</p>
            )}
            {activity.map((act, idx) => (
              <div key={idx} className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50', act.color)}>
                  <act.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{act.title}</p>
                  <p className="text-xs text-slate-400">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(() => {
            const allBadges = (badgesData as any)?.badges ?? (badgesData as any)?.data ?? [];
            if (allBadges.length === 0) {
              return <div className="col-span-full py-12 text-center text-sm text-slate-400">No badges available yet. Complete courses and quizzes to earn badges!</div>;
            }
            return allBadges.map((badge: any) => {
              const earned = !!badge.earnedAt;
              return (
            <Card key={badge.id ?? badge.name} className={cn('flex flex-col items-center p-4 text-center border shadow-sm', earned ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-60')}>
              <div className={cn('mb-2 flex h-12 w-12 items-center justify-center rounded-full', earned ? 'bg-violet-50 text-violet-600' : 'bg-slate-200 text-slate-400')}>
                {badge.iconUrl ? <img src={badge.iconUrl} alt={badge.name} className="h-6 w-6" /> : <Award className="h-6 w-6" />}
              </div>
              <p className="text-xs font-medium text-slate-900">{badge.name}</p>
              <p className="text-[10px] text-slate-400">{earned ? 'Earned' : 'Locked'}</p>
              {badge.description && <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">{badge.description}</p>}
            </Card>
              );
            });
          })()}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
              <button onClick={() => setShowEdit(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700">First Name</Label>
                  <Input value={editFirst} onChange={(e) => setEditFirst(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700">Last Name</Label>
                  <Input value={editLast} onChange={(e) => setEditLast(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Bio</Label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              {editErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{editErr}</div>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                  {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
              <button onClick={() => { setShowChangePassword(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setPwError(''); setPwSuccess(''); }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Current Password</Label>
                <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter your current password" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
              </div>
              {pwError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{pwError}</div>}
              {pwSuccess && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{pwSuccess}</div>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => { setShowChangePassword(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setPwError(''); setPwSuccess(''); }} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button
                  onClick={() => {
                    setPwError(''); setPwSuccess('');
                    if (!oldPassword || !newPassword || !confirmPassword) { setPwError('All fields are required.'); return; }
                    if (newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
                    if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return; }
                    changePasswordMut.mutate(
                      { oldPassword, newPassword },
                      {
                        onSuccess: () => {
                          setPwSuccess('Password changed successfully!');
                          setOldPassword(''); setNewPassword(''); setConfirmPassword('');
                          setTimeout(() => { setShowChangePassword(false); setPwSuccess(''); }, 2000);
                        },
                        onError: (err: any) => setPwError(err.response?.data?.message || 'Failed to change password.'),
                      },
                    );
                  }}
                  disabled={changePasswordMut.isPending}
                  className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {changePasswordMut.isPending ? 'Changing…' : 'Change Password'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

// ─── AI Assistant Sidebar (Trenning-inspired) ─────────────────────────────
function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const authUser = useAuthStore((s) => s.user);
  const firstName = authUser?.firstName ?? 'there';

  const quickActions = [
    { label: 'Summarize my progress', desc: 'Get an overview of your learning' },
    { label: 'What should I learn next?', desc: 'Get personalized recommendations' },
    { label: 'Explain a concept', desc: 'Ask about any topic you\'re studying' },
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, text: input };
    setMessages([...messages, userMsg]);
    setInput('');
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: 'I\'m your AI learning assistant. This feature will be connected to an AI backend to help you with your studies. For now, you can explore your dashboard, courses, and quizzes!' }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
          title="AI Assistant"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[500px] w-80 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-violet-50 to-blue-50 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-violet-100 bg-white/50 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
                <p className="text-[10px] text-slate-500">Your learning companion</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages or quick actions */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-sm text-slate-700">Hi {firstName}! I\'m your AI learning assistant. How can I help you today?</p>
                </div>
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => { setInput(action.label); }}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-violet-200 hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-500">{action.desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[85%] rounded-xl p-3 text-sm',
                      msg.role === 'user' ? 'bg-violet-500 text-white' : 'bg-white text-slate-700 shadow-sm'
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-violet-100 bg-white/50 p-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder="Ask me anything..."
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 text-white transition-all hover:bg-violet-600 disabled:opacity-50"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const userRole = (authUser?.role ?? 'STUDENT') as Role;
  const [view, setView] = useState<View>(isAuthenticated ? 'dashboard' : 'login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string>('');
  const [lastAttemptId, setLastAttemptId] = useState<string>('');

  // Role-based access control map: which views require which roles
  const viewRoles: Partial<Record<View, Role[]>> = {
    'admin': ['ADMIN'],
    'audit': ['ADMIN'],
    'users': ['ADMIN'],
    'settings': ['ADMIN'],
    'course-create': ['TEACHER'],
    'my-courses': ['TEACHER'],
    'academic-management': ['ADMIN'],
  };

  const handleNavigate = (v: View) => {
    // Guard: if the view requires specific roles and the user doesn't have one, redirect to dashboard
    const requiredRoles = viewRoles[v];
    if (requiredRoles && !requiredRoles.includes(userRole)) {
      setView('dashboard');
      setSidebarOpen(false);
      window.scrollTo(0, 0);
      return;
    }
    // Clear selected IDs when navigating to list views so we don't show a stale detail view
    if (v === 'quiz') setSelectedQuizId('');
    if (v === 'assignment') setSelectedAssignmentId('');
    if (v === 'discussions') setSelectedDiscussionId('');
    if (v === 'catalog') setSelectedCourseId('');
    setView(v);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleSelectCourse = (id: string) => {
    setSelectedCourseId(id);
    setView('course-detail');
    window.scrollTo(0, 0);
  };

  const handleSelectQuiz = (id: string) => {
    setSelectedQuizId(id);
    setView('quiz');
    window.scrollTo(0, 0);
  };

  const handleSelectAssignment = (id: string) => {
    setSelectedAssignmentId(id);
    setView('assignment');
    window.scrollTo(0, 0);
  };

  const handleSelectDiscussion = (id: string) => {
    setSelectedDiscussionId(id);
    setView('discussion-detail');
    window.scrollTo(0, 0);
  };

  const handleQuizSubmitted = (attemptId: string) => {
    setLastAttemptId(attemptId);
    setView('quiz-results');
    window.scrollTo(0, 0);
  };

  // Verify certificate view — public, no auth required
  if (view === 'verify-certificate') {
    return <CertificateVerificationView onNavigate={handleNavigate} />;
  }

  // Login view — no sidebar/header
  if (view === 'login' || !isAuthenticated) {
    return <LoginPage onLogin={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
  }

  // Role guard: if current view requires a role the user doesn't have, redirect to dashboard
  const currentViewRoles = viewRoles[view];
  if (currentViewRoles && !currentViewRoles.includes(userRole)) {
    setView('dashboard');
  }

  // All other views — with sidebar + header
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentView={view} onNavigate={handleNavigate} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-16" : "lg:pl-60")}>
        <Header onMenuClick={() => setSidebarOpen(true)} onNavigate={handleNavigate} currentView={view} onSelectCourse={handleSelectCourse} />
        {view === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {view === 'catalog' && <CatalogView onSelectCourse={handleSelectCourse} onNavigate={handleNavigate} />}
        {view === 'my-courses' && <MyCoursesView onSelectCourse={handleSelectCourse} onNavigate={handleNavigate} />}
        {view === 'my-sections' && <MySectionsView onNavigate={handleNavigate} />}
        {view === 'academic-management' && <AcademicManagementView onNavigate={handleNavigate} />}
        {view === 'course-detail' && <CourseDetailView courseId={selectedCourseId} onNavigate={handleNavigate} onSelectQuiz={handleSelectQuiz} onSelectAssignment={handleSelectAssignment} />}
        {view === 'quiz' && <QuizView quizId={selectedQuizId} onNavigate={handleNavigate} onSelectQuiz={handleSelectQuiz} onSubmitted={handleQuizSubmitted} />}
        {view === 'quiz-results' && <QuizResultsView attemptId={lastAttemptId} onNavigate={handleNavigate} />}
        {view === 'assignment' && <AssignmentView assignmentId={selectedAssignmentId} onNavigate={handleNavigate} onSelectAssignment={handleSelectAssignment} />}
        {view === 'discussions' && <DiscussionsView onNavigate={handleNavigate} onSelectDiscussion={handleSelectDiscussion} />}
        {view === 'discussion-detail' && <DiscussionDetailView discussionId={selectedDiscussionId} onNavigate={handleNavigate} />}
        {view === 'announcements' && <AnnouncementsView onNavigate={handleNavigate} />}
        {view === 'admin' && <AdminView onNavigate={handleNavigate} />}
        {view === 'audit' && <AuditLogsView onNavigate={handleNavigate} />}
        {view === 'users' && <UsersView onNavigate={handleNavigate} />}
        {view === 'gamification' && <GamificationView onNavigate={handleNavigate} />}
        {view === 'course-create' && <CourseCreateView onNavigate={handleNavigate} />}
        {view === 'settings' && <SettingsView onNavigate={handleNavigate} />}
        {view === 'messages' && <MessagesView onNavigate={handleNavigate} />}
        {view === 'profile' && <ProfileView onNavigate={handleNavigate} />}
      </div>
      <AIAssistant />
    </div>
  );
}
