// src/modules/courses/moderation.service.ts
//
// Post-moderation engine: background jobs that run after content is published.
// Philosophy: "Content is published instantly, moderated reactively."
//
// Jobs:
//   1. File type validation — blocks disallowed types
//   2. Virus scanning — simulated (real impl would use ClamAV or similar)
//   3. Quality scoring — evaluates content completeness
//   4. Plagiarism detection — simulated (real impl would use Copyleaks/Turnitin)
//   5. Content moderation flagging — aggregates results, flags if needed

import { prisma } from '../../lib/prisma';

// ---------------------------------------------------------------------------
// Allowed file types per content type
// ---------------------------------------------------------------------------

const ALLOWED_VIDEO_TYPES = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
const ALLOWED_DOC_TYPES = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt'];
const ALLOWED_IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

// Suspicious patterns that trigger virus scanning flag
const SUSPICIOUS_PATTERNS = [
  /\.(exe|bat|cmd|sh|ps1|dll|scr|vbs)$/i,
  /double-extension/i, // e.g. file.pdf.exe
];

// ---------------------------------------------------------------------------
// 1. File Type Validation
// ---------------------------------------------------------------------------

export function validateFileType(content: {
  type: string;
  videoUrl?: string | null;
  fileUrl?: string | null;
  externalUrl?: string | null;
}): { valid: boolean; reason?: string } {
  const urls = [content.videoUrl, content.fileUrl, content.externalUrl].filter(Boolean) as string[];

  for (const url of urls) {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (!ext) continue;

    // Check for suspicious extensions
    if (SUSPICIOUS_PATTERNS.some(p => p.test(url))) {
      return { valid: false, reason: `Suspicious file extension detected: ${ext}` };
    }

    // Check allowed types based on content type
    if (content.type === 'VIDEO' && !ALLOWED_VIDEO_TYPES.includes(ext) && !ALLOWED_IMAGE_TYPES.includes(ext)) {
      return { valid: false, reason: `Video type .${ext} not allowed. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}` };
    }
    if (content.type === 'DOCUMENT' && !ALLOWED_DOC_TYPES.includes(ext) && !ALLOWED_IMAGE_TYPES.includes(ext)) {
      return { valid: false, reason: `Document type .${ext} not allowed. Allowed: ${ALLOWED_DOC_TYPES.join(', ')}` };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// 2. Virus Scanning (simulated)
// ---------------------------------------------------------------------------

export async function scanForViruses(contentId: string): Promise<{ clean: boolean; threat?: string }> {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return { clean: true };

  const urls = [content.videoUrl, content.fileUrl, content.externalUrl].filter(Boolean) as string[];

  for (const url of urls) {
    // Simulated virus check — in production, integrate with ClamAV or a cloud scanner
    if (SUSPICIOUS_PATTERNS.some(p => p.test(url))) {
      // eslint-disable-next-line no-console
      console.log(`[moderation] Virus scan flagged: ${contentId} (${url})`);
      return { clean: false, threat: `Potentially malicious file detected: ${url.split('/').pop()}` };
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[moderation] Virus scan clean: ${contentId}`);
  return { clean: true };
}

// ---------------------------------------------------------------------------
// 3. Content Quality Scoring
// ---------------------------------------------------------------------------

export async function scoreContentQuality(contentId: string): Promise<number> {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return 0;

  let score = 0;
  const maxScore = 100;

  // Has title (always true, but +10 for meaningful title)
  if (content.title.length > 10) score += 10;

  // Has description: +20
  if (content.description && content.description.trim().length > 30) score += 20;

  // Has content (contentJson for PAGE, videoUrl for VIDEO, etc.): +25
  if (content.contentJson) score += 15;
  if (content.videoUrl) score += 10;
  if (content.fileUrl) score += 10;
  if (content.externalUrl) score += 5;

  // Has duration: +10
  if (content.duration && content.duration > 0) score += 10;

  // Type-specific checks: +10
  if (content.type === 'PAGE' && content.contentJson) {
    const cj = content.contentJson as any;
    if (cj?.type === 'markdown' && typeof cj.content === 'string' && cj.content.length > 100) score += 10;
  } else if (content.type === 'VIDEO' && content.videoUrl) {
    score += 10;
  } else if (content.type === 'QUIZ' || content.type === 'ASSIGNMENT') {
    score += 10;
  }

  score = Math.min(score, maxScore);

  // Update the content's quality score
  await prisma.content.update({
    where: { id: contentId },
    data: { qualityScore: score },
  });

  // eslint-disable-next-line no-console
  console.log(`[moderation] Quality score for ${contentId}: ${score}/${maxScore}`);
  return score;
}

// ---------------------------------------------------------------------------
// 4. Plagiarism Detection (simulated)
// ---------------------------------------------------------------------------

export async function checkPlagiarism(contentId: string): Promise<{ original: boolean; similarity?: number }> {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return { original: true };

  // Only check PAGE content (text-based)
  if (content.type !== 'PAGE' || !content.contentJson) return { original: true };

  const cj = content.contentJson as any;
  const text = cj?.type === 'markdown' ? cj.content : '';
  if (!text || text.length < 50) return { original: true };

  // Simulated plagiarism check — in production, integrate with Copyleaks/Turnitin
  // For now, we check for common copy-paste patterns
  const commonPhrases = [
    'lorem ipsum',
    'this is a test',
    'placeholder text',
    'todo: write content',
  ];

  const lowerText = text.toLowerCase();
  for (const phrase of commonPhrases) {
    if (lowerText.includes(phrase)) {
      // eslint-disable-next-line no-console
      console.log(`[moderation] Plagiarism check flagged: ${contentId} (found "${phrase}")`);
      return { original: false, similarity: 85 };
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[moderation] Plagiarism check passed: ${contentId}`);
  return { original: true };
}

// ---------------------------------------------------------------------------
// 5. Content Moderation — runs all checks and flags if needed
// ---------------------------------------------------------------------------

export async function moderateContent(contentId: string): Promise<{
  status: 'PUBLISHED' | 'FLAGGED';
  reason?: string;
  qualityScore?: number;
}> {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return { status: 'PUBLISHED' };

  // Run all checks in parallel
  const [fileCheck, virusCheck, qualityScore, plagiarismCheck] = await Promise.all([
    Promise.resolve(validateFileType({
      type: content.type,
      videoUrl: content.videoUrl,
      fileUrl: content.fileUrl,
      externalUrl: content.externalUrl,
    })),
    scanForViruses(contentId),
    scoreContentQuality(contentId),
    checkPlagiarism(contentId),
  ]);

  // Determine if content should be flagged
  const flags: string[] = [];

  if (!fileCheck.valid) {
    flags.push(`File validation: ${fileCheck.reason}`);
  }

  if (!virusCheck.clean) {
    flags.push(`Virus scan: ${virusCheck.threat}`);
  }

  if (!plagiarismCheck.original) {
    flags.push(`Plagiarism: ${plagiarismCheck.similarity}% similarity detected`);
  }

  if (qualityScore < 20) {
    flags.push(`Low quality score: ${qualityScore}/100`);
  }

  if (flags.length > 0) {
    const reason = flags.join('; ');
    await prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'FLAGGED',
        flagReason: reason,
        qualityScore,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`[moderation] Content FLAGGED: ${contentId} — ${reason}`);
    return { status: 'FLAGGED', reason, qualityScore };
  }

  // All checks passed — keep published
  await prisma.content.update({
    where: { id: contentId },
    data: {
      status: 'PUBLISHED',
      flagReason: null,
      qualityScore,
    },
  });
  // eslint-disable-next-line no-console
  console.log(`[moderation] Content approved: ${contentId} (quality: ${qualityScore})`);
  return { status: 'PUBLISHED', qualityScore };
}

// ---------------------------------------------------------------------------
// Admin moderation actions
// ---------------------------------------------------------------------------

export async function getFlaggedContent(filters?: { type?: string; page?: number; limit?: number }) {
  const page = filters?.page ?? 1;
  const limit = Math.min(filters?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: any = { status: 'FLAGGED' };
  if (filters?.type) where.type = filters.type;

  const [data, total] = await Promise.all([
    prisma.content.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.content.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function moderateFlaggedContent(
  contentId: string,
  adminId: string,
  action: 'APPROVE' | 'ARCHIVE' | 'REMOVE',
  notes?: string,
) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) throw new Error('Content not found');

  const updateData: any = {
    moderatedAt: new Date(),
    moderatedBy: adminId,
  };

  if (action === 'APPROVE') {
    updateData.status = 'PUBLISHED';
    updateData.flagReason = null;
  } else if (action === 'ARCHIVE' || action === 'REMOVE') {
    updateData.status = 'ARCHIVED';
    updateData.flagReason = `Admin ${action.toLowerCase()}: ${notes || 'No notes provided'}`;
    updateData.isPublished = false;
  }

  const updated = await prisma.content.update({
    where: { id: contentId },
    data: updateData,
  });

  // eslint-disable-next-line no-console
  console.log(`[moderation] Admin ${action} content ${contentId} by ${adminId}`);
  return { message: `Content ${action.toLowerCase()}d successfully.`, content: updated };
}
