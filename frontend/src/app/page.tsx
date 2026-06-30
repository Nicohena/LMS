'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, BookOpen, FileText, GraduationCap, Award, Settings,
  Bell, Search, Calendar, ChevronRight, Menu, X, LogOut, MessageSquare,
  Layers, Star, FileQuestion, Route, Crown, TrendingUp, ArrowUpRight,
  Plus, Filter, PlayCircle, Sparkles, Clock, Users, CheckCircle2,
  AlertCircle, Lock, Mail, Eye, EyeOff, ArrowLeft, BookMarked,
  Video, File, Link2, ChevronDown, MoreHorizontal, Zap, CircleDot,
  Upload, Pin, BarChart3, Trash2, UserPlus, Edit,
  Download, Trophy, Target, Flame, Medal, BadgeCheck,
  Check, GripVertical, Image,
} from 'lucide-react';
import { cn, getInitials, formatDate, timeAgo } from '@/lib/utils';
import { useLogin, useLogout, useMyProfile, useUpdateMyProfile, useCourses, useCourse, useCreateCourse, useCreateModule, useUpdateModule, useDeleteModule, useCreateContent, useDeleteContent, useUpdateContent, useStudentDashboard, usePlatformDashboard, useUsers, useCreateUser, useUpdateUser, useDeleteUser, useDiscussions, useCreateDiscussion, useDiscussion, useCreateReply, useUpvoteDiscussion, useDeleteDiscussion, useMarkBestAnswer, useChangePassword, useAuditLogs, useQuizAnalytics, useConversations, useMessages, useSendMessage, useUserLevel, useUserBadges, useLeaderboard, useMyCertificates, useSettings, useBatchUpdateSettings, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useMarkAnnouncementRead, useQuizzes, useQuizzesForContents, useQuiz, useStartQuizAttempt, useSubmitQuizAttempt, useAttemptResults, useCreateQuiz, useUpdateQuiz, useDeleteQuiz, useAddQuestion, useDeleteQuestion, useAssignments, useAssignmentsForContents, useAssignment, useSubmissions, useCreateSubmission, useUploadFile, useGradeSubmission, useRequestRevision, useMyPeerReviews, useAssignPeerReviews, useSubmitPeerReview, useReceivedPeerReviews, useNotificationPreferences, useUpdateNotificationPreference, useEnrollments } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
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
type View = 'login' | 'dashboard' | 'catalog' | 'course-detail' | 'quiz' | 'quiz-results' | 'assignment' | 'discussions' | 'discussion-detail' | 'announcements' | 'admin' | 'audit' | 'users' | 'gamification' | 'course-create' | 'settings' | 'messages' | 'profile';

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
const navItems = [
  { label: 'Home', icon: LayoutDashboard, view: 'dashboard' as View },
  { label: 'My Learning', icon: BookOpen, view: 'dashboard' as View },
  { label: 'Catalog', icon: Layers, view: 'catalog' as View },
  { label: 'Favorites', icon: Star },
  { label: 'Assignments', icon: FileText, badge: 3, view: 'assignment' as View },
  { label: 'Quizzes', icon: FileQuestion, view: 'quiz' as View },
  { label: 'Certificates', icon: Award, view: 'gamification' as View },
  { label: 'Discussions', icon: MessageSquare, badge: 5, view: 'discussions' as View },
  { label: 'Announcements', icon: Bell, view: 'announcements' as View },
  { label: 'Messages', icon: MessageSquare, badge: 3, view: 'messages' as View },
  { label: 'Admin Panel', icon: BarChart3, view: 'admin' as View },
  { label: 'Audit Logs', icon: FileText, view: 'audit' as View },
  { label: 'User Management', icon: Users, view: 'users' as View },
  { label: 'Create Course', icon: Plus, view: 'course-create' as View },
  { label: 'Settings', icon: Settings, view: 'settings' as View },
  { label: 'Calendar', icon: Calendar },
];

const stats = [
  { label: 'Course', value: '12', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+2' },
  { label: 'Page', value: '48', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+5' },
  { label: 'Assignment', value: '7', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+1' },
  { label: 'Quiz', value: '15', icon: FileQuestion, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+3' },
  { label: 'Learning Path', value: '4', icon: Route, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+1' },
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
  { id: 'mock-1', title: 'UI Design Fundamentals', description: 'Master the principles of user interface design from wireframing to prototyping.', instructor: 'Sarah Chen', category: 'Design', difficulty: 'Beginner', duration: '12h 30m', lessons: 48, students: 1248, rating: 4.8, thumbnail: 'bg-gradient-to-br from-indigo-500 to-purple-500', progress: 75, modules: [
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
  { id: 'mock-3', title: 'Project Management Essentials', description: 'Learn Agile, Scrum, and Kanban methodologies for effective project delivery.', instructor: 'Emily Davis', category: 'Business', difficulty: 'Intermediate', duration: '8h 15m', lessons: 32, students: 634, rating: 4.7, thumbnail: 'bg-gradient-to-br from-amber-500 to-orange-500', progress: 90 },
  { id: 'mock-4', title: 'Data Science with Python', description: 'From Pandas to Machine Learning — master data science fundamentals.', instructor: 'James Park', category: 'Data Science', difficulty: 'Intermediate', duration: '24h 00m', lessons: 85, students: 521, rating: 4.6, thumbnail: 'bg-gradient-to-br from-emerald-500 to-teal-500', progress: 15 },
  { id: 'mock-5', title: 'Digital Marketing Mastery', description: 'SEO, content marketing, social media strategy, and paid advertising.', instructor: 'Lisa Wang', category: 'Marketing', difficulty: 'Beginner', duration: '10h 30m', lessons: 40, students: 387, rating: 4.5, thumbnail: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  { id: 'mock-6', title: 'Cloud Architecture', description: 'AWS, Azure, GCP — design scalable cloud-native applications.', instructor: 'David Kim', category: 'Programming', difficulty: 'Advanced', duration: '20h 00m', lessons: 55, students: 445, rating: 4.8, thumbnail: 'bg-gradient-to-br from-slate-600 to-slate-800' },
];

const categories = ['All', 'Design', 'Programming', 'Business', 'Data Science', 'Marketing'];
const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

// ─── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ open, onClose, currentView, onNavigate }: { open: boolean; onClose: () => void; currentView: View; onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'STUDENT';
  // Filter nav items by role — admin/teacher see admin entries, students don't
  const visibleNavItems = navItems.filter((item) => {
    if (item.label === 'Admin Panel' || item.label === 'Audit Logs' || item.label === 'User Management' || item.label === 'Create Course') {
      return role === 'ADMIN' || role === 'TEACHER';
    }
    return true;
  });
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={cn('fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-slate-200 bg-slate-50 transition-transform duration-200 lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600"><GraduationCap className="h-5 w-5 text-white" /></div>
          <span className="text-lg font-bold text-slate-900">Trenning</span>
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-200 lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {visibleNavItems.map((item) => (
            <button key={item.label} onClick={() => item.view && onNavigate(item.view)} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              (item.view === currentView) ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900')}>
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.badge && <span className={cn('ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold', (item.view === currentView) ? 'bg-white/20 text-white' : 'bg-red-500 text-white')}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
          <button onClick={() => onNavigate('profile')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900"><Users className="h-4 w-4" />My Profile</button>
          <button onClick={() => onNavigate('settings')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900"><Settings className="h-4 w-4" />Settings</button>
          <button onClick={() => onNavigate('login')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900"><LogOut className="h-4 w-4" />Logout</button>
        </div>
      </aside>
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────
function Header({ onMenuClick, onNavigate, currentView, onSelectCourse }: { onMenuClick: () => void; onNavigate: (v: View) => void; currentView: View; onSelectCourse: (id: string) => void }) {
  const user = useAuthStore((s) => s.user);
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
  const headerLinks = [
    { label: 'Home', view: 'dashboard' as View },
    { label: 'My Learning', view: 'dashboard' as View },
    { label: 'Catalog', view: 'catalog' as View },
    { label: 'Favorites', view: 'dashboard' as View },
  ];
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
        {headerLinks.map((link) => (
          <button key={link.label} onClick={() => onNavigate(link.view)} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', link.view === currentView ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100')}>{link.label}</button>
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
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
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
                  className="block w-full border-t border-slate-200 px-3 py-2.5 text-center text-xs font-medium text-indigo-600 hover:bg-slate-50"
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
                    <button onClick={handleMarkAllRead} disabled={markAllReadMut.isPending} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
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
                        className={cn('flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50', !n.isRead && 'bg-indigo-50/40')}
                      >
                        <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-indigo-500')} />
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
                    className="block w-full border-t border-slate-200 px-4 py-2.5 text-center text-xs font-medium text-indigo-600 hover:bg-slate-50"
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">{initials}</div>
          <button onClick={() => logoutMutation.mutate()} title="Logout" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}

// ─── Login Page ──────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
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
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600"><GraduationCap className="h-7 w-7 text-white" /></div>
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
                <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Forgot password?</button>
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
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <Label htmlFor="remember" className="text-sm text-slate-600">Remember me for 30 days</Label>
            </div>
            <Button type="submit" disabled={loginMutation.isPending} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
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
          Don&apos;t have an account? <button className="font-semibold text-indigo-600 hover:text-indigo-700">Sign up free</button>
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard View ──────────────────────────────────────────────────────
function DashboardView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'STUDENT';
  const { data: studentData, isLoading: studentLoading } = useStudentDashboard();
  const { data: platformData, isLoading: platformLoading } = usePlatformDashboard();
  const { data: leaderboardData } = useLeaderboard({ limit: 5 });
  const SectionHeader = ({ title, action }: { title: string; action?: string }) => (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {action && <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">{action}<ChevronRight className="h-3.5 w-3.5" /></button>}
    </div>
  );

  const firstName = user?.firstName ?? 'Learner';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Derive stats from real data
  const liveStats = isStudent
    ? [
        { label: 'Enrolled', value: String(studentData?.stats?.totalEnrollments ?? 0), icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '' },
        { label: 'Active', value: String(studentData?.stats?.active ?? 0), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', trend: '' },
        { label: 'Completed', value: String(studentData?.stats?.completed ?? 0), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '' },
        { label: 'Avg Progress', value: `${Math.round(studentData?.stats?.averageProgress ?? 0)}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', trend: '' },
        { label: 'Dropped', value: String(studentData?.stats?.dropped ?? 0), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', trend: '' },
      ]
    : [
        { label: 'Users', value: String(platformData?.stats?.users?.total ?? 0), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: `+${platformData?.stats?.users?.newThisWeek ?? 0}` },
        { label: 'Courses', value: String(platformData?.stats?.courses?.total ?? 0), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', trend: '' },
        { label: 'Enrollments', value: String(platformData?.stats?.enrollments?.total ?? 0), icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `+${platformData?.stats?.enrollments?.newThisWeek ?? 0}` },
        { label: 'Modules', value: String(platformData?.stats?.content?.totalModules ?? 0), icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50', trend: '' },
        { label: 'Submissions', value: String(platformData?.stats?.engagement?.assignmentSubmissions ?? 0), icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', trend: '' },
      ];

  // Use student recentActivity as "most issued content" for students, otherwise use quiz grading list
  const liveMostIssued = (studentData?.recentActivity ?? []).map((a: any, i: number) => ({
    id: a.contentId ?? i,
    title: a.contentTitle ?? 'Untitled',
    type: a.status === 'COMPLETED' ? 'Page' : 'Assignment',
    views: Math.round(a.progressPercent ?? 0),
    trend: a.progressPercent && a.progressPercent > 50 ? 5 : -2,
  }));

  const liveTopLearners = (leaderboardData?.entries ?? []).map((e: any) => ({
    id: e.userId,
    name: e.displayName,
    points: e.totalXP,
    rank: e.rank,
    avatar: getInitials(e.displayName),
    courses: e.level,
  }));

  const loading = isStudent ? studentLoading : platformLoading;
  if (loading) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading dashboard…</div></main>;
  }

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">{isStudent
            ? <>You have <span className="font-semibold text-indigo-600">{studentData?.stats?.active ?? 0} active courses</span> and your average progress is <span className="font-semibold text-indigo-600">{Math.round(studentData?.stats?.averageProgress ?? 0)}%</span>.</>
            : <>Your platform has <span className="font-semibold text-indigo-600">{platformData?.stats?.users?.total ?? 0} users</span> and <span className="font-semibold text-indigo-600">{platformData?.stats?.courses?.total ?? 0} courses</span>.</>
          }</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ label: 'Browse Courses', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' }, { label: 'My Assignments', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' }, { label: 'Take a Quiz', icon: FileQuestion, color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'Certificates', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' }].map((a) => (
            <button key={a.label} onClick={() => a.label === 'Browse Courses' && onNavigate('catalog')} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
              <div className={cn('flex h-6 w-6 items-center justify-center rounded', a.bg)}><a.icon className={cn('h-3.5 w-3.5', a.color)} /></div>{a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {liveStats.map((stat) => (
          <Card key={stat.label} className="border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.bg)}><stat.icon className={cn('h-5 w-5', stat.color)} /></div>
              <div><p className="text-xs font-medium text-slate-500">{stat.label}</p><div className="flex items-center gap-1.5"><p className="text-xl font-bold text-slate-900">{stat.value}</p>{stat.trend && <span className="flex items-center text-[10px] font-semibold text-emerald-600"><ArrowUpRight className="h-3 w-3" />{stat.trend}</span>}</div></div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-slate-200 p-5 shadow-sm">
            <SectionHeader title={isStudent ? "Continue learning" : "Most issued content"} action="View all" />
            <div className="space-y-1">
              {(liveMostIssued.length > 0 ? liveMostIssued : mostIssuedContent).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
                  <span className="w-5 text-sm font-bold text-slate-300">{idx + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge className={cn('rounded-full px-2 py-0 text-[10px] font-medium', item.type === 'Page' ? 'bg-blue-50 text-blue-600' : item.type === 'Assignment' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600')}>{item.type}</Badge>
                      <span className="text-xs text-slate-400">{item.views} views</span>
                    </div>
                  </div>
                  <div className={cn('flex items-center gap-0.5 text-xs font-semibold', item.trend > 0 ? 'text-emerald-600' : 'text-red-500')}><TrendingUp className={cn('h-3 w-3', item.trend < 0 && 'rotate-180')} />{Math.abs(item.trend)}%</div>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border border-slate-200 p-5 shadow-sm">
              <SectionHeader title="Assignment" action="Details" />
              <div className="grid grid-cols-2 gap-3">
                {assignmentStats.map((stat) => (
                  <div key={stat.name} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stat.color }} /><span className="text-xs font-medium text-slate-600">{stat.name}</span></div>
                    <p className="mt-1.5 text-2xl font-bold text-slate-900">{stat.count}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="border border-slate-200 p-5 shadow-sm">
              <SectionHeader title="Learning Content" action="Details" />
              <div className="flex items-center gap-4">
                <div className="relative h-36 w-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={learningContentStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">{learningContentStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><p className="text-2xl font-bold text-slate-900">{learningContentStatus.reduce((a, b) => a + b.value, 0)}</p><p className="text-[10px] text-slate-400">Total</p></div>
                </div>
                <div className="flex-1 space-y-2">
                  {learningContentStatus.map((item) => (
                    <div key={item.name} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-xs text-slate-600">{item.name}</span></div><span className="text-xs font-semibold text-slate-900">{item.value}</span></div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
        <div className="space-y-6">
          <Card className="border border-slate-200 p-5 shadow-sm">
            <SectionHeader title="Top Learner" action="See all" />
            <div className="space-y-1">
              {(liveTopLearners.length > 0 ? liveTopLearners : topLearners).map((learner) => (
                <div key={learner.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', learner.rank === 1 ? 'bg-amber-100 text-amber-700' : learner.rank === 2 ? 'bg-slate-200 text-slate-600' : learner.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400')}>{learner.rank}</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">{learner.avatar}</div>
                  <div className="flex-1"><p className="text-sm font-medium text-slate-900">{learner.name}</p><p className="text-xs text-slate-400">Level {learner.courses}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-indigo-600">{learner.points.toLocaleString()}</p><p className="text-[10px] text-slate-400">XP</p></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="relative overflow-hidden border border-indigo-100 bg-gradient-to-br from-indigo-600 to-indigo-500 p-5 shadow-sm">
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2"><Crown className="h-5 w-5 text-amber-300" /><span className="text-sm font-semibold text-white">Upgrade to PRO</span></div>
              <p className="mb-4 text-xs text-indigo-100">Unlock unlimited courses, advanced analytics, certificates, and priority support.</p>
              <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Upgrade Now</Button>
            </div>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" /><div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
          </Card>
          <Card className="border border-slate-200 p-5 shadow-sm">
            <SectionHeader title="Quiz Grading" action="View all" />
            <div className="space-y-3">
              {quizGrading.map((quiz) => (
                <div key={quiz.id} className="rounded-lg border border-slate-100 p-3 hover:border-slate-200">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50"><FileQuestion className="h-4 w-4 text-emerald-600" /></div>
                      <div><p className="text-sm font-medium text-slate-900">{quiz.title}</p><p className="text-xs text-slate-400">{quiz.questions} questions · {quiz.submissions} submissions</p></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {quiz.pending > 0 && <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50">{quiz.pending} pending</Badge>}
                    <Button size="sm" className="ml-auto bg-indigo-600 text-white hover:bg-indigo-700">Grade Now<ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
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

// ─── Catalog View ────────────────────────────────────────────────────────
function CatalogView({ onSelectCourse, onNavigate }: { onSelectCourse: (id: string) => void; onNavigate: (v: View) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Popular');
  const { data, isLoading, isError } = useCourses({ limit: 50, search: searchQuery || undefined });

  // Normalize API courses into the shape expected by the UI
  const apiCourses: Course[] = (data?.data ?? []).map((c: any) => ({
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
    thumbnail: 'bg-gradient-to-br from-indigo-500 to-purple-500',
  }));

  const filtered = apiCourses.filter(c => {
    const catMatch = selectedCategory === 'All' || c.category === selectedCategory;
    const diffMatch = selectedDifficulty === 'All Levels' || c.difficulty === selectedDifficulty;
    return catMatch && diffMatch;
  });

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Catalog</span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Course Catalog</h1><p className="mt-1 text-sm text-slate-500">Discover {apiCourses.length} courses across {categories.length - 1} categories</p></div>
        <div className="flex items-center gap-2">
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
          <Card className="border border-slate-200 p-5 shadow-sm">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="mb-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Category</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors', selectedCategory === cat ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-50')}>
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
                  <button key={diff} onClick={() => setSelectedDifficulty(diff)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors', selectedDifficulty === diff ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-50')}>
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
            {filtered.map((course) => (
              <Card key={course.id} className="group cursor-pointer overflow-hidden border border-slate-200 shadow-sm transition-all hover:shadow-md" onClick={() => onSelectCourse(course.id)}>
                {/* Thumbnail */}
                <div className={cn('relative h-36', course.thumbnail)}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90"><PlayCircle className="h-6 w-6 text-indigo-600" /></div>
                  </div>
                  <Badge className="absolute left-3 top-3 bg-white/90 text-slate-700 hover:bg-white">{course.category}</Badge>
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
                  <h3 className="mb-1 text-sm font-semibold text-slate-900 group-hover:text-indigo-600">{course.title}</h3>
                  <p className="mb-3 line-clamp-2 text-xs text-slate-500">{course.description}</p>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-600">{course.instructor.split(' ').map(n => n[0]).join('')}</div>
                      <span className="text-xs text-slate-500">{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="font-semibold text-slate-700">{course.rating}</span></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Page Content Editor (rich text for PAGE-type content) ───────────────
function PageContentEditor({ courseId, contentId, canAuthor }: { courseId: string; contentId: string; canAuthor: boolean }) {
  const { data: courseData } = useCourse(courseId || null);
  const updateContent = useUpdateContent(courseId || null);
  const [markdown, setMarkdown] = useState('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, content?.contentJson]);

  const handleSave = () => {
    setSaveStatus({ type: 'idle' });
    updateContent.mutate(
      {
        contentId,
        data: { contentJson: { type: 'markdown', content: markdown, updatedAt: new Date().toISOString() } },
      },
      {
        onSuccess: () => {
          setSaveStatus({ type: 'success', msg: 'Content saved.' });
          setIsEditing(false);
          setTimeout(() => setSaveStatus({ type: 'idle' }), 3000);
        },
        onError: (err: any) => setSaveStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to save.' }),
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
          <RichTextEditor value={markdown} onChange={setMarkdown} placeholder="Write your lesson content here. Supports markdown: **bold**, *italic*, # headings, - lists, > quotes, [links](url)..." />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setIsEditing(false); setSaveStatus({ type: 'idle' }); }} className="border-slate-200 text-slate-600">Cancel</Button>
            <Button onClick={handleSave} disabled={updateContent.isPending} className="bg-indigo-600 text-white hover:bg-indigo-700">
              {updateContent.isPending ? 'Saving…' : 'Save Content'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
          {markdown.trim() ? (
            <RichTextRenderer content={markdown} />
          ) : (
            <p className="text-sm italic text-slate-400">
              {canAuthor ? 'No content yet. Click "Edit Content" to add lesson material.' : 'No content available for this lesson yet.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Course Detail View ──────────────────────────────────────────────────
function CourseDetailView({ courseId, onNavigate, onSelectQuiz, onSelectAssignment }: { courseId: string; onNavigate: (v: View) => void; onSelectQuiz?: (id: string) => void; onSelectAssignment?: (id: string) => void }) {
  const { data: courseData, isLoading } = useCourse(courseId || null);
  const authUser = useAuthStore((s) => s.user);
  const canAuthor = authUser?.role === 'ADMIN' || authUser?.role === 'TEACHER';
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
    thumbnail: 'bg-gradient-to-br from-indigo-500 to-purple-500',
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
        onSuccess: () => { setNewModuleTitle(''); setShowAddModule(false); },
        onError: (err: any) => setAuthorErr(err.response?.data?.message || 'Failed to create module.'),
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
        },
        onError: (err: any) => setAuthorErr(err.response?.data?.message || 'Failed to create content.'),
      },
    );
  };

  const handleDeleteModule = (moduleId: string) => {
    if (!confirm('Delete this module and all its content? This cannot be undone.')) return;
    deleteModuleMut.mutate(moduleId);
  };

  const handleDeleteContent = (contentId: string) => {
    if (!confirm('Delete this content? This cannot be undone.')) return;
    deleteContentMut.mutate(contentId);
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

      <button onClick={() => onNavigate('catalog')} className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
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
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />{course.rating}</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.students.toLocaleString()} students</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{course.lessons} lessons</span>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={() => {
              const activeLessonObj = course.modules?.[activeModule]?.lessons?.[activeLesson];
              if (activeLessonObj) handleLessonClick(activeModule, activeLesson, activeLessonObj);
            }} className="bg-white text-indigo-600 hover:bg-white/90"><PlayCircle className="mr-2 h-4 w-4" />Continue Learning</Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Add to Favorites</Button>
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
          <Card className="border border-slate-200 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                {(() => { const Icon = lessonTypeIcons[course.modules?.[activeModule]?.lessons[activeLesson]?.type || 'video'] || Video; return <Icon className="h-5 w-5 text-indigo-600" />; })()}
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
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-200 bg-amber-50/50 p-8 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100"><FileText className="h-7 w-7 text-amber-600" /></div>
                    <p className="text-base font-semibold text-slate-900">Ready to submit your work?</p>
                    <p className="mt-1 text-sm text-slate-500">This lesson is an assignment. Click below to view instructions and submit.</p>
                    <Button onClick={() => onSelectAssignment?.(assignmentIdByContent[contentId])} className="mt-4 bg-amber-600 text-white hover:bg-amber-700">
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
                      <button key={tab} className={cn('border-b-2 px-3 py-2 text-sm font-medium transition-colors', i === 0 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>{tab}</button>
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
                  <button onClick={() => setShowAddModule(true)} title="Add module" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }} />
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
                        <button onClick={() => setShowAddContent(String(module.id))} title="Add content" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><Plus className="h-3.5 w-3.5" /></button>
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
                          <div key={lesson.id} className={cn('group flex items-center rounded-lg', mIdx === activeModule && lIdx === activeLesson ? 'bg-indigo-50' : 'hover:bg-slate-50')}>
                            <button
                              onClick={() => handleLessonClick(mIdx, lIdx, lesson)}
                              className={cn('flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors')}
                              title={hasLinkedEntity ? `Open ${lesson.type}` : undefined}
                            >
                              <div className={cn('flex h-5 w-5 items-center justify-center rounded-full', lesson.completed ? 'bg-emerald-100' : 'bg-slate-100')}>
                                {lesson.completed ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Icon className={cn('h-3 w-3', lesson.type === 'quiz' || lesson.type === 'assignment' ? 'text-indigo-500' : 'text-slate-400')} />}
                              </div>
                              <div className="flex-1">
                                <p className={cn('text-xs', mIdx === activeModule && lIdx === activeLesson ? 'font-medium text-indigo-600' : 'text-slate-600')}>{lesson.title}</p>
                              </div>
                              {hasLinkedEntity && <ChevronRight className="h-3 w-3 text-indigo-400" />}
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
                        <button onClick={() => setShowAddContent(String(module.id))} className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600">
                          <Plus className="h-3 w-3" />Add content
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {canAuthor && course.modules && course.modules.length === 0 && (
                <button onClick={() => setShowAddModule(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600">
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
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-slate-600">Certificate of Completion</span>
                <span className="ml-auto text-[10px] font-medium text-slate-400">Locked</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5">
                <Crown className="h-4 w-4 text-indigo-500" />
                <span className="text-xs text-slate-600">500 XP on completion</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5">
                <Star className="h-4 w-4 text-purple-500" />
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
                <Button onClick={handleCreateModule} disabled={createModuleMut.isPending} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
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
                <select value={newContentType} onChange={(e) => setNewContentType(e.target.value as any)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none">
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
                <Button onClick={() => handleCreateContent(showAddContent)} disabled={createContentMut.isPending} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
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
  const isTeacher = authUser?.role === 'ADMIN' || authUser?.role === 'TEACHER';
  // Teachers see all quizzes (including drafts); students only see PUBLISHED
  const { data, isLoading } = useQuizzes({ limit: 50, status: isTeacher ? undefined : 'PUBLISHED' });
  const deleteQuizMut = useDeleteQuiz();
  const [showCreate, setShowCreate] = useState(false);
  const quizzes = (data?.data ?? []) as any[];

  const handleDelete = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this quiz and all its questions? This cannot be undone.')) return;
    deleteQuizMut.mutate(quizId);
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
          <p className="mt-1 text-sm text-slate-500">{quizzes.length} {isTeacher ? 'total' : 'published'} quizzes · {isTeacher ? 'Manage your quiz library' : 'Test your knowledge'}</p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="mr-1.5 h-4 w-4" />Create Quiz
          </Button>
        )}
      </div>
      {isLoading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading quizzes…</div>}
      {!isLoading && quizzes.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {isTeacher ? 'No quizzes yet. Click "Create Quiz" to get started.' : 'No quizzes available yet.'}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quizzes.map((q: any) => (
          <Card key={q.id} className="group cursor-pointer border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md" onClick={() => onSelectQuiz(q.id)}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><FileQuestion className="h-5 w-5 text-emerald-600" /></div>
              <div className="flex items-center gap-2">
                {isTeacher && q.status && (
                  <Badge className={cn('hover:opacity-90', q.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>{q.status}</Badge>
                )}
                <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">{q.questionCount ?? 0} Q</Badge>
                {isTeacher && (
                  <button onClick={(e) => handleDelete(e, q.id)} title="Delete quiz" className="rounded p-1 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{q.title}</h3>
            {q.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{q.description}</p>}
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{q.timeLimit ?? 15} min</span>
              <span className="flex items-center gap-1"><Target className="h-3 w-3" />Pass: {q.passingScore}%</span>
              <span className="flex items-center gap-1"><Route className="h-3 w-3" />{q.maxAttempts} tries</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Quiz Modal */}
      {showCreate && (
        <QuizEditorModal onClose={() => setShowCreate(false)} />
      )}
    </main>
  );
}

// ─── Quiz Editor Modal (create quiz + add questions) ─────────────────────
function QuizEditorModal({ onClose, quizId: existingQuizId }: { onClose: () => void; quizId?: string }) {
  const createQuiz = useCreateQuiz();
  const addQuestion = useAddQuestion(existingQuizId ?? null);
  const deleteQuestion = useDeleteQuestion(existingQuizId ?? null);
  const { data: existingQuizData } = useQuiz(existingQuizId ?? null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('15');
  const [passingScore, setPassingScore] = useState('60');
  const [maxAttempts, setMaxAttempts] = useState('3');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [error, setError] = useState('');
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(existingQuizId ?? null);

  // Question form state
  const [qType, setQType] = useState<'MULTIPLE_CHOICE_SINGLE' | 'TRUE_FALSE'>('MULTIPLE_CHOICE_SINGLE');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qPoints, setQPoints] = useState('1');
  const [qError, setQError] = useState('');

  const isEditing = !!createdQuizId;
  const quiz = (existingQuizData as any)?.quiz;
  const existingQuestions = ((existingQuizData as any)?.questions ?? []) as any[];

  const handleCreate = () => {
    setError('');
    if (!title.trim()) { setError('Title is required.'); return; }
    createQuiz.mutate(
      {
        title,
        description: description.trim() || undefined,
        timeLimit: Number(timeLimit) || 15,
        passingScore: Number(passingScore) || 60,
        maxAttempts: Number(maxAttempts) || 3,
        status,
      },
      {
        onSuccess: (data: any) => {
          setCreatedQuizId(data?.quiz?.id ?? data?.id ?? null);
        },
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to create quiz.'),
      },
    );
  };

  const handleAddQuestion = () => {
    setQError('');
    if (!qText.trim()) { setQError('Question text is required.'); return; }
    if (!createdQuizId) { setQError('Create the quiz first.'); return; }

    let options: any;
    let correctAnswer: any;

    if (qType === 'TRUE_FALSE') {
      options = [{ text: 'True', isCorrect: qCorrectIdx === 0 }, { text: 'False', isCorrect: qCorrectIdx === 1 }];
      correctAnswer = qCorrectIdx === 0;
    } else {
      const filled = qOptions.filter((o) => o.trim());
      if (filled.length < 2) { setQError('Provide at least 2 options.'); return; }
      options = qOptions.map((text, idx) => ({ text: text.trim(), isCorrect: idx === qCorrectIdx }));
      correctAnswer = qOptions[qCorrectIdx]?.trim();
    }

    addQuestion.mutate(
      {
        type: qType,
        questionText: qText,
        points: Number(qPoints) || 1,
        options,
        correctAnswer,
      },
      {
        onSuccess: () => {
          setQText(''); setQOptions(['', '', '', '']); setQCorrectIdx(0); setQError('');
        },
        onError: (err: any) => setQError(err.response?.data?.message || 'Failed to add question.'),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-0 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Quiz' : 'Create New Quiz'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {/* Quiz details form */}
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-slate-700">Quiz Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., UI Design Principles Quiz" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-slate-700">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of what the quiz covers" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Time Limit (min)</Label>
                <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Passing Score (%)</Label>
                <Input type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Max Attempts</Label>
                <Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Status</Label>
                <select value={status} onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700">
                  <option value="DRAFT">Draft (not visible to students)</option>
                  <option value="PUBLISHED">Published (visible to students)</option>
                </select>
              </div>
            </div>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <Button onClick={handleCreate} disabled={createQuiz.isPending} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
              {createQuiz.isPending ? 'Creating…' : 'Create Quiz'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              ✓ Quiz created! Now add questions below. {quiz?.title && `(${quiz.title})`}
            </div>

            {/* Existing questions */}
            {existingQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Existing Questions ({existingQuestions.length})</p>
                {existingQuestions.map((q: any, idx: number) => (
                  <div key={q.id} className="group flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{idx + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{q.questionText}</p>
                      <p className="text-xs text-slate-400">{q.type.replace(/_/g, ' ')} · {q.points} pt</p>
                    </div>
                    <button onClick={() => deleteQuestion.mutate(q.id)} className="rounded p-1 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add question form */}
            <div className="rounded-lg border-2 border-dashed border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Add Question</h3>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-slate-600">Question Type</Label>
                  <select value={qType} onChange={(e) => { setQType(e.target.value as any); if (e.target.value === 'TRUE_FALSE') setQCorrectIdx(0); }} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700">
                    <option value="MULTIPLE_CHOICE_SINGLE">Multiple Choice (single answer)</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-slate-600">Question Text *</Label>
                  <textarea value={qText} onChange={(e) => setQText(e.target.value)} rows={2} placeholder="Type the question..." className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                {qType === 'MULTIPLE_CHOICE_SINGLE' && (
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium text-slate-600">Options (select the correct one)</Label>
                    <div className="space-y-1.5">
                      {qOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <button type="button" onClick={() => setQCorrectIdx(idx)} className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold', idx === qCorrectIdx ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-slate-400')}>
                            {idx === qCorrectIdx ? '✓' : String.fromCharCode(65 + idx)}
                          </button>
                          <Input value={opt} onChange={(e) => { const next = [...qOptions]; next[idx] = e.target.value; setQOptions(next); }} placeholder={`Option ${String.fromCharCode(65 + idx)}`} className="text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {qType === 'TRUE_FALSE' && (
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium text-slate-600">Correct Answer</Label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setQCorrectIdx(0)} className={cn('rounded-lg border px-4 py-2 text-sm font-medium', qCorrectIdx === 0 ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-600')}>True</button>
                      <button type="button" onClick={() => setQCorrectIdx(1)} className={cn('rounded-lg border px-4 py-2 text-sm font-medium', qCorrectIdx === 1 ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-600')}>False</button>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-slate-600">Points</Label>
                  <Input type="number" min="1" max="100" value={qPoints} onChange={(e) => setQPoints(e.target.value)} className="w-24" />
                </div>
                {qError && <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{qError}</div>}
                <Button onClick={handleAddQuestion} disabled={addQuestion.isPending} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                  {addQuestion.isPending ? 'Adding…' : 'Add Question'}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={onClose} className="bg-emerald-600 text-white hover:bg-emerald-700">Done</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Quiz Runner (single quiz attempt) ───────────────────────────────────
function QuizRunner({ quizId, onNavigate, onSubmitted }: { quizId: string; onNavigate: (v: View) => void; onSubmitted: (attemptId: string) => void }) {
  const { data: quizData, isLoading } = useQuiz(quizId || null);
  const { data: enrollmentsData } = useEnrollments({ status: 'ACTIVE' });
  const { data: analyticsData } = useQuizAnalytics(quizId || null);
  const startAttempt = useStartQuizAttempt();
  const submitAttempt = useSubmitQuizAttempt();
  const authUser = useAuthStore((s) => s.user);
  const isTeacher = authUser?.role === 'ADMIN' || authUser?.role === 'TEACHER';

  const quiz = (quizData as any)?.quiz;
  const questions = ((quizData as any)?.questions ?? []) as any[];

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [attemptId, setAttemptId] = useState<string>('');
  const [startTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>((quiz?.timeLimit ?? 15) * 60);
  const [error, setError] = useState('');

  // Reset timer when quiz loads
  useEffect(() => {
    if (quiz?.timeLimit) setTimeLeft(quiz.timeLimit * 60);
  }, [quiz?.timeLimit]);

  // Tick down timer only while attempt is active
  useEffect(() => {
    if (!attemptId || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [attemptId, timeLeft]);

  // Auto-submit on time-out
  useEffect(() => {
    if (attemptId && timeLeft === 0 && !showSubmit) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, attemptId]);

  // Reset to first question when a new attempt starts
  useEffect(() => {
    if (attemptId) {
      setCurrentQ(0);
      setAnswers({});
    }
  }, [attemptId]);

  const enrollments = (enrollmentsData?.data ?? []) as any[];
  // Pick the first active enrollment that matches the quiz's contentId's course, else first active
  const matchingEnrollment = enrollments[0];

  const handleStart = () => {
    if (!matchingEnrollment) {
      setError('No active enrollment found. Enroll in a course first.');
      return;
    }
    setError('');
    startAttempt.mutate(
      { quizId, enrollmentId: matchingEnrollment.id },
      {
        onSuccess: (data) => {
          setAttemptId(data.attempt.id);
        },
        onError: (err: any) => setError(err.response?.data?.message || 'Failed to start attempt'),
      },
    );
  };

  const handleSubmit = () => {
    if (!attemptId) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    submitAttempt.mutate(
      { attemptId, answers, timeSpent },
      {
        onSuccess: () => {
          setShowSubmit(false);
          onSubmitted(attemptId);
        },
        onError: (err: any) => {
          setError(err.response?.data?.message || 'Failed to submit quiz');
          setShowSubmit(false);
        },
      },
    );
  };

  const answered = Object.keys(answers).length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (isLoading) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading quiz…</div></main>;
  }

  if (!quiz) {
    return (
      <main className="mx-auto max-w-7xl p-4 lg:p-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <p className="text-sm font-medium text-amber-700">Quiz not found.</p>
          <Button variant="outline" onClick={() => onNavigate('dashboard')} className="mt-4 border-amber-200 text-amber-700">Back to Dashboard</Button>
        </div>
      </main>
    );
  }

  // Pre-attempt screen
  if (!attemptId) {
    return (
      <main className="mx-auto max-w-3xl p-4 lg:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-slate-700">{quiz.title}</span>
        </div>
        <Card className="border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50"><FileQuestion className="h-7 w-7 text-indigo-600" /></div>
            <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
            {quiz.description && <p className="mt-2 max-w-md text-sm text-slate-500">{quiz.description}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><FileQuestion className="h-3.5 w-3.5" />{quiz.questionCount ?? questions.length} questions</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{quiz.timeLimit ?? 15} min</span>
              <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" />Pass: {quiz.passingScore}%</span>
              <span className="flex items-center gap-1"><Route className="h-3.5 w-3.5" />Max attempts: {quiz.maxAttempts}</span>
            </div>
            {quiz.instructions && (
              <div className="mt-6 w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-600">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Instructions</p>
                {quiz.instructions}
              </div>
            )}
            {error && <div className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            {!isTeacher && (
              <Button onClick={handleStart} disabled={startAttempt.isPending || !matchingEnrollment} className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {startAttempt.isPending ? 'Starting…' : matchingEnrollment ? 'Start Quiz' : 'No active enrollment'}
              </Button>
            )}
            {!matchingEnrollment && !isTeacher && <p className="mt-2 text-xs text-amber-600">You need an active enrollment to take this quiz.</p>}

            {/* Teacher Analytics Panel */}
            {isTeacher && analyticsData && (
              <div className="mt-6 w-full border-t border-slate-200 pt-4 text-left">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Quiz Analytics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-100 p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{(analyticsData as any)?.totalAttempts ?? 0}</p>
                    <p className="text-xs text-slate-400">Total Attempts</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{(analyticsData as any)?.passRate != null ? `${(analyticsData as any).passRate}%` : '—'}</p>
                    <p className="text-xs text-slate-400">Pass Rate</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{(analyticsData as any)?.averageScore != null ? `${(analyticsData as any).averageScore}%` : '—'}</p>
                    <p className="text-xs text-slate-400">Avg Score</p>
                  </div>
                </div>
                {(analyticsData as any)?.questionStats?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Per-Question Breakdown</p>
                    {(analyticsData as any).questionStats.map((qs: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{i + 1}</div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-xs font-medium text-slate-700">{qs.questionText ?? qs.questionId}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-400">{qs.correctCount ?? 0}/{qs.totalResponses ?? 0} correct</span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${qs.totalResponses > 0 ? ((qs.correctCount / qs.totalResponses) * 100) : 0}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {quiz?.status === 'DRAFT' && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                    ⚠️ This quiz is a <strong>Draft</strong>. Students cannot see it until you publish it. Use the Quiz Editor to change the status.
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </main>
    );
  }

  // In-progress quiz screen
  if (questions.length === 0) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-700">This quiz has no questions yet.</div></main>;
  }

  const currentQuestion = questions[currentQ];
  const isTrueFalse = currentQuestion.type === 'TRUE_FALSE';
  const isMCQSingle = currentQuestion.type === 'MULTIPLE_CHOICE_SINGLE';
  const options: any[] = currentQuestion.options ?? [];

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">{quiz.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Question Area */}
        <div className="lg:col-span-3">
          {/* Quiz Header */}
          <Card className="mb-4 border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
                <p className="mt-0.5 text-sm text-slate-500">{questions.length} questions · Passing score: {quiz.passingScore}%</p>
              </div>
              <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2', timeLeft < 300 ? 'bg-red-50' : 'bg-slate-50')}>
                <Clock className={cn('h-4 w-4', timeLeft < 300 ? 'text-red-500' : 'text-slate-500')} />
                <span className={cn('text-sm font-semibold', timeLeft < 300 ? 'text-red-600' : 'text-slate-700')}>{mins}:{secs.toString().padStart(2, '0')}</span>
              </div>
            </div>
            {/* Progress */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Question {currentQ + 1} of {questions.length}</p>
          </Card>

          {/* Question Card */}
          <Card className="border border-slate-200 p-6 shadow-sm">
            <div className="mb-4">
              <Badge className="mb-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-50">{currentQuestion.type.replace(/_/g, ' ')}</Badge>
              <h2 className="text-lg font-semibold text-slate-900">{currentQuestion.questionText}</h2>
            </div>
            <div className="space-y-2">
              {options.map((opt, idx) => {
                const optValue = isTrueFalse ? opt.text === 'True' : opt.text;
                const selected = isTrueFalse
                  ? answers[currentQuestion.id] === (opt.text === 'True')
                  : answers[currentQuestion.id] === opt.text;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [currentQuestion.id]: optValue })}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition-all',
                      selected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <div className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs font-bold',
                      selected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 text-slate-400',
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                className="border-slate-200 text-slate-600"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Previous
              </Button>
              {currentQ === questions.length - 1 ? (
                <Button onClick={() => setShowSubmit(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Submit Quiz
                </Button>
              ) : (
                <Button onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))} className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Next
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Quiz Navigation Sidebar */}
        <div>
          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Questions</h3>
              <p className="mt-0.5 text-xs text-slate-400">{answered}/{questions.length} answered</p>
            </div>
            <div className="grid grid-cols-5 gap-2 p-4">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(idx)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    idx === currentQ
                      ? 'bg-indigo-600 text-white'
                      : answers[q.id] !== undefined
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-200 p-4">
              <div className="mb-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-indigo-600" /><span className="text-slate-500">Current</span></div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-emerald-100" /><span className="text-slate-500">Answered</span></div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-slate-100" /><span className="text-slate-500">Not answered</span></div>
              </div>
              <Button onClick={() => setShowSubmit(true)} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                Submit Quiz
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50"><AlertCircle className="h-7 w-7 text-amber-500" /></div>
              <h2 className="text-lg font-bold text-slate-900">Submit Quiz?</h2>
              <p className="mt-1 text-sm text-slate-500">You have answered {answered} out of {questions.length} questions.</p>
              {answered < questions.length && (
                <p className="mt-2 text-xs font-medium text-amber-600">{questions.length - answered} questions are still unanswered.</p>
              )}
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowSubmit(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitAttempt.isPending} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {submitAttempt.isPending ? 'Submitting…' : 'Finish!'}
              </Button>
            </div>
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <p className="text-sm font-medium text-amber-700">Results not available.</p>
          <Button variant="outline" onClick={() => onNavigate('dashboard')} className="mt-4 border-amber-200 text-amber-700">Back to Dashboard</Button>
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
            <p className="text-2xl font-bold text-indigo-600">{accuracy}%</p>
            <p className="text-xs text-slate-400">Accuracy</p>
          </div>
        </div>
      </Card>

      {/* Answer Review */}
      <Card className="border border-slate-200 p-5 shadow-sm">
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
        <Button onClick={() => onNavigate('catalog')} className="bg-indigo-600 text-white hover:bg-indigo-700">Browse More Courses</Button>
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
  const { data, isLoading } = useAssignments({ limit: 50, status: 'PUBLISHED' });
  const assignments = (data?.data ?? []) as any[];

  return (
    <main className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Assignments</span>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Available Assignments</h1>
        <p className="mt-1 text-sm text-slate-500">{assignments.length} published assignments · Submit your work</p>
      </div>
      {isLoading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading assignments…</div>}
      {!isLoading && assignments.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No assignments available yet.</div>
      )}
      <div className="space-y-3">
        {assignments.map((a: any) => {
          const due = a.dueDate ? new Date(a.dueDate) : null;
          const isOverdue = due && due < new Date();
          return (
            <Card key={a.id} className="cursor-pointer border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md" onClick={() => onSelectAssignment(a.id)}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50"><FileText className="h-5 w-5 text-amber-600" /></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                    <Badge className={cn('hover:opacity-90', isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>{isOverdue ? 'Overdue' : 'Open'}</Badge>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"><Users className="h-5 w-5 text-purple-600" /></div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Peer Reviews</h3>
            <p className="text-xs text-slate-400">No peer reviews assigned to you for this assignment yet.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"><Users className="h-5 w-5 text-purple-600" /></div>
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
              <button key={r.id} onClick={() => setSelectedReviewId(r.id)} className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors', isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:bg-slate-50')}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">{getInitials(authorName)}</div>
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
                      <File className="h-3.5 w-3.5 text-indigo-500" /><span className="flex-1 truncate">{f.original_filename}</span><Download className="h-3.5 w-3.5 text-slate-400" />
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
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} placeholder="Provide constructive feedback..." className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
              {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">{success}</div>}
              <Button onClick={handleSubmit} disabled={submitReview.isPending} className="bg-purple-600 text-white hover:bg-purple-700">
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
    RESUBMITTED: 'bg-amber-50 text-amber-600',
    NOT_GRADED: 'bg-slate-100 text-slate-500',
  };

  if (isLoading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading submissions…</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Submissions ({submissions.length})</h2>
            <p className="text-xs text-slate-400">Grade and provide feedback on student work</p>
          </div>
          {assignment.allowPeerReview && (
            <Button onClick={() => {
              if (!confirm('Automatically assign peer reviews to all students who submitted?')) return;
              assignPeerReviewsMut.mutate({ assignmentId });
            }} disabled={assignPeerReviewsMut.isPending} variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
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
                    className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors', isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50')}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
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
                <Card className="border border-slate-200 p-4 shadow-sm">
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
                          <a key={idx} href={f.secure_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 hover:border-indigo-300 hover:bg-slate-50">
                            <File className="h-3.5 w-3.5 text-indigo-500" />
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
                <Card className="border border-slate-200 p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Grade Submission</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium text-slate-600">Grade (out of {assignment.maxPoints})</Label>
                      <Input type="number" min="0" max={assignment.maxPoints} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder={`0 - ${assignment.maxPoints}`} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium text-slate-600">Feedback (optional)</Label>
                      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Provide feedback for the student..." className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="revision" checked={showRevisionBox} onChange={(e) => setShowRevisionBox(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                      <Label htmlFor="revision" className="text-xs font-medium text-slate-600">Request revision (student must resubmit)</Label>
                    </div>
                    {showRevisionBox && (
                      <div>
                        <Label className="mb-1.5 block text-xs font-medium text-slate-600">Revision Comments</Label>
                        <textarea value={revisionComments} onChange={(e) => setRevisionComments(e.target.value)} rows={2} placeholder="Explain what needs to be revised..." className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </div>
                    )}
                    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
                    {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">{success}</div>}
                    <div className="flex gap-2">
                      <Button onClick={handleGrade} disabled={gradeMut.isPending} className="bg-indigo-600 text-white hover:bg-indigo-700">
                        {gradeMut.isPending ? 'Saving…' : 'Save Grade'}
                      </Button>
                      {showRevisionBox && (
                        <Button onClick={handleRequestRevision} disabled={revisionMut.isPending} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <p className="text-sm font-medium text-amber-700">Assignment not found.</p>
          <Button variant="outline" onClick={() => onNavigate('dashboard')} className="mt-4 border-amber-200 text-amber-700">Back to Dashboard</Button>
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
              <Badge className={cn('hover:opacity-90', statusLabel === 'SUBMITTED' || statusLabel === 'GRADED' ? 'bg-emerald-50 text-emerald-600' : statusLabel === 'Overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>{statusLabel}</Badge>
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
          <Card className="border border-slate-200 p-5 shadow-sm">
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
            <Card className="border border-slate-200 p-5 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Your Latest Submission</h2>
              <div className="rounded-lg border border-slate-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge className={cn('hover:opacity-90', latestSubmission.status === 'GRADED' ? 'bg-emerald-50 text-emerald-600' : latestSubmission.status === 'RESUBMITTED' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600')}>{latestSubmission.status}</Badge>
                  <span className="text-xs text-slate-400">v{latestSubmission.version} · {timeAgo(latestSubmission.submittedAt)}</span>
                </div>
                {latestSubmission.content?.text && <p className="text-sm text-slate-700">{latestSubmission.content.text}</p>}
                {latestSubmission.content?.files && latestSubmission.content.files.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {latestSubmission.content.files.map((f: any, idx: number) => (
                      <a key={idx} href={f.secure_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 hover:border-indigo-300 hover:bg-slate-50">
                        <File className="h-3.5 w-3.5 text-indigo-500" />
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
          <Card className="border border-slate-200 p-5 shadow-sm">
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
                    <label className={cn('flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8', uploadingFile ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50')}>
                      {uploadingFile ? (
                        <>
                          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                          <p className="text-sm font-medium text-indigo-600">Uploading to Cloudinary…</p>
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
                            <a href={f.secure_url} target="_blank" rel="noopener noreferrer" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="View file">
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
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                <Button onClick={handleSubmit} disabled={createSubmission.isPending || uploadingFile || (!submissionText.trim() && uploadedFiles.length === 0)} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                  {createSubmission.isPending ? 'Submitting…' : latestSubmission ? 'Resubmit Assignment' : 'Submit Assignment'}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar — Rubric info */}
        <div>
          <Card className="border border-slate-200 p-5 shadow-sm">
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
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus className="mr-1.5 h-4 w-4" />
          New Thread
        </Button>
      </div>

      {/* Thread List */}
      <div className="space-y-3">
        {threads.map((thread) => (
          <Card key={thread.id} className="cursor-pointer border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md" onClick={() => onSelectDiscussion(thread.id)}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">{thread.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {thread.pinned && <Pin className="h-3.5 w-3.5 text-indigo-500" />}
                  <h3 className="text-sm font-semibold text-slate-900 hover:text-indigo-600">{thread.title}</h3>
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
                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={5} placeholder="Share your thoughts..." className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={handleCreate} disabled={!newTitle.trim()} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">Post Thread</Button>
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
    if (!confirm('Delete this discussion and all replies?')) return;
    deleteDiscussion.mutate(discussionId, {
      onSuccess: () => onNavigate('discussions'),
    });
  };

  if (isLoading) {
    return <main className="mx-auto max-w-4xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading discussion…</div></main>;
  }
  if (!discussion) {
    return <main className="mx-auto max-w-4xl p-4 lg:p-6"><div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-700">Discussion not found.</div></main>;
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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-600">{getInitials(authorName)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {discussion.pinned && <Pin className="h-4 w-4 text-indigo-500" />}
              <h1 className="text-xl font-bold text-slate-900">{discussion.title}</h1>
            </div>
            <p className="mt-1 text-xs text-slate-400">By {authorName} · {timeAgo(discussion.createdAt)} · {discussion.views} views</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{discussion.content}</p>
            <div className="mt-4 flex items-center gap-4">
              <button onClick={() => upvoteDiscussion.mutate(discussionId)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600">
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
                    {reply.author?.role === 'TEACHER' && <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50">Teacher</Badge>}
                    <span className="text-xs text-slate-400">· {timeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-wrap">{reply.content}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600">
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
      <Card className="border border-slate-200 p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Post a Reply</h3>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={4}
          placeholder="Write your reply..."
          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {error && <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
        <div className="mt-3 flex justify-end">
          <Button onClick={handleReply} disabled={createReply.isPending || !replyText.trim()} className="bg-indigo-600 text-white hover:bg-indigo-700">
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
    SUBMISSION_CREATE: 'bg-amber-50 text-amber-600',
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
    if (!confirm('Delete this announcement? This cannot be undone.')) return;
    deleteMut.mutate(id);
  };

  const handleMarkRead = (id: string) => {
    markReadMut.mutate(id);
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-600',
    NORMAL: 'bg-blue-50 text-blue-600',
    HIGH: 'bg-amber-50 text-amber-600',
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
          <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
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
            <Card key={a.id} className={cn('border p-5 shadow-sm transition-all', isUnread ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200')}>
              <div className="flex items-start gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', priorityColors[a.priority ?? 'NORMAL'] || priorityColors.NORMAL)}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                        {isUnread && <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">New</Badge>}
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
                    <button onClick={() => handleMarkRead(a.id)} className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700">
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
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
                    <button key={p} type="button" onClick={() => setNewPriority(p)} className={cn('rounded-lg border py-2 text-xs font-medium transition-colors', p === newPriority ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{p}</button>
                  ))}
                </div>
              </div>
              {formErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{formErr}</div>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={handleCreate} disabled={createMut.isPending} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
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

// ─── Admin Dashboard View ─────────────────────────────────────────────────
function AdminView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { data: platformData, isLoading } = usePlatformDashboard();
  const stats = platformData?.stats;

  const platformStats = [
    { label: 'Total Users', value: String(stats?.users?.total ?? 0), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: `+${stats?.users?.newThisWeek ?? 0}` },
    { label: 'Active Courses', value: String(stats?.courses?.total ?? 0), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', trend: `+${stats?.courses?.published ?? 0}` },
    { label: 'Enrollments', value: String(stats?.enrollments?.total ?? 0), icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `+${stats?.enrollments?.newThisWeek ?? 0}` },
    { label: 'Certificates', value: String(stats?.engagement?.certificatesIssued ?? 0), icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', trend: '' },
    { label: 'Quiz Attempts', value: String(stats?.engagement?.quizAttempts ?? 0), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: '' },
    { label: 'Submissions', value: String(stats?.engagement?.assignmentSubmissions ?? 0), icon: Target, color: 'text-cyan-600', bg: 'bg-cyan-50', trend: '' },
  ];

  const userDistribution = [
    { name: 'Students', value: stats?.users?.students ?? 0, color: '#4F46E5' },
    { name: 'Teachers', value: stats?.users?.teachers ?? 0, color: '#10B981' },
    { name: 'Admins', value: stats?.users?.admins ?? 0, color: '#F59E0B' },
  ];
  const totalUsers = stats?.users?.total ?? 0;

  // Charts with mock fallback — the API doesn't expose these yet
  const enrollmentTrend = [
    { month: 'Jan', enrollments: 420, revenue: 18 },
    { month: 'Feb', enrollments: 510, revenue: 22 },
    { month: 'Mar', enrollments: 680, revenue: 28 },
    { month: 'Apr', enrollments: 590, revenue: 25 },
    { month: 'May', enrollments: 720, revenue: 32 },
    { month: 'Jun', enrollments: 890, revenue: 38 },
    { month: 'Jul', enrollments: 950, revenue: 42 },
    { month: 'Aug', enrollments: 1120, revenue: 48 },
  ];
  const topCourses = [
    { id: 1, title: 'UI Design Fundamentals', students: 1248, revenue: '$12,480', completion: 78 },
    { id: 2, title: 'Advanced TypeScript', students: 892, revenue: '$8,920', completion: 65 },
    { id: 3, title: 'Project Management', students: 634, revenue: '$6,340', completion: 82 },
    { id: 4, title: 'Data Science with Python', students: 521, revenue: '$5,210', completion: 45 },
    { id: 5, title: 'Digital Marketing', students: 387, revenue: '$3,870', completion: 71 },
  ];

  if (isLoading) {
    return <main className="mx-auto max-w-7xl p-4 lg:p-6"><div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading admin dashboard…</div></main>;
  }

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Platform overview · Last updated just now</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200 text-slate-600"><Download className="mr-1.5 h-4 w-4" />Export</Button>
          <Button onClick={() => onNavigate('users')} className="bg-indigo-600 text-white hover:bg-indigo-700"><UserPlus className="mr-1.5 h-4 w-4" />Add User</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {platformStats.map((stat) => (
          <Card key={stat.label} className="border border-slate-200 p-4 shadow-sm">
            <div className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-lg', stat.bg)}>
              <stat.icon className={cn('h-4 w-4', stat.color)} />
            </div>
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              <span className="text-[10px] font-semibold text-emerald-600">{stat.trend}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Enrollment Chart + Top Courses */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-slate-200 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Enrollment & Revenue Trend</h2>
                <p className="text-sm text-slate-500">Monthly enrollment count and revenue</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">+18% YoY</Badge>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={enrollmentTrend}>
                <defs>
                  <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }} />
                <Area type="monotone" dataKey="enrollments" stroke="#4F46E5" strokeWidth={2} fill="url(#colorEnroll)" name="Enrollments" />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#colorRev)" name="Revenue ($K)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Courses Table */}
          <Card className="border border-slate-200 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Top Performing Courses</h2>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">View all</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="pb-2 pr-4 text-left font-medium">Course</th>
                    <th className="pb-2 pr-4 text-right font-medium">Students</th>
                    <th className="pb-2 pr-4 text-right font-medium">Revenue</th>
                    <th className="pb-2 text-right font-medium">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {topCourses.map((course) => (
                    <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 pr-4 font-medium text-slate-900">{course.title}</td>
                      <td className="py-3 pr-4 text-right text-slate-600">{course.students.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-emerald-600">{course.revenue}</td>
                      <td className="py-3 text-right">
                        <div className="ml-auto flex w-20 items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${course.completion}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{course.completion}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: User Distribution + Quick Actions */}
        <div className="space-y-6">
          <Card className="border border-slate-200 p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">User Distribution</h2>
            <div className="relative h-40">
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
                <p className="text-[10px] text-slate-400">Total Users</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {userDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-slate-200 p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Manage Users', icon: Users, view: 'users' as View, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Create Course', icon: Plus, view: 'course-create' as View, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'View Reports', icon: BarChart3, view: 'admin' as View, color: 'text-amber-600 bg-amber-50' },
                { label: 'Gamification', icon: Trophy, view: 'gamification' as View, color: 'text-purple-600 bg-purple-50' },
              ].map((action) => (
                <button key={action.label} onClick={() => onNavigate(action.view)} className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm font-medium text-slate-700 transition-all hover:border-indigo-200 hover:bg-slate-50">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', action.color)}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  {action.label}
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
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

  const { data, isLoading } = useUsers({ page: 1, limit: 50, search: search || undefined });
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
    TEACHER: 'bg-indigo-50 text-indigo-600',
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
          onSuccess: () => setShowCreate(false),
          onError: (err: any) => setFormErr(err.response?.data?.message || 'Failed to update user.'),
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
          onSuccess: () => setShowCreate(false),
          onError: (err: any) => setFormErr(err.response?.data?.message || 'Failed to create user.'),
        },
      );
    }
  };

  const handleToggleActive = (u: any) => {
    updateUser.mutate({ id: u.id, data: { isActive: !u.isActive } });
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteUser.mutate(deletingUser.id, {
      onSuccess: () => setDeletingUser(null),
      onError: (err: any) => { setFormErr(err.response?.data?.message || 'Failed to delete user.'); setDeletingUser(null); },
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
          <Button variant="outline" className="border-slate-200 text-slate-600"><Download className="mr-1.5 h-4 w-4" />Export CSV</Button>
          <Button onClick={openCreate} className="bg-indigo-600 text-white hover:bg-indigo-700"><UserPlus className="mr-1.5 h-4 w-4" />Add User</Button>
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
              <button key={role} onClick={() => setRoleFilter(role)} className={cn('rounded-lg px-3 py-2 text-xs font-medium transition-colors', roleFilter === role ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
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
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">{user.avatar}</div>
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
                      <span className="text-xs text-slate-600 hover:text-indigo-600">{user.status}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{user.courses}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{user.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(user)} title="Edit user" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><Edit className="h-4 w-4" /></button>
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
                    <button key={role} type="button" onClick={() => setFormRole(role)} className={cn('rounded-lg border py-2 text-xs font-medium transition-colors', role === formRole ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{role}</button>
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
                <Button onClick={handleSubmit} disabled={createUser.isPending || updateUser.isPending} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
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
              <p className="mt-2 text-xs text-amber-600">This action cannot be undone.</p>
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
  const { data: certData } = useMyCertificates();

  const level = (levelData as any)?.level;
  const totalXP = level?.totalXP ?? 0;
  const currentLevel = level?.level ?? 1;
  const progressPct = level?.progressToNextLevel ?? 0;

  // Combine earned badges with mock badge catalog
  const earnedBadges = (badgesData?.badges ?? []) as any[];
  const badges = [
    { id: 1, name: 'Quick Learner', icon: Zap, color: 'bg-amber-100 text-amber-600', earned: true, date: '2 days ago' },
    { id: 2, name: 'Quiz Master', icon: FileQuestion, color: 'bg-indigo-100 text-indigo-600', earned: true, date: '1 week ago' },
    { id: 3, name: 'Perfect Score', icon: Star, color: 'bg-purple-100 text-purple-600', earned: true, date: '3 days ago' },
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
      <Card className="mb-6 overflow-hidden border border-indigo-100 bg-gradient-to-br from-indigo-600 to-indigo-500 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Trophy className="h-8 w-8 text-amber-300" />
            </div>
            <div>
              <p className="text-sm text-indigo-100">Your Level</p>
              <p className="text-3xl font-bold text-white">Level {currentLevel}</p>
              <p className="text-xs text-indigo-200">{totalXP.toLocaleString()} XP · {level?.nextLevelXP ? `${level.nextLevelXP - level.currentLevelXP} XP to Level ${currentLevel + 1}` : ''}</p>
            </div>
          </div>
          <div className="sm:w-64">
            <div className="mb-1.5 flex items-center justify-between text-xs text-indigo-100">
              <span>Level {currentLevel}</span>
              <span>{Math.round(progressPct)}% to Level {currentLevel + 1}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-white" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Badges + Certificates */}
        <div className="space-y-6 lg:col-span-2">
          {/* Badges */}
          <Card className="border border-slate-200 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Badge Collection</h2>
                <p className="text-sm text-slate-500">{earnedCount} of {badges.length} badges earned</p>
              </div>
              <Medal className="h-5 w-5 text-amber-500" />
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
          <Card className="border border-slate-200 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Certificates</h2>
                <p className="text-sm text-slate-500">{certificates.length} certificates earned</p>
              </div>
              <Award className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="space-y-3">
              {certList.map((cert) => (
                <div key={cert.id} className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                    <BadgeCheck className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{cert.title}</p>
                    <p className="text-xs text-slate-500">Issued {cert.issueDate} · {cert.instructor}</p>
                    <p className="mt-0.5 text-[10px] font-mono text-slate-400">{cert.ref}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="border-slate-200 text-slate-600"><Download className="mr-1 h-3.5 w-3.5" />PDF</Button>
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">Verify</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Leaderboard + Streaks */}
        <div className="space-y-6">
          {/* Learning Streak */}
          <Card className="border border-slate-200 p-5 shadow-sm">
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
          <Card className="border border-slate-200 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Leaderboard</h2>
              <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50">This Week</Badge>
            </div>
            <div className="space-y-1">
              {liveLeaderboard.map((learner) => (
                <div key={learner.rank} className={cn('flex items-center gap-3 rounded-lg px-2 py-2', learner.name === 'Ricky Fajrin' ? 'bg-indigo-50' : 'hover:bg-slate-50')}>
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', learner.rank === 1 ? 'bg-amber-100 text-amber-700' : learner.rank === 2 ? 'bg-slate-200 text-slate-600' : learner.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400')}>
                    {learner.rank}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">{learner.avatar}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{learner.name}</p>
                    <p className="text-[10px] text-slate-400">Level {learner.level} · {learner.courses} courses</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600">{learner.xp.toLocaleString()}</p>
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
    { type: 'Video', icon: Video, color: 'bg-indigo-50 text-indigo-600', desc: 'Upload or embed video content' },
    { type: 'Quiz', icon: FileQuestion, color: 'bg-emerald-50 text-emerald-600', desc: 'Create quizzes with multiple question types' },
    { type: 'Assignment', icon: FileText, color: 'bg-amber-50 text-amber-600', desc: 'File upload or text-based assignments' },
    { type: 'Document', icon: File, color: 'bg-purple-50 text-purple-600', desc: 'Upload PDF, DOCX, or other documents' },
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
              <Button onClick={() => onNavigate('dashboard')} className="bg-indigo-600 text-white hover:bg-indigo-700">Back to Dashboard</Button>
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
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors', step >= s.num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400')}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={cn('mt-1.5 text-xs font-medium', step >= s.num ? 'text-slate-900' : 'text-slate-400')}>{s.label}</span>
            </div>
            {idx < steps.length - 1 && <div className={cn('mx-2 h-0.5 w-12 sm:w-24', step > s.num ? 'bg-indigo-600' : 'bg-slate-200')} />}
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
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Brief description of what students will learn..." className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Category</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none">
                  <option>Design</option><option>Programming</option><option>Business</option><option>Data Science</option><option>Marketing</option><option>General</option>
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Difficulty</Label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none">
                  <option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-slate-700">Thumbnail</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-6 hover:border-indigo-300 hover:bg-slate-50">
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
            <Button onClick={() => setStep(2)} disabled={!title || !description} className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">Next: Add Content<ChevronRight className="ml-1.5 h-4 w-4" /></Button>
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
            <Button onClick={() => setStep(3)} className="bg-indigo-600 text-white hover:bg-indigo-700">Next: Review & Publish<ChevronRight className="ml-1.5 h-4 w-4" /></Button>
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
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
                  <button onClick={() => setAllowReg(!allowReg)} className={cn('relative h-6 w-11 rounded-full transition-colors', allowReg ? 'bg-indigo-600' : 'bg-slate-300')}>
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
                  <Button onClick={handleSaveGeneral} disabled={batchUpdate.isPending} className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50"><Mail className="h-4 w-4 text-indigo-600" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{tpl.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-400">{tpl.subject}</p>
                    </div>
                    <Badge className={cn('rounded-full', tpl.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                      {tpl.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><Edit className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'grading' && (
            <Card className="border border-slate-200 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Grading Scales</h2>
                <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700"><Plus className="mr-1 h-3.5 w-3.5" />Add Scale</Button>
              </div>
              <div className="space-y-3">
                {gradingScales.map((scale) => (
                  <div key={scale.name} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{scale.name}</p>
                        {scale.isDefault && <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50">Default</Badge>}
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
                <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700"><Plus className="mr-1 h-3.5 w-3.5" />Add Year</Button>
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
                  <textarea value={maintMsg} onChange={(e) => setMaintMsg(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-amber-700">When enabled, only whitelisted IPs can access the platform. All other users see the maintenance message.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Save Settings</Button>
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
                    className={cn('relative h-6 w-11 rounded-full transition-colors', isEnabled(nt.type, 'IN_APP') ? 'bg-indigo-600' : 'bg-slate-300')}
                  >
                    <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', isEnabled(nt.type, 'IN_APP') ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => handleToggle(nt.type, 'EMAIL', !isEnabled(nt.type, 'EMAIL'))}
                    className={cn('relative h-6 w-11 rounded-full transition-colors', isEnabled(nt.type, 'EMAIL') ? 'bg-indigo-600' : 'bg-slate-300')}
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
            <button key={conv.id} onClick={() => setActiveChat(conv.id)} className={cn('flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition-colors', activeChatId === conv.id ? 'bg-indigo-50' : 'hover:bg-slate-50')}>
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">{conv.avatar}</div>
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
                  {conv.unread > 0 && <span className="ml-1 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">{conv.unread}</span>}
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">{activeConv?.avatar}</div>
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
                <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm', msg.isMe ? 'rounded-br-md bg-indigo-600 text-white' : 'rounded-bl-md bg-white text-slate-700 border border-slate-200')}>
                  <p>{msg.text}</p>
                  <p className={cn('mt-1 text-[10px]', msg.isMe ? 'text-indigo-200' : 'text-slate-400')}>{msg.time}</p>
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
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button onClick={handleSend} disabled={!message.trim()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
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
          // Update the Zustand auth store too so the header reflects the new name immediately
          const updated = data?.user ?? data;
          if (updated) {
            updateUserStore({ firstName: updated.firstName, lastName: updated.lastName });
          }
          setShowEdit(false);
        },
        onError: (err: any) => setEditErr(err.response?.data?.message || 'Failed to update profile.'),
      },
    );
  };

  const myCourses = (studentData?.courses ?? []).map((c: any) => ({
    title: c.course?.title ?? 'Untitled',
    progress: c.progressPercentage ?? 0,
    instructor: '—',
    difficulty: c.course?.difficulty ?? 'Beginner',
  }));
  const courses = myCourses.length > 0 ? myCourses : [
    { title: 'UI Design Fundamentals', progress: 75, instructor: 'Sarah Chen', difficulty: 'Beginner' },
    { title: 'Advanced TypeScript', progress: 40, instructor: 'Mike Rodriguez', difficulty: 'Advanced' },
    { title: 'Project Management', progress: 90, instructor: 'Emily Davis', difficulty: 'Intermediate' },
    { title: 'Data Science with Python', progress: 15, instructor: 'James Park', difficulty: 'Intermediate' },
  ];

  const achievements = [
    { icon: Trophy, label: `Level ${currentLevel}`, sublabel: `${totalXP.toLocaleString()} XP`, color: 'bg-amber-50 text-amber-600' },
    { icon: Flame, label: '12-day streak', sublabel: 'Longest: 21 days', color: 'bg-orange-50 text-orange-600' },
    { icon: BookOpen, label: `${studentData?.stats?.totalEnrollments ?? 0} courses`, sublabel: `${studentData?.stats?.active ?? 0} in progress`, color: 'bg-indigo-50 text-indigo-600' },
    { icon: Award, label: '2 certificates', sublabel: 'This year', color: 'bg-emerald-50 text-emerald-600' },
  ];

  const activity = [
    { type: 'quiz', title: 'Scored 92% on Design Principles Quiz', time: '2 hours ago', icon: FileQuestion, color: 'text-emerald-600' },
    { type: 'lesson', title: 'Completed: Introduction to Generics', time: '5 hours ago', icon: CheckCircle2, color: 'text-indigo-600' },
    { type: 'badge', title: 'Earned Badge: Quick Learner (+50 XP)', time: '1 day ago', icon: Zap, color: 'text-amber-600' },
    { type: 'assignment', title: 'Submitted: User Research Report', time: '2 days ago', icon: FileText, color: 'text-blue-600' },
    { type: 'certificate', title: 'Earned Certificate: UI Design Fundamentals', time: '3 days ago', icon: Award, color: 'text-purple-600' },
  ];

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
      <Card className="mb-6 overflow-hidden border border-slate-200 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-indigo-600 to-purple-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-indigo-100 text-2xl font-bold text-indigo-600 shadow-lg">{initials}</div>
              <div className="pb-2">
                <h1 className="text-xl font-bold text-slate-900">{fullName}</h1>
                <p className="text-sm capitalize text-slate-500">{roleLabel} · Joined {joinedDate}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50"><Trophy className="mr-1 h-3 w-3" />Level {currentLevel}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50"><Flame className="mr-1 h-3 w-3" />12-day streak</Badge>
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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200 p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-slate-900">About</h2>
            <p className="text-sm text-slate-600">Passionate UI/UX designer in training. Focused on creating intuitive, accessible digital experiences. Currently learning wireframing, design systems, and usability principles.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-500"><Mail className="h-4 w-4 text-slate-400" />ricky@trenning.com</div>
              <div className="flex items-center gap-2 text-slate-500"><BookOpen className="h-4 w-4 text-slate-400" />4 enrolled courses</div>
              <div className="flex items-center gap-2 text-slate-500"><Award className="h-4 w-4 text-slate-400" />2 certificates earned</div>
            </div>
          </Card>
          <Card className="border border-slate-200 p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Recent Activity</h2>
            <div className="space-y-3">
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
          {courses.map((course) => (
            <Card key={course.title} className="border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-400">{course.instructor} · {course.difficulty}</p>
                </div>
                <div className="ml-4 w-32">
                  <div className="mb-1 flex items-center justify-between text-xs"><span className="text-slate-400">Progress</span><span className="font-semibold text-slate-700">{course.progress}%</span></div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${course.progress}%` }} /></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <Card className="border border-slate-200 p-5 shadow-sm">
          <div className="space-y-4">
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
          {[
            { name: 'Quick Learner', icon: Zap, color: 'bg-amber-50 text-amber-600', earned: true },
            { name: 'Quiz Master', icon: FileQuestion, color: 'bg-indigo-50 text-indigo-600', earned: true },
            { name: 'Perfect Score', icon: Star, color: 'bg-purple-50 text-purple-600', earned: true },
            { name: 'Course Completer', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', earned: true },
            { name: '7-Day Streak', icon: Flame, color: 'bg-orange-50 text-orange-600', earned: true },
            { name: 'Discussion Pro', icon: MessageSquare, color: 'bg-blue-50 text-blue-600', earned: false },
            { name: 'Design Master', icon: Award, color: 'bg-pink-50 text-pink-600', earned: false },
            { name: 'Top 10', icon: Trophy, color: 'bg-yellow-50 text-yellow-600', earned: false },
          ].map((badge) => (
            <Card key={badge.name} className={cn('flex flex-col items-center p-4 text-center border shadow-sm', badge.earned ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-60')}>
              <div className={cn('mb-2 flex h-12 w-12 items-center justify-center rounded-full', badge.earned ? badge.color : 'bg-slate-200 text-slate-400')}>
                <badge.icon className="h-6 w-6" />
              </div>
              <p className="text-xs font-medium text-slate-900">{badge.name}</p>
              <p className="text-[10px] text-slate-400">{badge.earned ? 'Earned' : 'Locked'}</p>
            </Card>
          ))}
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
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {editErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{editErr}</div>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
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
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
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

// ─── Main Page ────────────────────────────────────────────────────────────
export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [view, setView] = useState<View>(isAuthenticated ? 'dashboard' : 'login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string>('');
  const [lastAttemptId, setLastAttemptId] = useState<string>('');

  const handleNavigate = (v: View) => {
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

  // Login view — no sidebar/header
  if (view === 'login' || !isAuthenticated) {
    return <LoginPage onLogin={() => handleNavigate('dashboard')} />;
  }

  // All other views — with sidebar + header
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentView={view} onNavigate={handleNavigate} />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} onNavigate={handleNavigate} currentView={view} onSelectCourse={handleSelectCourse} />
        {view === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {view === 'catalog' && <CatalogView onSelectCourse={handleSelectCourse} onNavigate={handleNavigate} />}
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
    </div>
  );
}
