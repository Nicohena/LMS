// src/common/services/upload.service.ts
//
// File-upload service backed by Cloudinary.
//
// - Image uploads (thumbnails): processed with sharp (resize + WebP) before upload
// - Other files (videos, documents): streamed straight to Cloudinary
// - Size + MIME-type validation enforced via multer config
//
// If Cloudinary credentials are not configured, `assertCloudinaryConfigured()`
// throws a 503 ServiceUnavailableError — the rest of the app keeps working
// (only upload endpoints are unavailable).

import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import multer, { type Multer } from 'multer';
import { Readable } from 'node:stream';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import { ServiceUnavailableError } from '../errors';

// ---------------------------------------------------------------------------
// Cloudinary config
// ---------------------------------------------------------------------------

let cloudinaryConfigured = false;

function configureCloudinary(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    cloudinaryConfigured = false;
    return;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  cloudinaryConfigured = true;
}

configureCloudinary();

/**
 * Re-run Cloudinary configuration. Call this AFTER dotenv.config() has loaded
 * env vars (the initial module-load call runs before dotenv, so it sees empty
 * env vars when the app is started via `node dist/server.js` without an
 * external env loader).
 */
export function reconfigureCloudinary(): void {
  configureCloudinary();
}

export function isCloudinaryConfigured(): boolean {
  return cloudinaryConfigured;
}

export function assertCloudinaryConfigured(): void {
  if (!cloudinaryConfigured) {
    throw new ServiceUnavailableError(
      'File uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env',
    );
  }
}

// ---------------------------------------------------------------------------
// File-size + MIME-type allow-lists
// ---------------------------------------------------------------------------

export const FILE_LIMITS = {
  IMAGE_MAX_BYTES: 5 * 1024 * 1024, // 5 MB
  VIDEO_MAX_BYTES: 100 * 1024 * 1024, // 100 MB
  DOCUMENT_MAX_BYTES: 25 * 1024 * 1024, // 25 MB
} as const;

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

// ---------------------------------------------------------------------------
// Multer factories
// ---------------------------------------------------------------------------

function buildMemoryStorage(): Multer {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: FILE_LIMITS.VIDEO_MAX_BYTES }, // generous global cap
    fileFilter: (_req, file, cb) => {
      const all = new Set([...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...DOCUMENT_MIME_TYPES]);
      if (all.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`));
      }
    },
  });
}

const upload = buildMemoryStorage();

/**
 * Single-image upload middleware (for thumbnails).
 * Enforces image-only MIME types and a 5 MB cap.
 */
export const uploadThumbnail = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_LIMITS.IMAGE_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Thumbnail must be an image (jpeg, png, webp, gif). Got: ${file.mimetype}`));
    }
  },
}).single('thumbnail');

/**
 * Multi-file upload middleware (for module content: videos, documents).
 */
export const uploadFiles = upload.array('files', 10);

// ---------------------------------------------------------------------------
// Upload helpers
// ---------------------------------------------------------------------------

export interface UploadOptions {
  /** Cloudinary folder/prefix (e.g. "lms/thumbnails"). */
  folder: string;
  /** Resize image to this width (maintains aspect ratio). Default: 800. */
  width?: number;
  /** Resize image to this height (maintains aspect ratio). Default: 600. */
  height?: number;
}

/**
 * Upload an image buffer to Cloudinary with sharp pre-processing:
 * resize to fit (800x600 by default), convert to WebP, quality 80.
 *
 * Returns the secure Cloudinary URL.
 */
export async function uploadImage(
  file: { buffer: Buffer; originalname: string; mimetype: string },
  options: UploadOptions,
): Promise<string> {
  assertCloudinaryConfigured();

  const width = options.width ?? 800;
  const height = options.height ?? 600;

  const processedBuffer = await sharp(file.buffer)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80 })
    .toBuffer();

  const publicId = `${options.folder}/${uuidv4()}`;

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'image',
        format: 'webp',
        overwrite: true,
      },
      (err, result: UploadApiResponse | undefined) => {
        if (err || !result) {
          reject(err ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve(result.secure_url);
      },
    );

    Readable.from(processedBuffer).pipe(uploadStream);
  });
}

/**
 * Upload a non-image file (video/document/etc.) to Cloudinary as-is.
 */
export async function uploadFile(
  file: { buffer: Buffer; originalname: string; mimetype: string },
  options: { folder: string; resourceType?: 'video' | 'raw' | 'image' },
): Promise<string> {
  assertCloudinaryConfigured();

  const resourceType = options.resourceType ?? 'raw';
  const publicId = `${options.folder}/${uuidv4()}`;

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
      },
      (err, result: UploadApiResponse | undefined) => {
        if (err || !result) {
          reject(err ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve(result.secure_url);
      },
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? undefined;
}

export function getUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : undefined;
}
