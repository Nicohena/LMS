'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  GraduationCap,
  Award,
  Settings,
  Bell,
  Search,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Users,
  BarChart3,
  MessageSquare,
  Layers,
  FileQuestion,
  Route,
  Crown,
  Star,
  ArrowUpRight,
  Plus,
  Filter,
  MoreHorizontal,
  PlayCircle,
  Zap,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  active?: boolean;
  badge?: number;
}

interface StatCard {
  label: string;
  value: string;
  icon: typeof BookOpen;
  color: string;
  bgColor: string;
  trend?: string;
}

interface ContentItem {
  id: number;
  title: string;
  type: 'Page' | 'Assignment' | 'Quiz';
  views: number;
  trend: number;
}

interface Learner {
  id: number;
  name: string;
  points: number;
  rank: number;
  avatar: string;
  courses: number;
}

interface QuizItem {
  id: number;
  title: string;
  questions: number;
  submissions: number;
  pending: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { label: 'Home', icon: LayoutDashboard, active: true },
  { label: 'My Learning', icon: BookOpen },
  { label: 'Catalog', icon: Layers },
  { label: 'Favorites', icon: Star },
  { label: 'Assignments', icon: FileText, badge: 3 },
  { label: 'Quizzes', icon: FileQuestion },
  { label: 'Certificates', icon: Award },
  { label: 'Messages', icon: MessageSquare, badge: 5 },
  { label: 'Calendar', icon: Calendar },
];

const stats: StatCard[] = [
  { label: 'Course', value: '12', icon: BookOpen, color: 'text-indigo-600', bgColor: 'bg-indigo-50', trend: '+2' },
  { label: 'Page', value: '48', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50', trend: '+5' },
  { label: 'Assignment', value: '7', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50', trend: '+1' },
  { label: 'Quiz', value: '15', icon: FileQuestion, color: 'text-emerald-600', bgColor: 'bg-emerald-50', trend: '+3' },
  { label: 'Learning Path', value: '4', icon: Route, color: 'text-purple-600', bgColor: 'bg-purple-50', trend: '+1' },
];

const mostIssuedContent: ContentItem[] = [
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

const topLearners: Learner[] = [
  { id: 1, name: 'Sarah Chen', points: 4850, rank: 1, avatar: 'SC', courses: 8 },
  { id: 2, name: 'Mike Rodriguez', points: 4120, rank: 2, avatar: 'MR', courses: 6 },
  { id: 3, name: 'Emily Davis', points: 3890, rank: 3, avatar: 'ED', courses: 7 },
  { id: 4, name: 'James Park', points: 3240, rank: 4, avatar: 'JP', courses: 5 },
  { id: 5, name: 'Lisa Wang', points: 2980, rank: 5, avatar: 'LW', courses: 4 },
];

const quizGrading: QuizItem[] = [
  { id: 1, title: 'UI Design Principles', questions: 20, submissions: 45, pending: 12 },
  { id: 2, title: 'Color Theory Fundamentals', questions: 15, submissions: 38, pending: 8 },
  { id: 3, title: 'Typography Basics', questions: 10, submissions: 52, pending: 15 },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-slate-200 bg-slate-50 transition-transform duration-200 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">Trenning</span>
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-200 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <button key={item.label} className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              item.active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900',
            )}>
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.badge && (
                <span className={cn(
                  'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  item.active ? 'bg-white/20 text-white' : 'bg-red-500 text-white',
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {/* Nav links */}
      <nav className="hidden items-center gap-1 md:flex">
        {['Home', 'My Learning', 'Catalog', 'Favorites'].map((link, i) => (
          <button key={link} className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            i === 0 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100',
          )}>
            {link}
          </button>
        ))}
      </nav>

      {/* Search */}
      <div className="relative hidden flex-1 md:block lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-slate-900">Ricky Fajrin</p>
            <p className="text-xs text-slate-500">Student</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            RF
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {action && (
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
          {action}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: StatCard }) {
  return (
    <Card className="border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.bgColor)}>
          <stat.icon className={cn('h-5 w-5', stat.color)} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">{stat.label}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            {stat.trend && (
              <span className="flex items-center text-[10px] font-semibold text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                {stat.trend}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Most Issued Content ─────────────────────────────────────────────────

function MostIssuedContent() {
  const typeColors: Record<string, string> = {
    Page: 'bg-blue-50 text-blue-600',
    Assignment: 'bg-amber-50 text-amber-600',
    Quiz: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <Card className="border border-slate-200 p-5 shadow-sm">
      <SectionHeader title="Most issued content" action="View all" />
      <div className="space-y-1">
        {mostIssuedContent.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
            <span className="w-5 text-sm font-bold text-slate-300">{idx + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge className={cn('rounded-full px-2 py-0 text-[10px] font-medium', typeColors[item.type])}>
                  {item.type}
                </Badge>
                <span className="text-xs text-slate-400">{item.views} views</span>
              </div>
            </div>
            <div className={cn(
              'flex items-center gap-0.5 text-xs font-semibold',
              item.trend > 0 ? 'text-emerald-600' : 'text-red-500',
            )}>
              <TrendingUp className={cn('h-3 w-3', item.trend < 0 && 'rotate-180')} />
              {Math.abs(item.trend)}%
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Assignment Stats ────────────────────────────────────────────────────

function AssignmentStats() {
  return (
    <Card className="border border-slate-200 p-5 shadow-sm">
      <SectionHeader title="Assignment" action="Details" />
      <div className="grid grid-cols-2 gap-3">
        {assignmentStats.map((stat) => (
          <div key={stat.name} className="rounded-lg border border-slate-100 p-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
              <span className="text-xs font-medium text-slate-600">{stat.name}</span>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{stat.count}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Learning Content Status (Pie Chart) ──────────────────────────────────

function LearningContentStatus() {
  return (
    <Card className="border border-slate-200 p-5 shadow-sm">
      <SectionHeader title="Learning Content" action="Details" />
      <div className="flex items-center gap-4">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={learningContentStatus}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {learningContentStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-slate-900">105</p>
            <p className="text-[10px] text-slate-400">Total</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {learningContentStatus.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Top Learners ─────────────────────────────────────────────────────────

function TopLearners() {
  const rankColors: Record<number, string> = {
    1: 'bg-amber-100 text-amber-700',
    2: 'bg-slate-200 text-slate-600',
    3: 'bg-orange-100 text-orange-700',
  };

  return (
    <Card className="border border-slate-200 p-5 shadow-sm">
      <SectionHeader title="Top Learner" action="See all" />
      <div className="space-y-1">
        {topLearners.map((learner) => (
          <div key={learner.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
              rankColors[learner.rank] || 'bg-slate-100 text-slate-400',
            )}>
              {learner.rank}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
              {learner.avatar}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{learner.name}</p>
              <p className="text-xs text-slate-400">{learner.courses} courses</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-indigo-600">{learner.points.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">points</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Upgrade Prompt ──────────────────────────────────────────────────────

function UpgradePrompt() {
  return (
    <Card className="relative overflow-hidden border border-indigo-100 bg-gradient-to-br from-indigo-600 to-indigo-500 p-5 shadow-sm">
      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-300" />
          <span className="text-sm font-semibold text-white">Upgrade to PRO</span>
        </div>
        <p className="mb-4 text-xs text-indigo-100">
          Unlock unlimited courses, advanced analytics, certificates, and priority support.
        </p>
        <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Upgrade Now
        </Button>
      </div>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
    </Card>
  );
}

// ─── Quiz Grading ────────────────────────────────────────────────────────

function QuizGrading() {
  return (
    <Card className="border border-slate-200 p-5 shadow-sm">
      <SectionHeader title="Quiz Grading" action="View all" />
      <div className="space-y-3">
        {quizGrading.map((quiz) => (
          <div key={quiz.id} className="rounded-lg border border-slate-100 p-3 hover:border-slate-200">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <FileQuestion className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{quiz.title}</p>
                  <p className="text-xs text-slate-400">{quiz.questions} questions · {quiz.submissions} submissions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {quiz.pending > 0 && (
                  <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50">
                    {quiz.pending} pending
                  </Badge>
                )}
              </div>
              <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                Grade Now
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: 'Browse Courses', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'My Assignments', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Take a Quiz', icon: FileQuestion, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Certificates', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
        >
          <div className={cn('flex h-6 w-6 items-center justify-center rounded', action.bg)}>
            <action.icon className={cn('h-3.5 w-3.5', action.color)} />
          </div>
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="mx-auto max-w-7xl p-4 lg:p-6">
          {/* Greeting + Quick Actions */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Good morning, Ricky Fajrin 👋
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                You have <span className="font-semibold text-indigo-600">3 assignments</span> and{' '}
                <span className="font-semibold text-indigo-600">2 quizzes</span> due this week.
              </p>
            </div>
            <QuickActions />
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="space-y-6 lg:col-span-2">
              <MostIssuedContent />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AssignmentStats />
                <LearningContentStatus />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <TopLearners />
              <UpgradePrompt />
              <QuizGrading />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
