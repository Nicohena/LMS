// src/modules/assignments/peer-review.service.ts
import { PeerReviewStatus, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../../common/errors';
import type { PeerReviewResponse, CreatorSummary } from './assignment.types';
import type { PeerReviewInput } from './assignment.schemas';
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidObjectId(id: string, what = 'Resource'): void {
  if (!OBJECT_ID_RE.test(id)) {
    throw new NotFoundError(`${what} not found`);
  }
}

function toCreatorSummary(u: { id: string; email: string; firstName: string; lastName: string; role: Role }): CreatorSummary {
  return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role };
}

// ---------------------------------------------------------------------------
// Auto-assign peer reviews
// ---------------------------------------------------------------------------

/**
 * Auto-assign peer reviews for an assignment.
 *
 * For each student who has submitted, assign `peerReviewCount` random
 * submissions from other students to review. Each review is a new
 * PeerReview record with status NOT_STARTED.
 *
 * Re-running this function will NOT create duplicate assignments — it
 * checks for existing PeerReview records first.
 */
export async function assignPeerReviews(
  assignmentId: string,
  viewer: { id: string; role: Role },
): Promise<{ assigned: number; skipped: number }> {
  assertValidObjectId(assignmentId, 'Assignment');
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true, createdBy: true, allowPeerReview: true, peerReviewCount: true,
    },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');

  if (viewer.role !== 'ADMIN' && assignment.createdBy !== viewer.id) {
    throw new ForbiddenError('You can only assign peer reviews for assignments you own');
  }
  if (!assignment.allowPeerReview) {
    throw new ValidationError('Peer review is not enabled for this assignment');
  }

  // Get all submissions that have been submitted (not draft, not graded-only)
  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId,
      status: { in: ['SUBMITTED', 'LATE', 'GRADED', 'RESUBMITTED'] },
    },
    select: { id: true, userId: true },
  });

  if (submissions.length < 2) {
    throw new ValidationError('Need at least 2 submitted submissions to assign peer reviews');
  }

  // Check for existing peer review assignments to avoid duplicates
  const existing = await prisma.peerReview.findMany({
    where: { assignmentId },
    select: { reviewerId: true, submissionId: true },
  });
  const existingSet = new Set(existing.map((e) => `${e.reviewerId}:${e.submissionId}`));

  let assigned = 0;
  let skipped = 0;

  // For each submission, assign `peerReviewCount` reviewers from OTHER students
  // (using a round-robin / shuffle approach to spread the load evenly)
  const reviewCount = Math.min(assignment.peerReviewCount, submissions.length - 1);

  for (const submission of submissions) {
    // Candidate reviewers: all other students who submitted
    const candidates = submissions
      .filter((s) => s.userId !== submission.userId)
      .map((s) => s.userId);

    // Shuffle for randomization
    shuffle(candidates);

    // Pick `reviewCount` reviewers
    const reviewers = candidates.slice(0, reviewCount);

    for (const reviewerId of reviewers) {
      const key = `${reviewerId}:${submission.id}`;
      if (existingSet.has(key)) {
        skipped++;
        continue;
      }
      await prisma.peerReview.create({
        data: {
          assignmentId,
          reviewerId,
          submissionId: submission.id,
          status: PeerReviewStatus.NOT_STARTED,
        },
      });
      assigned++;
    }
  }

  return { assigned, skipped };
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ---------------------------------------------------------------------------
// Get peer reviews
// ---------------------------------------------------------------------------

export async function getMyPeerReviews(
  userId: string,
  assignmentId?: string,
): Promise<PeerReviewResponse[]> {
  const where: Prisma.PeerReviewWhereInput = { reviewerId: userId };
  if (assignmentId) {
    assertValidObjectId(assignmentId, 'Assignment');
    where.assignmentId = assignmentId;
  }

  const reviews = await prisma.peerReview.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      submission: {
        select: {
          id: true,
          userId: true,
          assignmentId: true,
          content: true,
          version: true,
        },
      },
    },
  });

  return reviews as PeerReviewResponse[];
}

export async function getPeerReview(
  reviewId: string,
  viewer: { id: string; role: Role },
): Promise<PeerReviewResponse> {
  assertValidObjectId(reviewId, 'PeerReview');
  const review = await prisma.peerReview.findUnique({
    where: { id: reviewId },
    include: {
      reviewer: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      submission: {
        select: { id: true, userId: true, assignmentId: true },
      },
      assignment: { select: { createdBy: true } },
    },
  });
  if (!review) throw new NotFoundError('Peer review not found');

  // Permission: admin, assignment owner, or the reviewer themselves
  const isReviewer = review.reviewerId === viewer.id;
  const isAssignmentOwner = review.assignment.createdBy === viewer.id;
  if (viewer.role !== 'ADMIN' && !isReviewer && !isAssignmentOwner) {
    throw new ForbiddenError('You can only view peer reviews assigned to you or for assignments you own');
  }

  return {
    ...review,
    reviewer: review.reviewer ? toCreatorSummary(review.reviewer) : undefined,
  } as PeerReviewResponse;
}

export async function getReceivedPeerReviews(
  assignmentId: string,
  userId: string,
): Promise<PeerReviewResponse[]> {
  assertValidObjectId(assignmentId, 'Assignment');
  // Find all submissions by this user for the assignment, then their peer reviews
  const submissions = await prisma.submission.findMany({
    where: { assignmentId, userId },
    select: { id: true },
  });
  if (submissions.length === 0) return [];

  const reviews = await prisma.peerReview.findMany({
    where: { submissionId: { in: submissions.map((s) => s.id) } },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  return reviews.map((r) => ({
    ...r,
    reviewer: r.reviewer ? toCreatorSummary(r.reviewer) : undefined,
  })) as PeerReviewResponse[];
}

// ---------------------------------------------------------------------------
// Submit peer review
// ---------------------------------------------------------------------------

export async function submitPeerReview(
  reviewId: string,
  userId: string,
  data: PeerReviewInput,
): Promise<PeerReviewResponse> {
  assertValidObjectId(reviewId, 'PeerReview');
  const review = await prisma.peerReview.findUnique({
    where: { id: reviewId },
    select: { id: true, reviewerId: true, status: true, assignmentId: true },
  });
  if (!review) throw new NotFoundError('Peer review not found');
  if (review.reviewerId !== userId) {
    throw new ForbiddenError('You can only submit peer reviews assigned to you');
  }
  if (review.status === PeerReviewStatus.COMPLETED) {
    throw new ConflictError('Peer review has already been submitted');
  }

  const updated = await prisma.peerReview.update({
    where: { id: reviewId },
    data: {
      score: data.score,
      feedback: data.feedback,
      comments: data.comments as Prisma.InputJsonValue | undefined,
      status: PeerReviewStatus.COMPLETED,
      submittedAt: new Date(),
    },
    include: {
      reviewer: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      submission: {
        select: { id: true, userId: true, assignmentId: true },
      },
    },
  });

  return {
    ...updated,
    reviewer: updated.reviewer ? toCreatorSummary(updated.reviewer) : undefined,
  } as PeerReviewResponse;
}
