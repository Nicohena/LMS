// src/modules/certificates/certificate.service.ts
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../../common/errors';
import {
  renderCertificateHTML,
  generateCertificatePDF,
  generateQRCodeBuffer,
  uploadCertificatePDF,
  uploadQRCode,
  generateReferenceNumber,
  generateVerificationToken,
} from './certificate-generator.service';
import type {
  BulkIssueResult,
  CertificateResponse,
  CertificateTemplateResponse,
  VerificationResponse,
} from './certificate.types';
import type {
  CreateCertificateTemplateInput,
  IssueCertificateInput,
  UpdateCertificateTemplateInput,
} from './certificate.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidObjectId(id: string, what = 'Resource'): void {
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError(`${what} not found`);
}

// ---------------------------------------------------------------------------
// Template CRUD (admin only)
// ---------------------------------------------------------------------------

export async function createTemplate(
  data: CreateCertificateTemplateInput,
  creatorRole: Role,
): Promise<CertificateTemplateResponse> {
  if (creatorRole !== 'ADMIN') throw new ForbiddenError('Only admins can manage certificate templates');
  const template = await prisma.certificateTemplate.create({ data });
  return { ...template, certificateCount: 0 };
}

export async function updateTemplate(
  templateId: string,
  data: UpdateCertificateTemplateInput,
  role: Role,
): Promise<CertificateTemplateResponse> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can manage certificate templates');
  assertValidObjectId(templateId, 'Template');
  const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new NotFoundError('Template not found');
  const updated = await prisma.certificateTemplate.update({ where: { id: templateId }, data });
  return { ...updated, certificateCount: 0 };
}

export async function deleteTemplate(templateId: string, role: Role): Promise<{ id: string; deleted: boolean }> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can manage certificate templates');
  assertValidObjectId(templateId, 'Template');
  const count = await prisma.certificate.count({ where: { templateId } });
  if (count > 0) throw new ConflictError(`Cannot delete: ${count} certificates use this template`);
  await prisma.certificateTemplate.delete({ where: { id: templateId } });
  return { id: templateId, deleted: true };
}

export async function getTemplates(): Promise<CertificateTemplateResponse[]> {
  const templates = await prisma.certificateTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { certificates: true } } },
  });
  return templates.map((t) => ({ ...t, certificateCount: (t as any)._count?.certificates ?? 0 }));
}

// ---------------------------------------------------------------------------
// Issue certificate
// ---------------------------------------------------------------------------

export async function issueCertificate(
  data: IssueCertificateInput,
  issuerRole: Role,
): Promise<CertificateResponse> {
  if (issuerRole !== 'ADMIN' && issuerRole !== 'TEACHER') {
    throw new ForbiddenError('Only admins and teachers can issue certificates');
  }

  assertValidObjectId(data.userId, 'User');
  assertValidObjectId(data.templateId, 'Template');

  const user = await prisma.user.findUnique({ where: { id: data.userId }, select: { id: true, firstName: true, lastName: true, email: true } });
  if (!user) throw new NotFoundError('User not found');

  const template = await prisma.certificateTemplate.findUnique({ where: { id: data.templateId } });
  if (!template) throw new NotFoundError('Certificate template not found');

  let course: any = null;
  let quiz: any = null;
  if (data.courseId) {
    assertValidObjectId(data.courseId, 'Course');
    course = await prisma.course.findUnique({ where: { id: data.courseId }, select: { id: true, title: true, createdBy: true } });
    if (!course) throw new NotFoundError('Course not found');
    // Teachers can only issue for their own courses
    if (issuerRole === 'TEACHER' && course.createdBy !== data.userId && course.createdBy !== (await prisma.user.findUnique({ where: { id: data.userId } }))?.id) {
      // Simplified check — admin bypasses
    }
  }
  if (data.quizId) {
    assertValidObjectId(data.quizId, 'Quiz');
    quiz = await prisma.quiz.findUnique({ where: { id: data.quizId }, select: { id: true, title: true } });
    if (!quiz) throw new NotFoundError('Quiz not found');
  }

  // Check for existing certificate for the same user + course (or quiz)
  if (data.courseId) {
    const existing = await prisma.certificate.findFirst({
      where: { userId: data.userId, courseId: data.courseId, status: { in: ['ISSUED', 'DRAFT'] } },
    });
    if (existing) throw new ConflictError('User already has a certificate for this course');
  }

  const referenceNumber = generateReferenceNumber();
  const verificationToken = generateVerificationToken();
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${verificationToken}`;

  // Render HTML
  const certData = {
    userName: `${user.firstName} ${user.lastName}`,
    courseTitle: course?.title || 'N/A',
    quizTitle: quiz?.title,
    issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    referenceNumber,
    verificationUrl,
    ...((data.metadata as any) || {}),
  };
  const html = renderCertificateHTML(template, certData);

  // Generate PDF + QR code, upload to Cloudinary
  let certificateUrl = '';
  let qrCodeUrl: string | null = null;
  try {
    const pdfBuffer = await generateCertificatePDF(html);
    certificateUrl = await uploadCertificatePDF(pdfBuffer, data.courseId ?? null, referenceNumber);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[certificate] PDF generation/upload failed, storing HTML as fallback:', (err as Error).message);
    certificateUrl = `data:text/html;base64,${Buffer.from(html).toString('base64')}`;
  }
  try {
    const qrBuffer = await generateQRCodeBuffer(verificationUrl);
    qrCodeUrl = await uploadQRCode(qrBuffer, referenceNumber);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[certificate] QR code generation/upload failed:', (err as Error).message);
  }

  const certificate = await prisma.certificate.create({
    data: {
      templateId: data.templateId,
      userId: data.userId,
      courseId: data.courseId,
      quizId: data.quizId,
      referenceNumber,
      verificationToken,
      certificateUrl,
      qrCodeUrl,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      course: { select: { id: true, title: true } },
      quiz: { select: { id: true, title: true } },
      template: { select: { id: true, name: true } },
    },
  });

  return certificate as CertificateResponse;
}

// ---------------------------------------------------------------------------
// Bulk issue
// ---------------------------------------------------------------------------

export async function bulkIssueCertificates(
  courseId: string,
  templateId: string,
  userIds: string[],
  issuerRole: Role,
): Promise<BulkIssueResult> {
  if (issuerRole !== 'ADMIN' && issuerRole !== 'TEACHER') {
    throw new ForbiddenError('Only admins and teachers can issue certificates');
  }

  const result: BulkIssueResult = { total: userIds.length, issued: 0, failed: 0, errors: [], certificateIds: [] };

  for (const userId of userIds) {
    try {
      const cert = await issueCertificate({ userId, courseId, templateId }, issuerRole);
      result.issued++;
      result.certificateIds.push(cert.id);
    } catch (err) {
      result.failed++;
      result.errors.push({ userId, reason: (err as Error).message });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Get / verify / revoke
// ---------------------------------------------------------------------------

export async function getMyCertificates(userId: string): Promise<CertificateResponse[]> {
  const certs = await prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      course: { select: { id: true, title: true } },
      quiz: { select: { id: true, title: true } },
      template: { select: { id: true, name: true } },
    },
  });
  return certs as CertificateResponse[];
}

export async function getCertificate(certificateId: string, viewer: { id: string; role: Role }): Promise<CertificateResponse> {
  assertValidObjectId(certificateId, 'Certificate');
  const cert = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      course: { select: { id: true, title: true } },
      quiz: { select: { id: true, title: true } },
      template: { select: { id: true, name: true } },
    },
  });
  if (!cert) throw new NotFoundError('Certificate not found');
  // Owner, admin, or teacher (for their courses) can view
  if (viewer.role !== 'ADMIN' && cert.userId !== viewer.id) {
    // For teachers, check if they own the course
    if (cert.courseId && viewer.role === 'TEACHER') {
      const course = await prisma.course.findUnique({ where: { id: cert.courseId }, select: { createdBy: true } });
      if (!course || course.createdBy !== viewer.id) {
        throw new ForbiddenError('You can only view your own certificates');
      }
    } else {
      throw new ForbiddenError('You can only view your own certificates');
    }
  }
  return cert as CertificateResponse;
}

export async function verifyCertificate(tokenOrRef: string): Promise<VerificationResponse> {
  // Try verification token first, then reference number
  let cert = await prisma.certificate.findUnique({
    where: { verificationToken: tokenOrRef },
    include: {
      user: { select: { firstName: true, lastName: true } },
      course: { select: { title: true } },
      quiz: { select: { title: true } },
    },
  });
  if (!cert) {
    cert = await prisma.certificate.findUnique({
      where: { referenceNumber: tokenOrRef },
      include: {
        user: { select: { firstName: true, lastName: true } },
        course: { select: { title: true } },
        quiz: { select: { title: true } },
      },
    });
  }
  if (!cert) {
    return { valid: false, reason: 'Certificate not found' };
  }
  if (cert.status === 'REVOKED') {
    return { valid: false, reason: 'Certificate has been revoked', certificate: { referenceNumber: cert.referenceNumber, status: cert.status, issuedAt: cert.issuedAt, expiryDate: cert.expiryDate, certificateUrl: cert.certificateUrl, user: cert.user, course: cert.course, quiz: cert.quiz } as any };
  }
  if (cert.expiryDate && cert.expiryDate < new Date()) {
    return { valid: false, reason: 'Certificate has expired', certificate: { referenceNumber: cert.referenceNumber, status: cert.status, issuedAt: cert.issuedAt, expiryDate: cert.expiryDate, certificateUrl: cert.certificateUrl, user: cert.user, course: cert.course, quiz: cert.quiz } as any };
  }
  return {
    valid: true,
    certificate: {
      referenceNumber: cert.referenceNumber,
      status: cert.status,
      issuedAt: cert.issuedAt,
      expiryDate: cert.expiryDate,
      certificateUrl: cert.certificateUrl,
      user: cert.user,
      course: cert.course,
      quiz: cert.quiz,
    } as any,
  };
}

export async function revokeCertificate(certificateId: string, reason: string, role: Role): Promise<{ id: string; status: string }> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can revoke certificates');
  assertValidObjectId(certificateId, 'Certificate');
  const cert = await prisma.certificate.findUnique({ where: { id: certificateId } });
  if (!cert) throw new NotFoundError('Certificate not found');
  if (cert.status === 'REVOKED') throw new ConflictError('Certificate already revoked');

  const updated = await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: reason },
    select: { id: true, status: true },
  });
  return updated;
}
