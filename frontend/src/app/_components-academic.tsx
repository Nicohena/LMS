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


export function StudentDashboardHomeView({ onNavigate }: { onNavigate: (v: View) => void }) {
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
              {liveTopLearners.map((learner) => (
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


export function TeacherDashboardHomeView({ onNavigate }: { onNavigate: (v: View) => void }) {
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

export function AdminDashboardHomeView({ onNavigate }: { onNavigate: (v: View) => void }) {
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

export function ScheduleTab() {
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


export function AcademicManagementView({ onNavigate }: { onNavigate: (v: View) => void }) {
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

export function AcademicYearsTab() {
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

export function AcademicYearSections({ academicYearId }: { academicYearId: string }) {
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

export function GradeSections({ gradeId, gradeName }: { gradeId: string; gradeName: string }) {
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

export function SubjectSections({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
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

export function GradesTab() {
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

export function SubjectsTab() {
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

export function SectionsTab({ selectedSectionId, onSelectSection }: { selectedSectionId: string | null; onSelectSection: (id: string | null) => void }) {
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

export function SectionDetailView({ sectionId, onBack }: { sectionId: string; onBack: () => void }) {
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



export function MySectionsView({ onNavigate }: { onNavigate: (v: View) => void }) {
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
