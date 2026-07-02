// src/modules/reports/report-builder.service.ts
import { Prisma, ReportFormat } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { ReportData, ReportTemplateResponse, GenerateReportResult } from './report.types';
import type { ReportTemplateInput, UpdateReportTemplateInput } from './report.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ---------------------------------------------------------------------------
// Template CRUD
// ---------------------------------------------------------------------------

export async function createTemplate(userId: string, data: ReportTemplateInput): Promise<ReportTemplateResponse> {
  const template = await prisma.reportTemplate.create({
    data: {
      ...data,
      metrics: data.metrics as Prisma.InputJsonValue,
      dimensions: data.dimensions as Prisma.InputJsonValue,
      filters: data.filters as Prisma.InputJsonValue | undefined,
      createdBy: userId,
    },
  });
  return template as ReportTemplateResponse;
}

export async function getTemplates(userId: string, role: string): Promise<ReportTemplateResponse[]> {
  const where: Prisma.ReportTemplateWhereInput = {};
  // Non-admins see only their own + public templates
  if (role !== 'ADMIN') {
    where.OR = [{ createdBy: userId }, { isPublic: true }];
  }
  const templates = await prisma.reportTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return templates as ReportTemplateResponse[];
}

export async function getTemplate(id: string, userId: string, role: string): Promise<ReportTemplateResponse> {
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Template not found');
  const template = await prisma.reportTemplate.findUnique({ where: { id } });
  if (!template) throw new NotFoundError('Template not found');
  if (role !== 'ADMIN' && template.createdBy !== userId && !template.isPublic) {
    throw new ForbiddenError('You can only view your own templates or public ones');
  }
  return template as ReportTemplateResponse;
}

export async function updateTemplate(id: string, userId: string, role: string, data: UpdateReportTemplateInput): Promise<ReportTemplateResponse> {
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Template not found');
  const template = await prisma.reportTemplate.findUnique({ where: { id } });
  if (!template) throw new NotFoundError('Template not found');
  if (role !== 'ADMIN' && template.createdBy !== userId) {
    throw new ForbiddenError('You can only update your own templates');
  }
  const updated = await prisma.reportTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.dataSource !== undefined && { dataSource: data.dataSource }),
      ...(data.metrics !== undefined && { metrics: data.metrics as Prisma.InputJsonValue }),
      ...(data.dimensions !== undefined && { dimensions: data.dimensions as Prisma.InputJsonValue }),
      ...(data.filters !== undefined && { filters: data.filters as Prisma.InputJsonValue }),
      ...(data.chartType !== undefined && { chartType: data.chartType }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
  });
  return updated as ReportTemplateResponse;
}

export async function deleteTemplate(id: string, userId: string, role: string): Promise<{ id: string; deleted: boolean }> {
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Template not found');
  const template = await prisma.reportTemplate.findUnique({ where: { id } });
  if (!template) throw new NotFoundError('Template not found');
  if (role !== 'ADMIN' && template.createdBy !== userId) {
    throw new ForbiddenError('You can only delete your own templates');
  }
  // Check for scheduled reports using this template
  const scheduledCount = await prisma.scheduledReport.count({ where: { templateId: id } });
  if (scheduledCount > 0) {
    throw new ValidationError(`Cannot delete: ${scheduledCount} scheduled report(s) use this template`);
  }
  await prisma.reportTemplate.delete({ where: { id } });
  return { id, deleted: true };
}

// ---------------------------------------------------------------------------
// Generate report
// ---------------------------------------------------------------------------

export async function generateReport(
  templateId: string,
  userId: string,
  role: string,
  filters?: Record<string, unknown>,
  format: ReportFormat = 'JSON',
): Promise<GenerateReportResult> {
  const template = await getTemplate(templateId, userId, role);

  // Fetch data based on dataSource
  const data = await fetchReportData(template.dataSource, template.metrics as string[], template.dimensions as string[], filters);

  // Export to requested format
  let fileUrl: string | undefined;
  let downloadUrl: string | undefined;

  if (format === 'JSON') {
    // Return data inline — no file to download
    return {
      reportId: template.id,
      format,
      rowCount: data.rows.length,
      generatedAt: new Date(),
    };
  }

  if (format === 'CSV') {
    const csv = exportToCSV(data);
    downloadUrl = `data:text/csv;base64,${Buffer.from(csv).toString('base64')}`;
  } else if (format === 'EXCEL') {
    const buffer = await exportToExcel(data);
    downloadUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer.toString('base64')}`;
  } else if (format === 'PDF') {
    const buffer = await exportToPDF(data);
    downloadUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
  }

  return {
    reportId: template.id,
    format,
    downloadUrl,
    rowCount: data.rows.length,
    generatedAt: new Date(),
  };
}

export async function previewReport(
  templateId: string,
  userId: string,
  role: string,
  filters?: Record<string, unknown>,
): Promise<ReportData> {
  const template = await getTemplate(templateId, userId, role);
  const data = await fetchReportData(template.dataSource, template.metrics as string[], template.dimensions as string[], filters);
  return {
    templateId: template.id,
    templateName: template.name,
    dataSource: template.dataSource,
    generatedAt: new Date(),
    columns: data.columns,
    rows: data.rows,
    summary: data.summary,
  };
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchReportData(
  dataSource: string,
  metrics: string[],
  dimensions: string[],
  filters?: Record<string, unknown>,
): Promise<{ columns: string[]; rows: Record<string, unknown>[]; summary?: Record<string, number> }> {
  const dateFilter = buildDateFilter(filters);

  switch (dataSource) {
    case 'users':
      return fetchUserData(metrics, dimensions, dateFilter);
    case 'courses':
      return fetchCourseData(metrics, dimensions, dateFilter);
    case 'enrollments':
      return fetchEnrollmentData(metrics, dimensions, dateFilter);
    case 'quiz_attempts':
      return fetchQuizAttemptData(metrics, dimensions, dateFilter);
    case 'submissions':
      return fetchSubmissionData(metrics, dimensions, dateFilter);
    case 'certificates':
      return fetchCertificateData(metrics, dimensions, dateFilter);
    case 'xp':
      return fetchXPData(metrics, dimensions, dateFilter);
    default:
      throw new ValidationError(`Unknown data source: ${dataSource}`);
  }
}

function buildDateFilter(filters?: Record<string, unknown>): { start?: Date; end?: Date } {
  if (!filters?.dateRange) return {};
  const dr = filters.dateRange as { start?: string; end?: string };
  return {
    start: dr.start ? new Date(dr.start) : undefined,
    end: dr.end ? new Date(dr.end) : undefined,
  };
}

async function fetchUserData(metrics: string[], _dimensions: string[], dateFilter: { start?: Date; end?: Date }) {
  const where: Prisma.UserWhereInput = {};
  if (dateFilter.start || dateFilter.end) {
    where.createdAt = {};
    if (dateFilter.start) where.createdAt.gte = dateFilter.start;
    if (dateFilter.end) where.createdAt.lte = dateFilter.end;
  }
  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, lastLogin: true },
    take: 1000,
  });
  const columns = ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'lastLogin'];
  const summary: Record<string, number> = { count: users.length };
  if (metrics.includes('count_by_role')) {
    summary.students = users.filter((u) => u.role === 'STUDENT').length;
    summary.teachers = users.filter((u) => u.role === 'TEACHER').length;
    summary.admins = users.filter((u) => u.role === 'ADMIN').length;
  }
  return { columns, rows: users as unknown as Record<string, unknown>[], summary };
}

async function fetchCourseData(metrics: string[], _dimensions: string[], dateFilter: { start?: Date; end?: Date }) {
  const where: Prisma.CourseWhereInput = {};
  if (dateFilter.start || dateFilter.end) {
    where.createdAt = {};
    if (dateFilter.start) where.createdAt.gte = dateFilter.start;
    if (dateFilter.end) where.createdAt.lte = dateFilter.end;
  }
  const courses = await prisma.course.findMany({
    where,
    select: { id: true, title: true, status: true, difficulty: true, category: true, createdAt: true, createdBy: true },
    take: 1000,
  });
  const columns = ['id', 'title', 'status', 'difficulty', 'category', 'createdAt', 'createdBy'];
  const summary: Record<string, number> = {
    count: courses.length,
    published: courses.filter((c) => c.status === 'PUBLISHED').length,
    draft: courses.filter((c) => c.status === 'DRAFT').length,
  };
  return { columns, rows: courses as unknown as Record<string, unknown>[], summary };
}

async function fetchEnrollmentData(metrics: string[], _dimensions: string[], dateFilter: { start?: Date; end?: Date }) {
  const where: Prisma.EnrollmentWhereInput = {};
  if (dateFilter.start || dateFilter.end) {
    where.enrolledAt = {};
    if (dateFilter.start) where.enrolledAt.gte = dateFilter.start;
    if (dateFilter.end) where.enrolledAt.lte = dateFilter.end;
  }
  const enrollments = await prisma.enrollment.findMany({
    where,
    select: { id: true, userId: true, courseId: true, status: true, progressPercentage: true, enrolledAt: true, completedAt: true },
    take: 5000,
  });
  const columns = ['id', 'userId', 'courseId', 'status', 'progressPercentage', 'enrolledAt', 'completedAt'];
  const summary: Record<string, number> = {
    count: enrollments.length,
    active: enrollments.filter((e) => e.status === 'ACTIVE').length,
    completed: enrollments.filter((e) => e.status === 'COMPLETED').length,
    dropped: enrollments.filter((e) => e.status === 'DROPPED').length,
  };
  if (metrics.includes('avg_progress')) {
    const active = enrollments.filter((e) => e.status === 'ACTIVE');
    summary.avgProgress = active.length > 0 ? Math.round(active.reduce((s, e) => s + e.progressPercentage, 0) / active.length * 100) / 100 : 0;
  }
  return { columns, rows: enrollments as unknown as Record<string, unknown>[], summary };
}

async function fetchQuizAttemptData(_metrics: string[], _dimensions: string[], dateFilter: { start?: Date; end?: Date }) {
  const where: Prisma.QuizAttemptWhereInput = {};
  if (dateFilter.start || dateFilter.end) {
    where.createdAt = {};
    if (dateFilter.start) where.createdAt.gte = dateFilter.start;
    if (dateFilter.end) where.createdAt.lte = dateFilter.end;
  }
  const attempts = await prisma.quizAttempt.findMany({
    where,
    select: { id: true, quizId: true, userId: true, status: true, score: true, scorePercentage: true, passed: true, timeSpent: true, createdAt: true },
    take: 5000,
  });
  const columns = ['id', 'quizId', 'userId', 'status', 'score', 'scorePercentage', 'passed', 'timeSpent', 'createdAt'];
  return { columns, rows: attempts as unknown as Record<string, unknown>[], summary: { count: attempts.length } };
}

async function fetchSubmissionData(_metrics: string[], _dimensions: string[], dateFilter: { start?: Date; end?: Date }) {
  const where: Prisma.SubmissionWhereInput = {};
  if (dateFilter.start || dateFilter.end) {
    where.createdAt = {};
    if (dateFilter.start) where.createdAt.gte = dateFilter.start;
    if (dateFilter.end) where.createdAt.lte = dateFilter.end;
  }
  const submissions = await prisma.submission.findMany({
    where,
    select: { id: true, assignmentId: true, userId: true, status: true, grade: true, gradingStatus: true, version: true, createdAt: true },
    take: 5000,
  });
  const columns = ['id', 'assignmentId', 'userId', 'status', 'grade', 'gradingStatus', 'version', 'createdAt'];
  return { columns, rows: submissions as unknown as Record<string, unknown>[], summary: { count: submissions.length } };
}

async function fetchCertificateData(_metrics: string[], _dimensions: string[], dateFilter: { start?: Date; end?: Date }) {
  const where: Prisma.CertificateWhereInput = {};
  if (dateFilter.start || dateFilter.end) {
    where.issuedAt = {};
    if (dateFilter.start) where.issuedAt.gte = dateFilter.start;
    if (dateFilter.end) where.issuedAt.lte = dateFilter.end;
  }
  const certs = await prisma.certificate.findMany({
    where,
    select: { id: true, referenceNumber: true, userId: true, courseId: true, status: true, issuedAt: true },
    take: 5000,
  });
  const columns = ['id', 'referenceNumber', 'userId', 'courseId', 'status', 'issuedAt'];
  return { columns, rows: certs as unknown as Record<string, unknown>[], summary: { count: certs.length } };
}

async function fetchXPData(_metrics: string[], _dimensions: string[], dateFilter: { start?: Date; end?: Date }) {
  const where: Prisma.XPTransactionWhereInput = {};
  if (dateFilter.start || dateFilter.end) {
    where.createdAt = {};
    if (dateFilter.start) where.createdAt.gte = dateFilter.start;
    if (dateFilter.end) where.createdAt.lte = dateFilter.end;
  }
  const transactions = await prisma.xPTransaction.findMany({
    where,
    select: { id: true, userId: true, source: true, points: true, sourceId: true, createdAt: true },
    take: 5000,
  });
  const columns = ['id', 'userId', 'source', 'points', 'sourceId', 'createdAt'];
  const totalXP = transactions.reduce((s, t) => s + t.points, 0);
  return { columns, rows: transactions as unknown as Record<string, unknown>[], summary: { count: transactions.length, totalXP } };
}

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

function exportToCSV(data: { columns: string[]; rows: Record<string, unknown>[] }): string {
  const { columns, rows } = data;
  const header = columns.map((c) => `"${c}"`).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => {
      const val = row[c];
      if (val === null || val === undefined) return '""';
      if (val instanceof Date) return `"${val.toISOString()}"`;
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(','),
  );
  return [header, ...lines].join('\n');
}

async function exportToExcel(data: { columns: string[]; rows: Record<string, unknown>[] }): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Report');
  sheet.columns = data.columns.map((c) => ({ header: c, key: c, width: 20 }));
  sheet.addRows(data.rows);
  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function exportToPDF(data: { columns: string[]; rows: Record<string, unknown>[] }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
    doc.text(`Rows: ${data.rows.length}`);
    doc.moveDown();

    // Table header
    const colWidth = Math.floor((doc.page.width - 60) / data.columns.length);
    doc.fontSize(8);
    doc.font('Helvetica-Bold');
    data.columns.forEach((col, i) => {
      doc.text(col, 30 + i * colWidth, doc.y, { width: colWidth - 5, continued: i < data.columns.length - 1 });
    });
    doc.moveDown();

    // Table rows (limit to 50 to avoid overflow)
    doc.font('Helvetica');
    const maxRows = Math.min(data.rows.length, 50);
    for (let r = 0; r < maxRows; r++) {
      const row = data.rows[r];
      data.columns.forEach((col, i) => {
        const val = row[col];
        const str = val === null || val === undefined ? '' : val instanceof Date ? val.toISOString().split('T')[0] : String(val);
        doc.text(str.slice(0, 30), 30 + i * colWidth, doc.y, { width: colWidth - 5, continued: i < data.columns.length - 1 });
      });
      doc.moveDown(0.3);
    }

    if (data.rows.length > 50) {
      doc.moveDown();
      doc.text(`... and ${data.rows.length - 50} more rows (export to Excel/CSV for full data)`);
    }

    doc.end();
  });
}
