// src/modules/certificates/certificate.types.ts
import type { Certificate, CertificateTemplate, CertificateStatus, Course, Quiz, User } from '@prisma/client';

export interface CertificateTemplateResponse extends CertificateTemplate {
  certificateCount?: number;
}

export interface CertificateResponse extends Certificate {
  user: { id: string; email: string; firstName: string; lastName: string };
  course?: { id: string; title: string } | null;
  quiz?: { id: string; title: string } | null;
  template?: { id: string; name: string };
}

export interface VerificationResponse {
  valid: boolean;
  certificate?: {
    referenceNumber: string;
    status: CertificateStatus;
    issuedAt: Date;
    expiryDate: Date | null;
    certificateUrl: string;
    user: { firstName: string; lastName: string };
    course?: { title: string } | null;
    quiz?: { title: string } | null;
  };
  reason?: string;
}

export interface BulkIssueResult {
  total: number;
  issued: number;
  failed: number;
  errors: Array<{ userId?: string; reason: string }>;
  certificateIds: string[];
}
