# Implementation Plan: Hooks Refactoring Phase 2.1

## Overview

This plan implements the migration of the monolithic `frontend/src/lib/hooks.ts` file (2,141 lines, 159 hooks) into 15 focused, domain-specific hook files organized in `frontend/src/hooks/api/`. The migration follows a 4-phase strategy ensuring zero breaking changes and complete backward compatibility through barrel exports.

The implementation will split hooks across domains: Authentication (3 hooks), Users (6), Courses (13), Enrollments (4), Quizzes (16), Assignments (27), Notifications (7), Gamification (5), Academic (27), Admin (18), Discussions (7), Peer Reviews (4), Settings (8), Messages (3), and Audit (2).

## Tasks

- [x] 1. Create new hooks/api directory structure and domain files
  - [x] 1.1 Create hooks/api directory and 15 domain-specific hook files
    - Create directory `frontend/src/hooks/api/`
    - Create `useAuth.ts` with 3 authentication hooks (login, logout, changePassword)
    - Create `useUsers.ts` with 6 user management hooks
    - Create `useCourses.ts` with 13 course management hooks
    - Create `useEnrollments.ts` with 4 enrollment dashboard hooks
    - Create `useQuizzes.ts` with 16 quiz-related hooks
    - Create `useAssignments.ts` with 27 assignment-related hooks
    - Create `useNotifications.ts` with 7 notification hooks
    - Create `useGamification.ts` with 5 gamification hooks
    - Create `useAcademic.ts` with 27 academic structure hooks
    - Create `useAdmin.ts` with 18 admin function hooks
    - Create `useDiscussions.ts` with 7 discussion forum hooks
    - Create `usePeerReviews.ts` with 4 peer review hooks
    - Create `useSettings.ts` with 8 system settings hooks
    - Create `useMessages.ts` with 3 messaging hooks
    - Create `useAudit.ts` with 2 audit log hooks
    - Extract and migrate hooks from `lib/hooks.ts` to appropriate domain files
    - Preserve all hook signatures, implementations, and React Query configurations
    - Maintain all queryKey patterns, cache invalidation logic, and error handling
    - Include 'use client' directive at the top of each file
    - Import only required dependencies per file (@tanstack/react-query, @/lib/api, @/lib/auth-store)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 16.1-16.15, 17.1-17.5, 18.1-18.5, 23.1-23.15_

  - [x] 1.2 Create barrel export index.ts file
    - Create `frontend/src/hooks/api/index.ts`
    - Use `export * from './fileName'` pattern to re-export from all 15 domain files
    - Ensure all 159 hooks are exported without naming conflicts
    - Verify imports work using pattern `import { hookName } from '@/hooks/api'`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [~] 2. Checkpoint - Verify new structure and preserve old file
  - Ensure TypeScript compilation succeeds with new hooks/api files
  - Verify original `lib/hooks.ts` remains unchanged
  - Test that imports from both `@/lib/hooks` and `@/hooks/api` work simultaneously
  - Ask the user if questions arise

- [ ] 3. Update all import paths across the codebase
  - [x] 3.1 Identify and update imports in app/ directory
    - Find all `.ts` and `.tsx` files in `frontend/src/app/` that import from `@/lib/hooks`
    - Replace `from '@/lib/hooks'` with `from '@/hooks/api'`
    - Preserve exact list of imported hook names in each file
    - Leave all other imports unchanged
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 3.2 Identify and update imports in components/ directory
    - Find all `.ts` and `.tsx` files in `frontend/src/components/` that import from `@/lib/hooks`
    - Replace `from '@/lib/hooks'` with `from '@/hooks/api'`
    - Preserve exact list of imported hook names in each file
    - Leave all other imports unchanged
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 3.3 Identify and update imports in remaining directories
    - Find all other `.ts` and `.tsx` files that import from `@/lib/hooks`
    - Replace `from '@/lib/hooks'` with `from '@/hooks/api'`
    - Preserve exact list of imported hook names in each file
    - Leave all other imports unchanged
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [~] 4. Checkpoint - Verify import path updates
  - Ensure TypeScript compilation succeeds after all import updates
  - Verify no files still import from `@/lib/hooks`
  - Confirm all components using hooks compile without type errors
  - Ask the user if questions arise

- [ ] 5. Execute comprehensive testing across all domains
  - [~] 5.1 Test authentication domain (useAuth.ts)
    - Test login flow with valid credentials
    - Test logout functionality and cache clearing
    - Test password change operation
    - Verify Socket.io connection establishment on login
    - _Requirements: 10.3, 21.1-21.5_

  - [~] 5.2 Test user management domain (useUsers.ts)
    - Test fetching user list with pagination
    - Test user creation, update, and deletion
    - Test current user profile fetching and updating
    - _Requirements: 10.4, 24.1-24.5_

  - [~] 5.3 Test course management domain (useCourses.ts)
    - Test fetching course list and single course details
    - Test course creation, publishing, and archiving
    - Test module creation, update, and deletion
    - Test content creation, update, and deletion
    - Test self-enrollment workflow
    - _Requirements: 10.4, 10.6_

  - [~] 5.4 Test enrollment domain (useEnrollments.ts)
    - Test student dashboard data fetching
    - Test teacher dashboard data fetching
    - Test enrollment list fetching
    - _Requirements: 10.4_

  - [~] 5.5 Test quiz domain (useQuizzes.ts)
    - Test quiz list and single quiz fetching
    - Test starting quiz attempt
    - Test submitting quiz answers
    - Test viewing attempt results
    - Test manual grading and grade override
    - Test grade dispute escalation and resolution
    - Test quiz analytics
    - _Requirements: 10.4, 10.5, 10.6_

  - [~] 5.6 Test assignment domain (useAssignments.ts)
    - Test assignment list and single assignment fetching
    - Test submission creation and file upload
    - Test grading submission and requesting revision
    - Test plagiarism check functionality
    - Test bulk grading and grade export
    - _Requirements: 10.4, 10.5, 10.6, 19.1-19.5_

  - [~] 5.7 Test notification domain (useNotifications.ts)
    - Test fetching notifications list
    - Test marking notification as read
    - Test marking all notifications as read
    - Test notification preferences fetching and updating
    - Test announcements list and creation
    - _Requirements: 10.4, 10.5_

  - [~] 5.8 Test gamification domain (useGamification.ts)
    - Test fetching current user's gamification stats
    - Test leaderboard fetching with filters
    - Test badges list fetching
    - Test XP history fetching
    - Test streak data fetching
    - _Requirements: 10.4_

  - [~] 5.9 Test academic structure domain (useAcademic.ts)
    - Test academic years CRUD operations
    - Test grades CRUD operations
    - Test subjects CRUD operations
    - Test sections CRUD operations
    - Test section courses management (add/remove)
    - Test timetable operations (fetch, create, update, delete, bulk)
    - Test my timetable and teacher timetable views
    - _Requirements: 10.4, 10.5, 10.6_

  - [~] 5.10 Test admin domain (useAdmin.ts)
    - Test admin roles CRUD operations
    - Test quality monitoring and course flagging
    - Test content moderation
    - Test auto-enrollment rules management
    - Test escalations listing and resolution
    - _Requirements: 10.4, 10.5_

  - [~] 5.11 Test discussions domain (useDiscussions.ts)
    - Test discussions list and single discussion fetching
    - Test discussion creation, update, and deletion
    - Test reply creation and deletion
    - _Requirements: 10.4, 10.5_

  - [~] 5.12 Test peer reviews domain (usePeerReviews.ts)
    - Test fetching assigned peer reviews
    - Test fetching received peer reviews
    - Test submitting peer review
    - Test peer review statistics
    - _Requirements: 10.4, 10.5_

  - [~] 5.13 Test settings domain (useSettings.ts)
    - Test system settings fetching and updating
    - Test maintenance mode status and toggle
    - Test database backup and restore
    - Test system health check
    - Test cache clearing
    - _Requirements: 10.4, 10.5_

  - [~] 5.14 Test messages domain (useMessages.ts)
    - Test conversations list fetching
    - Test messages fetching for conversation
    - Test sending message
    - _Requirements: 10.4, 10.5_

  - [~] 5.15 Test audit domain (useAudit.ts)
    - Test audit logs fetching with filters
    - Test data export functionality
    - _Requirements: 10.4_

- [~] 6. Checkpoint - Verify all functionality works correctly
  - Confirm all 15 domains tested successfully
  - Verify cache invalidation works across all mutations
  - Verify error handling works correctly
  - Verify real-time features (Socket.io) work correctly
  - Ask the user if questions arise

- [ ] 7. Clean up and finalize migration
  - [~] 7.1 Delete old hooks.ts file and verify
    - Delete `frontend/src/lib/hooks.ts`
    - Run TypeScript compilation to verify no errors
    - Verify no files reference the deleted file path
    - Test application functionality one final time
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [~] 7.2 Update documentation
    - Update project documentation to reference new `@/hooks/api` import path
    - Document the 15 domain-specific files and their contained hooks
    - Create migration guide explaining the refactoring
    - Update onboarding documentation for new developers
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [~] 8. Final checkpoint - Migration complete
  - Ensure all tests pass
  - Verify zero breaking changes
  - Confirm production deployment readiness
  - Ask the user if questions arise

## Notes

- **Zero Breaking Changes**: All hooks maintain exact signatures and behavior
- **Backward Compatibility**: During migration, both `@/lib/hooks` and `@/hooks/api` imports work simultaneously
- **Incremental Migration**: Import paths can be updated file by file without breaking functionality
- **Domain Organization**: Hooks are grouped by business domain following Single Responsibility Principle
- **File Size Constraints**: All domain files stay between 60-250 lines (manageable and readable)
- **TypeScript Safety**: Full type safety maintained throughout migration
- **React Query Consistency**: All cache patterns, invalidation logic, and configurations preserved
- **Testing Focus**: Manual testing is required across 15 domains to verify real-world workflows
- **Socket.io Preservation**: Real-time connection establishment in useAuth.ts must be verified
- **Production Safety**: Gradual rollout with monitoring and rollback capability recommended

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 4, "tasks": ["5.6", "5.7", "5.8", "5.9", "5.10"] },
    { "id": 5, "tasks": ["5.11", "5.12", "5.13", "5.14", "5.15"] },
    { "id": 6, "tasks": ["7.1", "7.2"] }
  ]
}
```
