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


export function AnnouncementsView({ onNavigate }: { onNavigate: (v: View) => void }) {
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

export function DisputeGradeButton({ attemptId }: { attemptId: string }) {
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

export function GradeDisputesSection() {
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

export function AdminSubRolesSection() {
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

export function QualityMonitoringSection() {
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

export function AutoEnrollmentRulesSection() {
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

export function EscalationsSection() {
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

export function AdminAlertsBar() {
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

export function ActivityFeed() {
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

export function AdminView({ onNavigate }: { onNavigate: (v: View) => void }) {
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

export function FlaggedContentSection() {
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

export function UsersView({ onNavigate }: { onNavigate: (v: View) => void }) {
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

export function AuditLogsView({ onNavigate }: { onNavigate: (v: View) => void }) {
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

export function DiscussionsView({ onNavigate, onSelectDiscussion }: { onNavigate: (v: View) => void; onSelectDiscussion: (id: string) => void }) {
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

export function DiscussionDetailView({ discussionId, onNavigate }: { discussionId: string; onNavigate: (v: View) => void }) {
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
