// src/modules/courses/course.types.ts
import type {
  Content,
  Course,
  CourseStatus,
  DifficultyLevel,
  ContentType,
  Module,
  User,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Visibility / role helpers
// ---------------------------------------------------------------------------

/**
 * Roles that can perform write operations on courses/modules/content.
 */
export const COURSE_AUTHOR_ROLES = ['ADMIN', 'TEACHER'] as const;

export type CourseAuthorRole = (typeof COURSE_AUTHOR_ROLES)[number];

// ---------------------------------------------------------------------------
// Filter / pagination shape (parsed query string)
// ---------------------------------------------------------------------------

export interface CourseFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  status?: CourseStatus;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'difficulty';
  sortOrder: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// API response shapes (no sensitive fields, includes derived counts)
// ---------------------------------------------------------------------------

export interface CreatorSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export type CourseResponse = Omit<Course, 'createdBy'> & {
  /** The course creator (admin/teacher who owns this course). */
  createdBy: CreatorSummary;
  moduleCount: number;
};

export type ModuleResponse = Module & {
  contentCount: number;
};

export type ContentResponse = Content;

export interface CourseListResponse {
  data: CourseResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CourseDetailResponse extends CourseResponse {
  modules: Array<
    ModuleResponse & {
      contents: ContentResponse[];
    }
  >;
}

// ---------------------------------------------------------------------------
// Used internally by service to fetch with creator relation
// ---------------------------------------------------------------------------

export type CourseWithCreator = Course & {
  creator: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>;
  _count?: { modules: number };
};
