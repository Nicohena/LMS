// src/modules/settings/grading.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError } from '../../common/errors';
import type { ConvertScoreResult, GradingScaleResponse } from './setting.types';
import type { GradingScaleInput, UpdateGradingScaleInput } from './setting.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createScale(data: GradingScaleInput, userId: string): Promise<GradingScaleResponse> {
  // If isDefault, unset other defaults
  if (data.isDefault) {
    await prisma.gradingScale.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  return prisma.gradingScale.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      grades: data.grades as Prisma.InputJsonValue,
      isDefault: data.isDefault,
      createdBy: userId,
    },
  });
}

export async function getScales(): Promise<GradingScaleResponse[]> {
  return prisma.gradingScale.findMany({ orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] });
}

export async function getScale(id: string): Promise<GradingScaleResponse> {
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Grading scale not found');
  const scale = await prisma.gradingScale.findUnique({ where: { id } });
  if (!scale) throw new NotFoundError('Grading scale not found');
  return scale;
}

export async function getDefaultScale(): Promise<GradingScaleResponse | null> {
  let scale = await prisma.gradingScale.findFirst({ where: { isDefault: true } });
  if (!scale) {
    // If no default set, return the first one
    scale = await prisma.gradingScale.findFirst({ orderBy: { createdAt: 'asc' } });
  }
  return scale;
}

export async function updateScale(id: string, data: UpdateGradingScaleInput, userId: string): Promise<GradingScaleResponse> {
  const existing = await getScale(id);

  // If setting as default, unset others
  if (data.isDefault === true) {
    await prisma.gradingScale.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  return prisma.gradingScale.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.grades !== undefined && { grades: data.grades as Prisma.InputJsonValue }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    },
  });
}

export async function deleteScale(id: string): Promise<{ id: string; deleted: boolean }> {
  const scale = await getScale(id);
  if (scale.isDefault) throw new ConflictError('Cannot delete the default grading scale. Set another as default first.');
  await prisma.gradingScale.delete({ where: { id } });
  return { id, deleted: true };
}

// ---------------------------------------------------------------------------
// Score conversion
// ---------------------------------------------------------------------------

export async function convertScore(score: number, scaleId?: string): Promise<ConvertScoreResult> {
  let scale: GradingScaleResponse | null;
  if (scaleId) {
    scale = await getScale(scaleId);
  } else {
    scale = await getDefaultScale();
  }

  if (!scale) {
    return {
      inputScore: score,
      letter: 'N/A',
      scaleName: 'No scale configured',
    };
  }

  const grades = scale.grades as unknown as Array<{
    letter: string;
    min: number;
    max: number;
    description?: string;
    gpa?: number;
  }>;

  // Find the grade band that contains the score
  const match = grades.find((g) => score >= g.min && score <= g.max);

  if (!match) {
    // Fallback: find the closest band
    const fallback = grades.reduce((closest, g) => {
      const dist = Math.min(Math.abs(score - g.min), Math.abs(score - g.max));
      return dist < closest.dist ? { grade: g, dist } : closest;
    }, { grade: grades[0], dist: Infinity });

    return {
      inputScore: score,
      letter: fallback.grade.letter,
      description: fallback.grade.description,
      gpa: fallback.grade.gpa,
      scaleName: scale.name,
    };
  }

  return {
    inputScore: score,
    letter: match.letter,
    description: match.description,
    gpa: match.gpa,
    scaleName: scale.name,
  };
}
