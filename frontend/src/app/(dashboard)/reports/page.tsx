'use client';

import { useState } from 'react';
import { useReports } from '@/hooks';
import { formatDateTime, patientFullName } from '@/lib/utils';
import { reportsService } from '@/lib/services/reports.service';
import { PageError, TableSkeleton } from '@/components/ui/Skeleton';
import { FileText, Eye, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { data, isLoading, error, refetch } = useReports();
  const [downloading, setDownloading] = useState<string | null>(null);

  const reports = data?.data ?? [];
  const total = (data?.pagination as { total?: number })?.total ?? 0;

  const handleDownload = async (id: string, format: 'pdf' | 'docx') => {
    setDownloading(`${id}-${format}`);
    try {
      await reportsService.download(id, format);
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">{isLoading ? '…' : `${total} reports generated`}</p>

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Patient</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Order ID</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Version</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Generated</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Published</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <FileText size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No reports generated yet.</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-900">{patientFullName(report.patient)}</p>
                      <p className="text-xs font-mono text-slate-500">{report.patient.patientId}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {report.order.orderId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        report.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : report.status === 'draft'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-700">v{report.version}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">{formatDateTime(report.generatedAt)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">
                        {report.publishedAt ? formatDateTime(report.publishedAt) : '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/reports/${report._id}`}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          <Eye size={12} /> View
                        </Link>
                        <button
                          onClick={() => handleDownload(report._id, 'pdf')}
                          disabled={downloading === `${report._id}-pdf`}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
                        >
                          {downloading === `${report._id}-pdf`
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Download size={12} />}
                          PDF
                        </button>
                        <button
                          onClick={() => handleDownload(report._id, 'docx')}
                          disabled={downloading === `${report._id}-docx`}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
                        >
                          {downloading === `${report._id}-docx`
                            ? <Loader2 size={12} className="animate-spin" />
                            : <FileText size={12} />}
                          DOCX
                        </button>
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
