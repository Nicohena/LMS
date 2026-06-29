// src/modules/reports/report.types.ts
import type { ReportFormat } from '@prisma/client';

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export interface PlatformDashboardStats {
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
    active: number;
    newThisWeek: number;
    newThisMonth: number;
    dailyActive: number;
    weeklyActive: number;
    monthlyActive: number;
  };
  courses: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  enrollments: {
    total: number;
    active: number;
    completed: number;
    dropped: number;
    newThisWeek: number;
  };
  content: {
    totalModules: number;
    totalContent: number;
    totalQuizzes: number;
    totalAssignments: number;
  };
  engagement: {
    quizAttempts: number;
    assignmentSubmissions: number;
    certificatesIssued: number;
  };
}

export interface TeacherDashboardStats {
  totalCourses: number;
  totalStudents: number;
  averageProgress: number;
  courses: Array<{
    id: string;
    title: string;
    enrolledCount: number;
    completedCount: number;
    averageProgress: number;
    atRiskCount: number;
  }>;
  atRiskStudents: Array<{
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    courseId: string;
    courseTitle: string;
    progressPercentage: number;
    daysSinceEnrollment: number;
  }>;
}

export interface StudentDashboardStats {
  enrollments: {
    total: number;
    active: number;
    completed: number;
  };
  averageProgress: number;
  timeSpentSeconds: number;
  upcomingDeadlines: Array<{
    assignmentId: string;
    title: string;
    courseTitle: string;
    dueDate: Date;
    daysUntilDue: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    date: Date;
  }>;
  gamification: {
    level: number;
    totalXP: number;
    badges: number;
    currentStreak: number;
  };
}

export interface CourseAnalyticsStats {
  courseId: string;
  courseTitle: string;
  enrolledCount: number;
  completedCount: number;
  completionRate: number;
  averageProgress: number;
  averageScore: number;
  moduleCount: number;
  contentCount: number;
  atRiskCount: number;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface ReportData {
  templateId: string;
  templateName: string;
  dataSource: string;
  generatedAt: Date;
  columns: string[];
  rows: Record<string, unknown>[];
  summary?: Record<string, number>;
}

export interface ReportTemplateResponse {
  id: string;
  name: string;
  description: string | null;
  dataSource: string;
  metrics: unknown;
  dimensions: unknown;
  filters: unknown;
  chartType: string | null;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReportResponse {
  id: string;
  templateId: string;
  name: string;
  frequency: string;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  isActive: boolean;
  format: string;
}

export interface GenerateReportResult {
  reportId: string;
  format: ReportFormat;
  fileUrl?: string;
  downloadUrl?: string;
  rowCount: number;
  generatedAt: Date;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export interface AuditLogResponse {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: Date;
  user?: { id: string; email: string; firstName: string; lastName: string } | null;
}

export interface UserDataExport {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: Date;
  };
  enrollments: unknown[];
  progress: unknown[];
  quizAttempts: unknown[];
  submissions: unknown[];
  certificates: unknown[];
  badges: unknown[];
  xpTransactions: unknown[];
  notifications: unknown[];
  auditLogs: unknown[];
}
