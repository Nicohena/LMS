# LMS Project — Shared Work Log

---
Task ID: 10
Agent: main (orchestrator)
Task: Implement role-based UI separation (Teacher sees own courses; Student sees own learning; Admin sees admin) + finalize Step 10 Real-time Admin Dashboard with WebSocket live updates.

Work Log:
- Read existing architecture: single-page Next.js app at frontend/src/app/page.tsx (~6400 lines), role filtering already exists in Sidebar (navItems[].roles) and App (viewRoles map guards admin/audit/users/settings/course-create).
- Backend already has all Step 10 endpoints: /dashboards/platform, /dashboards/alerts, /dashboards/activity, /dashboards/summary.
- Backend course service already scopes visibility: ADMIN all, TEACHER published+own, STUDENT published only.
- Hooks already exist: usePlatformDashboard, useAdminAlerts, useRecentActivity (all refetchInterval=30s).
- Plan:
  1. Backend: add `mine` boolean to courseQuerySchema + service so teachers can explicitly fetch only their own courses.
  2. Backend: emit `platform-stats-update` event to admin room when key entities change (course/user/enrollment/submission created). Add admin room join.
  3. Frontend hooks: add useMyCourses() hook (calls /courses?mine=true).
  4. Frontend DashboardView: split into StudentDashboard, TeacherDashboard, AdminDashboard subcomponents dispatched by role.
  5. Frontend CatalogView: role-aware — Teacher sees their own courses with Edit/Publish/Archive actions; Student sees available courses with Enroll; Admin sees all with admin badge.
  6. Add new View 'my-courses' for teachers + nav entry.
  7. Tighten viewRoles: assignments/quizzes/discussions don't need role gates but Catalog already filters server-side.
  8. Step 10: enhance AdminView with WebSocket live updates (subscribe to `platform-stats-update`), DAU/WAU/MAU metrics, pending escalations counter, flagged content counter, quality score overview, quick actions.
  9. Add role guard banner if a user lands on a forbidden view.
  10. Build, commit, push.

Stage Summary:
- (in progress)
