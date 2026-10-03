'use client';

import { useState, useRef } from 'react';
import { useSamples, useBarcodeScanner } from '@/hooks';
import { samplesService } from '@/lib/services/samples.service';
import { formatDateTime, patientFullName } from '@/lib/utils';
import { SampleStatusBadge } from '@/components/ui/Badge';
import { TableSkeleton, PageError } from '@/components/ui/Skeleton';
import { TestTube, CheckCircle2, XCircle, Barcode, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SamplesPage() {
  const { data, isLoading, error, refetch } = useSamples();
  const { result: scannedSample, isLoading: scanning, error: scanError, lookup } = useBarcodeScanner();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const samples = data?.data ?? [];

  const doAction = async (
    label: string,
    action: () => Promise<unknown>
  ) => {
    setActionLoading(label);
    try {
      await action();
      toast.success(`${label} successfully!`);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? `Failed: ${label}`;
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pending Collection', value: samples.filter((s) => s.status === 'pending_collection').length, color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Collected', value: samples.filter((s) => s.status === 'collected').length, color: 'bg-blue-50 border-blue-200 text-blue-800' },
          { label: 'Accepted', value: samples.filter((s) => s.status === 'accepted').length, color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
          { label: 'Processed', value: samples.filter((s) => s.status === 'processed').length, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border p-4 ${color}`}>
            {isLoading ? <div className="h-7 bg-current/10 rounded animate-pulse w-10 mb-1" /> : <p className="text-2xl font-bold tabular-nums">{value}</p>}
            <p className="text-sm font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Barcode scanner */}
      <div className={`border rounded-2xl p-4 flex items-center gap-3 transition-colors ${scanError ? 'bg-red-50 border-red-200' : scannedSample ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
        <Barcode size={18} className={scanError ? 'text-red-500' : scannedSample ? 'text-emerald-600' : 'text-indigo-600'} />
        <div className="flex-1">
          <input
            ref={barcodeRef}
            id="barcode-scanner-input"
            type="text"
            placeholder="Scan or type barcode (e.g. LCP-2026-001-001)…"
            className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                lookup((e.target as HTMLInputElement).value.trim());
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>
        {scanning && <Loader2 size={16} className="text-indigo-500 animate-spin" />}
        {scannedSample && !scanning && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <CheckCircle2 size={14} />
            Found: {patientFullName(scannedSample.patient)} — {scannedSample.sampleType}
          </div>
        )}
        {scanError && !scanning && (
          <div className="flex items-center gap-1.5 text-xs text-red-700">
            <AlertTriangle size={13} />
            {scanError}
          </div>
        )}
        {!scanning && !scannedSample && !scanError && (
          <span className="text-xs text-slate-400">Press Enter to look up</span>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Barcode</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Patient</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Order</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Sample Type</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Collected At</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {samples.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">No samples found.</td>
                </tr>
              ) : (
                samples.map((sample) => (
                  <tr key={sample._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <TestTube size={13} className="text-slate-400" />
                        <span className="text-xs font-mono font-semibold text-slate-700">{sample.barcode}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-900">{patientFullName(sample.patient)}</p>
                      <p className="text-xs text-slate-500 font-mono">{sample.patient.patientId}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/orders/${sample.order._id}`} className="text-xs font-mono text-indigo-600 hover:text-indigo-700">
                        {sample.order.orderId}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-700">{sample.sampleType}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <SampleStatusBadge status={sample.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">{sample.collectedAt ? formatDateTime(sample.collectedAt) : '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {sample.status === 'pending_collection' && (
                          <button
                            onClick={() => doAction(`Collect ${sample.barcode}`, () => samplesService.collect(sample._id))}
                            disabled={actionLoading === `Collect ${sample.barcode}`}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `Collect ${sample.barcode}` ? <Loader2 size={11} className="animate-spin" /> : <TestTube size={11} />}
                            Collect
                          </button>
                        )}
                        {sample.status === 'collected' && (
                          <>
                            <button
                              onClick={() => doAction(`Accept ${sample.barcode}`, () => samplesService.accept(sample._id))}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actionLoading === `Accept ${sample.barcode}` ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                const reason = window.prompt('Enter rejection reason:');
                                if (!reason?.trim()) return;
                                doAction(`Reject ${sample.barcode}`, () => samplesService.reject(sample._id, reason));
                              }}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actionLoading === `Reject ${sample.barcode}` ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
