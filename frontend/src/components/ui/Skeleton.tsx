import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block animate-pulse rounded-lg bg-slate-200', className)}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4 border-b border-slate-50 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-4 flex-1 ${j > 0 ? 'opacity-80' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-2.5 w-32" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

export function PageError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-700 mb-1">Something went wrong</p>
      <p className="text-xs text-slate-500 mb-4 max-w-xs">{message ?? 'Failed to load data from server.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
