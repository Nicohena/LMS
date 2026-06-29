'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileText,
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
  Mail,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ─── Mock data (replace with API calls later) ──────────────────────────────

const enrolledCourses = [
  { id: 1, title: 'UI Design Fundamentals', progress: 75, instructor: 'Sarah Chen', category: 'Design', difficulty: 'Beginner', nextLesson: 'Wireframing Techniques' },
  { id: 2, title: 'Advanced TypeScript', progress: 40, instructor: 'Mike Rodriguez', category: 'Programming', difficulty: 'Advanced', nextLesson: 'Conditional Types' },
  { id: 3, title: 'Project Management Essentials', progress: 90, instructor: 'Emily Davis', category: 'Business', difficulty: 'Intermediate', nextLesson: 'Agile Methodologies' },
  { id: 4, title: 'Data Science with Python', progress: 15, instructor: 'James Park', category: 'Data Science', difficulty: 'Intermediate', nextLesson: 'Pandas Basics' },
];

const upcomingDeadlines = [
  { id: 1, title: 'Wireframe Assignment', course: 'UI Design Fundamentals', dueDate: 'Tomorrow', priority: 'high' },
  { id: 2, title: 'Quiz: Type Guards', course: 'Advanced TypeScript', dueDate: 'In 3 days', priority: 'medium' },
  { id: 3, title: 'Final Project Proposal', course: 'Project Management', dueDate: 'In 5 days', priority: 'low' },
];

const recentActivity = [
  { id: 1, type: 'quiz', title: 'Completed Quiz: Design Principles', course: 'UI Design Fundamentals', score: 92, time: '2 hours ago' },
  { id: 2, type: 'lesson', title: 'Finished: Introduction to Generics', course: 'Advanced TypeScript', time: '5 hours ago' },
  { id: 3, type: 'badge', title: 'Earned Badge: Quick Learner', course: 'System', time: '1 day ago' },
  { id: 4, type: 'assignment', title: 'Submitted: User Research Report', course: 'UI Design Fundamentals', time: '2 days ago' },
];

const weeklyProgress = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3.2 },
  { day: 'Wed', hours: 1.8 },
  { day: 'Thu', hours: 4.1 },
  { day: 'Fri', hours: 2.9 },
  { day: 'Sat', hours: 5.3 },
  { day: 'Sun', hours: 3.7 },
];

const courseDistribution = [
  { name: 'Design', value: 1, color: '#4F46E5' },
  { name: 'Programming', value: 1, color: '#10B981' },
  { name: 'Business', value: 1, color: '#F59E0B' },
  { name: 'Data Science', value: 1, color: '#EF4444' },
];

const stats = [
  { label: 'Enrolled Courses', value: '4', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Completed Lessons', value: '47', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Average Score', value: '87%', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Learning Streak', value: '12 days', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'My Courses', icon: BookOpen },
  { label: 'Assignments', icon: FileText },
  { label: 'Quizzes', icon: GraduationCap },
  { label: 'Certificates', icon: Award },
  { label: 'Messages', icon: MessageSquare },
  { label: 'Calendar', icon: Calendar },
];

// ─── Sidebar Component ───────────────────────────────────────────────────

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-slate-200 bg-slate-50 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">LMS</span>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-200 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                item.active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.label === 'Messages' && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  3
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom section */}
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

// ─── Top Bar ───────────────────────────────────────────────────────────────

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative hidden flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search courses, lessons, assignments..."
          className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-slate-900">John Doe</p>
            <p className="text-xs text-slate-500">Student</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: typeof stats[0] }) {
  return (
    <Card className="border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', stat.bg)}>
          <stat.icon className={cn('h-6 w-6', stat.color)} />
        </div>
      </div>
    </Card>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────

function CourseCard({ course }: { course: typeof enrolledCourses[0] }) {
  return (
    <Card className="group cursor-pointer border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50">
              {course.category}
            </Badge>
            <span className="text-xs font-light text-slate-400">{course.difficulty}</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600">
            {course.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">by {course.instructor}</p>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">Progress</span>
        <span className="text-xs font-bold text-slate-700">{course.progress}%</span>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${course.progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          Next: {course.nextLesson}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
      </div>
    </Card>
  );
}

// ─── Activity Item ──────────────────────────────────────────────────────────

function ActivityItem({ activity }: { activity: typeof recentActivity[0] }) {
  const icons: Record<string, typeof CheckCircle2> = {
    quiz: GraduationCap,
    lesson: BookOpen,
    badge: Award,
    assignment: FileText,
  };
  const Icon = icons[activity.type] || CheckCircle2;

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{activity.title}</p>
        <p className="text-xs text-slate-500">{activity.course}</p>
      </div>
      <div className="text-right">
        {activity.score && (
          <Badge className="mb-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-50">
            {activity.score}%
          </Badge>
        )}
        <p className="text-xs font-light text-slate-400">{activity.time}</p>
      </div>
    </div>
  );
}

// ─── Deadline Item ──────────────────────────────────────────────────────────

function DeadlineItem({ deadline }: { deadline: typeof upcomingDeadlines[0] }) {
  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-600',
    medium: 'bg-amber-100 text-amber-600',
    low: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', priorityColors[deadline.priority])}>
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{deadline.title}</p>
        <p className="text-xs text-slate-500">{deadline.course}</p>
      </div>
      <Badge variant="outline" className="border-slate-200 text-xs text-slate-600">
        {deadline.dueDate}
      </Badge>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <main className="mx-auto max-w-7xl p-4 lg:p-6">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, John! 👋</h1>
            <p className="mt-1 text-sm text-slate-500">
              You&apos;ve learned <span className="font-semibold text-indigo-600">23 hours</span> this month. Keep up the great work!
            </p>
          </div>

          {/* Stats grid */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          {/* Main grid: 2/3 content + 1/3 sidebar */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Weekly Progress Chart */}
              <Card className="border border-slate-200 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Weekly Learning Activity</h2>
                    <p className="text-sm text-slate-500">Hours spent learning this week</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-200 text-slate-600">
                    <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                    Details
                  </Button>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={weeklyProgress}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      fill="url(#colorHours)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Enrolled Courses */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Continue Learning</h2>
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">
                    View all courses
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {enrolledCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <Card className="border border-slate-200 p-5 shadow-sm">
                <h2 className="mb-2 text-base font-semibold text-slate-900">Recent Activity</h2>
                <div className="divide-y divide-slate-100">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Upcoming Deadlines */}
              <Card className="border border-slate-200 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-base font-semibold text-slate-900">Upcoming Deadlines</h2>
                </div>
                <div className="space-y-2">
                  {upcomingDeadlines.map((deadline) => (
                    <DeadlineItem key={deadline.id} deadline={deadline} />
                  ))}
                </div>
              </Card>

              {/* Course Distribution */}
              <Card className="border border-slate-200 p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">Course Distribution</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={courseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {courseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {courseDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Achievement Card */}
              <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Level 7 Achieved!</p>
                    <p className="text-xs text-slate-500">2,450 XP · 145 XP to next level</p>
                  </div>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: '85%' }} />
                </div>
                <p className="mt-2 text-right text-xs font-light text-slate-400">85% to Level 8</p>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
