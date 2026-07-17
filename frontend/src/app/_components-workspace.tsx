'use client';

import { useState } from 'react';
import {
  BookOpen, Home, Layers, FileText, FileQuestion, File, Folder,
  Image, ClipboardList, Award, MessageSquare, Bell, BarChart3,
  Users, Calendar, Target, Settings, ChevronLeft, ChevronRight,
  Search, Star, MoreHorizontal, Eye, Clock, Lock, Download, Upload,
  Copy, Trash2, Plus, GripVertical, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { View, Course } from './_shared';
import { useCourseSettings, useUpdateCourseSettings, useCourseAnalyticsSummary } from '@/lib/hooks';
import { toast } from '@/hooks/use-toast';

// ─── Course workspace navigation items ────────────────────────────────────
const COURSE_NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'modules', label: 'Modules', icon: Layers },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'media', label: 'Media Library', icon: Image },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'quizzes', label: 'Quizzes', icon: FileQuestion },
  { id: 'question-bank', label: 'Question Bank', icon: FileQuestion },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'gradebook', label: 'Gradebook', icon: BarChart3 },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'outcomes', label: 'Learning Outcomes', icon: Target },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'students', label: 'Student Progress', icon: Users },
  { id: 'settings', label: 'Course Settings', icon: Settings },
] as const;

export type CourseNavId = typeof COURSE_NAV_ITEMS[number]['id'];

interface CourseWorkspaceProps {
  course: Course;
  courseId: string;
  activeNav: CourseNavId;
  onNavChange: (nav: CourseNavId) => void;
  onNavigate: (v: View) => void;
  canAuthor: boolean;
  children: React.ReactNode;
}

/**
 * Three-panel workspace layout inspired by Canvas LMS:
 * - Left: course navigation sidebar (collapsible)
 * - Center: main content area (renders children)
 * - Right: context-sensitive properties panel (teacher only)
 */
export function CourseWorkspace({
  course,
  courseId,
  activeNav,
  onNavChange,
  onNavigate,
  canAuthor,
  children,
}: CourseWorkspaceProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [navSearch, setNavSearch] = useState('');

  const filteredNav = COURSE_NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(navSearch.toLowerCase())
  );

  const activeNavItem = COURSE_NAV_ITEMS.find((item) => item.id === activeNav);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      {/* ─── Left Sidebar: Course Navigation ─────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col border-r border-slate-200 bg-white transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-3">
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{course.title}</p>
              <p className="truncate text-xs text-slate-400">Course Navigation</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Search (only when expanded) */}
        {!sidebarCollapsed && (
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search..."
                className="h-8 bg-slate-50 pl-8 text-xs"
              />
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-2">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeNav;
            return (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  'mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-violet-50 font-medium text-violet-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  sidebarCollapsed && 'justify-center'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-violet-600')} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
          {filteredNav.length === 0 && !sidebarCollapsed && (
            <p className="px-2.5 py-4 text-center text-xs text-slate-400">No results</p>
          )}
        </nav>

        {/* Sidebar footer */}
        {!sidebarCollapsed && (
          <div className="border-t border-slate-100 p-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </button>
          </div>
        )}
      </aside>

      {/* ─── Main Content Area ──────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Breadcrumb + toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => onNavigate('dashboard')} className="text-slate-400 hover:text-slate-600">
              Dashboard
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <button onClick={() => onNavChange('home')} className="text-slate-500 hover:text-slate-700">
              {course.title}
            </button>
            {activeNavItem && activeNav !== 'home' && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="font-medium text-slate-900">{activeNavItem.label}</span>
              </>
            )}
          </div>

          {/* Toolbar actions */}
          <div className="flex items-center gap-1.5">
            {canAuthor && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                  title={showRightPanel ? 'Hide properties panel' : 'Show properties panel'}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 hover:text-slate-700"
                  title="Preview as student"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-slate-700"
              title="Star this course"
            >
              <Star className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-slate-700"
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* ─── Right Properties Panel (teacher only) ──────────────────────── */}
      {canAuthor && showRightPanel && (
        <aside className="hidden w-72 shrink-0 border-l border-slate-200 bg-white xl:block">
          <div className="border-b border-slate-100 p-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Properties</h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">Context-sensitive settings</p>
          </div>

          <div className="overflow-y-auto p-3">
            <CoursePropertiesPanel activeNav={activeNav} course={course} courseId={courseId} />
          </div>
        </aside>
      )}
    </div>
  );
}

// ─── Context-sensitive properties panel ───────────────────────────────────
function CoursePropertiesPanel({ activeNav, course, courseId }: { activeNav: CourseNavId; course: Course; courseId: string }) {
  const { data: settingsData, isLoading: settingsLoading } = useCourseSettings(courseId);
  const { data: analytics } = useCourseAnalyticsSummary(courseId);
  const updateSettings = useUpdateCourseSettings(courseId);
  const settings = settingsData?.settings;

  const handleUpdate = (field: string, value: any) => {
    if (!settings) return;
    updateSettings.mutate(
      { [field]: value },
      {
        onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update setting.', variant: 'destructive' }),
      }
    );
  };

  const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
  const totalModules = course.modules?.length ?? 0;
  const storageUsed = settings?.storageUsedMB ?? 0;
  const storageLimit = settings?.storageLimitMB ?? 10240;
  const storagePct = storageLimit > 0 ? Math.round((storageUsed / storageLimit) * 100) : 0;
  const storageUsedGB = (storageUsed / 1024).toFixed(1);
  const storageLimitGB = (storageLimit / 1024).toFixed(0);

  if (settingsLoading) {
    return <div className="py-8 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  // Common properties shown for all views
  const commonProps = (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Course Stats</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="font-semibold text-slate-900">{analytics?.totalModules ?? totalModules}</p>
            <p className="text-slate-400">Modules</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{analytics?.totalLessons ?? totalLessons}</p>
            <p className="text-slate-400">Lessons</p>
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div>
        <Label className="mb-1.5 block text-xs font-medium text-slate-500">Visibility</Label>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={settings?.isVisibleToStudents ?? true}
              onChange={(e) => handleUpdate('isVisibleToStudents', e.target.checked)}
              className="h-3.5 w-3.5 accent-violet-600"
            />
            <Eye className="h-3.5 w-3.5" /> Visible to students
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={settings?.requireEnrollmentKey ?? false}
              onChange={(e) => handleUpdate('requireEnrollmentKey', e.target.checked)}
              className="h-3.5 w-3.5 accent-violet-600"
            />
            <Lock className="h-3.5 w-3.5" /> Require enrollment key
          </label>
        </div>
      </div>

      {/* Scheduling */}
      <div>
        <Label className="mb-1.5 block text-xs font-medium text-slate-500">Scheduling</Label>
        <div className="space-y-2">
          <div>
            <p className="mb-0.5 text-[10px] text-slate-400">Start date</p>
            <Input
              type="date"
              className="h-8 text-xs"
              value={settings?.startDate ? new Date(settings.startDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleUpdate('startDate', e.target.value || null)}
            />
          </div>
          <div>
            <p className="mb-0.5 text-[10px] text-slate-400">End date</p>
            <Input
              type="date"
              className="h-8 text-xs"
              value={settings?.endDate ? new Date(settings.endDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleUpdate('endDate', e.target.value || null)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Nav-specific properties — all data-driven from settings/analytics
  const navSpecific: Record<CourseNavId, React.ReactNode> = {
    home: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Customize the course homepage that students see first.</p>
        <Button size="sm" variant="outline" className="w-full text-xs">Edit Homepage</Button>
      </div>
    ),
    modules: (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500">Module Settings</p>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={settings?.allowDragDrop ?? true}
              onChange={(e) => handleUpdate('allowDragDrop', e.target.checked)}
              className="h-3.5 w-3.5 accent-violet-600"
            />
            <GripVertical className="h-3.5 w-3.5" /> Allow drag-and-drop reorder
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={settings?.sequentialProgression ?? false}
              onChange={(e) => handleUpdate('sequentialProgression', e.target.checked)}
              className="h-3.5 w-3.5 accent-violet-600"
            />
            <CheckCircle2 className="h-3.5 w-3.5" /> Sequential progression
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={settings?.requirePrerequisites ?? false}
              onChange={(e) => handleUpdate('requirePrerequisites', e.target.checked)}
              className="h-3.5 w-3.5 accent-violet-600"
            />
            <Lock className="h-3.5 w-3.5" /> Require prerequisites
          </label>
        </div>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Plus className="mr-1 h-3.5 w-3.5" />Add Module
        </Button>
      </div>
    ),
    pages: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Create rich text pages with embedded media.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Plus className="mr-1 h-3.5 w-3.5" />New Page
        </Button>
      </div>
    ),
    files: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Upload and organize course files.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Upload className="mr-1 h-3.5 w-3.5" />Upload File
        </Button>
        <div className="rounded-lg border border-slate-100 p-2 text-xs text-slate-500">
          <p className="font-medium text-slate-600">Storage</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${storagePct}%` }} />
          </div>
          <p className="mt-1 text-[10px]">{storageUsedGB} GB of {storageLimitGB} GB used</p>
        </div>
      </div>
    ),
    media: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Manage images, videos, and audio for your course.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Image className="mr-1 h-3.5 w-3.5" />Upload Media
        </Button>
      </div>
    ),
    assignments: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Create assignments with rubrics and due dates.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Plus className="mr-1 h-3.5 w-3.5" />New Assignment
        </Button>
      </div>
    ),
    quizzes: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Build quizzes with multiple question types.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Plus className="mr-1 h-3.5 w-3.5" />New Quiz
        </Button>
        <div>
          <Label className="mb-1 block text-xs font-medium text-slate-500">Default Settings</Label>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={settings?.defaultShuffleQuestions ?? true}
                onChange={(e) => handleUpdate('defaultShuffleQuestions', e.target.checked)}
                className="h-3.5 w-3.5 accent-violet-600"
              /> Shuffle questions
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={settings?.defaultShuffleAnswers ?? true}
                onChange={(e) => handleUpdate('defaultShuffleAnswers', e.target.checked)}
                className="h-3.5 w-3.5 accent-violet-600"
              /> Shuffle answers
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={settings?.defaultShowCorrectAnswers ?? false}
                onChange={(e) => handleUpdate('defaultShowCorrectAnswers', e.target.checked)}
                className="h-3.5 w-3.5 accent-violet-600"
              /> Show correct answers after
            </label>
          </div>
        </div>
      </div>
    ),
    'question-bank': (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Reusable question repository across quizzes.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Plus className="mr-1 h-3.5 w-3.5" />Add Question
        </Button>
      </div>
    ),
    discussions: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Create discussion forums for student interaction.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Plus className="mr-1 h-3.5 w-3.5" />New Discussion
        </Button>
      </div>
    ),
    announcements: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Post announcements to enrolled students.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Plus className="mr-1 h-3.5 w-3.5" />New Announcement
        </Button>
      </div>
    ),
    gradebook: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">View and manage student grades.</p>
        <Button size="sm" variant="outline" className="w-full text-xs">
          <Download className="mr-1 h-3.5 w-3.5" />Export CSV
        </Button>
        <div>
          <Label className="mb-1 block text-xs font-medium text-slate-500">Grading Scheme</Label>
          <select
            value={settings?.gradingScheme ?? 'percentage'}
            onChange={(e) => handleUpdate('gradingScheme', e.target.value)}
            className="w-full rounded border border-slate-200 p-1.5 text-xs"
          >
            <option value="percentage">Percentage</option>
            <option value="letter">Letter Grade</option>
            <option value="points">Points</option>
          </select>
        </div>
      </div>
    ),
    attendance: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Track student attendance for class sessions.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Calendar className="mr-1 h-3.5 w-3.5" />Take Attendance
        </Button>
      </div>
    ),
    outcomes: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Define learning outcomes and align assessments.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Plus className="mr-1 h-3.5 w-3.5" />Add Outcome
        </Button>
      </div>
    ),
    certificates: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Configure completion certificates.</p>
        <Button size="sm" className="w-full bg-violet-600 text-xs hover:bg-violet-700">
          <Award className="mr-1 h-3.5 w-3.5" />Create Certificate
        </Button>
      </div>
    ),
    analytics: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">View course engagement and performance metrics.</p>
        <div className="space-y-2 rounded-lg border border-slate-100 p-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Completion rate</span>
            <span className="font-semibold text-slate-900">{analytics?.completionRate ?? 0}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Avg. progress</span>
            <span className="font-semibold text-slate-900">{analytics?.averageProgress ?? 0}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Active students</span>
            <span className="font-semibold text-slate-900">{analytics?.totalStudents ?? 0}</span>
          </div>
        </div>
      </div>
    ),
    students: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Monitor individual student progress.</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-700">{analytics?.studentDistribution?.onTrack ?? 0} on track</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2 text-xs">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-amber-700">{analytics?.studentDistribution?.behind ?? 0} behind</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-2 text-xs">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
            <span className="text-red-700">{analytics?.studentDistribution?.atRisk ?? 0} at risk</span>
          </div>
        </div>
      </div>
    ),
    settings: (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">General course configuration.</p>
        <div>
          <Label className="mb-1 block text-xs font-medium text-slate-500">Course Name</Label>
          <Input className="h-8 text-xs" defaultValue={course.title} readOnly />
        </div>
        <div>
          <Label className="mb-1 block text-xs font-medium text-slate-500">Difficulty</Label>
          <select
            className="w-full rounded border border-slate-200 p-1.5 text-xs"
            defaultValue={course.difficulty}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="flex-1 text-xs">
            <Copy className="mr-1 h-3 w-3" />Copy
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs text-red-600 hover:bg-red-50">
            <Trash2 className="mr-1 h-3 w-3" />Delete
          </Button>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      {navSpecific[activeNav]}
      <div className="border-t border-slate-100 pt-3">
        {commonProps}
      </div>
    </div>
  );
}
