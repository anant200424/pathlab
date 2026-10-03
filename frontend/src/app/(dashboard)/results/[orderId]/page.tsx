'use client';

import { notFound } from 'next/navigation';
import { use, useState } from 'react';
import { useOrder, useOrderResults } from '@/hooks';
import { resultsService, type EnterResultPayload } from '@/lib/services/results.service';
import { formatDateTime, patientFullName } from '@/lib/utils';
import { ResultFlagBadge, } from '@/components/ui/Badge';
import { Skeleton, PageError } from '@/components/ui/Skeleton';
import { ArrowLeft, CheckCircle2, XCircle, Save, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { ResultFlag } from '@/types';
import { useRef } from 'react';

export default function ResultEntryPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const orderQuery = useOrder(orderId);
  const resultsQuery = useOrderResults(orderId);
  const [saving, setSaving] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  // Track edited parameter values by result._id → param name → value
  const editedValues = useRef<Record<string, Record<string, string>>>({});

  const order = orderQuery.data;
  const results = resultsQuery.data ?? [];

  if (orderQuery.error) return <PageError message={orderQuery.error} onRetry={orderQuery.refetch} />;
  if (!orderQuery.isLoading && !order) notFound();

  const hasCritical = results.some((r) =>
    r.parameters.some((p) => p.flag === 'critical_high' || p.flag === 'critical_low')
  );

  const handleSave = async (resultId: string) => {
    setSaving(resultId);
    try {
      const result = results.find((r) => r._id === resultId);
      if (!result) return;
      const edits = editedValues.current[resultId] ?? {};
      const payload: EnterResultPayload = {
        parameters: result.parameters.map((p) => ({
          name: p.name,
          value: edits[p.name] !== undefined ? edits[p.name] : (p.value ?? ''),
          unit: p.unit,
          flag: p.flag as ResultFlag,
        })),
      };
      await resultsService.enter(resultId, payload);
      toast.success('Results saved successfully!');
      resultsQuery.refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save results';
      toast.error(msg);
    } finally {
      setSaving(null);
    }
  };

  const handleVerify = async (resultId: string) => {
    setVerifying(resultId);
    try {
      await resultsService.verify(resultId);
      toast.success('Result verified and signed off!');
      resultsQuery.refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to verify result';
      toast.error(msg);
    } finally {
      setVerifying(null);
    }
  };

  const handleReject = async (resultId: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason?.trim()) return;
    setRejecting(resultId);
    try {
      await resultsService.reject(resultId, reason);
      toast.success('Result rejected — sent for re-testing');
      resultsQuery.refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to reject result';
      toast.error(msg);
    } finally {
      setRejecting(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <Link href={`/orders/${orderId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft size={14} /> Back to Order {order?.orderId ?? '…'}
      </Link>

      {/* Patient header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        {orderQuery.isLoading ? (
          <div className="flex items-center justify-between">
            <div className="space-y-1.5"><Skeleton className="h-5 w-48" /><Skeleton className="h-3 w-32" /></div>
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
        ) : order ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">{patientFullName(order.patient)}</h2>
              <p className="text-sm text-slate-500">{order.patient.patientId} · {order.orderId}</p>
            </div>
            <div className="flex items-center gap-2">
              {hasCritical && (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
                  <AlertTriangle size={13} />
                  <span className="text-xs font-semibold">CRITICAL VALUES</span>
                </div>
              )}
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                {resultsQuery.isLoading ? '…' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Results */}
      {resultsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <Skeleton className="h-5 w-48" />
              {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center">
          <p className="text-sm text-slate-400">No results available for this order yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => {
            if (!editedValues.current[result._id]) editedValues.current[result._id] = {};
            const hasCriticalParam = result.parameters.some((p) => p.flag === 'critical_high' || p.flag === 'critical_low');
            return (
              <div key={result._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${hasCriticalParam ? 'border-red-200' : 'border-slate-200'}`}>
                {/* Test header */}
                <div className={`flex items-center justify-between px-5 py-4 border-b ${hasCriticalParam ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{result.test.name}</h3>
                      <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">{result.test.code}</span>
                      {hasCriticalParam && <AlertTriangle size={13} className="text-red-500" />}
                    </div>
                    {result.enteredBy && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Entered by {result.enteredBy.firstName} {result.enteredBy.lastName} · {formatDateTime(result.enteredAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : result.status === 'entered' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                      {result.status}
                    </span>
                    {result.status === 'entered' && (
                      <button
                        onClick={() => handleVerify(result._id)}
                        disabled={verifying === result._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-60"
                      >
                        {verifying === result._id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                        Verify
                      </button>
                    )}
                  </div>
                </div>

                {/* Parameters */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Parameter</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Value</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Unit</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Reference Range</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {result.parameters.map((param, pIdx) => (
                        <tr key={pIdx} className={`${param.flag === 'critical_high' || param.flag === 'critical_low' ? 'bg-red-50/50' : param.flag === 'abnormal_high' || param.flag === 'abnormal_low' ? 'bg-amber-50/40' : ''}`}>
                          <td className="px-5 py-3 text-sm text-slate-700 font-medium">{param.name}</td>
                          <td className="px-5 py-3">
                            <input
                              type="text"
                              defaultValue={param.value?.toString() ?? ''}
                              onChange={(e) => {
                                if (!editedValues.current[result._id]) editedValues.current[result._id] = {};
                                editedValues.current[result._id][param.name] = e.target.value;
                              }}
                              disabled={result.status === 'verified'}
                              className={`w-24 px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-mono font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${
                                param.flag === 'critical_high' || param.flag === 'critical_low' ? 'border-red-300 bg-red-50 text-red-700' :
                                param.flag === 'abnormal_high' || param.flag === 'abnormal_low' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                                'border-slate-200 bg-slate-50 text-slate-800'
                              }`}
                            />
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-500">{param.unit}</td>
                          <td className="px-5 py-3 text-sm text-slate-500 font-mono">{param.referenceRange}</td>
                          <td className="px-5 py-3">
                            {param.flag ? <ResultFlagBadge flag={param.flag as ResultFlag} /> : <span className="text-xs text-slate-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                {result.status !== 'verified' && (
                  <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => handleReject(result._id)}
                      disabled={rejecting === result._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 text-slate-600 hover:bg-white rounded-lg transition-colors disabled:opacity-60"
                    >
                      {rejecting === result._id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                      Reject
                    </button>
                    <button
                      onClick={() => handleSave(result._id)}
                      disabled={saving === result._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-60"
                    >
                      {saving === result._id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                      Save Results
                    </button>
                  </div>
                )}
                {result.status === 'verified' && result.verifiedBy && (
                  <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-t border-emerald-100">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <p className="text-xs text-emerald-700">
                      Verified by {result.verifiedBy.firstName} {result.verifiedBy.lastName} · {formatDateTime(result.verifiedAt)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
