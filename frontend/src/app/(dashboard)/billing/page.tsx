'use client';

import { useState } from 'react';
import { useInvoices } from '@/hooks';
import { billingService, type RecordPaymentPayload } from '@/lib/services/billing.service';
import { formatCurrency, formatDateTime, patientFullName } from '@/lib/utils';
import { InvoiceStatusBadge } from '@/components/ui/Badge';
import { TableSkeleton, PageError } from '@/components/ui/Skeleton';
import { CreditCard, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const { data, isLoading, error, refetch } = useInvoices();
  const [recordingPayment, setRecordingPayment] = useState<string | null>(null);

  const invoices = data?.data ?? [];
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
  const total = (data?.pagination as { total?: number })?.total ?? 0;

  const handleRecordPayment = async (invoiceId: string, balanceAmount: number) => {
    const method = window.prompt('Payment method (cash/card/upi/net_banking):') as RecordPaymentPayload['method'];
    if (!method) return;
    const amountStr = window.prompt(`Amount to collect (outstanding: ₹${balanceAmount.toFixed(0)}):`, String(balanceAmount));
    const amount = parseFloat(amountStr ?? '0');
    if (!amount || isNaN(amount)) return;

    setRecordingPayment(invoiceId);
    try {
      await billingService.recordPayment({ invoiceId, method, amount });
      toast.success(`Payment of ₹${amount.toFixed(0)} recorded via ${method}!`);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to record payment';
      toast.error(msg);
    } finally {
      setRecordingPayment(null);
    }
  };

  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: formatCurrency(totalRevenue), color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
          { label: 'Outstanding', value: formatCurrency(totalOutstanding), color: 'bg-red-50 border-red-200 text-red-800' },
          { label: 'Paid Invoices', value: invoices.filter((i) => i.status === 'paid').length, color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
          { label: 'Partial Payments', value: invoices.filter((i) => i.status === 'partial').length, color: 'bg-amber-50 border-amber-200 text-amber-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border p-4 ${color}`}>
            {isLoading ? (
              <div className="h-6 bg-current/10 rounded animate-pulse w-16 mb-1" />
            ) : (
              <p className="text-lg font-bold tabular-nums">{value}</p>
            )}
            <p className="text-sm font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{isLoading ? '…' : `${total} invoices`}</p>
        <button
          onClick={() => toast('Create invoice — first create an order, then use POST /billing/invoices', { icon: '🧾' })}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={15} /> New Invoice
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Invoice #</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Patient</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Order</th>
                <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Total</th>
                <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Paid</th>
                <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Balance</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Method</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-slate-400">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-900">{patientFullName(invoice.patient)}</p>
                      <p className="text-xs text-slate-500 font-mono">{invoice.patient.patientId}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-slate-600">{invoice.order.orderId}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(invoice.netAmount)}</p>
                      {invoice.discountAmount > 0 && (
                        <p className="text-xs text-emerald-600">-{formatCurrency(invoice.discountAmount)}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm font-semibold text-emerald-700">{formatCurrency(invoice.paidAmount)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className={`text-sm font-semibold ${invoice.balanceAmount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {formatCurrency(invoice.balanceAmount)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {invoice.payments.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <CreditCard size={12} className="text-slate-400" />
                          <span className="text-sm text-slate-600 capitalize">{invoice.payments[0].method}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">{formatDateTime(invoice.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {invoice.balanceAmount > 0 && (
                        <button
                          onClick={() => handleRecordPayment(invoice._id, invoice.balanceAmount)}
                          disabled={recordingPayment === invoice._id}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          {recordingPayment === invoice._id ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                          Record Payment
                        </button>
                      )}
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
