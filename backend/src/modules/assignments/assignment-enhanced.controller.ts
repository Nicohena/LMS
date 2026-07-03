// src/modules/assignments/assignment-enhanced.controller.ts
//
// Controllers for the enhanced assignment operations. Each controller
// wraps a service function with req/res/next and audit-logging context.
//
import { Request, Response, NextFunction } from 'express';
import {
  publishAssignment,
  scheduleAssignment,
  closeAssignment,
  reopenAssignment,
  archiveAssignment,
  restoreAssignment,
  duplicateAssignment,
  bulkGrade,
  getGradeDistribution,
  createRubricTemplate,
  getRubricTemplates,
  getRubricTemplate,
  updateRubricTemplate,
  deleteRubricTemplate,
  applyRubricTemplateToAssignment,
  getResources,
  uploadResource,
  deleteResource,
  getAuditLogs,
  getSubmissionStats,
} from './assignment-enhanced.service';

function viewer(req: Request) {
  return { id: req.user!.sub, role: req.user!.role };
}

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  if (!v || typeof v !== 'string') throw new Error(`Missing route param: ${key}`);
  return v;
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export async function publishAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await publishAssignment(assignmentId, viewer(req));
    res.status(200).json({ message: 'Assignment published.', assignment: result });
  } catch (err) { next(err); }
}

export async function scheduleAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const publishDate = new Date(req.body.publishDate);
    const result = await scheduleAssignment(assignmentId, viewer(req), publishDate);
    res.status(200).json({ message: 'Assignment scheduled.', assignment: result });
  } catch (err) { next(err); }
}

export async function closeAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await closeAssignment(assignmentId, viewer(req));
    res.status(200).json({ message: 'Assignment closed.', assignment: result });
  } catch (err) { next(err); }
}

export async function reopenAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await reopenAssignment(assignmentId, viewer(req));
    res.status(200).json({ message: 'Assignment reopened.', assignment: result });
  } catch (err) { next(err); }
}

export async function archiveAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await archiveAssignment(assignmentId, viewer(req));
    res.status(200).json({ message: 'Assignment archived.', assignment: result });
  } catch (err) { next(err); }
}

export async function restoreAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await restoreAssignment(assignmentId, viewer(req));
    res.status(200).json({ message: 'Assignment restored.', assignment: result });
  } catch (err) { next(err); }
}

export async function duplicateAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await duplicateAssignment(assignmentId, viewer(req), req.body);
    res.status(201).json({ message: 'Assignment duplicated.', assignment: result });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Bulk grading
// ---------------------------------------------------------------------------

export async function bulkGradeController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const { grades } = req.body;
    const result = await bulkGrade(assignmentId, viewer(req), grades);
    res.status(200).json({ message: 'Bulk grade complete.', ...result });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getGradeDistributionController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await getGradeDistribution(assignmentId, viewer(req));
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getSubmissionStatsController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await getSubmissionStats(assignmentId, viewer(req));
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Rubric templates
// ---------------------------------------------------------------------------

export async function createRubricTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await createRubricTemplate(viewer(req), req.body);
    res.status(201).json({ message: 'Rubric template created.', template: result });
  } catch (err) { next(err); }
}

export async function getRubricTemplatesController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getRubricTemplates(viewer(req), { search: req.query.search as string | undefined });
    res.status(200).json({ templates: result });
  } catch (err) { next(err); }
}

export async function getRubricTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = paramId(req, 'templateId');
    const result = await getRubricTemplate(templateId, viewer(req));
    res.status(200).json({ template: result });
  } catch (err) { next(err); }
}

export async function updateRubricTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = paramId(req, 'templateId');
    const result = await updateRubricTemplate(templateId, viewer(req), req.body);
    res.status(200).json({ message: 'Rubric template updated.', template: result });
  } catch (err) { next(err); }
}

export async function deleteRubricTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = paramId(req, 'templateId');
    const result = await deleteRubricTemplate(templateId, viewer(req));
    res.status(200).json({ message: 'Rubric template deleted.', ...result });
  } catch (err) { next(err); }
}

export async function applyRubricTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = paramId(req, 'templateId');
    const assignmentId = paramId(req, 'assignmentId');
    const result = await applyRubricTemplateToAssignment(templateId, assignmentId, viewer(req));
    res.status(200).json({ message: 'Rubric applied to assignment.', rubric: result });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export async function getResourcesController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await getResources(assignmentId);
    res.status(200).json({ resources: result });
  } catch (err) { next(err); }
}

export async function uploadResourceController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await uploadResource(assignmentId, viewer(req), req.body);
    res.status(201).json({ message: 'Resource uploaded.', resource: result });
  } catch (err) { next(err); }
}

export async function deleteResourceController(req: Request, res: Response, next: NextFunction) {
  try {
    const resourceId = paramId(req, 'resourceId');
    const result = await deleteResource(resourceId, viewer(req));
    res.status(200).json({ message: 'Resource deleted.', ...result });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export async function getAuditLogsController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await getAuditLogs(assignmentId, viewer(req), {
      action: req.query.action as string | undefined,
      userId: req.query.userId as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });
    res.status(200).json(result);
  } catch (err) { next(err); }
}
