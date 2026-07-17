'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  Check, GripVertical, Image, Send,
} from 'lucide-react';
import { cn, getInitials, formatDate, timeAgo } from '@/lib/utils';
import { useLogin, useLogout, useMyProfile, useUpdateMyProfile, useCourses, useMyCourses, useCourse, useCreateCourse, usePublishCourse, useArchiveCourse, useSelfEnroll, useCreateModule, useUpdateModule, useDeleteModule, useCreateContent, useDeleteContent, useUpdateContent, useFlaggedContent, useModerateContent, useQualityReport, useRecalculateQuality, useFlagCourse, useUnflagCourse, useAdminRoles, useCreateAdminRole, useDeleteAdminRole, useAssignAdminRole, useAdmins, useRemoveAdminRole, useStudentDashboard, useTeacherDashboard, usePlatformDashboard, useAdminAlerts, useRecentActivity, useUsers, useCreateUser, useUpdateUser, useDeleteUser, useDiscussions, useCreateDiscussion, useDiscussion, useCreateReply, useUpvoteDiscussion, useDeleteDiscussion, useMarkBestAnswer, useChangePassword, useAuditLogs, useQuizAnalytics, useAdminOverrideGrade, useEscalateGrade, useGradeDisputes, useResolveDispute, useEscalations, useTeacherResolveEscalation, useAdminResolveEscalation, useAutoEnrollRules, useCreateAutoEnrollRule, useDeleteAutoEnrollRule, useTriggerAutoEnroll, useConversations, useMessages, useSendMessage, useUserLevel, useUserBadges, useLeaderboard, useMyCertificates, useStreak, useSettings, useBatchUpdateSettings, useMaintenanceStatus, useEnableMaintenance, useDisableMaintenance, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useMarkAnnouncementRead, useQuizzes, useQuizzesForContents, useQuiz, useStartQuizAttempt, useSubmitQuizAttempt, useAttemptResults, useCreateQuiz, useUpdateQuiz, useDeleteQuiz, useAddQuestion, useDeleteQuestion, useAssignments, useAssignmentsForContents, useAssignment, useSubmissions, useCreateSubmission, useUploadFile, useGradeSubmission, useRequestRevision, useMyPeerReviews, useAssignPeerReviews, useSubmitPeerReview, useReceivedPeerReviews, useNotificationPreferences, useUpdateNotificationPreference, useEnrollments, useAcademicYears, useCurrentAcademicYear, useGrades, useSubjects, useSections, useSectionStudents, useSectionSubjects, useCreateAcademicYear, useCreateGrade, useCreateSubject, useCreateSection, useAssignTeacher, useAssignStudent, useRemoveStudentFromSection, useUserSections, useTeacherSections, useSectionContent, useSectionQuizzes, useSectionAssignments, useTeacherSchoolDashboard, useStudentSchoolDashboard, useAdminSchoolDashboard, useXPHistory, useStudentTimetable, useTeacherTimetable, useSectionTimetable, useCreateTimetableBatch, useDeleteTimetableEntry, useUpdateQuestion, useQuizAttempts, useManualGradeAttempt,
  usePublishAssignment, useArchiveAssignment, useRestoreAssignment, useDuplicateAssignment,
} from '@/lib/hooks';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

// ─── Shared types, constants, and utilities ───────────────────────────────
import {
  type View,
  type Course,
  type CourseModule as Module,
  type Role,
  type NavItem,
  navItems,
  stats,
  categories,
  difficulties,
  downloadCSV,
  formatDeadline,
  ASSIGNMENT_STATUS_CONFIG,
} from './_shared';

// ─── Sidebar (icon-only, narrow design) ──────────────────────────────────
// ─── Extracted leaf components ────────────────────────────────────────────
import { GamificationView, CourseCreateView, SettingsView, NotificationPreferencesTab, MessagesView, ProfileView, AIAssistant } from './_components-misc';

// ─── Extracted admin + communication components ──────────────────────────
import { AnnouncementsView, DisputeGradeButton, GradeDisputesSection, AdminSubRolesSection, QualityMonitoringSection, AutoEnrollmentRulesSection, EscalationsSection, AdminAlertsBar, ActivityFeed, AdminView, FlaggedContentSection, UsersView, AuditLogsView, DiscussionsView, DiscussionDetailView } from './_components-admin';

// ─── Extracted academic + dashboard components ───────────────────────────
import { StudentDashboardHomeView, TeacherDashboardHomeView, AdminDashboardHomeView, ScheduleTab, AcademicManagementView, AcademicYearsTab, AcademicYearSections, GradeSections, SubjectSections, GradesTab, SubjectsTab, SectionsTab, SectionDetailView, MySectionsView } from './_components-academic';

// ─── Extracted quiz + assignment components ──────────────────────────────
import { QuizView, QuizListView, HotspotEditor, QuizSubmissionsModal, SubmissionDetailPanel, ManualGradeRow, QuizEditorModal, OrderingQuestion, MatchingQuestion, QuizRunner, QuizResultsView, AssignmentView, AssignmentListView, PeerReviewPanel, TeacherGradingPanel, AssignmentRunner } from './_components-quiz-assignment';

// ─── Extracted course components ─────────────────────────────────────────
import { CatalogView, MyCoursesView, PageContentEditor, CourseDetailView } from './_components-course';

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
  const [quizPassword, setQuizPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
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
