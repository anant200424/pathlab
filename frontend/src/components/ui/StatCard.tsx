import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue' | 'violet';
}

const COLOR_MAP = {
  indigo: { icon: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
  amber: { icon: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
  rose: { icon: 'bg-rose-50 text-rose-600', border: 'border-rose-100' },
  blue: { icon: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
  violet: { icon: 'bg-violet-50 text-violet-600', border: 'border-violet-100' },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'indigo' }: StatCardProps) {
  const colors = COLOR_MAP[color];
  return (
    <div className={cn(
      'bg-white rounded-xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0',
      colors.border
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums truncate">{value}</p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'text-[10px] sm:text-xs font-medium mt-1 sm:mt-2 truncate',
              trend.positive ? 'text-emerald-600' : 'text-red-500'
            )}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0', colors.icon)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}
