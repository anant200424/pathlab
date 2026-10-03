import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-700',
  info:    'bg-blue-50 text-blue-700',
  purple:  'bg-violet-50 text-violet-700',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Status badge using utils config ─────────────────────────────────────────

import type { OrderStatus, Priority, ResultFlag, InvoiceStatus, SampleStatus } from '@/types';
import {
  ORDER_STATUS_CONFIG,
  PRIORITY_CONFIG,
  RESULT_FLAG_CONFIG,
  INVOICE_STATUS_CONFIG,
  SAMPLE_STATUS_CONFIG,
} from '@/lib/utils';

export function OrderStatusBadge({ status }: { status?: string | OrderStatus }) {
  const cfg = (ORDER_STATUS_CONFIG as any)[status as string] || {
    label: (status || 'Registered').replace(/_/g, ' '),
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', cfg.color, cfg.bg)}>
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority?: string | Priority }) {
  const cfg = (PRIORITY_CONFIG as any)[priority as string] || {
    label: priority || 'Routine',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tracking-wide capitalize', cfg.color, cfg.bg)}>
      {cfg.label}
    </span>
  );
}

export function ResultFlagBadge({ flag }: { flag?: string | ResultFlag }) {
  const cfg = (RESULT_FLAG_CONFIG as any)[flag as string] || {
    label: flag || 'Normal',
    color: 'text-emerald-600',
  };
  return (
    <span className={cn('text-xs font-semibold', cfg.color)}>
      {cfg.label}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status?: string | InvoiceStatus }) {
  const cfg = (INVOICE_STATUS_CONFIG as any)[status as string] || {
    label: (status || 'Unpaid').replace(/_/g, ' '),
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', cfg.color, cfg.bg)}>
      {cfg.label}
    </span>
  );
}

export function SampleStatusBadge({ status }: { status?: string | SampleStatus }) {
  const cfg = (SAMPLE_STATUS_CONFIG as any)[status as string] || {
    label: (status || 'Pending').replace(/_/g, ' '),
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', cfg.color, cfg.bg)}>
      {cfg.label}
    </span>
  );
}
