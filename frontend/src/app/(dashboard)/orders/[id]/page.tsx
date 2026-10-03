'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import { useOrder, useOrderResults } from '@/hooks';
import { formatCurrency, formatDateTime, patientFullName, ORDER_STATUS_STEPS, getOrderStatusStep, ORDER_STATUS_CONFIG } from '@/lib/utils';
import { OrderStatusBadge, PriorityBadge, ResultFlagBadge } from '@/components/ui/Badge';
import { Skeleton, PageError } from '@/components/ui/Skeleton';
import { ordersService } from '@/lib/services/orders.service';
import { reportsService } from '@/lib/services/reports.service';
import { SelectToPrintModal } from '@/components/ui/SelectToPrintModal';
import { ArrowLeft, CheckCircle2, Clock, Printer, Download, FileText, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { OrderStatus, ResultFlag } from '@/types';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderQuery = useOrder(id);
  const resultsQuery = useOrderResults(id);
  const [advancing, setAdvancing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const order = orderQuery.data;
  const results = resultsQuery.data ?? [];

  if (orderQuery.error) return <PageError message={orderQuery.error} onRetry={orderQuery.refetch} />;
  if (!orderQuery.isLoading && !order) notFound();

  const currentStep = order ? getOrderStatusStep(order.status) : 0;

  const handleAdvanceStatus = async () => {
    if (!order) return;
    const nextStatus = ORDER_STATUS_STEPS[currentStep + 1] as OrderStatus;
    setAdvancing(true);
    try {
      await ordersService.advanceStatus(order._id, nextStatus);
      toast.success(`Status advanced to: ${ORDER_STATUS_CONFIG[nextStatus].label}`);
      orderQuery.refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to advance status';
      toast.error(msg);
    } finally {
      setAdvancing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!order) return;
    setGenerating(true);
    try {
      const report = await reportsService.generate(order._id);
      toast.success('Report generated successfully!');
      orderQuery.refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to generate report';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!order) return;
    setDownloading(true);
    try {
      // We need the report ID first — for now open via window
      const url = reportsService.getDownloadUrl(order._id, format);
      window.open(url, '_blank');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/orders" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Back to Orders
        </Link>
        <div className="flex items-center gap-2">
          {order && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-blue-200 cursor-pointer"
            >
              <Printer size={14} /> Print Report Slip
            </button>
          )}
          <button
            onClick={() => order && window.open(`/print/slip/${order._id}?format=MAIN`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
          >
            <Download size={13} /> Quick Slip (MAIN)
          </button>
          {order?.status === 'verified' && (
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              Generate Report
            </button>
          )}
          {order?.status === 'published' && (
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm shadow-indigo-200"
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Download Report
            </button>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        {orderQuery.isLoading ? (
          <div className="space-y-3">
            <div className="flex gap-3"><Skeleton className="h-6 w-36" /><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-24 rounded-full" /></div>
            <Skeleton className="h-3 w-48" />
            <div className="flex justify-between mt-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="flex flex-col items-center gap-1"><Skeleton className="w-7 h-7 rounded-full" /><Skeleton className="h-2 w-12" /></div>)}</div>
          </div>
        ) : order ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-slate-900">{order.orderId}</h2>
                  <PriorityBadge priority={order.priority} />
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">Created {formatDateTime(order.createdAt)}</p>
              </div>
              {currentStep < ORDER_STATUS_STEPS.length - 1 && (
                <button
                  onClick={handleAdvanceStatus}
                  disabled={advancing}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl transition-colors shadow-sm"
                >
                  {advancing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Advance Status
                </button>
              )}
            </div>
            <div className="relative">
              <div className="flex items-center justify-between relative">
                {ORDER_STATUS_STEPS.map((step, idx) => {
                  const cfg = ORDER_STATUS_CONFIG[step as OrderStatus];
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 transition-all ${isDone ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'} ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}>
                        {isDone ? <CheckCircle2 size={13} className="text-white" /> : <Clock size={11} className="text-slate-300" />}
                      </div>
                      <p className={`text-[10px] mt-1.5 text-center font-medium ${isDone ? 'text-indigo-700' : 'text-slate-400'}`}>{cfg.label}</p>
                      {idx < ORDER_STATUS_STEPS.length - 1 && (
                        <div className={`absolute top-3.5 h-0.5 transition-all ${idx < currentStep ? 'bg-indigo-600' : 'bg-slate-200'}`}
                          style={{ left: `calc(${(idx / (ORDER_STATUS_STEPS.length - 1)) * 100}% + 14px)`, width: `calc(${(1 / (ORDER_STATUS_STEPS.length - 1)) * 100}% - 28px)` }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {order && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Patient</h3>
              <Link href={`/patients/${order.patient._id}`} className="font-medium text-sm text-indigo-600 hover:text-indigo-700">
                {patientFullName(order.patient)}
              </Link>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{order.patient.patientId}</p>
            </div>
            {order.referringDoctor && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Referring Doctor</h3>
                <p className="text-sm font-medium text-slate-800">{order.referringDoctor.displayName}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Billing</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="text-slate-700">{formatCurrency(order.totalAmount)}</span></div>
                {order.discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Discount</span><span className="text-emerald-600">-{formatCurrency(order.discountAmount)}</span></div>}
                <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-2 mt-2"><span className="text-slate-900">Net Amount</span><span className="text-slate-900">{formatCurrency(order.netAmount)}</span></div>
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-900">Tests Ordered</h3></div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Test</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Code</th>
                    <th className="text-right text-xs font-medium text-slate-500 px-5 py-2.5">Price</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.orderedTests.map((ot, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-slate-800">{ot.test.name}</td>
                      <td className="px-5 py-3"><span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{ot.test.code}</span></td>
                      <td className="px-5 py-3 text-right text-sm text-slate-700">{formatCurrency(ot.price)}</td>
                      <td className="px-5 py-3"><span className="text-xs capitalize text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{ot.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {results.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Results</h3>
                  <Link href={`/results/${order._id}`} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                    <FileText size={12} /> Enter / Review Results
                  </Link>
                </div>
                <div className="divide-y divide-slate-50">
                  {(results as import('@/types').Result[]).map((result) => (
                    <div key={result._id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-800">{result.test.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : result.status === 'entered' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {result.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {result.parameters.map((param: import('@/types').ResultParameter, pIdx: number) => (
                          <div key={pIdx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{param.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-800 font-medium">{param.value} {param.unit}</span>
                              <span className="text-xs text-slate-400">{param.referenceRange}</span>
                              {param.flag && param.flag !== 'normal' && <ResultFlagBadge flag={param.flag as ResultFlag} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Select to Print Modal (Screenshot 3) */}
      {order && (
        <SelectToPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          orderId={order._id}
          orderNumber={order.orderId}
          defaultFormat="MAIN"
          tests={(order.orderedTests || []).map((ot: any) => ({
            id: ot.test?._id || ot._id,
            name: ot.test?.name || ot.name || 'Clinical Test',
            code: ot.test?.code || ot.testCode,
          }))}
          onConfirmPrint={(selectedTestIds, format) => {
            setIsPrintModalOpen(false);
            const query = selectedTestIds.join(',');
            const url = `/print/slip/${order._id}?format=${format}&tests=${query}`;
            window.open(url, '_blank');
          }}
        />
      )}
    </div>
  );
}
