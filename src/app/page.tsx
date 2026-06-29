'use client';

import { useState, useEffect } from 'react';
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
import { useLogin, useLogout, useMyProfile, useCourses, useCourse, useStudentDashboard, usePlatformDashboard, useUsers, useDiscussions, useCreateDiscussion, useConversations, useMessages, useSendMessage, useUserLevel, useUserBadges, useLeaderboard, useMyCertificates, useSettings, useNotifications, useQuizzes, useQuiz, useStartQuizAttempt, useSubmitQuizAttempt, useAttemptResults, useAssignments, useAssignment, useSubmissions, useCreateSubmission, useEnrollments } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
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
type View = 'login' | 'dashboard' | 'catalog' | 'course-detail' | 'quiz' | 'quiz-results' | 'assignment' | 'discussions' | 'admin' | 'users' | 'gamification' | 'course-create' | 'settings' | 'messages' | 'profile';

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
  { label: 'Messages', icon: MessageSquare, badge: 3, view: 'messages' as View },
  { label: 'Admin Panel', icon: BarChart3, view: 'admin' as View },
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
    if (item.label === 'Admin Panel' || item.label === 'User Management' || item.label === 'Create Course') {
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
function Header({ onMenuClick, onNavigate, currentView }: { onMenuClick: () => void; onNavigate: (v: View) => void; currentView: View }) {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const { data: notifData } = useNotifications({ limit: 5, unreadOnly: true });
  const unreadCount = (notifData?.data ?? []).length;
  const headerLinks = [
    { label: 'Home', view: 'dashboard' as View },
    { label: 'My Learning', view: 'dashboard' as View },
    { label: 'Catalog', view: 'catalog' as View },
    { label: 'Favorites', view: 'dashboard' as View },
  ];
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Guest';
  const initials = user ? getInitials(displayName) : 'G';
  const roleLabel = user?.role.toLowerCase() ?? 'visitor';
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
        <input type="text" placeholder="Search..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Bell className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}</button>
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

// ─── Course Detail View ──────────────────────────────────────────────────
function CourseDetailView({ courseId, onNavigate, onSelectQuiz, onSelectAssignment }: { courseId: string; onNavigate: (v: View) => void; onSelectQuiz?: (id: string) => void; onSelectAssignment?: (id: string) => void }) {
  const { data: courseData, isLoading } = useCourse(courseId || null);
  // Normalize the API response into our Course shape; fall back to first mock for layout
  const apiCourse = courseData as any;
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
    modules: (apiCourse.modules ?? []).map((m: any, mi: number) => ({
      id: m.id ?? mi,
      title: m.title ?? `Module ${mi + 1}`,
      lessons: (m.contents ?? m.lessons ?? []).map((l: any, li: number) => ({
        id: l.id ?? li,
        title: l.title ?? 'Untitled',
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
            <Button className="bg-white text-indigo-600 hover:bg-white/90"><PlayCircle className="mr-2 h-4 w-4" />Continue Learning</Button>
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
            {/* Video placeholder */}
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
          </Card>
        </div>

        {/* Course Sidebar — Table of Contents */}
        <div>
          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Course Content</h3>
              <p className="mt-0.5 text-xs text-slate-400">{completedLessons}/{totalLessons} lessons completed</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-2">
              {course.modules?.map((module, mIdx) => (
                <div key={module.id} className="mb-2">
                  <button onClick={() => setActiveModule(mIdx)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50">
                    <span className="text-sm font-semibold text-slate-900">{module.title}</span>
                    <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', mIdx === activeModule && 'rotate-180')} />
                  </button>
                  {mIdx === activeModule && (
                    <div className="mt-1 space-y-0.5 pl-2">
                      {module.lessons.map((lesson, lIdx) => {
                        const Icon = lessonTypeIcons[lesson.type] || Video;
                        return (
                          <button key={lesson.id} onClick={() => { setActiveModule(mIdx); setActiveLesson(lIdx); }} className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors', mIdx === activeModule && lIdx === activeLesson ? 'bg-indigo-50' : 'hover:bg-slate-50')}>
                            <div className={cn('flex h-5 w-5 items-center justify-center rounded-full', lesson.completed ? 'bg-emerald-100' : 'bg-slate-100')}>
                              {lesson.completed ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Icon className="h-3 w-3 text-slate-400" />}
                            </div>
                            <div className="flex-1"><p className={cn('text-xs', mIdx === activeModule && lIdx === activeLesson ? 'font-medium text-indigo-600' : 'text-slate-600')}>{lesson.title}</p></div>
                            <span className="text-[10px] text-slate-400">{lesson.duration}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
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
  const { data, isLoading } = useQuizzes({ limit: 50, status: 'PUBLISHED' });
  const quizzes = (data?.data ?? []) as any[];

  return (
    <main className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-700">Home</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Quizzes</span>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Available Quizzes</h1>
        <p className="mt-1 text-sm text-slate-500">{quizzes.length} published quizzes · Test your knowledge</p>
      </div>
      {isLoading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading quizzes…</div>}
      {!isLoading && quizzes.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No quizzes available yet.</div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quizzes.map((q: any) => (
          <Card key={q.id} className="cursor-pointer border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md" onClick={() => onSelectQuiz(q.id)}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><FileQuestion className="h-5 w-5 text-emerald-600" /></div>
              <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">{q.questionCount ?? 0} Q</Badge>
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
    </main>
  );
}

// ─── Quiz Runner (single quiz attempt) ───────────────────────────────────
function QuizRunner({ quizId, onNavigate, onSubmitted }: { quizId: string; onNavigate: (v: View) => void; onSubmitted: (attemptId: string) => void }) {
  const { data: quizData, isLoading } = useQuiz(quizId || null);
  const { data: enrollmentsData } = useEnrollments({ status: 'ACTIVE' });
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
            <Button onClick={handleStart} disabled={startAttempt.isPending || !matchingEnrollment} className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              {startAttempt.isPending ? 'Starting…' : matchingEnrollment ? 'Start Quiz' : 'No active enrollment'}
            </Button>
            {!matchingEnrollment && <p className="mt-2 text-xs text-amber-600">You need an active enrollment to take this quiz.</p>}
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

// ─── Assignment Runner (single assignment view) ──────────────────────────
function AssignmentRunner({ assignmentId, onNavigate }: { assignmentId: string; onNavigate: (v: View) => void }) {
  const { data: assignData, isLoading } = useAssignment(assignmentId || null);
  const { data: submissionsData } = useSubmissions(assignmentId || null);
  const { data: enrollmentsData } = useEnrollments({ status: 'ACTIVE' });
  const createSubmission = useCreateSubmission();

  const [submissionText, setSubmissionText] = useState('');
  const [fileName, setFileName] = useState('');
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
    if (file) setFileName(file.name);
  };

  const handleSubmit = () => {
    if (!matchingEnrollment) {
      setError('No active enrollment. Enroll in the course first.');
      return;
    }
    if (!submissionText.trim()) {
      setError('Please add a comment or upload a file.');
      return;
    }
    setError('');
    createSubmission.mutate(
      {
        assignmentId,
        enrollmentId: matchingEnrollment.id,
        content: { text: submissionText, links: [] },
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          setSubmissionText('');
          setFileName('');
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
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-8 hover:border-indigo-300 hover:bg-slate-50">
                      <Upload className="mb-2 h-8 w-8 text-slate-400" />
                      <p className="text-sm text-slate-500">{fileName || 'Click to upload or drag and drop'}</p>
                      <p className="mt-1 text-xs text-slate-400">{assignment.allowedFileTypes?.join(', ').toUpperCase() ?? 'PDF, DOCX, ZIP'} up to {assignment.maxFileSizeMB}MB</p>
                      <input type="file" className="hidden" onChange={handleFileUpload} accept={assignment.allowedFileTypes?.map((t: string) => `.${t}`).join(',')} />
                    </label>
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
                <Button onClick={handleSubmit} disabled={createSubmission.isPending || (!submissionText.trim() && !fileName)} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
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
    </main>
  );
}

// ─── Discussions View ─────────────────────────────────────────────────────
function DiscussionsView({ onNavigate }: { onNavigate: (v: View) => void }) {
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
          <Card key={thread.id} className="cursor-pointer border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md">
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

  const { data, isLoading } = useUsers({ page: 1, limit: 50, search: search || undefined });
  const apiUsers = (data?.data ?? []).map((u: any) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    role: u.role,
    status: u.isActive ? 'Active' : 'Inactive',
    courses: 0,
    joined: u.createdAt ? formatDate(u.createdAt) : '—',
    avatar: getInitials(`${u.firstName} ${u.lastName}`),
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
          <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white hover:bg-indigo-700"><UserPlus className="mr-1.5 h-4 w-4" />Add User</Button>
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
                    <div className="flex items-center gap-1.5">
                      <div className={cn('h-2 w-2 rounded-full', user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300')} />
                      <span className="text-xs text-slate-600">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{user.courses}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{user.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><Edit className="h-4 w-4" /></button>
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create New User</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="mb-1.5 block text-sm font-medium text-slate-700">First Name</Label><Input placeholder="John" /></div>
                <div><Label className="mb-1.5 block text-sm font-medium text-slate-700">Last Name</Label><Input placeholder="Doe" /></div>
              </div>
              <div><Label className="mb-1.5 block text-sm font-medium text-slate-700">Email</Label><Input type="email" placeholder="john@trenning.com" /></div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['STUDENT', 'TEACHER', 'ADMIN'].map((role) => (
                    <button key={role} className={cn('rounded-lg border py-2 text-xs font-medium transition-colors', role === 'STUDENT' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{role}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={() => setShowCreate(false)} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700">Create User</Button>
              </div>
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
  const [difficulty, setDifficulty] = useState('Beginner');

  const steps = [
    { num: 1, label: 'General Info' },
    { num: 2, label: 'Add Content' },
    { num: 3, label: 'Assign Learners' },
  ];

  const contentTypes = [
    { type: 'Page', icon: File, color: 'bg-blue-50 text-blue-600', desc: 'Rich text content with images, videos, and embeds' },
    { type: 'Video', icon: Video, color: 'bg-indigo-50 text-indigo-600', desc: 'Upload or embed video content' },
    { type: 'Quiz', icon: FileQuestion, color: 'bg-emerald-50 text-emerald-600', desc: 'Create quizzes with multiple question types' },
    { type: 'Assignment', icon: FileText, color: 'bg-amber-50 text-amber-600', desc: 'File upload or text-based assignments' },
    { type: 'Document', icon: File, color: 'bg-purple-50 text-purple-600', desc: 'Upload PDF, DOCX, or other documents' },
    { type: 'External Link', icon: Link2, color: 'bg-cyan-50 text-cyan-600', desc: 'Link to external resources' },
  ];

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
                  <option>Design</option><option>Programming</option><option>Business</option><option>Data Science</option><option>Marketing</option>
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Difficulty</Label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none">
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
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
          <p className="mb-4 text-sm text-slate-500">Choose what type of content you want to add to this course</p>

          <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3">
            <GripVertical className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-medium text-slate-700">Module 1: Introduction</span>
            <button className="ml-auto text-xs text-indigo-600 hover:text-indigo-700">Rename</button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {contentTypes.map((ct) => (
              <button key={ct.type} className="flex flex-col items-center rounded-lg border border-slate-200 p-4 text-center transition-all hover:border-indigo-200 hover:shadow-sm">
                <div className={cn('mb-2 flex h-10 w-10 items-center justify-center rounded-lg', ct.color)}>
                  <ct.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-900">{ct.type}</p>
                <p className="mt-1 text-[10px] text-slate-400">{ct.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="border-slate-200 text-slate-600"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button>
            <Button onClick={() => setStep(3)} className="bg-indigo-600 text-white hover:bg-indigo-700">Next: Assign Learners<ChevronRight className="ml-1.5 h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {/* Step 3: Assign Learners */}
      {step === 3 && (
        <Card className="border border-slate-200 p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Assign Learners</h2>
          <p className="mb-4 text-sm text-slate-500">Select who should be enrolled in this course</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              <div className="flex-1"><p className="text-sm font-medium text-slate-900">All Students</p><p className="text-xs text-slate-400">2,412 students enrolled</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              <div className="flex-1"><p className="text-sm font-medium text-slate-900">Design Department</p><p className="text-xs text-slate-400">186 students</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              <div className="flex-1"><p className="text-sm font-medium text-slate-900">New Hires (2024)</p><p className="text-xs text-slate-400">42 students</p></div>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600">
              <UserPlus className="h-4 w-4" />Select Individual Learners
            </button>
          </div>

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="border-slate-200 text-slate-600"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button>
            <Button onClick={() => onNavigate('dashboard')} className="bg-emerald-600 text-white hover:bg-emerald-700"><CheckCircle2 className="mr-1.5 h-4 w-4" />Publish Course</Button>
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
  const settings = (settingsData?.settings ?? []) as any[];
  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value ?? '';
  const [siteName, setSiteName] = useState(getSetting('siteName') || 'Trenning LMS');
  const [supportEmail, setSupportEmail] = useState(getSetting('supportEmail') || 'support@trenning.com');
  const [allowReg, setAllowReg] = useState(getSetting('allowRegistration') ?? true);
  const [maintMode, setMaintMode] = useState(false);
  const [maintMsg, setMaintMsg] = useState('Platform under maintenance.');

  // Keep form state in sync once settings load
  useEffect(() => {
    setSiteName(getSetting('siteName') || 'Trenning LMS');
    setSupportEmail(getSetting('supportEmail') || 'support@trenning.com');
    setAllowReg(getSetting('allowRegistration') ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsData]);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email Templates', icon: Mail },
    { id: 'grading', label: 'Grading Scales', icon: Award },
    { id: 'academic', label: 'Academic Years', icon: Calendar },
    { id: 'maintenance', label: 'Maintenance', icon: AlertCircle },
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
                <div className="flex justify-end">
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Save Changes</Button>
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
        </div>
      </div>
    </main>
  );
}

// ─── Messages View ───────────────────────────────────────────────────────
function MessagesView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [activeChat, setActiveChat] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { data: convData } = useConversations();
  const { data: msgData } = useMessages(activeChat || null);
  const sendMutation = useSendMessage();

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

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate({ content: message, receiverId: activeConv?.id?.startsWith('mock') ? undefined : activeConv?.id });
    setMessage('');
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
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
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 border border-slate-200">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Plus className="h-5 w-5" /></button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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

  const me = profile ?? authUser;
  const level = (levelData as any)?.level;
  const totalXP = level?.totalXP ?? 0;
  const currentLevel = level?.level ?? 1;

  const fullName = me ? `${me.firstName} ${me.lastName}` : 'Guest';
  const initials = me ? getInitials(fullName) : 'G';
  const joinedDate = me?.createdAt ? formatDate(me.createdAt) : (me?.lastLogin ? formatDate(me.lastLogin) : '—');
  const roleLabel = me?.role ? me.role.toLowerCase() : 'member';

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
            <Button variant="outline" className="border-slate-200 text-slate-600"><Edit className="mr-1.5 h-4 w-4" />Edit Profile</Button>
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
        <Header onMenuClick={() => setSidebarOpen(true)} onNavigate={handleNavigate} currentView={view} />
        {view === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {view === 'catalog' && <CatalogView onSelectCourse={handleSelectCourse} onNavigate={handleNavigate} />}
        {view === 'course-detail' && <CourseDetailView courseId={selectedCourseId} onNavigate={handleNavigate} onSelectQuiz={handleSelectQuiz} onSelectAssignment={handleSelectAssignment} />}
        {view === 'quiz' && <QuizView quizId={selectedQuizId} onNavigate={handleNavigate} onSelectQuiz={handleSelectQuiz} onSubmitted={handleQuizSubmitted} />}
        {view === 'quiz-results' && <QuizResultsView attemptId={lastAttemptId} onNavigate={handleNavigate} />}
        {view === 'assignment' && <AssignmentView assignmentId={selectedAssignmentId} onNavigate={handleNavigate} onSelectAssignment={handleSelectAssignment} />}
        {view === 'discussions' && <DiscussionsView onNavigate={handleNavigate} />}
        {view === 'admin' && <AdminView onNavigate={handleNavigate} />}
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
