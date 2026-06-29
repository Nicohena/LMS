import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(firstName: string, lastName?: string): string {
  // If only one argument is passed, treat it as a full name and split
  if (lastName === undefined) {
    const parts = firstName.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function getAvatarColor(role: string): string {
  const colors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-600',
    TEACHER: 'bg-indigo-100 text-indigo-600',
    STUDENT: 'bg-emerald-100 text-emerald-600',
  };
  return colors[role] || 'bg-slate-100 text-slate-600';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PUBLISHED: 'bg-emerald-100 text-emerald-700',
    DRAFT: 'bg-slate-100 text-slate-600',
    ARCHIVED: 'bg-red-100 text-red-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    DROPPED: 'bg-red-100 text-red-700',
    PENDING: 'bg-amber-100 text-amber-700',
    GRADED: 'bg-emerald-100 text-emerald-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    LATE: 'bg-amber-100 text-amber-700',
    NOT_SUBMITTED: 'bg-slate-100 text-slate-600',
    REVISION_REQUESTED: 'bg-amber-100 text-amber-700',
    ISSUED: 'bg-emerald-100 text-emerald-700',
    REVOKED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-slate-100 text-slate-600',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
}
