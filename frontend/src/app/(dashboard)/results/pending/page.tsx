'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePendingVerificationOrders, useOrderResults } from '@/hooks';
import { resultsService } from '@/lib/services/results.service';
import { formatDateTime, patientFullName } from '@/lib/utils';
import { PriorityBadge, ResultFlagBadge } from '@/components/ui/Badge';
import { PageError } from '@/components/ui/Skeleton';
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ResultFlag } from '@/types';

function OrderResultsSummary({ orderId }: { orderId: string }) {
  const { data: resultsData } = useOrderResults(orderId);
  const results = resultsData ?? [];
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
      {results.map((result) => (
        <div key={result._id} className="text-xs">
          <p className="font-medium text-slate-700 mb-1">{result.test.name}</p>
          {result.parameters.map((p, pIdx) => (
            <div key={pIdx} className="flex items-center justify-between text-slate-500">
              <span>{p.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-slate-700">{p.value} {p.unit}</span>
                {p.flag && p.flag !== 'normal' && <ResultFlagBadge flag={p.flag as ResultFlag} />}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function VerificationQueuePage() {
  const { data, isLoading, error, refetch } = usePendingVerificationOrders();
  const [verifyingAll, setVerifyingAll] = useState<string | null>(null);

  const pendingOrders = data?.data ?? [];

  const handleVerifyAll = async (orderId: string) => {
    setVerifyingAll(orderId);
    try {
      // Get all pending results for this order and verify them
      const results = await resultsService.getByOrder(orderId);
      const enteredResults = results.filter((r) => r.status === 'entered');
      await Promise.all(enteredResults.map((r) => resultsService.verify(r._id)));
      toast.success(`All ${enteredResults.length} results verified!`);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to verify results';
      toast.error(msg);
    } finally {
      setVerifyingAll(null);
    }
  };

  const hasCritical = (orderId: string, results: typeof pendingOrders) => false; // evaluated per-order via child

  if (error) return <PageError message={error} onRetry={refetch} />;

  const totalOrders = pendingOrders.length;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Pending Verification',
            value: isLoading ? '…' : totalOrders,
            color: 'bg-amber-50 border-amber-200 text-amber-800',
          },
          {
            label: 'STAT Orders',
            value: isLoading ? '…' : pendingOrders.filter((o) => o.priority === 'stat').length,
            color: 'bg-red-50 border-red-200 text-red-800',
          },
          {
            label: 'Urgent Orders',
            value: isLoading ? '…' : pendingOrders.filter((o) => o.priority === 'urgent').length,
            color: 'bg-orange-50 border-orange-200 text-orange-800',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border p-4 ${color}`}>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-sm font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Queue */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="h-4 bg-slate-100 rounded w-48" />
                  <div className="h-3 bg-slate-100 rounded w-64" />
                </div>
                <div className="h-8 bg-slate-100 rounded-xl w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : pendingOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center">
          <CheckCircle2 size={40} className="text-emerald-300 mx-auto mb-4" />
          <p className="text-base font-semibold text-slate-700">All caught up!</p>
          <p className="text-sm text-slate-400 mt-1">No orders awaiting verification.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {order.priority === 'stat' && <AlertTriangle size={14} className="text-red-500" />}
                    <h3 className="text-sm font-bold text-slate-900">{patientFullName(order.patient)}</h3>
                    <span className="text-xs font-mono text-slate-500">{order.patient.patientId}</span>
                    <PriorityBadge priority={order.priority} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {order.orderId} · {order.orderedTests.length} test{order.orderedTests.length !== 1 ? 's' : ''} · {order.clinic.name.replace('LabCare Pro — ', '')}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Order created {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleVerifyAll(order._id)}
                    disabled={verifyingAll === order._id}
                    className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-medium border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {verifyingAll === order._id ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={11} />
                    )}
                    Verify All
                  </button>
                  <Link
                    href={`/results/${order._id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-colors shadow-sm ${
                      order.priority === 'stat'
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                    }`}
                  >
                    <ClipboardList size={13} />
                    Review Results
                  </Link>
                </div>
              </div>

              {/* Live results summary from API */}
              <OrderResultsSummary orderId={order._id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
