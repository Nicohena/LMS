// src/modules/certificates/certificate-generator.service.ts
//
// Certificate PDF generation using Puppeteer + Handlebars.
// QR code generation using the `qrcode` package.
// Uploads to Cloudinary via the existing upload service.
//
// If Puppeteer fails to launch (e.g., no Chromium), falls back to storing
// the rendered HTML as the certificate URL (still usable, just not a PDF).

import handlebars from 'handlebars';
import QRCode from 'qrcode';
import { prisma } from '../../lib/prisma';
import { uploadFile, uploadImage, isCloudinaryConfigured } from '../../common/services/upload.service';
import { Readable } from 'node:stream';
import { v4 as uuidv4 } from 'uuid';
import { ServiceUnavailableError } from '../../common/errors';

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

export interface CertificateData {
  userName: string;
  courseTitle: string;
  quizTitle?: string;
  issueDate: string;
  referenceNumber: string;
  verificationUrl: string;
  score?: string;
  grade?: string;
  [key: string]: unknown;
}

/**
 * Render the certificate HTML template with the given data using Handlebars.
 */
export function renderCertificateHTML(
  template: { htmlTemplate: string; cssStyle?: string | null; backgroundImage?: string | null; signatureImage?: string | null; signatureName?: string | null; signatureTitle?: string | null; fontFamily?: string | null },
  data: CertificateData,
): string {
  const compiled = handlebars.compile(template.htmlTemplate);
  const body = compiled(data);

  const css = template.cssStyle || '';
  const bgStyle = template.backgroundImage ? `background-image: url('${template.backgroundImage}'); background-size: cover; background-position: center;` : '';
  const fontStyle = template.fontFamily ? `font-family: ${template.fontFamily}, serif;` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 0; }
  body { margin: 0; padding: 40px; ${fontStyle} ${bgStyle} }
  ${css}
</style>
</head>
<body>
${body}
${
  template.signatureImage
    ? `<div style="position: absolute; bottom: 60px; right: 80px; text-align: center;">
         <img src="${template.signatureImage}" style="height: 80px;" />
         <div>${template.signatureName || ''}</div>
         <div style="font-size: 12px; color: #666;">${template.signatureTitle || ''}</div>
       </div>`
    : ''
}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// PDF generation (Puppeteer)
// ---------------------------------------------------------------------------

/**
 * Generate a PDF from HTML content using Puppeteer.
 * Returns the PDF as a Buffer.
 * If Puppeteer fails to launch, throws an error (caller should handle fallback).
 */
export async function generateCertificatePDF(htmlContent: string): Promise<Buffer> {
  // Dynamic import so the module doesn't fail at startup if puppeteer is broken
  const puppeteer = await import('puppeteer');
  let browser;
  try {
    browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    if (browser) await browser.close();
  }
}

// ---------------------------------------------------------------------------
// QR code generation
// ---------------------------------------------------------------------------

/**
 * Generate a QR code image as a Buffer (PNG format).
 */
export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: 'png',
    width: 300,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

// ---------------------------------------------------------------------------
// Upload helpers (uses Cloudinary if configured, falls back gracefully)
// ---------------------------------------------------------------------------

export async function uploadCertificatePDF(
  pdfBuffer: Buffer,
  courseId: string | null,
  referenceNumber: string,
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new ServiceUnavailableError('Cloudinary not configured — cannot upload certificate PDF');
  }
  const folder = `lms/certificates/${courseId || 'general'}`;
  // Use uploadFile with raw resource type for PDFs
  return uploadFile(
    { buffer: pdfBuffer, originalname: `${referenceNumber}.pdf`, mimetype: 'application/pdf' },
    { folder, resourceType: 'raw' },
  );
}

export async function uploadQRCode(
  qrBuffer: Buffer,
  referenceNumber: string,
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new ServiceUnavailableError('Cloudinary not configured — cannot upload QR code');
  }
  return uploadImage(
    { buffer: qrBuffer, originalname: `${referenceNumber}-qr.png`, mimetype: 'image/png' },
    { folder: `lms/certificates/qr`, width: 300, height: 300 },
  );
}

// ---------------------------------------------------------------------------
// Reference number + verification token generation
// ---------------------------------------------------------------------------

export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CERT-${year}-${random}`;
}

export function generateVerificationToken(): string {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
}
