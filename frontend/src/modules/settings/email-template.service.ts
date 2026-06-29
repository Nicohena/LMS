// src/modules/settings/email-template.service.ts
import handlebars from 'handlebars';
import { Prisma, EmailTemplateType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError } from '../../common/errors';
import type { EmailTemplateResponse } from './setting.types';
import type { EmailTemplateInput, UpdateEmailTemplateInput } from './setting.schemas';

// Default email templates seeded on first run
const DEFAULT_TEMPLATES: Array<{ type: EmailTemplateType; name: string; subject: string; htmlContent: string; placeholders: string[] }> = [
  {
    type: 'WELCOME', name: 'Welcome Email',
    subject: 'Welcome to {{siteName}}, {{firstName}}!',
    htmlContent: '<h1>Welcome, {{firstName}}!</h1><p>Your account on {{siteName}} has been created. Email: {{email}}</p>',
    placeholders: ['firstName', 'email', 'siteName'],
  },
  {
    type: 'PASSWORD_RESET', name: 'Password Reset',
    subject: 'Reset your password',
    htmlContent: '<h1>Password Reset</h1><p>Click <a href="{{resetLink}}">here</a> to reset your password. This link expires in 1 hour.</p>',
    placeholders: ['resetLink'],
  },
  {
    type: 'ASSIGNMENT_GRADED', name: 'Assignment Graded',
    subject: 'Assignment Graded: {{assignmentTitle}}',
    htmlContent: '<h1>Assignment Graded</h1><p>Your submission for {{assignmentTitle}} has been graded.</p><p>Grade: {{grade}}/{{maxGrade}}</p><p>Feedback: {{feedback}}</p>',
    placeholders: ['assignmentTitle', 'grade', 'maxGrade', 'feedback'],
  },
  {
    type: 'QUIZ_GRADED', name: 'Quiz Graded',
    subject: 'Quiz Results: {{quizTitle}}',
    htmlContent: '<h1>Quiz Results</h1><p>Quiz: {{quizTitle}}</p><p>Score: {{scorePercentage}}%</p><p>Status: {{#if passed}}Passed{{else}}Not Passed{{/if}}</p>',
    placeholders: ['quizTitle', 'scorePercentage', 'passed'],
  },
  {
    type: 'COURSE_COMPLETED', name: 'Course Completed',
    subject: 'Congratulations! You completed {{courseTitle}}',
    htmlContent: '<h1>Course Completed!</h1><p>You have successfully completed {{courseTitle}}.</p>',
    placeholders: ['courseTitle'],
  },
  {
    type: 'ANNOUNCEMENT', name: 'Announcement',
    subject: '{{title}}',
    htmlContent: '<h1>{{title}}</h1><div>{{{content}}}</div>',
    placeholders: ['title', 'content'],
  },
];

/**
 * Seed default email templates if they don't exist. Called on server startup.
 */
export async function seedDefaultTemplates(): Promise<void> {
  const count = await prisma.emailTemplate.count();
  if (count > 0) return;

  for (const t of DEFAULT_TEMPLATES) {
    await prisma.emailTemplate.create({
      data: {
        type: t.type,
        name: t.name,
        subject: t.subject,
        htmlContent: t.htmlContent,
        placeholders: t.placeholders as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  }
  // eslint-disable-next-line no-console
  console.log(`[settings] Seeded ${DEFAULT_TEMPLATES.length} default email templates`);
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getTemplate(type: EmailTemplateType): Promise<EmailTemplateResponse | null> {
  return prisma.emailTemplate.findUnique({ where: { type } });
}

export async function listTemplates(): Promise<EmailTemplateResponse[]> {
  return prisma.emailTemplate.findMany({ orderBy: { type: 'asc' } });
}

export async function createTemplate(data: EmailTemplateInput, userId: string): Promise<EmailTemplateResponse> {
  const existing = await prisma.emailTemplate.findUnique({ where: { type: data.type } });
  if (existing) throw new ConflictError(`Template for type ${data.type} already exists. Use PATCH to update.`);

  return prisma.emailTemplate.create({
    data: {
      ...data,
      placeholders: data.placeholders as Prisma.InputJsonValue,
      updatedBy: userId,
    },
  });
}

export async function updateTemplate(type: EmailTemplateType, data: UpdateEmailTemplateInput, userId: string): Promise<EmailTemplateResponse> {
  const existing = await prisma.emailTemplate.findUnique({ where: { type } });
  if (!existing) throw new NotFoundError('Email template not found');

  return prisma.emailTemplate.update({
    where: { type },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.htmlContent !== undefined && { htmlContent: data.htmlContent }),
      ...(data.textContent !== undefined && { textContent: data.textContent }),
      ...(data.placeholders !== undefined && { placeholders: data.placeholders as Prisma.InputJsonValue }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      version: { increment: 1 },
      updatedBy: userId,
    },
  });
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function renderTemplate(
  template: { subject: string; htmlContent: string; textContent?: string | null },
  data: Record<string, unknown>,
): { subject: string; html: string; text?: string } {
  const subjectTpl = handlebars.compile(template.subject);
  const htmlTpl = handlebars.compile(template.htmlContent);
  const textTpl = template.textContent ? handlebars.compile(template.textContent) : null;

  return {
    subject: subjectTpl(data),
    html: htmlTpl(data),
    ...(textTpl && { text: textTpl(data) }),
  };
}

/**
 * Get a template by type and render it with the given data.
 */
export async function getAndRenderTemplate(
  type: EmailTemplateType,
  data: Record<string, unknown>,
): Promise<{ subject: string; html: string; text?: string } | null> {
  const template = await getTemplate(type);
  if (!template || !template.isActive) return null;
  return renderTemplate(template, data);
}
