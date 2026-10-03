'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import { useReport, useOrderResults } from '@/hooks';
import { useOrder } from '@/hooks';
import { formatCurrency, formatDateTime, patientFullName } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { ResultFlagBadge } from '@/components/ui/Badge';
import { reportsService } from '@/lib/services/reports.service';
import { Skeleton, PageError } from '@/components/ui/Skeleton';
import { FileText, Download, Printer, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { ResultFlag } from '@/types';

export default function ReportViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const reportQuery = useReport(id);
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null);
  const [printing, setPrinting] = useState(false);

  const report = reportQuery.data;

  // Fetch associated order + results
  const orderQuery = useOrder(report?.order._id ?? '');
  const resultsQuery = useOrderResults(report?.order._id ?? '');

  const order = orderQuery.data;
  const results = resultsQuery.data ?? [];

  if (reportQuery.error) return <PageError message={reportQuery.error} onRetry={reportQuery.refetch} />;
  if (!reportQuery.isLoading && !report) notFound();

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!report) return;
    setDownloading(format);
    try {
      await reportsService.download(report._id, format);
    } catch {
      toast.error(`Failed to download ${format.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  };

  const handlePrint = () => {
    if (!report) return;
    const printUrl = reportsService.getPrintUrl(report.order?._id || report._id);
    window.open(printUrl, '_blank');
  };

  return (
    <div className="max-w-4xl space-y-5">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <Link href="/reports" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Back to Reports
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <Printer size={13} /> Print
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloading === 'pdf'}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-60"
          >
            {downloading === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            PDF
          </button>
          <button
            onClick={() => handleDownload('docx')}
            disabled={downloading === 'docx'}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-60"
          >
            {downloading === 'docx' ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
            DOCX
          </button>
        </div>
      </div>

      {/* Report document */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-8 py-6 text-white">
          {reportQuery.isLoading ? (
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-6 bg-white/20 rounded w-36 animate-pulse" />
                <div className="h-3 bg-white/10 rounded w-48 animate-pulse" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 bg-white/20 rounded w-32 animate-pulse" />
                <div className="h-3 bg-white/10 rounded w-24 animate-pulse" />
              </div>
            </div>
          ) : report ? (
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <FileText size={16} className="text-white" />
                  </div>
                  <span className="text-lg font-bold">LabCare Pro</span>
                </div>
                <p className="text-indigo-200 text-sm">Laboratory Test Report</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{report.order.orderId}</p>
                <p className="text-indigo-200 text-xs mt-0.5">
                  Version {report.version} · {report.status.toUpperCase()}
                </p>
                {report.publishedAt && (
                  <p className="text-indigo-200 text-xs mt-0.5">
                    Published {formatDateTime(report.publishedAt)}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Patient + Order info */}
        {reportQuery.isLoading ? (
          <div className="grid grid-cols-2 border-b border-slate-100">
            {[0, 1].map((i) => (
              <div key={i} className={`px-8 py-5 space-y-2 ${i === 0 ? 'border-r border-slate-100' : ''}`}>
                <div className="h-3 bg-slate-100 rounded w-24 animate-pulse" />
                <div className="h-5 bg-slate-100 rounded w-40 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>
        ) : report ? (
          <div className="grid grid-cols-2 gap-0 border-b border-slate-100">
            <div className="px-8 py-5 border-r border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Patient Information</h3>
              <p className="text-base font-bold text-slate-900">{patientFullName(report.patient)}</p>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{report.patient.patientId}</p>
              {order && (
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  {order.referringDoctor && (
                    <p>Referred by: <span className="font-medium">{order.referringDoctor.displayName}</span></p>
                  )}
                  <p>Clinic: <span className="font-medium">{order.clinic.name.replace('LabCare Pro — ', '')}</span></p>
                </div>
              )}
            </div>
            <div className="px-8 py-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Order Information</h3>
              {order && (
                <div className="space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p>Order Date: <span className="font-medium">{formatDateTime(order.createdAt)}</span></p>
                  <p>Tests: <span className="font-medium">{order.orderedTests.length} test{order.orderedTests.length !== 1 ? 's' : ''}</span></p>
                  <p>Total Amount: <span className="font-semibold">{formatCurrency(order.netAmount)}</span></p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Results */}
        <div className="px-8 py-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Test Results</h3>
          {resultsQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-48 animate-pulse" />
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-3 bg-slate-100 rounded w-32 animate-pulse" />
                      <div className="h-3 bg-slate-100 rounded w-24 animate-pulse" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No results available for this report.</p>
          ) : (
            <div className="space-y-6">
              {results.map((result) => (
                <div key={result._id}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-indigo-700 border-b-2 border-indigo-200 pb-1">
                      {result.test.name}
                      <span className="ml-2 text-xs font-mono text-slate-500 font-normal">[{result.test.code}]</span>
                    </h4>
                    {result.verifiedBy && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                        <CheckCircle2 size={12} />
                        Verified by {result.verifiedBy.firstName} {result.verifiedBy.lastName}
                      </div>
                    )}
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border border-slate-200">
                        <th className="text-left text-xs font-semibold text-slate-600 px-4 py-2">Parameter</th>
                        <th className="text-right text-xs font-semibold text-slate-600 px-4 py-2">Result</th>
                        <th className="text-center text-xs font-semibold text-slate-600 px-4 py-2">Unit</th>
                        <th className="text-center text-xs font-semibold text-slate-600 px-4 py-2">Reference Range</th>
                        <th className="text-center text-xs font-semibold text-slate-600 px-4 py-2">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.parameters.map((param, pIdx) => (
                        <tr
                          key={pIdx}
                          className={`border-b border-slate-100 ${
                            param.flag === 'critical_high' || param.flag === 'critical_low'
                              ? 'bg-red-50'
                              : param.flag === 'abnormal_high' || param.flag === 'abnormal_low'
                              ? 'bg-amber-50/40'
                              : ''
                          }`}
                        >
                          <td className="text-sm text-slate-700 px-4 py-2.5 font-medium">{param.name}</td>
                          <td className={`text-right px-4 py-2.5 font-bold font-mono text-sm ${
                            param.flag === 'critical_high' || param.flag === 'critical_low' ? 'text-red-700' :
                            param.flag === 'abnormal_high' || param.flag === 'abnormal_low' ? 'text-amber-700' :
                            'text-slate-900'
                          }`}>
                            {param.value}
                          </td>
                          <td className="text-center text-sm text-slate-500 px-4 py-2.5">{param.unit}</td>
                          <td className="text-center text-sm text-slate-500 px-4 py-2.5 font-mono">{param.referenceRange}</td>
                          <td className="text-center px-4 py-2.5">
                            {param.flag
                              ? <ResultFlagBadge flag={param.flag as ResultFlag} />
                              : <span className="text-emerald-600 text-xs">Normal</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center">
          This report is electronically generated and verified. For queries contact support@labcarepro.com
          {report && ` · Generated ${formatDateTime(report.generatedAt)}`}
        </div>
      </div>
    </div>
  );
}
