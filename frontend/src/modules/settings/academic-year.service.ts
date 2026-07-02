// src/modules/settings/academic-year.service.ts
import { AcademicYearStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError, ValidationError } from '../../common/errors';
import type { AcademicYearResponse } from './setting.types';
import type { AcademicYearInput, UpdateAcademicYearInput } from './setting.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createYear(data: AcademicYearInput): Promise<AcademicYearResponse> {
  // If setting as current, unset others
  if (data.isCurrent) {
    await prisma.academicYear.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    });
  }

  // Check for overlapping years
  const overlapping = await prisma.academicYear.findFirst({
    where: {
      OR: [
        { startDate: { lte: data.endDate }, endDate: { gte: data.startDate } },
      ],
    },
  });
  if (overlapping) {
    throw new ConflictError(`Academic year overlaps with "${overlapping.name}"`);
  }

  return prisma.academicYear.create({ data });
}

export async function getYears(status?: AcademicYearStatus): Promise<AcademicYearResponse[]> {
  const where: Prisma.AcademicYearWhereInput = {};
  if (status) where.status = status;

  return prisma.academicYear.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { courses: true } } },
  });
}

export async function getYear(id: string): Promise<AcademicYearResponse> {
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Academic year not found');
  const year = await prisma.academicYear.findUnique({
    where: { id },
    include: { _count: { select: { courses: true } } },
  });
  if (!year) throw new NotFoundError('Academic year not found');
  return year;
}

export async function getCurrentYear(): Promise<AcademicYearResponse | null> {
  return prisma.academicYear.findFirst({
    where: { isCurrent: true, status: 'ACTIVE' },
    include: { _count: { select: { courses: true } } },
  });
}

export async function updateYear(id: string, data: UpdateAcademicYearInput): Promise<AcademicYearResponse> {
  const existing = await getYear(id);

  // Validate date range if updating dates
  const newStart = data.startDate ?? existing.startDate;
  const newEnd = data.endDate ?? existing.endDate;
  if (newEnd <= newStart) {
    throw new ValidationError('endDate must be after startDate');
  }

  // If setting as current, unset others
  if (data.isCurrent === true) {
    await prisma.academicYear.updateMany({
      where: { isCurrent: true, id: { not: id } },
      data: { isCurrent: false },
    });
  }

  return prisma.academicYear.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.isCurrent !== undefined && { isCurrent: data.isCurrent }),
    },
  });
}

export async function deleteYear(id: string): Promise<{ id: string; deleted: boolean }> {
  const year = await getYear(id);
  if (year.isCurrent) throw new ConflictError('Cannot delete the current academic year');

  // Check if any courses are linked
  const courseCount = await prisma.course.count({ where: { academicYearId: id } });
  if (courseCount > 0) {
    throw new ConflictError(`Cannot delete: ${courseCount} course(s) are linked to this academic year`);
  }

  await prisma.academicYear.delete({ where: { id } });
  return { id, deleted: true };
}

export async function setCurrentYear(id: string): Promise<AcademicYearResponse> {
  const year = await getYear(id);
  if (year.status === 'ARCHIVED') {
    throw new ValidationError('Cannot set an archived year as current');
  }

  // Unset all others
  await prisma.academicYear.updateMany({
    where: { isCurrent: true, id: { not: id } },
    data: { isCurrent: false },
  });

  return prisma.academicYear.update({
    where: { id },
    data: { isCurrent: true, status: 'ACTIVE' },
  });
}
