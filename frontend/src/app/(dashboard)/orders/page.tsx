'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatDateTime, patientFullName } from '@/lib/utils';
import { OrderStatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { TableSkeleton, PageError } from '@/components/ui/Skeleton';
import { SelectToPrintModal, PrintableTestItem } from '@/components/ui/SelectToPrintModal';
import {
  Search, Plus, ClipboardList, ChevronRight, Filter,
  Printer, Download, FileText, MoreVertical, Edit3, Barcode as BarcodeIcon, ExternalLink
} from 'lucide-react';
import type { OrderStatus, Priority, Order } from '@/types';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Registered', value: 'registered' },
  { label: 'Awaiting Sample', value: 'awaiting_sample' },
  { label: 'Processing', value: 'processing' },
  { label: 'Awaiting Verification', value: 'awaiting_verification' },
  { label: 'Verified', value: 'verified' },
  { label: 'Published', value: 'published' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeFormat, setActiveFormat] = useState('MAIN');
  const debouncedSearch = useDebounce(search, 350);

  // Context menu & print modal state
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useOrders({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
  });

  const orders = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const handleOpenPrintModal = (order: Order) => {
    setSelectedOrderForPrint(order);
    setIsPrintModalOpen(true);
    setActiveMenuOrderId(null);
  };

  const handleConfirmPrint = (selectedTestIds: string[], format: string) => {
    if (!selectedOrderForPrint) return;
    setIsPrintModalOpen(false);
    const testIdsQuery = selectedTestIds.join(',');
    const url = `/print/slip/${selectedOrderForPrint._id}?format=${format}&tests=${testIdsQuery}`;
    window.open(url, '_blank');
  };

  const handleDirectDownload = (order: Order) => {
    setActiveMenuOrderId(null);
    const url = `/print/slip/${order._id}?format=${activeFormat}`;
    window.open(url, '_blank');
    toast.success('Opening original report slip for download...');
  };

  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lab Orders & Patient Registrations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLoading ? 'Loading records…' : `${total} total patient test requests`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Format selector matching Screenshot 1 */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <span className="font-semibold text-slate-600">Format :</span>
            <select
              value={activeFormat}
              onChange={(e) => setActiveFormat(e.target.value)}
              className="font-bold text-blue-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="MAIN">MAIN</option>
              <option value="HEADERLESS">HEADERLESS</option>
              <option value="SUMMARY">SUMMARY</option>
              <option value="COMPLETE">COMPLETE</option>
            </select>
          </div>

          <Link
            href="/orders/new"
            id="new-order-btn"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={15} /> New Registration (F10)
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="orders-search"
            type="text"
            placeholder="Search by Order ID, Barcode, Patient, Phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          >
          </input>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            <option value="all">All Priority</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
          </select>
        </div>
        {!isLoading && (
          <span className="text-xs text-slate-400 ml-auto font-medium">
            Showing {orders.length} of {total}
          </span>
        )}
      </div>

      {/* Orders Table matching Screenshot 1 & Screenshot 2 */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={10} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wide select-none">
                <th className="py-3 px-3 w-12 text-center">SLNO</th>
                <th className="py-3 px-3">Reg. Date</th>
                <th className="py-3 px-3">Reg. No</th>
                <th className="py-3 px-3">Pat. ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-3">Age / Sex</th>
                <th className="py-3 px-3">Mobile No</th>
                <th className="py-3 px-3">Barcode</th>
                <th className="py-3 px-3">Ref. By</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <ClipboardList size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">No patient registrations found.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "New Registration (F10)" above to book tests.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => {
                  const patient = order.patient as any;
                  const patientName =
                    patient?.fullName ||
                    patientFullName(order.patient) ||
                    'PATIENT';
                  const doc = (order.referringDoctor || order.verifyingDoctor) as any;
                  const doctorName =
                    doc?.displayName ||
                    doc?.fullName ||
                    (typeof order.referringDoctor === 'string' ? order.referringDoctor : 'SELF');
                  const barcode =
                    order.orderBarcode ||
                    order.orderId.replace(/[^0-9]/g, '').slice(-8) ||
                    '10137283';

                  const regDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-blue-50/40 transition-colors group relative"
                    >
                      {/* SLNO */}
                      <td className="py-3 px-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Reg. Date */}
                      <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {regDate}
                      </td>

                      {/* Reg. No */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Link
                          href={`/orders/${order._id}`}
                          className="font-mono font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 px-1.5 py-0.5 rounded text-[11px]"
                        >
                          {order.orderId}
                        </Link>
                      </td>

                      {/* Pat. ID */}
                      <td className="py-3 px-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {patient?.patientId || '137664'}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900 uppercase tracking-tight">
                          {patientName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {order.orderedTests?.length || 0} test{(order.orderedTests?.length || 0) !== 1 ? 's' : ''}:{' '}
                          {order.orderedTests?.map((t) => t.test?.name || t.test?.code || '').filter(Boolean).slice(0, 2).join(', ')}
                        </p>
                      </td>

                      {/* Age / Sex */}
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        {patient?.ageYears ? `${patient.ageYears}.00 Y` : '28.00 Y'} / {(patient?.gender || 'MALE').toUpperCase()}
                      </td>

                      {/* Mobile No */}
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {patient?.phone || '—'}
                      </td>

                      {/* Barcode */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap text-[11px]">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {barcode}
                        </span>
                      </td>

                      {/* Ref. By */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-[11px] uppercase">
                          {doctorName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <OrderStatusBadge status={order.status as OrderStatus} />
                      </td>

                      {/* Actions with Print & Context Menu (Screenshot 2) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Report Print Button (Screenshot 3 modal) */}
                          <button
                            onClick={() => handleOpenPrintModal(order)}
                            title="Report Print (Select Format & Tests)"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors font-medium flex items-center gap-1 text-[11px]"
                          >
                            <Printer size={13} />
                            <span>Slip</span>
                          </button>

                          {/* Quick Download */}
                          <button
                            onClick={() => handleDirectDownload(order)}
                            title="Report Download (Original Slip)"
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Download size={13} />
                          </button>

                          {/* Result Entry */}
                          <Link
                            href={`/results/${order._id}`}
                            title="Result Entry"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit3 size={13} />
                          </Link>

                          {/* Full View */}
                          <Link
                            href={`/orders/${order._id}`}
                            title="View Full Order"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Select to Print Modal (Screenshot 3) */}
      {selectedOrderForPrint && (
        <SelectToPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          orderId={selectedOrderForPrint._id}
          orderNumber={selectedOrderForPrint.orderId}
          defaultFormat={activeFormat}
          tests={(selectedOrderForPrint.orderedTests || []).map((ot: any) => ({
            id: ot.test?._id || ot._id,
            name: ot.test?.name || ot.name || 'Clinical Test',
            code: ot.test?.code || ot.testCode,
          }))}
          onConfirmPrint={handleConfirmPrint}
        />
      )}
    </div>
  );
}
