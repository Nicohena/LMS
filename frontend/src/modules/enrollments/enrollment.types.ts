// src/modules/enrollments/enrollment.types.ts
import type {
  Content,
  Course,
  Enrollment,
  EnrollmentStatus,
  Progress,
  ProgressStatus,
  User,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Filter / pagination shape (parsed query string)
// ---------------------------------------------------------------------------

export interface EnrollmentFilters {
  page: number;
  limit: number;
  status?: EnrollmentStatus;
  courseId?: string;
  userId?: string;
  search?: string;
  sortBy: 'enrolledAt' | 'updatedAt' | 'progressPercentage' | 'lastAccessedAt';
  sortOrder: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  thumbnail: string | null;
  category: string | null;
  difficulty: string;
}

export type ProgressResponse = Progress;

export type EnrollmentResponse = Enrollment & {
  user: UserSummary;
  course: CourseSummary;
};

export interface EnrollmentListResponse {
  data: EnrollmentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EnrollmentDetailResponse extends EnrollmentResponse {
  progress: Array<
    Progress & {
      content: {
        id: string;
        title: string;
        type: string;
        moduleId: string;
        order: number;
      };
    }
  >;
}

export interface BulkEnrollResult {
  total: number;
  enrolled: number;
  failed: number;
  errors: Array<{ userId?: string; reason: string }>;
}

// ---------------------------------------------------------------------------
// Dashboard response shapes
// ---------------------------------------------------------------------------

export interface EnrolledCourseStat {
  enrollmentId: string;
  course: CourseSummary;
  status: EnrollmentStatus;
  progressPercentage: number;
  lastAccessedAt: Date;
  enrolledAt: Date;
  nextContentId: string | null;
}

export interface StudentDashboardResponse {
  stats: {
    totalEnrollments: number;
    active: number;
    completed: number;
    dropped: number;
    averageProgress: number;
  };
  courses: EnrolledCourseStat[];
  recentActivity: Array<{
    contentId: string;
    contentTitle: string;
    courseTitle: string;
    status: ProgressStatus;
    progressPercent: number;
    lastAccessedAt: Date;
  }>;
}

export interface CourseProgressStat {
  courseId: string;
  courseTitle: string;
  enrolledCount: number;
  completedCount: number;
  averageProgress: number;
  atRiskCount: number;
}

export interface AtRiskStudent {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
  enrolledAt: Date;
  daysSinceEnrollment: number;
}

export interface TeacherDashboardResponse {
  totalCourses: number;
  totalEnrollments: number;
  averageCompletionRate: number;
  courses: CourseProgressStat[];
  atRiskStudents: AtRiskStudent[];
}

// ---------------------------------------------------------------------------
// Cache key helpers
// ---------------------------------------------------------------------------

export const CACHE_KEYS = {
  studentDashboard: (userId: string) => `student:dashboard:${userId}`,
  teacherDashboard: (userId: string) => `teacher:dashboard:${userId}`,
  enrollmentProgress: (enrollmentId: string) => `enrollment:${enrollmentId}:progress`,
} as const;

export const CACHE_TTL = {
  studentDashboard: 5 * 60, // 5 minutes
  teacherDashboard: 10 * 60, // 10 minutes
  enrollmentProgress: 2 * 60, // 2 minutes
} as const;
