import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { OrderStatus, Priority, ResultFlag, InvoiceStatus, SampleStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm a');
  } catch {
    return '—';
  }
}

export function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function calcAge(dateOfBirth: string): string {
  try {
    const dob = parseISO(dateOfBirth);
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const months = today.getMonth() - dob.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
      years--;
    }
    return `${years} yrs`;
  } catch {
    return '—';
  }
}

// ─── Currency formatting ──────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Status labels & colors ───────────────────────────────────────────────────

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  draft:                  { label: 'Draft',                color: 'text-slate-600',   bg: 'bg-slate-100' },
  registered:             { label: 'Registered',           color: 'text-blue-600',    bg: 'bg-blue-50' },
  awaiting_sample:        { label: 'Awaiting Sample',      color: 'text-amber-600',   bg: 'bg-amber-50' },
  sample_collected:       { label: 'Sample Collected',     color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  processing:             { label: 'Processing',           color: 'text-violet-600',  bg: 'bg-violet-50' },
  awaiting_verification:  { label: 'Awaiting Verification',color: 'text-orange-600',  bg: 'bg-orange-50' },
  verified:               { label: 'Verified',             color: 'text-emerald-600', bg: 'bg-emerald-50' },
  published:              { label: 'Published',            color: 'text-green-700',   bg: 'bg-green-50' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  routine: { label: 'Routine', color: 'text-slate-600',  bg: 'bg-slate-100' },
  urgent:  { label: 'Urgent',  color: 'text-amber-700',  bg: 'bg-amber-100' },
  stat:    { label: 'STAT',    color: 'text-red-700',    bg: 'bg-red-100' },
};

export const RESULT_FLAG_CONFIG: Record<ResultFlag, { label: string; color: string }> = {
  normal:         { label: 'Normal',        color: 'text-emerald-600' },
  abnormal_low:   { label: 'Low ↓',         color: 'text-amber-600' },
  abnormal_high:  { label: 'High ↑',        color: 'text-orange-600' },
  critical_low:   { label: 'Critical Low ↓↓',  color: 'text-red-700' },
  critical_high:  { label: 'Critical High ↑↑', color: 'text-red-700' },
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  unpaid:   { label: 'Unpaid',   color: 'text-red-600',     bg: 'bg-red-50' },
  partial:  { label: 'Partial',  color: 'text-amber-600',   bg: 'bg-amber-50' },
  paid:     { label: 'Paid',     color: 'text-emerald-600', bg: 'bg-emerald-50' },
  refunded: { label: 'Refunded', color: 'text-slate-600',   bg: 'bg-slate-100' },
};

export const SAMPLE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending_collection: { label: 'Pending Collection', color: 'text-slate-600',   bg: 'bg-slate-100' },
  pending:            { label: 'Pending',            color: 'text-slate-600',   bg: 'bg-slate-100' },
  collected:          { label: 'Collected',           color: 'text-blue-600',    bg: 'bg-blue-50' },
  accepted:           { label: 'Accepted',            color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  rejected:           { label: 'Rejected',            color: 'text-red-600',     bg: 'bg-red-50' },
  processing:         { label: 'Processing',          color: 'text-violet-600',  bg: 'bg-violet-50' },
  processed:          { label: 'Processed',           color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

// ─── Permission checker ───────────────────────────────────────────────────────

export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes('*') || userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((p) => hasPermission(userPermissions, p));
}

// ─── Patient display ──────────────────────────────────────────────────────────

export function patientFullName(
  patient?: { firstName?: string; lastName?: string; fullName?: string; name?: string } | string | null
): string {
  if (!patient) return 'Unknown Patient';
  if (typeof patient === 'string') return patient;
  if (patient.fullName) return patient.fullName;
  if (patient.firstName || patient.lastName) {
    return `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || 'Unknown Patient';
  }
  if (patient.name) return patient.name;
  return 'Unknown Patient';
}

// ─── Order status machine ─────────────────────────────────────────────────────

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'draft',
  'registered',
  'awaiting_sample',
  'sample_collected',
  'processing',
  'awaiting_verification',
  'verified',
  'published',
];

export function getOrderStatusStep(status: OrderStatus): number {
  return ORDER_STATUS_STEPS.indexOf(status);
}
