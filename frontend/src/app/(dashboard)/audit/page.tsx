'use client';

import { useState, useMemo } from 'react';
import { useAuditLog } from '@/hooks';
import { formatDateTime } from '@/lib/utils';
import { TableSkeleton, PageError } from '@/components/ui/Skeleton';
import { Shield, Search, User, Activity, Clock, Terminal } from 'lucide-react';

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch } = useAuditLog();

  const logs = useMemo(() => {
    return data?.data ?? [];
  }, [data]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      const actorName = log.actor ? `${log.actor.firstName || ''} ${log.actor.lastName || ''}` : '';
      return (
        (log.action && log.action.toLowerCase().includes(search.toLowerCase())) ||
        (log.entityType && log.entityType.toLowerCase().includes(search.toLowerCase())) ||
        actorName.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [logs, search]);

  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security & Audit Trails</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system logs tracking every user action, authentication event, and patient record modification.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter audit events by action, entity, user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Timestamp</th>
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Action Event</th>
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Entity</th>
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Performed By</th>
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any, idx: number) => {
                  const actorDisplay = log.actor
                    ? `${log.actor.firstName || ''} ${log.actor.lastName || ''}`.trim() || 'System'
                    : 'System Administrator';

                  return (
                    <tr key={log._id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                          <Clock size={12} className="text-slate-400" />
                          {formatDateTime(log.createdAt || log.timestamp)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
                          <Terminal size={11} /> {log.action}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-800">
                          {log.entityType || log.resource || 'Resource'}
                        </span>
                        {log.entityId && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {String(log.entityId).slice(-6)}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <User size={13} className="text-slate-400" />
                          {actorDisplay}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-500 truncate max-w-xs block font-mono">
                          {log.details ? JSON.stringify(log.details) : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
