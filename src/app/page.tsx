'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, FileText, GraduationCap, Award, Settings,
  Bell, Search, Calendar, ChevronRight, Menu, X, LogOut, MessageSquare,
  Layers, Star, FileQuestion, Route, Crown, TrendingUp, ArrowUpRight,
  Plus, Filter, PlayCircle, Sparkles, Clock, Users, CheckCircle2,
  AlertCircle, Lock, Mail, Eye, EyeOff, ArrowLeft, BookMarked,
  Video, File, Link2, ChevronDown, MoreHorizontal, Zap, CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
type View = 'login' | 'dashboard' | 'catalog' | 'course-detail' | 'quiz' | 'quiz-results' | 'assignment' | 'discussions';

interface Course {
  id: number; title: string; description: string; instructor: string;
  category: string; difficulty: string; duration: string; lessons: number;
  students: number; rating: number; progress?: number; thumbnail: string;
  modules: Module[];
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
  { label: 'Certificates', icon: Award },
  { label: 'Discussions', icon: MessageSquare, badge: 5, view: 'discussions' as View },
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
  { id: 1, title: 'UI Design Fundamentals', description: 'Master the principles of user interface design from wireframing to prototyping.', instructor: 'Sarah Chen', category: 'Design', difficulty: 'Beginner', duration: '12h 30m', lessons: 48, students: 1248, rating: 4.8, thumbnail: 'bg-gradient-to-br from-indigo-500 to-purple-500', progress: 75, modules: [
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
  { id: 2, title: 'Advanced TypeScript', description: 'Deep dive into TypeScript generics, conditional types, and utility types.', instructor: 'Mike Rodriguez', category: 'Programming', difficulty: 'Advanced', duration: '18h 45m', lessons: 62, students: 892, rating: 4.9, thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-500', progress: 40 },
  { id: 3, title: 'Project Management Essentials', description: 'Learn Agile, Scrum, and Kanban methodologies for effective project delivery.', instructor: 'Emily Davis', category: 'Business', difficulty: 'Intermediate', duration: '8h 15m', lessons: 32, students: 634, rating: 4.7, thumbnail: 'bg-gradient-to-br from-amber-500 to-orange-500', progress: 90 },
  { id: 4, title: 'Data Science with Python', description: 'From Pandas to Machine Learning — master data science fundamentals.', instructor: 'James Park', category: 'Data Science', difficulty: 'Intermediate', duration: '24h 00m', lessons: 85, students: 521, rating: 4.6, thumbnail: 'bg-gradient-to-br from-emerald-500 to-teal-500', progress: 15 },
  { id: 5, title: 'Digital Marketing Mastery', description: 'SEO, content marketing, social media strategy, and paid advertising.', instructor: 'Lisa Wang', category: 'Marketing', difficulty: 'Beginner', duration: '10h 30m', lessons: 40, students: 387, rating: 4.5, thumbnail: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  { id: 6, title: 'Cloud Architecture', description: 'AWS, Azure, GCP — design scalable cloud-native applications.', instructor: 'David Kim', category: 'Programming', difficulty: 'Advanced', duration: '20h 00m', lessons: 55, students: 445, rating: 4.8, thumbnail: 'bg-gradient-to-br from-slate-600 to-slate-800' },
];

const categories = ['All', 'Design', 'Programming', 'Business', 'Data Science', 'Marketing'];
const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

// ─── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ open, onClose, currentView, onNavigate }: { open: boolean; onClose: () => void; currentView: View; onNavigate: (v: View) => void }) {
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
          {navItems.map((item) => (
            <button key={item.label} onClick={() => item.view && onNavigate(item.view)} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              (item.view === currentView) ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900')}>
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.badge && <span className={cn('ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold', (item.view === currentView) ? 'bg-white/20 text-white' : 'bg-red-500 text-white')}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900"><Settings className="h-4 w-4" />Settings</button>
          <button onClick={() => onNavigate('login')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900"><LogOut className="h-4 w-4" />Logout</button>
        </div>
      </aside>
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────
function Header({ onMenuClick, onNavigate, currentView }: { onMenuClick: () => void; onNavigate: (v: View) => void; currentView: View }) {
  const headerLinks = [
    { label: 'Home', view: 'dashboard' as View },
    { label: 'My Learning', view: 'dashboard' as View },
    { label: 'Catalog', view: 'catalog' as View },
    { label: 'Favorites', view: 'dashboard' as View },
  ];
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
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Bell className="h-5 w-5" /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" /></button>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="hidden text-right md:block"><p className="text-sm font-semibold text-slate-900">Ricky Fajrin</p><p className="text-xs text-slate-500">Student</p></div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">RF</div>
        </div>
      </div>
    </header>
  );
}

// ─── Login Page ──────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 800);
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
            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
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
  const SectionHeader = ({ title, action }: { title: string; action?: string }) => (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {action && <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">{action}<ChevronRight className="h-3.5 w-3.5" /></button>}
    </div>
  );
  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good morning, Ricky Fajrin 👋</h1>
          <p className="mt-1 text-sm text-slate-500">You have <span className="font-semibold text-indigo-600">3 assignments</span> and <span className="font-semibold text-indigo-600">2 quizzes</span> due this week.</p>
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
        {stats.map((stat) => (
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
            <SectionHeader title="Most issued content" action="View all" />
            <div className="space-y-1">
              {mostIssuedContent.map((item, idx) => (
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><p className="text-2xl font-bold text-slate-900">105</p><p className="text-[10px] text-slate-400">Total</p></div>
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
              {topLearners.map((learner) => (
                <div key={learner.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', learner.rank === 1 ? 'bg-amber-100 text-amber-700' : learner.rank === 2 ? 'bg-slate-200 text-slate-600' : learner.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400')}>{learner.rank}</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">{learner.avatar}</div>
                  <div className="flex-1"><p className="text-sm font-medium text-slate-900">{learner.name}</p><p className="text-xs text-slate-400">{learner.courses} courses</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-indigo-600">{learner.points.toLocaleString()}</p><p className="text-[10px] text-slate-400">points</p></div>
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
function CatalogView({ onSelectCourse, onNavigate }: { onSelectCourse: (id: number) => void; onNavigate: (v: View) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Popular');

  const filtered = catalogCourses.filter(c => {
    const catMatch = selectedCategory === 'All' || c.category === selectedCategory;
    const diffMatch = selectedDifficulty === 'All Levels' || c.difficulty === selectedDifficulty;
    const searchMatch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && diffMatch && searchMatch;
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
        <div><h1 className="text-2xl font-bold text-slate-900">Course Catalog</h1><p className="mt-1 text-sm text-slate-500">Discover {catalogCourses.length} courses across {categories.length - 1} categories</p></div>
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
function CourseDetailView({ courseId, onNavigate }: { courseId: number; onNavigate: (v: View) => void }) {
  const course = catalogCourses.find(c => c.id === courseId) || catalogCourses[0];
  const [activeLesson, setActiveLesson] = useState(0);
  const [activeModule, setActiveModule] = useState(0);

  const lessonTypeIcons: Record<string, typeof Video> = {
    video: Video, page: File, quiz: FileQuestion, assignment: FileText,
  };

  const completedLessons = course.modules?.reduce((acc, m) => acc + m.lessons.filter(l => l.completed).length, 0) || 0;
  const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || 0;

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

// ─── Main Page ────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>('login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(1);

  const handleNavigate = (v: View) => {
    setView(v);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleSelectCourse = (id: number) => {
    setSelectedCourseId(id);
    setView('course-detail');
    window.scrollTo(0, 0);
  };

  // Login view — no sidebar/header
  if (view === 'login') {
    return <LoginPage onLogin={() => handleNavigate('dashboard')} />;
  }

  // Dashboard/Catalog/Course Detail — with sidebar + header
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentView={view} onNavigate={handleNavigate} />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} onNavigate={handleNavigate} currentView={view} />
        {view === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {view === 'catalog' && <CatalogView onSelectCourse={handleSelectCourse} onNavigate={handleNavigate} />}
        {view === 'course-detail' && <CourseDetailView courseId={selectedCourseId} onNavigate={handleNavigate} />}
      </div>
    </div>
  );
}
