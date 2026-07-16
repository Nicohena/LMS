# LMS Codebase Refactoring Plan

## Executive Summary

This document outlines a comprehensive refactoring strategy for the Learning Management System (LMS) codebase. The refactoring addresses critical architectural issues, massive file sizes, and improves maintainability, scalability, and code quality.

---

## Current State Analysis

### Critical Issues Identified

#### 1. **CRITICAL: Backend Code in Frontend** ❌
- **Location**: `frontend/src/modules/` (12 module directories)
- **Problem**: Contains controllers, routes, services, and schemas that belong in the backend
- **Files**: 80+ backend files (controllers, routes, services) in frontend
- **Impact**: 
  - Violates separation of concerns
  - Confuses developers
  - Potential security risks (exposing backend logic)
  - Breaks Next.js architectural patterns

#### 2. **Massive File Sizes** 🔴
| File | Lines | Issue |
|------|-------|-------|
| `frontend/src/app/_components-quiz-assignment.tsx` | 3,407 | 3.4x recommended max |
| `frontend/src/lib/hooks.ts` | 2,141 | 2x recommended max |
| `frontend/src/app/_components-academic.tsx` | 1,790 | 1.8x recommended max |
| `frontend/src/app/_components-admin.tsx` | 1,722 | 1.7x recommended max |
| `frontend/src/app/_components-misc.tsx` | 1,585 | 1.6x recommended max |
| `frontend/src/app/_components-course.tsx` | 1,517 | 1.5x recommended max |
| `frontend/src/app/page.tsx` | 789 | Acceptable but monolithic |
| **Total** | **12,951** | Single page app! |

**Recommended maximum**: 1,000 lines per file

#### 3. **Architectural Issues**
- ❌ Single-page Next.js app (everything in `app/page.tsx`)
- ❌ Component naming with underscores (`_components-*.tsx`)
- ❌ All UI logic in one massive page component
- ❌ No proper routing structure
- ❌ Frontend has `server.ts`, `lib/prisma.ts`, `lib/db.ts` (backend concerns)

#### 4. **Code Organization Issues**
- Mixed concerns in files
- Lack of feature-based organization
- Duplicate code between frontend and backend
- Poor separation of UI, business logic, and data fetching

---

## Proposed Architecture

### Frontend Structure (Next.js App Router)

```
frontend/src/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth group layout
│   │   ├── layout.tsx             # Auth-specific layout
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── verify-certificate/
│   │       └── page.tsx
│   ├── (dashboard)/               # Authenticated group layout
│   │   ├── layout.tsx             # Dashboard layout (sidebar, header)
│   │   ├── page.tsx               # Dashboard home
│   │   ├── courses/
│   │   │   ├── page.tsx           # Course catalog
│   │   │   ├── my-courses/
│   │   │   │   └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx       # Course detail
│   │   │       └── content/
│   │   │           └── [contentId]/
│   │   │               └── page.tsx
│   │   ├── quizzes/
│   │   │   ├── page.tsx           # Quiz list
│   │   │   ├── [quizId]/
│   │   │   │   ├── page.tsx       # Quiz detail/runner
│   │   │   │   └── results/
│   │   │   │       └── [attemptId]/
│   │   │   │           └── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   ├── assignments/
│   │   │   ├── page.tsx
│   │   │   ├── [assignmentId]/
│   │   │   │   └── page.tsx
│   │   │   └── submissions/
│   │   │       └── [submissionId]/
│   │   │           └── page.tsx
│   │   ├── discussions/
│   │   │   ├── page.tsx
│   │   │   └── [discussionId]/
│   │   │       └── page.tsx
│   │   ├── academic/
│   │   │   ├── page.tsx           # Academic management
│   │   │   └── sections/
│   │   │       └── [sectionId]/
│   │   │           └── page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   ├── quality/
│   │   │   ├── roles/
│   │   │   └── audit/
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── gamification/
│   │   │   └── page.tsx
│   │   ├── messages/
│   │   │   └── page.tsx
│   │   └── announcements/
│   │       └── page.tsx
│   ├── layout.tsx                 # Root layout
│   └── globals.css
│
├── components/                    # Reusable UI components
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ... (other shadcn components)
│   ├── layouts/                   # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── course/                    # Course-related components
│   │   ├── CourseCard.tsx
│   │   ├── CourseList.tsx
│   │   ├── CourseDetail.tsx
│   │   ├── ModuleList.tsx
│   │   ├── ModuleItem.tsx
│   │   ├── ContentEditor.tsx
│   │   └── CourseFilters.tsx
│   ├── quiz/                      # Quiz components
│   │   ├── QuizCard.tsx
│   │   ├── QuizList.tsx
│   │   ├── QuizRunner.tsx
│   │   ├── QuizResults.tsx
│   │   ├── QuizEditor.tsx
│   │   ├── QuestionEditor.tsx
│   │   ├── QuestionTypes/
│   │   │   ├── MultipleChoice.tsx
│   │   │   ├── TrueFalse.tsx
│   │   │   ├── ShortAnswer.tsx
│   │   │   ├── Essay.tsx
│   │   │   ├── FillInBlank.tsx
│   │   │   ├── Matching.tsx
│   │   │   ├── Ordering.tsx
│   │   │   ├── Hotspot.tsx
│   │   │   └── MultiSelect.tsx
│   │   └── SubmissionsPanel.tsx
│   ├── assignment/                # Assignment components
│   │   ├── AssignmentCard.tsx
│   │   ├── AssignmentList.tsx
│   │   ├── AssignmentRunner.tsx
│   │   ├── SubmissionForm.tsx
│   │   ├── GradingPanel.tsx
│   │   └── PeerReviewPanel.tsx
│   ├── academic/                  # Academic components
│   │   ├── AcademicYearSelector.tsx
│   │   ├── GradeList.tsx
│   │   ├── SubjectList.tsx
│   │   ├── SectionCard.tsx
│   │   ├── SectionDetail.tsx
│   │   └── TimetableView.tsx
│   ├── admin/                     # Admin components
│   │   ├── UserTable.tsx
│   │   ├── RoleManager.tsx
│   │   ├── QualityReport.tsx
│   │   ├── ContentModeration.tsx
│   │   ├── AuditLog.tsx
│   │   └── SystemSettings.tsx
│   ├── dashboard/                 # Dashboard components
│   │   ├── StatCard.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── ProgressChart.tsx
│   │   ├── UpcomingEvents.tsx
│   │   └── QuickActions.tsx
│   ├── gamification/              # Gamification components
│   │   ├── BadgeDisplay.tsx
│   │   ├── LeaderboardTable.tsx
│   │   ├── StreakCounter.tsx
│   │   ├── XPProgressBar.tsx
│   │   └── LevelIndicator.tsx
│   ├── notifications/             # Notification components
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationList.tsx
│   │   ├── AnnouncementCard.tsx
│   │   └── MessageThread.tsx
│   └── shared/                    # Shared/common components
│       ├── SearchBar.tsx
│       ├── FilterPanel.tsx
│       ├── Pagination.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── EmptyState.tsx
│       ├── ConfirmDialog.tsx
│       └── RichTextEditor.tsx
│
├── features/                      # Feature-based modules (optional alternative)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── courses/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── ... (other features)
│
├── hooks/                         # Custom React hooks
│   ├── api/                       # API hooks (split from massive hooks.ts)
│   │   ├── useAuth.ts             # 50-100 lines
│   │   ├── useCourses.ts          # 100-150 lines
│   │   ├── useEnrollments.ts      # 80-100 lines
│   │   ├── useQuizzes.ts          # 150-200 lines
│   │   ├── useAssignments.ts      # 150-200 lines
│   │   ├── useUsers.ts            # 80-100 lines
│   │   ├── useNotifications.ts    # 100-120 lines
│   │   ├── useGamification.ts     # 100-120 lines
│   │   ├── useAcademic.ts         # 150-200 lines
│   │   ├── useAdmin.ts            # 100-150 lines
│   │   └── index.ts               # Re-exports all
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   ├── useIntersectionObserver.ts
│   └── use-toast.ts
│
├── lib/                           # Utilities and configurations
│   ├── api.ts                     # Axios client (keep as-is)
│   ├── auth-store.ts              # Zustand store (keep)
│   ├── socket.ts                  # Socket.io client (keep)
│   ├── utils.ts                   # Utility functions (keep)
│   ├── providers.tsx              # React Query provider (keep)
│   ├── constants.ts               # App constants
│   ├── types.ts                   # Shared TypeScript types
│   └── validations.ts             # Zod schemas for forms
│
├── services/                      # Business logic layer
│   ├── courseService.ts
│   ├── quizService.ts
│   ├── assignmentService.ts
│   └── ... (other services)
│
├── styles/                        # Additional styles
│   └── custom.css
│
└── types/                         # TypeScript type definitions
    ├── api.types.ts               # API response types
    ├── course.types.ts
    ├── quiz.types.ts
    ├── assignment.types.ts
    └── ... (other domain types)
```

### Backend Structure (Keep Clean - Reference)

```
backend/src/
├── app.ts                         # Express app setup
├── server.ts                      # Server entry point
├── common/                        # Shared utilities
│   ├── errors.ts
│   ├── middlewares/
│   ├── services/
│   ├── types/
│   └── utils/
├── lib/
│   └── prisma.ts                  # Prisma client
└── modules/                       # Domain modules
    ├── auth/
    ├── courses/
    ├── quizzes/
    ├── assignments/
    ├── academic/
    └── ... (other modules)
```

---

## Refactoring Phases

### Phase 1: Critical Architecture Fix (HIGH PRIORITY) 🔴

**Goal**: Remove backend code from frontend, fix architectural violations

**Tasks**:
1. ✅ **Verify backend has all necessary modules** (already exists in `backend/src/modules/`)
2. ❌ **Delete `frontend/src/modules/`** (80+ files)
3. ❌ **Delete `frontend/src/server.ts`** (backend concern)
4. ❌ **Delete `frontend/src/lib/prisma.ts`** (backend concern)
5. ❌ **Delete `frontend/src/lib/db.ts`** (backend concern)
6. ✅ **Verify `frontend/src/lib/api.ts`** works (already uses axios to call backend)
7. ✅ **Verify frontend hooks** call API correctly (already using `api.get()`, `api.post()`)
8. ✅ **Test functionality** after removal

**Expected Outcome**: Frontend only contains UI code, all backend logic is in backend

**Files to Delete**:
- `frontend/src/modules/` (entire directory)
- `frontend/src/server.ts`
- `frontend/src/lib/prisma.ts`
- `frontend/src/lib/db.ts`
- `frontend/src/socket/index.ts` (if duplicated from `lib/socket.ts`)

---

### Phase 2: Break Down Massive Files (HIGH PRIORITY) 🟡

**Goal**: Split 12,951 lines of code into manageable, focused modules

#### 2.1. Split `frontend/src/lib/hooks.ts` (2,141 lines)

**Strategy**: Split by domain into `hooks/api/` directory

**New Files**:
```
hooks/api/
├── index.ts              # Re-export all hooks
├── useAuth.ts            # Login, logout, profile (~80 lines)
├── useCourses.ts         # Courses, modules, content (~200 lines)
├── useEnrollments.ts     # Enrollments, progress (~100 lines)
├── useQuizzes.ts         # Quizzes, attempts, grading (~250 lines)
├── useAssignments.ts     # Assignments, submissions, peer review (~200 lines)
├── useUsers.ts           # User management (~100 lines)
├── useNotifications.ts   # Notifications, announcements (~120 lines)
├── useGamification.ts    # XP, badges, leaderboard (~120 lines)
├── useAcademic.ts        # Academic years, grades, sections (~200 lines)
├── useAdmin.ts           # Admin roles, quality, audit (~150 lines)
├── useDiscussions.ts     # Discussions, replies (~80 lines)
├── useSettings.ts        # Settings, maintenance (~80 lines)
└── useCertificates.ts    # Certificates (~60 lines)
```

**Migration Steps**:
1. Create `hooks/api/` directory
2. Copy hooks by domain into separate files
3. Update imports to use new structure
4. Delete old `lib/hooks.ts`
5. Create barrel export in `hooks/api/index.ts`

#### 2.2. Split `_components-quiz-assignment.tsx` (3,407 lines)

**Strategy**: Break into focused component files

**New Files**:
```
components/quiz/
├── QuizCard.tsx                (~50 lines)
├── QuizList.tsx                (~100 lines)
├── QuizRunner.tsx              (~200 lines)
├── QuizResults.tsx             (~150 lines)
├── QuizEditor.tsx              (~300 lines)
├── SubmissionsPanel.tsx        (~200 lines)
├── SubmissionDetail.tsx        (~150 lines)
├── ManualGrading.tsx           (~100 lines)
├── QuestionTypes/
│   ├── MultipleChoice.tsx      (~80 lines)
│   ├── TrueFalse.tsx           (~60 lines)
│   ├── ShortAnswer.tsx         (~70 lines)
│   ├── Essay.tsx               (~80 lines)
│   ├── FillInBlank.tsx         (~90 lines)
│   ├── Matching.tsx            (~150 lines)
│   ├── Ordering.tsx            (~120 lines)
│   ├── Hotspot.tsx             (~200 lines)
│   └── MultiSelect.tsx         (~80 lines)
└── index.ts                    (exports)

components/assignment/
├── AssignmentCard.tsx          (~50 lines)
├── AssignmentList.tsx          (~100 lines)
├── AssignmentRunner.tsx        (~150 lines)
├── SubmissionForm.tsx          (~200 lines)
├── GradingPanel.tsx            (~200 lines)
├── PeerReviewPanel.tsx         (~150 lines)
└── index.ts                    (exports)
```

#### 2.3. Split `_components-academic.tsx` (1,790 lines)

**New Files**:
```
components/academic/
├── AcademicYearSelector.tsx    (~80 lines)
├── AcademicYearList.tsx        (~100 lines)
├── GradeList.tsx               (~100 lines)
├── SubjectList.tsx             (~100 lines)
├── SectionCard.tsx             (~80 lines)
├── SectionDetail.tsx           (~200 lines)
├── SectionList.tsx             (~100 lines)
├── TimetableView.tsx           (~150 lines)
├── TimetableEditor.tsx         (~150 lines)
└── index.ts

components/dashboard/
├── StudentDashboard.tsx        (~200 lines)
├── TeacherDashboard.tsx        (~200 lines)
├── AdminDashboard.tsx          (~200 lines)
├── StatCard.tsx                (~50 lines)
├── ActivityFeed.tsx            (~100 lines)
└── index.ts
```

#### 2.4. Split `_components-admin.tsx` (1,722 lines)

**New Files**:
```
components/admin/
├── UserTable.tsx               (~150 lines)
├── UserForm.tsx                (~100 lines)
├── RoleManager.tsx             (~150 lines)
├── QualityReport.tsx           (~200 lines)
├── ContentModeration.tsx       (~150 lines)
├── FlaggedContent.tsx          (~100 lines)
├── AuditLog.tsx                (~150 lines)
├── AutoEnrollment.tsx          (~150 lines)
├── GradeDisputes.tsx           (~150 lines)
├── Escalations.tsx             (~150 lines)
├── AdminAlerts.tsx             (~100 lines)
└── index.ts

components/notifications/
├── AnnouncementList.tsx        (~150 lines)
├── AnnouncementForm.tsx        (~100 lines)
├── NotificationBell.tsx        (~100 lines)
└── index.ts

components/discussions/
├── DiscussionList.tsx          (~100 lines)
├── DiscussionDetail.tsx        (~150 lines)
├── DiscussionForm.tsx          (~100 lines)
└── index.ts
```

#### 2.5. Split `_components-course.tsx` (1,517 lines)

**New Files**:
```
components/course/
├── CourseCatalog.tsx           (~200 lines)
├── CourseCard.tsx              (~80 lines)
├── CourseList.tsx              (~100 lines)
├── CourseDetail.tsx            (~200 lines)
├── CourseFilters.tsx           (~100 lines)
├── MyCoursesList.tsx           (~150 lines)
├── ModuleList.tsx              (~100 lines)
├── ModuleItem.tsx              (~80 lines)
├── ContentEditor.tsx           (~200 lines)
├── PageContentEditor.tsx       (~150 lines)
└── index.ts
```

#### 2.6. Split `_components-misc.tsx` (1,585 lines)

**New Files**:
```
components/gamification/
├── GamificationView.tsx        (~200 lines)
├── BadgeDisplay.tsx            (~100 lines)
├── LeaderboardTable.tsx        (~150 lines)
├── StreakCounter.tsx           (~80 lines)
├── XPProgressBar.tsx           (~80 lines)
└── index.ts

components/course/
├── CourseCreateForm.tsx        (~200 lines)

components/settings/
├── SettingsView.tsx            (~150 lines)
├── NotificationPreferences.tsx (~150 lines)
└── index.ts

components/messages/
├── MessagesView.tsx            (~150 lines)
├── MessageThread.tsx           (~100 lines)
└── index.ts

components/profile/
├── ProfileView.tsx             (~150 lines)
├── ProfileForm.tsx             (~100 lines)
└── index.ts

components/ai/
├── AIAssistant.tsx             (~150 lines)
└── index.ts
```

#### 2.7. Refactor `app/page.tsx` (789 lines)

**Strategy**: Convert to proper Next.js routing

**Current Issue**: Single-page app with view switching

**Solution**: Use Next.js App Router
- Remove view switching logic
- Create route-based pages
- Move Sidebar/Header to layout
- Use `(dashboard)` route group for authenticated pages

---

### Phase 3: Implement Proper Routing (MEDIUM PRIORITY) 🟢

**Goal**: Convert single-page app to proper Next.js App Router structure

**Tasks**:
1. Create `app/(auth)/` group for login, register
2. Create `app/(dashboard)/` group for authenticated routes
3. Move Sidebar + Header to `(dashboard)/layout.tsx`
4. Create individual page routes:
   - `courses/page.tsx`
   - `courses/[courseId]/page.tsx`
   - `quizzes/page.tsx`
   - `quizzes/[quizId]/page.tsx`
   - `assignments/page.tsx`
   - `admin/page.tsx`
   - etc.
5. Remove view switching logic from `page.tsx`
6. Use Next.js navigation (`useRouter`, `Link`)

---

### Phase 4: Code Quality Improvements (MEDIUM PRIORITY) 🟢

**Goal**: Apply SOLID principles, DRY, improve type safety

**Tasks**:
1. **Extract shared types**:
   - Create `types/api.types.ts`
   - Create `types/course.types.ts`
   - Create `types/quiz.types.ts`
   - etc.

2. **Remove duplicate code**:
   - Identify duplicate logic between components
   - Extract to shared utilities
   - Create reusable hooks

3. **Improve error handling**:
   - Create `ErrorBoundary` components
   - Standardize error messages
   - Add loading states

4. **Improve type safety**:
   - Replace `any` with proper types
   - Add strict TypeScript checks
   - Use Zod for runtime validation

---

### Phase 5: Performance Optimizations (LOW PRIORITY) 🟦

**Goal**: Optimize rendering, reduce bundle size

**Tasks**:
1. **Lazy loading**:
   - Use `React.lazy()` for heavy components
   - Implement route-based code splitting
   - Use `next/dynamic` for large components

2. **Memoization**:
   - Add `React.memo()` where appropriate
   - Use `useMemo()` for expensive calculations
   - Use `useCallback()` for functions passed to children

3. **Bundle optimization**:
   - Analyze bundle with Next.js analyzer
   - Remove unused dependencies
   - Use tree-shaking

---

### Phase 6: Documentation & Testing (LOW PRIORITY) 🟦

**Goal**: Add documentation, write tests

**Tasks**:
1. **Documentation**:
   - Add JSDoc comments to functions
   - Create component documentation
   - Update README with architecture

2. **Testing**:
   - Add unit tests for hooks
   - Add component tests (React Testing Library)
   - Add integration tests

---

## Migration Strategy

### Approach: Incremental, Non-Breaking

1. **Create new structure alongside old** (do not delete immediately)
2. **Migrate one feature at a time**
3. **Test thoroughly after each migration**
4. **Update imports gradually**
5. **Delete old files only after confirming new structure works**

### Testing Checklist After Each Phase

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Dev server runs (`npm run dev`)
- [ ] All pages load correctly
- [ ] User authentication works
- [ ] Course viewing/creation works
- [ ] Quiz taking/creation works
- [ ] Assignment submission/grading works
- [ ] Admin features work
- [ ] No console errors
- [ ] No network errors

---

## Implementation Order (Recommended)

### Week 1: Critical Fixes
- ✅ Phase 1: Remove backend code from frontend
- ✅ Test and verify functionality

### Week 2-3: File Splitting
- ✅ Phase 2.1: Split hooks.ts
- ✅ Phase 2.2-2.6: Split component files
- ✅ Test after each split

### Week 4: Routing
- ✅ Phase 3: Implement proper routing
- ✅ Migrate pages one by one

### Week 5: Quality
- ✅ Phase 4: Code quality improvements
- ✅ Remove duplicates, improve types

### Week 6: Optimization
- ✅ Phase 5: Performance optimizations
- ✅ Lazy loading, memoization

### Week 7: Polish
- ✅ Phase 6: Documentation & testing
- ✅ Final cleanup

---

## Success Metrics

### Before Refactoring
- ❌ 80+ backend files in frontend
- ❌ 12,951 lines in component files
- ❌ 2,141 lines in hooks.ts
- ❌ Single-page app (no routing)
- ❌ Mixed concerns everywhere

### After Refactoring
- ✅ 0 backend files in frontend (clean separation)
- ✅ Average 100-200 lines per component file
- ✅ Max 250 lines per hook file
- ✅ Proper Next.js routing (20+ routes)
- ✅ Feature-based organization
- ✅ Clear separation of concerns
- ✅ Improved type safety
- ✅ Better performance (code splitting)
- ✅ Production-ready architecture

---

## Risk Mitigation

### Risks

1. **Breaking changes during refactoring**
   - **Mitigation**: Incremental approach, test after each change
   
2. **Import path changes causing errors**
   - **Mitigation**: Use barrel exports (`index.ts`), update imports carefully
   
3. **State management issues**
   - **Mitigation**: Keep Zustand store structure unchanged

4. **Backend API dependency**
   - **Mitigation**: Verify API calls work before and after each phase

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Get approval** to proceed
3. **Create backup branch** (`git checkout -b backup-before-refactor`)
4. **Start Phase 1** (remove backend code from frontend)
5. **Test thoroughly**
6. **Continue with remaining phases**

---

## Notes

- **Zero Breaking Changes**: All functionality must be preserved
- **Incremental Migration**: Do not delete old code until new code is tested
- **Git Commits**: Commit after each phase for easy rollback
- **Documentation**: Update as you go
- **Testing**: Manual testing required after each phase (no test suite exists yet)

---

**Document Version**: 1.0  
**Created**: $(date)  
**Last Updated**: $(date)  
**Status**: Draft - Awaiting Approval
