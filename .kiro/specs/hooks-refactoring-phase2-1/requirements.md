# Requirements Document

## Introduction

This document specifies the functional, non-functional, and technical requirements for Phase 2.1 of the LMS frontend refactoring project: splitting the massive `hooks.ts` file (2,141 lines, 159 hooks) into 15 focused, domain-specific files organized in a `hooks/api/` directory. This refactoring aims to improve code maintainability, navigability, and developer experience while maintaining 100% backward compatibility.

The requirements are derived from the design document and ensure the refactoring achieves its goals without introducing breaking changes or disrupting existing functionality.

## Glossary

- **System**: The LMS frontend application hooks refactoring implementation
- **Hook**: A React custom hook using React Query for data fetching and mutations
- **Domain_File**: A TypeScript file containing hooks for a specific business domain (e.g., useAuth.ts, useCourses.ts)
- **Barrel_Export**: An index.ts file that re-exports all hooks from domain files
- **Migration**: The process of moving hooks from the monolithic hooks.ts to domain-specific files
- **React_Query**: The @tanstack/react-query library used for server state management
- **API_Client**: The Axios instance configured in @/lib/api for making HTTP requests
- **Auth_Store**: The Zustand store managing authentication state
- **Query_Key**: A unique identifier used by React Query for caching and invalidation
- **Component**: A React component that consumes hooks
- **Import_Path**: The module path used in import statements (e.g., '@/lib/hooks' or '@/hooks/api')
- **TypeScript_Compiler**: The TypeScript compiler that validates type correctness
- **Developer**: A programmer working on or using the LMS frontend codebase

## Requirements

### Requirement 1: Domain-Specific File Creation

**User Story:** As a developer, I want hooks organized into domain-specific files, so that I can quickly locate and maintain hooks related to specific business domains.

#### Acceptance Criteria

1. THE System SHALL create exactly 15 domain-specific hook files in the `frontend/src/hooks/api/` directory
2. WHEN creating domain files, THE System SHALL name files according to the domain convention: `useAuth.ts`, `useUsers.ts`, `useCourses.ts`, `useEnrollments.ts`, `useQuizzes.ts`, `useAssignments.ts`, `useNotifications.ts`, `useGamification.ts`, `useAcademic.ts`, `useAdmin.ts`, `useDiscussions.ts`, `usePeerReviews.ts`, `useSettings.ts`, `useMessages.ts`, `useAudit.ts`
3. WHEN organizing hooks, THE System SHALL ensure each domain file contains hooks related only to its specific business domain
4. THE System SHALL ensure no domain file exceeds 250 lines of code
5. THE System SHALL ensure no domain file contains fewer than 60 lines of code (except useAudit.ts which is 60 lines)
6. THE System SHALL distribute all 159 hooks from the original hooks.ts file across the 15 domain files with no hooks omitted

### Requirement 2: Hook Preservation and Integrity

**User Story:** As a developer, I want all existing hooks to maintain their exact signatures and behavior, so that existing components continue to function without modification.

#### Acceptance Criteria

1. WHEN migrating hooks to domain files, THE System SHALL preserve the exact function signature of every hook including parameter names, types, and return types
2. WHEN migrating hooks to domain files, THE System SHALL preserve all hook implementation logic without modification
3. WHEN migrating hooks to domain files, THE System SHALL preserve all React Query configurations including queryKey patterns, staleTime, cacheTime, and refetch settings
4. WHEN migrating hooks to domain files, THE System SHALL preserve all onSuccess, onError, and onSettled callback behaviors
5. WHEN migrating hooks to domain files, THE System SHALL preserve all cache invalidation logic using queryClient.invalidateQueries
6. THE System SHALL ensure all 159 hooks from the original file are present in the new structure

### Requirement 3: Barrel Export Implementation

**User Story:** As a developer, I want a barrel export that re-exports all hooks, so that I can import hooks from a single entry point.

#### Acceptance Criteria

1. THE System SHALL create an index.ts file at `frontend/src/hooks/api/index.ts`
2. WHEN implementing the barrel export, THE Barrel_Export SHALL use `export * from './fileName'` syntax to re-export all hooks from each of the 15 domain files
3. WHEN importing from the barrel export, THE System SHALL allow developers to import any hook using the pattern `import { hookName } from '@/hooks/api'`
4. THE Barrel_Export SHALL maintain the same export interface as the original hooks.ts file
5. THE Barrel_Export SHALL export all 159 hooks without naming conflicts or duplicates

### Requirement 4: Backward Compatibility During Migration

**User Story:** As a developer, I want both old and new import paths to work simultaneously, so that migration can be performed incrementally without breaking existing functionality.

#### Acceptance Criteria

1. WHEN new domain files are created, THE System SHALL preserve the original `frontend/src/lib/hooks.ts` file unchanged
2. WHILE migration is in progress, THE System SHALL allow imports from both `@/lib/hooks` and `@/hooks/api` paths
3. WHILE migration is in progress, THE System SHALL ensure components using old import paths continue to function identically to components using new import paths
4. WHEN a component imports from `@/lib/hooks`, THE System SHALL provide the same hook functionality as importing from `@/hooks/api`

### Requirement 5: Import Path Migration

**User Story:** As a developer, I want to update all import statements to use the new hooks/api path, so that the codebase uses a consistent import structure.

#### Acceptance Criteria

1. THE System SHALL identify all TypeScript and TSX files that import from `@/lib/hooks`
2. WHEN updating imports, THE System SHALL replace `from '@/lib/hooks'` with `from '@/hooks/api'` in all identified files
3. WHEN updating imports, THE System SHALL preserve the exact list of imported hook names in each import statement
4. WHEN updating imports, THE System SHALL preserve all other import statements in each file unchanged
5. AFTER updating all imports, THE TypeScript_Compiler SHALL compile the codebase without errors

### Requirement 6: File Structure and Organization

**User Story:** As a developer, I want a clear and consistent file structure, so that I can navigate the codebase efficiently.

#### Acceptance Criteria

1. THE System SHALL create the directory structure `frontend/src/hooks/api/` if it does not exist
2. THE System SHALL place all 15 domain files and the barrel export within the `frontend/src/hooks/api/` directory
3. WHEN structuring domain files, THE System SHALL use the file template pattern with 'use client' directive, imports section, domain separator comment, and hook exports
4. THE System SHALL ensure each domain file imports only the dependencies it requires: @tanstack/react-query, @/lib/api, and @/lib/auth-store
5. THE System SHALL ensure consistent code formatting across all domain files using the project's existing formatting rules

### Requirement 7: TypeScript Type Safety

**User Story:** As a developer, I want full TypeScript type safety maintained, so that type errors are caught at compile time.

#### Acceptance Criteria

1. THE System SHALL ensure all hooks maintain their original TypeScript type annotations for parameters and return types
2. WHEN the migration is complete, THE TypeScript_Compiler SHALL successfully compile the entire codebase with strict mode enabled
3. THE System SHALL ensure no new TypeScript errors are introduced during migration
4. THE System SHALL ensure all hook parameter types and return types are properly inferred by the TypeScript language server
5. THE System SHALL ensure all imported types from domain files are correctly resolved

### Requirement 8: React Query Consistency

**User Story:** As a developer, I want React Query behavior to remain consistent, so that caching, invalidation, and mutations work identically after refactoring.

#### Acceptance Criteria

1. THE System SHALL preserve all useQuery queryKey patterns in the format: `['resource', params]` for collections and `['resource', id]` for single resources
2. WHEN hooks perform mutations, THE System SHALL preserve all cache invalidation calls using queryClient.invalidateQueries with the correct queryKey patterns
3. THE System SHALL preserve all React Query configuration options including enabled, staleTime, cacheTime, refetchOnWindowFocus, and retry settings
4. THE System SHALL ensure optimistic updates and onMutate logic remain unchanged
5. THE System SHALL ensure error handling patterns using onError callbacks remain unchanged

### Requirement 9: Zero Breaking Changes

**User Story:** As a developer, I want zero breaking changes to existing components, so that all existing functionality continues to work without modification.

#### Acceptance Criteria

1. THE System SHALL ensure all components that imported hooks from `@/lib/hooks` continue to function identically after importing from `@/hooks/api`
2. THE System SHALL ensure all hook call sites (where hooks are invoked in components) require no changes to function calls, parameters, or return value handling
3. THE System SHALL ensure all existing tests that use these hooks continue to pass without modification
4. WHEN the migration is complete and the old hooks.ts file is removed, THE System SHALL ensure no runtime errors occur in any part of the application
5. THE System SHALL ensure authentication flows, data fetching, mutations, and cache invalidation work identically before and after migration

### Requirement 10: Testing and Verification

**User Story:** As a developer, I want comprehensive testing of the migrated hooks, so that I can be confident the refactoring did not introduce bugs.

#### Acceptance Criteria

1. THE System SHALL successfully compile the TypeScript codebase without errors after migration
2. WHEN testing manually, THE System SHALL pass all functionality tests across all 15 business domains (auth, users, courses, enrollments, quizzes, assignments, notifications, gamification, academic, admin, discussions, peer reviews, settings, messages, audit)
3. WHEN testing authentication flows, THE System SHALL successfully execute login, logout, and password change operations
4. WHEN testing data fetching hooks, THE System SHALL successfully retrieve data from all API endpoints and populate components correctly
5. WHEN testing mutation hooks, THE System SHALL successfully create, update, and delete resources and invalidate caches appropriately
6. WHEN testing real-world user scenarios, THE System SHALL handle complete workflows (e.g., create course → add module → publish course) without errors

### Requirement 11: Documentation and Developer Communication

**User Story:** As a developer, I want clear documentation of the new structure, so that I can understand and use the refactored hooks effectively.

#### Acceptance Criteria

1. THE System SHALL provide documentation listing all 15 domain files and their contained hooks
2. THE System SHALL provide migration guide documentation explaining the import path change from `@/lib/hooks` to `@/hooks/api`
3. THE System SHALL provide examples of importing hooks using the new barrel export pattern
4. THE System SHALL document the domain organization strategy and file size constraints
5. THE System SHALL update team onboarding documentation to reference the new hooks/api structure

### Requirement 12: Performance Requirements

**User Story:** As a developer, I want the refactoring to maintain or improve application performance, so that users experience no degradation.

#### Acceptance Criteria

1. THE System SHALL ensure TypeScript compilation time does not increase by more than 10% after refactoring
2. THE System SHALL ensure IDE autocomplete performance for hook imports is equivalent to or faster than before refactoring
3. THE System SHALL ensure React Query cache behavior and performance remain unchanged
4. THE System SHALL ensure the JavaScript bundle size does not increase after refactoring (may decrease due to better tree-shaking)
5. THE System SHALL ensure file loading times in the IDE are faster for smaller domain files compared to the original monolithic file

### Requirement 13: Maintainability Requirements

**User Story:** As a developer, I want the new structure to be maintainable, so that future development is easier and more efficient.

#### Acceptance Criteria

1. THE System SHALL ensure each domain file adheres to the Single Responsibility Principle by containing hooks for only one business domain
2. THE System SHALL ensure functional cohesion by grouping related hooks together within each domain file
3. WHEN a developer needs to add a new hook, THE System SHALL allow adding it to the appropriate domain file without exceeding the 250-line limit
4. WHEN a developer needs to find a specific hook, THE System SHALL enable locating it quickly by examining the domain file name
5. THE System SHALL ensure merge conflicts are reduced by separating hooks into smaller, focused files

### Requirement 14: Cleanup and Finalization

**User Story:** As a developer, I want the old monolithic hooks file removed after migration, so that the codebase maintains a single source of truth.

#### Acceptance Criteria

1. WHEN all import paths have been updated to `@/hooks/api`, THE System SHALL allow the deletion of `frontend/src/lib/hooks.ts`
2. AFTER deleting the old hooks file, THE TypeScript_Compiler SHALL compile successfully with no errors referencing the deleted file
3. AFTER deleting the old hooks file, THE System SHALL ensure no files in the codebase import from `@/lib/hooks`
4. AFTER deleting the old hooks file, THE System SHALL ensure all application functionality continues to work identically
5. THE System SHALL remove any temporary migration scripts or tools after migration is complete

### Requirement 15: Rollback Capability

**User Story:** As a developer, I want the ability to roll back the migration if issues arise, so that I can quickly recover from problems.

#### Acceptance Criteria

1. WHILE migration is in progress, THE System SHALL maintain the original `frontend/src/lib/hooks.ts` file unchanged until all testing is complete
2. THE System SHALL commit changes to version control after each migration phase (file creation, import updates, testing, cleanup)
3. IF issues are discovered during migration, THE System SHALL allow reverting to a previous commit to restore the old structure
4. IF runtime errors occur after migration, THE System SHALL allow rolling back imports file by file to identify the source
5. THE System SHALL document the rollback procedure in the migration guide

### Requirement 16: Domain-Specific Hook Distribution

**User Story:** As a developer, I want hooks distributed according to their business domain, so that related functionality is grouped together logically.

#### Acceptance Criteria

1. THE useAuth.ts file SHALL contain exactly 3 hooks: useLogin, useLogout, useChangePassword
2. THE useUsers.ts file SHALL contain exactly 6 hooks: useUsers, useCreateUser, useUpdateUser, useDeleteUser, useMyProfile, useUpdateMyProfile
3. THE useCourses.ts file SHALL contain exactly 13 hooks related to course management, modules, and content authoring
4. THE useEnrollments.ts file SHALL contain exactly 4 hooks related to student and teacher dashboards and enrollments
5. THE useQuizzes.ts file SHALL contain exactly 16 hooks related to quiz management, attempts, grading, and analytics
6. THE useAssignments.ts file SHALL contain exactly 27 hooks related to assignments, submissions, file uploads, and grading
7. THE useNotifications.ts file SHALL contain exactly 7 hooks related to notifications, announcements, and preferences
8. THE useGamification.ts file SHALL contain exactly 5 hooks related to XP, badges, leaderboard, and streak management
9. THE useAcademic.ts file SHALL contain exactly 27 hooks related to academic years, grades, subjects, sections, and timetable
10. THE useAdmin.ts file SHALL contain exactly 18 hooks related to admin roles, quality monitoring, auto-enrollment, content moderation, and escalations
11. THE useDiscussions.ts file SHALL contain exactly 7 hooks related to discussion forums and replies
12. THE usePeerReviews.ts file SHALL contain exactly 4 hooks related to peer review management
13. THE useSettings.ts file SHALL contain exactly 8 hooks related to system settings and maintenance
14. THE useMessages.ts file SHALL contain exactly 3 hooks related to direct messaging between users
15. THE useAudit.ts file SHALL contain exactly 2 hooks related to audit logs and data exports

### Requirement 17: Dependency Management

**User Story:** As a developer, I want proper dependency management in domain files, so that imports are minimal and explicit.

#### Acceptance Criteria

1. WHEN a domain file uses useQuery or useMutation, THE System SHALL import them from '@tanstack/react-query'
2. WHEN a domain file needs cache invalidation, THE System SHALL import useQueryClient from '@tanstack/react-query'
3. WHEN a domain file makes HTTP requests, THE System SHALL import { api } from '@/lib/api'
4. WHEN a domain file needs authentication state, THE System SHALL import { useAuthStore } from '@/lib/auth-store'
5. THE System SHALL ensure no unused imports are present in any domain file

### Requirement 18: Code Formatting and Style Consistency

**User Story:** As a developer, I want consistent code formatting across all domain files, so that the codebase maintains a uniform style.

#### Acceptance Criteria

1. THE System SHALL apply consistent indentation (2 spaces) across all domain files
2. THE System SHALL include the 'use client' directive at the top of each domain file (required for Next.js client components)
3. THE System SHALL use consistent comment formatting for domain separator comments (e.g., `// ─── Domain Name ─────────────────────────────`)
4. THE System SHALL ensure consistent spacing between hook function definitions
5. THE System SHALL follow the existing project's ESLint and Prettier configuration rules

### Requirement 19: API Endpoint Preservation

**User Story:** As a developer, I want all API endpoint calls to remain unchanged, so that backend integration continues to work identically.

#### Acceptance Criteria

1. WHEN migrating hooks, THE System SHALL preserve all HTTP method calls (GET, POST, PATCH, DELETE, PUT)
2. WHEN migrating hooks, THE System SHALL preserve all API endpoint URLs exactly as they were in the original hooks.ts file
3. WHEN migrating hooks, THE System SHALL preserve all request payload structures and parameter passing
4. WHEN migrating hooks, THE System SHALL preserve all response data extraction patterns (e.g., `return res.data`)
5. THE System SHALL ensure authentication headers and cookies continue to be sent with requests as before

### Requirement 20: Error Handling Preservation

**User Story:** As a developer, I want error handling logic to remain unchanged, so that errors are handled consistently after refactoring.

#### Acceptance Criteria

1. WHEN migrating hooks that handle errors, THE System SHALL preserve all try-catch blocks
2. WHEN migrating mutation hooks, THE System SHALL preserve all onError callbacks and their error handling logic
3. WHEN migrating hooks with error state, THE System SHALL preserve error state management and propagation to components
4. THE System SHALL preserve all error logging, error reporting, and error notification behaviors
5. THE System SHALL ensure user-facing error messages remain identical before and after migration

### Requirement 21: Socket.io Integration Preservation

**User Story:** As a developer, I want Socket.io integration to continue working, so that real-time features function correctly.

#### Acceptance Criteria

1. WHEN migrating the useLogin hook, THE System SHALL preserve the lazy Socket.io connection establishment code
2. THE System SHALL ensure the Socket.io connection import pattern `import('@/lib/socket').then(({ getSocket }) => getSocket())` is preserved in useAuth.ts
3. WHEN a user logs in after migration, THE System SHALL establish the Socket.io connection identically to before
4. THE System SHALL preserve all socket event listeners and emitters in relevant hooks
5. THE System SHALL ensure real-time notifications and updates continue to function after migration

### Requirement 22: Cache Management Consistency

**User Story:** As a developer, I want cache management to work identically, so that data freshness and invalidation behave as expected.

#### Acceptance Criteria

1. WHEN a mutation hook invalidates cache, THE System SHALL use the exact same queryKey patterns as before migration
2. WHEN multiple related caches need invalidation, THE System SHALL invalidate all of them in the same order as before
3. WHEN optimistic updates are performed, THE System SHALL maintain the same rollback behavior on errors
4. THE System SHALL preserve all queryClient.clear() calls in the logout hook
5. THE System SHALL ensure cached data persists correctly across component remounts and page navigation

### Requirement 23: File Size Compliance

**User Story:** As a developer, I want all domain files to stay within size limits, so that files remain manageable and readable.

#### Acceptance Criteria

1. THE useQuizzes.ts file SHALL not exceed 250 lines of code (the largest file)
2. THE useAcademic.ts file SHALL not exceed 200 lines of code
3. THE useAssignments.ts file SHALL not exceed 200 lines of code
4. THE useCourses.ts file SHALL not exceed 200 lines of code
5. THE useAdmin.ts file SHALL not exceed 150 lines of code
6. THE useUsers.ts file SHALL not exceed 120 lines of code
7. THE useNotifications.ts file SHALL not exceed 120 lines of code
8. THE useGamification.ts file SHALL not exceed 120 lines of code
9. THE useEnrollments.ts file SHALL not exceed 100 lines of code
10. THE useDiscussions.ts file SHALL not exceed 100 lines of code
11. THE usePeerReviews.ts file SHALL not exceed 100 lines of code
12. THE useAuth.ts file SHALL not exceed 80 lines of code
13. THE useMessages.ts file SHALL not exceed 80 lines of code
14. THE useSettings.ts file SHALL not exceed 80 lines of code
15. THE useAudit.ts file SHALL not exceed 60 lines of code

### Requirement 24: Hook Signature Documentation

**User Story:** As a developer, I want clear understanding of hook signatures, so that I can use hooks correctly without referring to implementation details.

#### Acceptance Criteria

1. WHEN migrating hooks with parameters, THE System SHALL preserve TypeScript type annotations for all parameters
2. WHEN migrating hooks that return query or mutation objects, THE System SHALL ensure return types are correctly inferred by TypeScript
3. THE System SHALL ensure hook parameter types are visible in IDE tooltips when hovering over hook calls
4. THE System SHALL ensure autocomplete suggestions include parameter names and types when calling hooks
5. THE System SHALL maintain the same parameter object patterns (e.g., destructured parameters) as the original hooks

### Requirement 25: Production Deployment Safety

**User Story:** As a developer, I want the migration to be safe for production deployment, so that users experience no disruptions or bugs.

#### Acceptance Criteria

1. WHEN deployed to production, THE System SHALL function identically to the version before migration
2. WHEN deployed to production, THE System SHALL not introduce any new JavaScript runtime errors
3. WHEN deployed to production, THE System SHALL not cause any existing features to break or behave differently
4. THE System SHALL pass all pre-deployment testing including unit tests, integration tests, and manual testing
5. THE System SHALL be deployed using a gradual rollout strategy with monitoring for errors and rollback capability
