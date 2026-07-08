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

export function GamificationView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const user = useAuthStore((s) => s.user);
  const { data: levelData } = useUserLevel();
  const { data: badgesData } = useUserBadges();
  const { data: leaderboardData } = useLeaderboard({ limit: 10 });
  const { data: schoolData } = useStudentSchoolDashboard();
  const { data: certData } = useMyCertificates();

  const level = (levelData as any)?.level;
  const totalXP = level?.totalXP ?? 0;
  const currentLevel = level?.level ?? 1;
  const progressPct = level?.progressToNextLevel ?? 0;

  // Combine earned badges with mock badge catalog
  const earnedBadges = (badgesData?.badges ?? []) as any[];
  const badges = [
    { id: 1, name: 'Quick Learner', icon: Zap, color: 'bg-violet-100 text-violet-600', earned: true, date: '2 days ago' },
    { id: 2, name: 'Quiz Master', icon: FileQuestion, color: 'bg-violet-100 text-violet-600', earned: true, date: '1 week ago' },
    { id: 3, name: 'Perfect Score', icon: Star, color: 'bg-violet-100 text-violet-600', earned: true, date: '3 days ago' },
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
      <Card className="mb-6 overflow-hidden border border-violet-100 bg-gradient-to-br from-violet-600 to-violet-500 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Trophy className="h-8 w-8 text-violet-300" />
            </div>
            <div>
              <p className="text-sm text-violet-100">Your Level</p>
              <p className="text-3xl font-bold text-white">Level {currentLevel}</p>
              <p className="text-xs text-violet-200">{totalXP.toLocaleString()} XP · {level?.nextLevelXP ? `${level.nextLevelXP - level.currentLevelXP} XP to Level ${currentLevel + 1}` : ''}</p>
            </div>
          </div>
          <div className="sm:w-64">
            <div className="mb-1.5 flex items-center justify-between text-xs text-violet-100">
              <span>Level {currentLevel}</span>
              <span>{Math.round(progressPct)}% to Level {currentLevel + 1}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-300 to-white" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Badges + Certificates */}
        <div className="space-y-6 lg:col-span-2">
          {/* Badges */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Badge Collection</h2>
                <p className="text-sm text-slate-500">{earnedCount} of {badges.length} badges earned</p>
              </div>
              <Medal className="h-5 w-5 text-violet-500" />
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
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Certificates</h2>
                <p className="text-sm text-slate-500">{certificates.length} certificates earned</p>
              </div>
              <Award className="h-5 w-5 text-violet-500" />
            </div>
            <div className="space-y-3">
              {certList.map((cert) => (
                <div key={cert.id} className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:border-violet-200 hover:shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-500">
                    <BadgeCheck className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{cert.title}</p>
                    <p className="text-xs text-slate-500">Issued {cert.issueDate} · {cert.instructor}</p>
                    <p className="mt-0.5 text-[10px] font-mono text-slate-400">{cert.ref}</p>
                  </div>
                  <div className="flex gap-1">
                    {(cert as any).certificateUrl && (
                      <a href={(cert as any).certificateUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="border-slate-200 text-slate-600"><Download className="mr-1 h-3.5 w-3.5" />PDF</Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('verify-certificate')} className="text-violet-600 hover:bg-violet-50">Verify</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Leaderboard + Streaks */}
        <div className="space-y-6">
          {/* Learning Streak */}
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
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
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Leaderboard</h2>
              <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">This Week</Badge>
            </div>
            <div className="space-y-1">
              {liveLeaderboard.map((learner) => (
                <div key={learner.rank} className={cn('flex items-center gap-3 rounded-lg px-2 py-2', learner.name === 'Ricky Fajrin' ? 'bg-violet-50' : 'hover:bg-slate-50')}>
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', learner.rank === 1 ? 'bg-violet-100 text-violet-700' : learner.rank === 2 ? 'bg-slate-200 text-slate-600' : learner.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400')}>
                    {learner.rank}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">{learner.avatar}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{learner.name}</p>
                    <p className="text-[10px] text-slate-400">Level {learner.level} · {learner.courses} courses</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-violet-600">{learner.xp.toLocaleString()}</p>
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

export function CourseCreateView({ onNavigate }: { onNavigate: (v: View) => void }) {
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
    { type: 'Video', icon: Video, color: 'bg-violet-50 text-violet-600', desc: 'Upload or embed video content' },
    { type: 'Quiz', icon: FileQuestion, color: 'bg-emerald-50 text-emerald-600', desc: 'Create quizzes with multiple question types' },
    { type: 'Assignment', icon: FileText, color: 'bg-violet-50 text-violet-600', desc: 'File upload or text-based assignments' },
    { type: 'Document', icon: File, color: 'bg-violet-50 text-violet-600', desc: 'Upload PDF, DOCX, or other documents' },
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
              <Button onClick={() => onNavigate('dashboard')} className="bg-violet-600 text-white hover:bg-violet-700">Back to Dashboard</Button>
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
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors', step >= s.num ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-400')}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={cn('mt-1.5 text-xs font-medium', step >= s.num ? 'text-slate-900' : 'text-slate-400')}>{s.label}</span>
            </div>
            {idx < steps.length - 1 && <div className={cn('mx-2 h-0.5 w-12 sm:w-24', step > s.num ? 'bg-violet-600' : 'bg-slate-200')} />}
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
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Brief description of what students will learn..." className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Category</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-violet-500 focus:outline-none">
                  <option>Design</option><option>Programming</option><option>Business</option><option>Data Science</option><option>Marketing</option><option>General</option>
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-slate-700">Difficulty</Label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-violet-500 focus:outline-none">
                  <option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-slate-700">Thumbnail</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-6 hover:border-violet-300 hover:bg-slate-50">
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
            <Button onClick={() => setStep(2)} disabled={!title || !description} className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">Next: Add Content<ChevronRight className="ml-1.5 h-4 w-4" /></Button>
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
            <Button onClick={() => setStep(3)} className="bg-violet-600 text-white hover:bg-violet-700">Next: Review & Publish<ChevronRight className="ml-1.5 h-4 w-4" /></Button>
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

export function SettingsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [activeTab, setActiveTab] = useState('general');
  const { data: settingsData } = useSettings();
  const batchUpdate = useBatchUpdateSettings();
  const enableMaintenance = useEnableMaintenance();
  const disableMaintenance = useDisableMaintenance();
  const { data: maintenanceStatus } = useMaintenanceStatus();
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
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
                  <button onClick={() => setAllowReg(!allowReg)} className={cn('relative h-6 w-11 rounded-full transition-colors', allowReg ? 'bg-violet-600' : 'bg-slate-300')}>
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
                  <Button onClick={handleSaveGeneral} disabled={batchUpdate.isPending} className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50"><Mail className="h-4 w-4 text-violet-600" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{tpl.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-400">{tpl.subject}</p>
                    </div>
                    <Badge className={cn('rounded-full', tpl.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                      {tpl.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <button onClick={() => {
                      import('@/lib/api').then(async ({ default: api }) => {
                        try {
                          const res = await api.get(`/email-templates/${tpl.type}`);
                          const template = res.data?.template ?? res.data;
                          const newSubject = prompt(`Edit subject for ${tpl.type.replace(/_/g, ' ')}:`, template?.subject ?? tpl.subject);
                          if (newSubject && newSubject !== (template?.subject ?? tpl.subject)) {
                            await api.patch(`/email-templates/${tpl.type}`, { subject: newSubject });
                            toast({ title: 'Template updated', description: 'Refresh the page to see changes.' });
                          }
                        } catch (err: any) {
                          toast({ title: 'Error', description: err.response?.data?.message || err.message, variant: 'destructive' });
                        }
                      });
                    }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600"><Edit className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'grading' && (
            <Card className="border border-slate-200 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Grading Scales</h2>
                <Button size="sm" onClick={() => {
                  const name = prompt('Enter grading scale name (e.g., "Standard A-F"):');
                  if (!name) return;
                  import('@/lib/api').then(async ({ default: api }) => {
                    try {
                      await api.post('/grading-scales', { name, type: 'PERCENTAGE', grades: [{ letter: 'A', minPercentage: 90 }, { letter: 'B', minPercentage: 80 }, { letter: 'C', minPercentage: 70 }, { letter: 'D', minPercentage: 60 }, { letter: 'F', minPercentage: 0 }] });
                      toast({ title: 'Grading scale created' });
                    } catch (err: any) { toast({ title: 'Error', description: err.response?.data?.message || err.message, variant: 'destructive' }); }
                  });
                }} className="bg-violet-600 text-white hover:bg-violet-700"><Plus className="mr-1 h-3.5 w-3.5" />Add Scale</Button>
              </div>
              <div className="space-y-3">
                {gradingScales.map((scale) => (
                  <div key={scale.name} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{scale.name}</p>
                        {scale.isDefault && <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">Default</Badge>}
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
                <Button size="sm" onClick={() => {
                  const name = prompt('Enter academic year name (e.g., "2026-2027"):');
                  if (!name) return;
                  const start = prompt('Start date (YYYY-MM-DD):', '2026-09-01');
                  if (!start) return;
                  const end = prompt('End date (YYYY-MM-DD):', '2027-06-30');
                  if (!end) return;
                  import('@/lib/api').then(async ({ default: api }) => {
                    try {
                      await api.post('/academic-years', { name, startDate: start, endDate: end });
                      toast({ title: 'Academic year created' });
                    } catch (err: any) { toast({ title: 'Error', description: err.response?.data?.message || err.message, variant: 'destructive' }); }
                  });
                }} className="bg-violet-600 text-white hover:bg-violet-700"><Plus className="mr-1 h-3.5 w-3.5" />Add Year</Button>
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
                  <textarea value={maintMsg} onChange={(e) => setMaintMsg(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                </div>
                <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-violet-600" />
                    <p className="text-xs text-violet-700">When enabled, only whitelisted IPs can access the platform. All other users see the maintenance message.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => {
                    if (maintMode) {
                      enableMaintenance.mutate({ message: maintMsg });
                    } else {
                      disableMaintenance.mutate();
                    }
                  }} disabled={enableMaintenance.isPending || disableMaintenance.isPending} className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                    {enableMaintenance.isPending || disableMaintenance.isPending ? 'Saving…' : 'Save Settings'}
                  </Button>
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

export function NotificationPreferencesTab() {
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
                    className={cn('relative h-6 w-11 rounded-full transition-colors', isEnabled(nt.type, 'IN_APP') ? 'bg-violet-600' : 'bg-slate-300')}
                  >
                    <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', isEnabled(nt.type, 'IN_APP') ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => handleToggle(nt.type, 'EMAIL', !isEnabled(nt.type, 'EMAIL'))}
                    className={cn('relative h-6 w-11 rounded-full transition-colors', isEnabled(nt.type, 'EMAIL') ? 'bg-violet-600' : 'bg-slate-300')}
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

export function MessagesView({ onNavigate }: { onNavigate: (v: View) => void }) {
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
            <button key={conv.id} onClick={() => setActiveChat(conv.id)} className={cn('flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition-colors', activeChatId === conv.id ? 'bg-violet-50' : 'hover:bg-slate-50')}>
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">{conv.avatar}</div>
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
                  {conv.unread > 0 && <span className="ml-1 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">{conv.unread}</span>}
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">{activeConv?.avatar}</div>
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
                <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm', msg.isMe ? 'rounded-br-md bg-violet-600 text-white' : 'rounded-bl-md bg-white text-slate-700 border border-slate-200')}>
                  <p>{msg.text}</p>
                  <p className={cn('mt-1 text-[10px]', msg.isMe ? 'text-violet-200' : 'text-slate-400')}>{msg.time}</p>
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
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button onClick={handleSend} disabled={!message.trim()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:opacity-50">
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────

export function ProfileView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const authUser = useAuthStore((s) => s.user);
  const { data: profile } = useMyProfile();
  const { data: levelData } = useUserLevel();
  const { data: studentData } = useStudentDashboard();
  const { data: badgesData } = useUserBadges();
  const { data: certificatesData } = useMyCertificates();
  const { data: streakData } = useStreak();
  const { data: xpHistoryData } = useXPHistory(15);
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
          const updated = data?.user ?? data;
          if (updated) {
            updateUserStore({ firstName: updated.firstName, lastName: updated.lastName });
          }
          setShowEdit(false);
          toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
        },
        onError: (err: any) => { setEditErr(err.response?.data?.message || 'Failed to update profile.'); toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update profile.', variant: 'destructive' }); },
      },
    );
  };

  const myCourses = (studentData?.courses ?? []).map((c: any) => ({
    title: c.course?.title ?? 'Untitled',
    progress: c.progressPercentage ?? 0,
    instructor: c.course?.createdBy ? `${c.course.createdBy.firstName} ${c.course.createdBy.lastName}` : '—',
    difficulty: c.course?.difficulty ? c.course.difficulty.charAt(0) + c.course.difficulty.slice(1).toLowerCase() : 'Beginner',
  }));
  const courses = myCourses;

  const earnedBadges = ((badgesData as any)?.badges ?? []).filter((b: any) => b.earnedAt);
  const certificates = ((certificatesData as any)?.certificates ?? (certificatesData as any)?.data ?? []);
  const streak = (streakData as any)?.streak;
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? currentStreak;

  const achievements = [
    { icon: Trophy, label: `Level ${currentLevel}`, sublabel: `${totalXP.toLocaleString()} XP`, color: 'bg-violet-50 text-violet-600' },
    { icon: Flame, label: `${currentStreak}-day streak`, sublabel: longestStreak > 0 ? `Longest: ${longestStreak} days` : 'Start learning today!', color: 'bg-orange-50 text-orange-600' },
    { icon: BookOpen, label: `${studentData?.stats?.enrollments?.total ?? 0} courses`, sublabel: `${studentData?.stats?.enrollments?.active ?? 0} in progress`, color: 'bg-violet-50 text-violet-600' },
    { icon: Award, label: `${certificates.length} certificates`, sublabel: certificates.length > 0 ? 'Earned' : 'None yet', color: 'bg-emerald-50 text-emerald-600' },
  ];

  const xpTransactions = ((xpHistoryData as any)?.transactions ?? (xpHistoryData as any)?.data ?? []);

  const activity = xpTransactions.map((tx: any) => ({
    type: 'xp',
    title: `${tx.source?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Activity'}: ${tx.points > 0 ? '+' : ''}${tx.points} XP`,
    time: tx.createdAt ? timeAgo(tx.createdAt) : '',
    icon: tx.points > 0 ? Zap : AlertCircle,
    color: tx.points > 0 ? 'text-violet-600' : 'text-red-500',
  }));

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
      <Card className="mb-6 overflow-hidden border border-slate-200 shadow-sm rounded-xl">
        <div className="h-28 bg-gradient-to-r from-violet-600 to-violet-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-violet-100 text-2xl font-bold text-violet-600 shadow-lg">{initials}</div>
              <div className="pb-2">
                <h1 className="text-xl font-bold text-slate-900">{fullName}</h1>
                <p className="text-sm capitalize text-slate-500">{roleLabel} · Joined {joinedDate}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50"><Trophy className="mr-1 h-3 w-3" />Level {currentLevel}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50"><Flame className="mr-1 h-3 w-3" />{currentStreak}-day streak</Badge>
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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', activeTab === tab.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-900">About</h2>
            <p className="text-sm text-slate-600">{(me as any)?.bio || `No bio yet. Click "Edit Profile" to add one.`}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-500"><Mail className="h-4 w-4 text-slate-400" />{me?.email ?? '—'}</div>
              <div className="flex items-center gap-2 text-slate-500"><BookOpen className="h-4 w-4 text-slate-400" />{studentData?.stats?.enrollments?.total ?? 0} enrolled courses</div>
              <div className="flex items-center gap-2 text-slate-500"><Award className="h-4 w-4 text-slate-400" />{certificates.length} certificates earned</div>
            </div>
          </Card>
          <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Recent Activity</h2>
            <div className="space-y-3">
              {activity.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">No recent activity yet.</p>
              )}
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
          {courses.length === 0 && (
            <Card className="border border-dashed border-slate-300 p-8 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-700">No courses yet</h3>
              <p className="mt-1 text-sm text-slate-500">You haven't enrolled in any courses yet.</p>
            </Card>
          )}
          {courses.map((course) => (
            <Card key={course.title} className="border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-400">{course.instructor} · {course.difficulty}</p>
                </div>
                <div className="ml-4 w-32">
                  <div className="mb-1 flex items-center justify-between text-xs"><span className="text-slate-400">Progress</span><span className="font-semibold text-slate-700">{course.progress}%</span></div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${course.progress}%` }} /></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <Card className="border border-slate-200 p-5 shadow-sm rounded-xl">
          <div className="space-y-4">
            {activity.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No recent activity. Start learning to earn XP!</p>
            )}
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
          {(() => {
            const allBadges = (badgesData as any)?.badges ?? (badgesData as any)?.data ?? [];
            if (allBadges.length === 0) {
              return <div className="col-span-full py-12 text-center text-sm text-slate-400">No badges available yet. Complete courses and quizzes to earn badges!</div>;
            }
            return allBadges.map((badge: any) => {
              const earned = !!badge.earnedAt;
              return (
            <Card key={badge.id ?? badge.name} className={cn('flex flex-col items-center p-4 text-center border shadow-sm', earned ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-60')}>
              <div className={cn('mb-2 flex h-12 w-12 items-center justify-center rounded-full', earned ? 'bg-violet-50 text-violet-600' : 'bg-slate-200 text-slate-400')}>
                {badge.iconUrl ? <img src={badge.iconUrl} alt={badge.name} className="h-6 w-6" /> : <Award className="h-6 w-6" />}
              </div>
              <p className="text-xs font-medium text-slate-900">{badge.name}</p>
              <p className="text-[10px] text-slate-400">{earned ? 'Earned' : 'Locked'}</p>
              {badge.description && <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">{badge.description}</p>}
            </Card>
              );
            });
          })()}
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
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              {editErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{editErr}</div>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1 border-slate-200 text-slate-600">Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
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
                  className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
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

// ─── AI Assistant Sidebar (Trenning-inspired) ─────────────────────────────

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const authUser = useAuthStore((s) => s.user);
  const firstName = authUser?.firstName ?? 'there';

  const quickActions = [
    { label: 'Summarize my progress', desc: 'Get an overview of your learning' },
    { label: 'What should I learn next?', desc: 'Get personalized recommendations' },
    { label: 'Explain a concept', desc: 'Ask about any topic you\'re studying' },
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, text: input };
    setMessages([...messages, userMsg]);
    setInput('');
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: 'I\'m your AI learning assistant. This feature will be connected to an AI backend to help you with your studies. For now, you can explore your dashboard, courses, and quizzes!' }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
          title="AI Assistant"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[500px] w-80 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-violet-50 to-blue-50 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-violet-100 bg-white/50 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
                <p className="text-[10px] text-slate-500">Your learning companion</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages or quick actions */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-sm text-slate-700">Hi {firstName}! I\'m your AI learning assistant. How can I help you today?</p>
                </div>
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => { setInput(action.label); }}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-violet-200 hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-500">{action.desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[85%] rounded-xl p-3 text-sm',
                      msg.role === 'user' ? 'bg-violet-500 text-white' : 'bg-white text-slate-700 shadow-sm'
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-violet-100 bg-white/50 p-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder="Ask me anything..."
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 text-white transition-all hover:bg-violet-600 disabled:opacity-50"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
