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

  // Load markdown from contentJson when content changes.
  // Handles multiple storage formats for backward compatibility:
  //   - string (raw markdown)
  //   - { type: 'markdown', content: '...' } (current canonical format)
  //   - { html: '...' } (legacy format from older Add Content modal)
  useEffect(() => {
    if (content?.contentJson) {
      const cj = content.contentJson as any;
      if (typeof cj === 'string') {
        setMarkdown(cj);
      } else if (cj?.type === 'markdown' && typeof cj.content === 'string') {
        setMarkdown(cj.content);
      } else if (typeof cj?.html === 'string') {
        // Legacy format — treat the html value as markdown content
        setMarkdown(cj.html);
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
          {(content.type === 'PAGE' || content.type === 'MIXED') && (
            <div className="space-y-3">
              <Label className="text-xs font-medium text-slate-600">📝 Rich Text Content</Label>
              <RichTextEditor value={markdown} onChange={setMarkdown} placeholder="Write your lesson content here. Supports markdown: **bold**, *italic*, # headings, - lists, > quotes, [links](url)..." />
            </div>
          )}
          {content.type === 'MIXED' && (
            <div className="space-y-3">
              <Label className="text-xs font-medium text-slate-600">🎥 Video URL (optional)</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              <Label className="text-xs font-medium text-slate-600">🔗 External Link (optional)</Label>
              <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
              <Label className="text-xs font-medium text-slate-600">📎 Document URL (optional)</Label>
              <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://.../document.pdf" />
            </div>
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
  const updateContentMut = useUpdateContent(courseId || null);
  const uploadFileMut = useUploadFile();
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [showAddContent, setShowAddContent] = useState<string | null>(null); // module ID
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentType, setNewContentType] = useState<'PAGE' | 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'ASSIGNMENT' | 'EXTERNAL_LINK' | 'MIXED'>('PAGE');
  const [newContentDescription, setNewContentDescription] = useState('');
  const [newContentVideoUrl, setNewContentVideoUrl] = useState('');
  const [newContentExternalUrl, setNewContentExternalUrl] = useState('');
  const [newContentDuration, setNewContentDuration] = useState('');
  const [newContentRichText, setNewContentRichText] = useState('');
  const [newContentFileUrl, setNewContentFileUrl] = useState('');
  const [newContentFileName, setNewContentFileName] = useState('');
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
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

  // Defensive default: when apiCourse is null (e.g. request failed or
  // refetching after an error), return an empty Course shape rather than
  // null. This prevents "Cannot read properties of null (reading 'modules')"
  // on the next line's course.modules?.reduce(...) call.
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
  } : {
    id: '', title: 'Course', description: '', instructor: 'Unknown',
    category: 'General', difficulty: 'Beginner', duration: '—',
    lessons: 0, students: 0, rating: 0,
    thumbnail: 'bg-gradient-to-br from-violet-500 to-violet-500',
    modules: [],
  };
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

  const resetContentForm = () => {
    setNewContentTitle(''); setNewContentDescription(''); setNewContentType('PAGE');
    setNewContentVideoUrl(''); setNewContentExternalUrl(''); setNewContentDuration('');
    setNewContentRichText(''); setNewContentFileUrl(''); setNewContentFileName('');
    setAuthorErr('');
  };

  const handleCreateContent = (moduleId: string) => {
    setAuthorErr('');
    if (!newContentTitle.trim()) { setAuthorErr('Content title is required.'); return; }
    const data: any = {
      title: newContentTitle.trim(), type: newContentType, isPublished: true,
      description: newContentDescription.trim() || undefined,
    };
    // For MIXED type, send ALL fields that have values. For other types,
    // only send the relevant field.
    const isMixed = newContentType === 'MIXED';
    if ((isMixed || newContentType === 'VIDEO') && newContentVideoUrl.trim()) data.videoUrl = newContentVideoUrl.trim();
    if ((isMixed || newContentType === 'EXTERNAL_LINK') && newContentExternalUrl.trim()) data.externalUrl = newContentExternalUrl.trim();
    if ((isMixed || newContentType === 'DOCUMENT') && newContentFileUrl.trim()) data.fileUrl = newContentFileUrl.trim();
    if ((isMixed || newContentType === 'PAGE') && newContentRichText.trim()) data.contentJson = { type: 'markdown', content: newContentRichText };
    if (newContentDuration && (isMixed || newContentType === 'VIDEO' || newContentType === 'DOCUMENT')) data.duration = Number(newContentDuration);
    createContentMut.mutate(
      { moduleId, data },
      {
        onSuccess: () => {
          resetContentForm();
          setShowAddContent(null);
          toast({ title: 'Content created', description: `${newContentType.charAt(0) + newContentType.slice(1).toLowerCase()} content added.` });
        },
        onError: (err: any) => { setAuthorErr(err.response?.data?.message || 'Failed to create content.'); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create content.', variant: 'destructive' }); },
      },
    );
  };

  const loadContentForEdit = (content: any) => {
    setEditingContentId(content.id);
    setNewContentTitle(content.title || '');
    setNewContentType(content.type || 'PAGE');
    setNewContentDescription(content.description || '');
    setNewContentVideoUrl(content.videoUrl || '');
    setNewContentExternalUrl(content.externalUrl || '');
    setNewContentDuration(content.duration ? String(content.duration) : '');
    setNewContentRichText(content.contentJson?.html || '');
    setNewContentFileUrl(content.fileUrl || '');
    setNewContentFileName(content.fileUrl ? content.fileUrl.split('/').pop() || '' : '');
    setAuthorErr('');
  };

  const handleUpdateContent = () => {
    if (!editingContentId) return;
    setAuthorErr('');
    if (!newContentTitle.trim()) { setAuthorErr('Content title is required.'); return; }
    const data: any = {
      title: newContentTitle.trim(),
      description: newContentDescription.trim() || undefined,
    };
    const isMixed = newContentType === 'MIXED';
    if ((isMixed || newContentType === 'VIDEO') && newContentVideoUrl.trim()) data.videoUrl = newContentVideoUrl.trim();
    if ((isMixed || newContentType === 'EXTERNAL_LINK') && newContentExternalUrl.trim()) data.externalUrl = newContentExternalUrl.trim();
    if ((isMixed || newContentType === 'DOCUMENT') && newContentFileUrl.trim()) data.fileUrl = newContentFileUrl.trim();
    if ((isMixed || newContentType === 'PAGE') && newContentRichText.trim()) data.contentJson = { type: 'markdown', content: newContentRichText };
    if (newContentDuration && (isMixed || newContentType === 'VIDEO' || newContentType === 'DOCUMENT')) data.duration = Number(newContentDuration);
    updateContentMut.mutate(
      { contentId: editingContentId, data },
      {
        onSuccess: () => {
          resetContentForm();
          setEditingContentId(null);
          toast({ title: 'Content updated', description: 'Your changes have been saved.' });
        },
        onError: (err: any) => { setAuthorErr(err.response?.data?.message || 'Failed to update content.'); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update content.', variant: 'destructive' }); },
      },
    );
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadFileMut.mutateAsync(file);
      setNewContentFileUrl(result.secure_url);
      setNewContentFileName(result.original_filename);
      toast({ title: 'File uploaded', description: result.original_filename });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.response?.data?.message || 'Failed to upload file.', variant: 'destructive' });
    }
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

      {/* Two-column: Content + Sidebar — content area takes 3/4 on wide screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Content Area */}
        <div className="lg:col-span-3">
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
              // For PAGE content, show rich text editor (teacher) or rendered content (student)
              if (activeLessonObj.type === 'page') {
                return <PageContentEditor courseId={courseId} contentId={contentId} canAuthor={canAuthor} />;
              }
              // Look up the original content object to get videoUrl, externalUrl, fileUrl, etc.
              const activeContent = apiModules.flatMap((m: any) => m.contents ?? []).find((c: any) => String(c.id) === contentId);
              // VIDEO type — show embedded video
              if (activeLessonObj.type === 'video') {
                if (activeContent?.videoUrl) {
                  const url = activeContent.videoUrl;
                  return (
                    <>
                      <div className="overflow-hidden rounded-lg">
                        {url.includes('youtube.com') || url.includes('youtu.be') ? (
                          <iframe src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="aspect-video w-full" allowFullScreen />
                        ) : url.includes('vimeo.com') ? (
                          <iframe src={url.replace('vimeo.com/', 'player.vimeo.com/video/')} className="aspect-video w-full" allowFullScreen />
                        ) : (
                          <video src={url} controls className="aspect-video w-full" />
                        )}
                      </div>
                      {activeContent?.description && <p className="mt-3 text-sm text-slate-500">{activeContent.description}</p>}
                    </>
                  );
                }
                return (
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-900">
                    <div className="text-center">
                      <PlayCircle className="mx-auto h-16 w-16 text-white/30" />
                      <p className="mt-2 text-sm text-white/50">No video URL set for this lesson.</p>
                      {canAuthor && <p className="mt-1 text-xs text-white/40">Click the edit icon to add a video URL.</p>}
                    </div>
                  </div>
                );
              }
              // EXTERNAL_LINK type — show open-link card
              if (activeLessonObj.type === 'external_link') {
                return (
                  <a href={activeContent?.externalUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 p-6 text-sm text-violet-700 hover:bg-violet-100">
                    <Link2 className="h-8 w-8 text-violet-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">External Resource</p>
                      <p className="text-xs text-slate-500">{activeContent?.externalUrl || 'No URL set — click edit to add one.'}</p>
                    </div>
                    <ChevronRight className="h-5 w-5" />
                  </a>
                );
              }
              // DOCUMENT type — show download card
              if (activeLessonObj.type === 'document') {
                if (activeContent?.fileUrl) {
                  return (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-6">
                      <div className="flex items-center gap-3">
                        <File className="h-10 w-10 text-emerald-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{activeContent.fileUrl.split('/').pop() || 'Document'}</p>
                          <p className="text-xs text-slate-500">Click to download or open in a new tab</p>
                        </div>
                        <a href={activeContent.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button className="bg-emerald-600 text-white hover:bg-emerald-700">Open</Button>
                        </a>
                      </div>
                      {activeContent?.description && <p className="mt-3 text-sm text-slate-500">{activeContent.description}</p>}
                    </div>
                  );
                }
                return (
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-50">
                    <div className="text-center">
                      <File className="mx-auto h-16 w-16 text-slate-300" />
                      <p className="mt-2 text-sm text-slate-500">No document uploaded for this lesson.</p>
                      {canAuthor && <p className="mt-1 text-xs text-slate-400">Click the edit icon to upload a document.</p>}
                    </div>
                  </div>
                );
              }
              // MIXED type — render all available content fields
              if (activeLessonObj.type === 'mixed') {
                const cj = activeContent?.contentJson as any;
                const markdownText = cj?.type === 'markdown' ? cj.content : (typeof cj === 'string' ? cj : (cj?.html || ''));
                return (
                  <div className="space-y-5">
                    {activeContent?.description && <p className="text-sm text-slate-500">{activeContent.description}</p>}
                    {/* Rich text */}
                    {markdownText && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                        <RichTextRenderer content={markdownText} />
                      </div>
                    )}
                    {/* Video */}
                    {activeContent?.videoUrl && (
                      <div className="overflow-hidden rounded-lg">
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">🎥 Video</p>
                        {activeContent.videoUrl.includes('youtube.com') || activeContent.videoUrl.includes('youtu.be') ? (
                          <iframe src={activeContent.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="aspect-video w-full" allowFullScreen />
                        ) : activeContent.videoUrl.includes('vimeo.com') ? (
                          <iframe src={activeContent.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')} className="aspect-video w-full" allowFullScreen />
                        ) : (
                          <video src={activeContent.videoUrl} controls className="aspect-video w-full" />
                        )}
                      </div>
                    )}
                    {/* Document */}
                    {activeContent?.fileUrl && (
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">📎 Document</p>
                        <a href={activeContent.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm hover:bg-emerald-50">
                          <File className="h-8 w-8 text-emerald-600" />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{activeContent.fileUrl.split('/').pop() || 'Document'}</p>
                            <p className="text-xs text-slate-500">Click to open in a new tab</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-emerald-600" />
                        </a>
                      </div>
                    )}
                    {/* External link */}
                    {activeContent?.externalUrl && (
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">🔗 External Resource</p>
                        <a href={activeContent.externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-700 hover:bg-violet-100">
                          <Link2 className="h-8 w-8 text-violet-600" />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">Open external resource</p>
                            <p className="text-xs text-slate-500">{activeContent.externalUrl}</p>
                          </div>
                          <ChevronRight className="h-5 w-5" />
                        </a>
                      </div>
                    )}
                    {/* Empty state */}
                    {!markdownText && !activeContent?.videoUrl && !activeContent?.fileUrl && !activeContent?.externalUrl && (
                      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-600">No content has been added to this lesson yet. {canAuthor && 'Click the edit icon to add rich text, video, documents, or links.'}</p>
                    )}
                  </div>
                );
              }
              // Default: video placeholder + tabs
              return (
                <>
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-900">
                    <div className="text-center">
                      <PlayCircle className="mx-auto h-16 w-16 text-white/30" />
                      <p className="mt-2 text-sm text-white/50">Content will appear here</p>
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
                              <div className="mr-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const content = apiModules.flatMap((m: any) => m.contents ?? []).find((c: any) => c.id === lesson.id);
                                    if (content) loadContentForEdit(content);
                                  }}
                                  title="Edit content"
                                  className="rounded p-1 text-slate-300 hover:bg-violet-50 hover:text-violet-600"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteContent(String(lesson.id)); }} title="Delete content" className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
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

      {/* Add Content / Edit Content Modal — wide, Word-like layout */}
      {(showAddContent || editingContentId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Sticky header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                  <FileText className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{editingContentId ? 'Edit Content' : 'Add Content'}</h2>
                  <p className="text-xs text-slate-400">{newContentType === 'PAGE' ? 'Write rich text content with full formatting' : newContentType === 'VIDEO' ? 'Embed a video from YouTube, Vimeo, or a direct URL' : newContentType === 'DOCUMENT' ? 'Upload or link a downloadable document' : newContentType === 'EXTERNAL_LINK' ? 'Link to an external resource' : 'Create content for this module'}</p>
                </div>
              </div>
              <button onClick={() => { setShowAddContent(null); setEditingContentId(null); resetContentForm(); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {/* Section: Basic Info */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-700">Content Title *</Label>
                    <Input value={newContentTitle} onChange={(e) => setNewContentTitle(e.target.value)} placeholder="e.g., Introduction to UX Design" className="text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-700">Content Type</Label>
                    <select value={newContentType} onChange={(e) => setNewContentType(e.target.value as any)} disabled={!!editingContentId} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-violet-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400">
                      <option value="PAGE">📄 Page (rich text)</option>
                      <option value="VIDEO">🎥 Video</option>
                      <option value="DOCUMENT">📎 Document</option>
                      <option value="QUIZ">❓ Quiz</option>
                      <option value="ASSIGNMENT">📝 Assignment</option>
                      <option value="EXTERNAL_LINK">🔗 External Link</option>
                      <option value="MIXED">🎨 Mixed (text + video + files + links)</option>
                    </select>
                    {editingContentId && <p className="mt-1 text-xs text-slate-400">Type cannot be changed after creation.</p>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700">Description</Label>
                  <textarea value={newContentDescription} onChange={(e) => setNewContentDescription(e.target.value)} placeholder="Brief description shown in the course outline..." rows={2} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:border-violet-500 focus:outline-none" />
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Section: Type-specific content */}
                {newContentType === 'PAGE' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700">Page Content</Label>
                      <span className="text-xs text-slate-400">{newContentRichText.length} characters</span>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <RichTextEditor value={newContentRichText} onChange={setNewContentRichText} placeholder="Write your lesson content here. Use the toolbar above to format text, add headings, lists, links, images, tables, and more..." />
                    </div>
                  </div>
                )}

                {/* MIXED type — show ALL content fields at once so teachers
                    can combine rich text + video + document + external link
                    in a single content item. */}
                {newContentType === 'MIXED' && (
                  <div className="space-y-5">
                    {/* Rich text section */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <Label className="text-sm font-medium text-slate-700">📝 Rich Text Content</Label>
                        <span className="text-xs text-slate-400">{newContentRichText.length} characters</span>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <RichTextEditor value={newContentRichText} onChange={setNewContentRichText} placeholder="Write your lesson content here (optional)..." />
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Video section */}
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">🎥 Video (optional)</Label>
                      <Input value={newContentVideoUrl} onChange={(e) => setNewContentVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=... or direct video URL" className="text-sm" />
                      {newContentVideoUrl && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                          {newContentVideoUrl.includes('youtube.com') || newContentVideoUrl.includes('youtu.be') ? (
                            <iframe src={newContentVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="aspect-video w-full" allowFullScreen />
                          ) : newContentVideoUrl.includes('vimeo.com') ? (
                            <iframe src={newContentVideoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')} className="aspect-video w-full" allowFullScreen />
                          ) : (
                            <video src={newContentVideoUrl} controls className="aspect-video w-full" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Document section */}
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">📎 Document (optional)</Label>
                      {newContentFileUrl ? (
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                          <File className="h-8 w-8 text-emerald-600" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-slate-700">{newContentFileName || 'Uploaded file'}</p>
                            <a href={newContentFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">View file →</a>
                          </div>
                          <button onClick={() => { setNewContentFileUrl(''); setNewContentFileName(''); }} className="rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">Remove</button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-violet-400 hover:bg-violet-50/30">
                          <Upload className="mb-2 h-8 w-8 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">Click to upload a document</p>
                          <p className="mt-1 text-xs text-slate-400">PDF, DOCX, PPTX, XLSX, ZIP, images</p>
                          <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} disabled={uploadFileMut.isPending} />
                          {uploadFileMut.isPending && <p className="mt-2 text-xs text-violet-500">Uploading...</p>}
                        </label>
                      )}
                      <div className="mt-2">
                        <Input value={newContentFileUrl} onChange={(e) => { setNewContentFileUrl(e.target.value); setNewContentFileName(e.target.value.split('/').pop() || ''); }} placeholder="Or paste document URL directly..." className="text-sm" />
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* External link section */}
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">🔗 External Link (optional)</Label>
                      <Input value={newContentExternalUrl} onChange={(e) => setNewContentExternalUrl(e.target.value)} placeholder="https://example.com/additional-resource" className="text-sm" />
                      {newContentExternalUrl && (
                        <a href={newContentExternalUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-700 hover:bg-violet-100">
                          <Link2 className="h-4 w-4" />Test link →
                        </a>
                      )}
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Duration */}
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">⏱ Estimated Duration (minutes)</Label>
                      <Input type="number" value={newContentDuration} onChange={(e) => setNewContentDuration(e.target.value)} placeholder="e.g., 15" className="w-32 text-sm" />
                    </div>
                  </div>
                )}

                {newContentType === 'VIDEO' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">Video URL</Label>
                      <Input value={newContentVideoUrl} onChange={(e) => setNewContentVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=... or direct video URL" className="text-sm" />
                      <p className="mt-1 text-xs text-slate-400">Supports YouTube, Vimeo, or direct video file URLs (MP4, WebM).</p>
                    </div>
                    {newContentVideoUrl && (
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        {newContentVideoUrl.includes('youtube.com') || newContentVideoUrl.includes('youtu.be') ? (
                          <iframe src={newContentVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="aspect-video w-full" allowFullScreen />
                        ) : newContentVideoUrl.includes('vimeo.com') ? (
                          <iframe src={newContentVideoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')} className="aspect-video w-full" allowFullScreen />
                        ) : (
                          <video src={newContentVideoUrl} controls className="aspect-video w-full" />
                        )}
                      </div>
                    )}
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">Duration (minutes)</Label>
                      <Input type="number" value={newContentDuration} onChange={(e) => setNewContentDuration(e.target.value)} placeholder="e.g., 15" className="w-32 text-sm" />
                    </div>
                  </div>
                )}

                {newContentType === 'EXTERNAL_LINK' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">External URL *</Label>
                      <Input value={newContentExternalUrl} onChange={(e) => setNewContentExternalUrl(e.target.value)} placeholder="https://example.com/resource" className="text-sm" />
                      <p className="mt-1 text-xs text-slate-400">Students will open this URL in a new tab when they click the lesson.</p>
                    </div>
                    {newContentExternalUrl && (
                      <a href={newContentExternalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-700 hover:bg-violet-100">
                        <Link2 className="h-4 w-4" />Test link →
                      </a>
                    )}
                  </div>
                )}

                {newContentType === 'DOCUMENT' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">Document File</Label>
                      {newContentFileUrl ? (
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                          <File className="h-8 w-8 text-emerald-600" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-slate-700">{newContentFileName || 'Uploaded file'}</p>
                            <a href={newContentFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">View file →</a>
                          </div>
                          <button onClick={() => { setNewContentFileUrl(''); setNewContentFileName(''); }} className="rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">Remove</button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center hover:border-violet-400 hover:bg-violet-50/30">
                          <Upload className="mb-2 h-10 w-10 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">Click to upload or drag and drop</p>
                          <p className="mt-1 text-xs text-slate-400">PDF, DOCX, PPTX, XLSX, ZIP, images — up to 100MB</p>
                          <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} disabled={uploadFileMut.isPending} />
                          {uploadFileMut.isPending && <p className="mt-2 text-xs text-violet-500">Uploading...</p>}
                        </label>
                      )}
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">Or paste file URL directly</Label>
                      <Input value={newContentFileUrl} onChange={(e) => { setNewContentFileUrl(e.target.value); setNewContentFileName(e.target.value.split('/').pop() || ''); }} placeholder="https://example.com/document.pdf" className="text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-700">Duration (minutes)</Label>
                      <Input type="number" value={newContentDuration} onChange={(e) => setNewContentDuration(e.target.value)} placeholder="e.g., 10" className="w-32 text-sm" />
                    </div>
                  </div>
                )}

                {(!editingContentId && (newContentType === 'QUIZ' || newContentType === 'ASSIGNMENT')) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    <p className="font-medium">Heads up</p>
                    <p className="mt-1 text-xs">
                      {newContentType === 'QUIZ' && 'After creating this content, you can attach quiz questions via the Quizzes page.'}
                      {newContentType === 'ASSIGNMENT' && 'After creating this content, you can configure the assignment via the Assignments page.'}
                    </p>
                  </div>
                )}

                {authorErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{authorErr}</div>}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-xs text-slate-400">
                {newContentType === 'PAGE' && 'Tip: Use markdown shortcuts like **bold**, # headings, - lists'}
                {newContentType === 'VIDEO' && 'Tip: YouTube and Vimeo URLs are automatically embedded'}
                {newContentType === 'DOCUMENT' && 'Tip: Uploaded files are stored securely on Cloudinary'}
                {newContentType === 'EXTERNAL_LINK' && 'Tip: Links open in a new tab for students'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowAddContent(null); setEditingContentId(null); resetContentForm(); }} className="border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={() => editingContentId ? handleUpdateContent() : handleCreateContent(showAddContent!)} disabled={createContentMut.isPending || updateContentMut.isPending} className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                  {editingContentId ? (updateContentMut.isPending ? 'Updating...' : 'Update Content') : (createContentMut.isPending ? 'Creating...' : 'Create Content')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Quiz View ───────────────────────────────────────────────────────────
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
