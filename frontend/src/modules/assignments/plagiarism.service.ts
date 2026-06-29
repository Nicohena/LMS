// src/modules/assignments/plagiarism.service.ts
//
// Basic plagiarism detection using cosine similarity on term-frequency
// vectors. This is a simple in-house check — for production-grade detection,
// integrate with Turnitin or Copyleaks (env vars TURNITIN_API_KEY /
// COPYLEAKS_API_KEY are placeholders for those integrations).
//
// The check compares a submission's text against all other submissions for
// the same assignment and returns a similarity score (0-100).

import { prisma } from '../../lib/prisma';

export interface PlagiarismResult {
  submissionId: string;
  similarityScore: number; // 0-100, highest similarity found
  matchedSubmissions: Array<{
    submissionId: string;
    userId: string;
    similarity: number;
  }>;
}

/**
 * Compute cosine similarity between two text strings.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
export function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // Build term-frequency vectors
  const tf1 = new Map<string, number>();
  const tf2 = new Map<string, number>();
  for (const t of tokens1) tf1.set(t, (tf1.get(t) ?? 0) + 1);
  for (const t of tokens2) tf2.set(t, (tf2.get(t) ?? 0) + 1);

  // Compute dot product
  let dotProduct = 0;
  for (const [term, freq] of tf1) {
    const other = tf2.get(term);
    if (other) dotProduct += freq * other;
  }

  // Compute magnitudes
  let mag1 = 0;
  for (const freq of tf1.values()) mag1 += freq * freq;
  let mag2 = 0;
  for (const freq of tf2.values()) mag2 += freq * freq;

  if (mag1 === 0 || mag2 === 0) return 0;

  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

function tokenize(text: string): string[] {
  // Lowercase, strip punctuation, split on whitespace, filter stopwords + short tokens
  const stop = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
    'not', 'no', 'so', 'if', 'then', 'than', 'too', 'very', 'just', 'about',
  ]);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));
}

/**
 * Check a submission's text against all other submissions for the same
 * assignment. Returns the highest similarity score found + the list of
 * matched submissions above a threshold.
 *
 * If TURNITIN_API_KEY or COPYLEAKS_API_KEY is set, this would delegate to
 * the external service instead (not implemented here — placeholder).
 */
export async function checkPlagiarism(submissionId: string): Promise<PlagiarismResult> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      assignmentId: true,
      userId: true,
      content: true,
    },
  });
  if (!submission) {
    return { submissionId, similarityScore: 0, matchedSubmissions: [] };
  }

  // Extract text from the submission content
  const text = extractText(submission.content as any);
  if (!text) {
    return { submissionId, similarityScore: 0, matchedSubmissions: [] };
  }

  // Fetch all other submissions for the same assignment
  const others = await prisma.submission.findMany({
    where: {
      assignmentId: submission.assignmentId,
      id: { not: submissionId },
      userId: { not: submission.userId }, // don't compare against own resubmissions
    },
    select: { id: true, userId: true, content: true },
  });

  const THRESHOLD = 0.3; // 30% similarity = flag
  const matched: PlagiarismResult['matchedSubmissions'] = [];
  let maxScore = 0;

  for (const other of others) {
    const otherText = extractText(other.content as any);
    if (!otherText) continue;
    const sim = calculateSimilarity(text, otherText);
    if (sim > maxScore) maxScore = sim;
    if (sim >= THRESHOLD) {
      matched.push({
        submissionId: other.id,
        userId: other.userId,
        similarity: Math.round(sim * 10000) / 100,
      });
    }
  }

  return {
    submissionId,
    similarityScore: Math.round(maxScore * 10000) / 100,
    matchedSubmissions: matched.sort((a, b) => b.similarity - a.similarity),
  };
}

function extractText(content: unknown): string {
  if (!content || typeof content !== 'object') return '';
  const c = content as { text?: string; links?: string[] };
  let text = c.text ?? '';
  if (Array.isArray(c.links)) {
    text += ' ' + c.links.join(' ');
  }
  return text.trim();
}

/**
 * Update a submission with plagiarism results.
 */
export async function savePlagiarismResult(
  submissionId: string,
  result: PlagiarismResult,
): Promise<void> {
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      plagiarismScore: result.similarityScore,
      // We don't generate a separate report URL in this basic implementation;
      // the matched submissions list is available via the API.
      plagiarismReport: null,
    },
  });
}
