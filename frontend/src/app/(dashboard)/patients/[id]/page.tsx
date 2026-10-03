'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { usePatient, useOrders } from '@/hooks';
import { formatDate, formatDateTime, calcAge, patientFullName, formatCurrency } from '@/lib/utils';
import { OrderStatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Skeleton, PageError } from '@/components/ui/Skeleton';
import { User, Phone, Mail, MapPin, Droplet, Calendar, ClipboardList, ArrowLeft, Plus, Edit, Heart } from 'lucide-react';
import Link from 'next/link';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const patientQuery = usePatient(id);
  const ordersQuery = useOrders({ limit: 50 });

  const patient = patientQuery.data;
  const patientOrders = (ordersQuery.data?.data ?? []).filter((o) => o.patient._id === id);

  if (patientQuery.error) return <PageError message={patientQuery.error} onRetry={patientQuery.refetch} />;
  if (!patientQuery.isLoading && !patient) notFound();

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <Link href="/patients" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Back to Patients
        </Link>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
            <Edit size={13} /> Edit
          </button>
          <Link href="/orders/new" className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm shadow-indigo-200">
            <Plus size={13} /> New Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            {patientQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-3 w-24 mx-auto" />
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
              </div>
            ) : patient ? (
              <>
                <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-indigo-600">
                      {(patient.firstName?.[0] || patient.fullName?.[0] || 'P').toUpperCase()}
                      {(patient.lastName?.[0] || patient.fullName?.split(' ')[1]?.[0] || '').toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{patientFullName(patient)}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{patient.patientId}</p>
                  <p className="text-xs text-slate-500 mt-1 capitalize">{patient.gender} · {calcAge(patient.dateOfBirth)}</p>
                </div>
                <div className="pt-4 space-y-3">
                  {[
                    { icon: Phone, label: 'Phone', value: patient.phone },
                    { icon: Mail, label: 'Email', value: patient.email ?? '—' },
                    { icon: Calendar, label: 'Date of Birth', value: formatDate(patient.dateOfBirth) },
                    { icon: MapPin, label: 'Address', value: [patient.address?.street || (patient.address as any)?.line1, patient.address?.city, patient.address?.state].filter(Boolean).join(', ') || '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-slate-700 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                  {patient.bloodGroup && (
                    <div className="flex items-start gap-3">
                      <Droplet size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Blood Group</p>
                        <p className="text-sm font-bold text-red-600 mt-0.5">{patient.bloodGroup}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600"><ClipboardList size={13} className="text-slate-400" /> Total Orders</div>
                <span className="text-sm font-bold text-slate-900">{ordersQuery.isLoading ? '…' : patientOrders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600"><Heart size={13} className="text-slate-400" /> Registered</div>
                <span className="text-sm text-slate-700">{patient ? formatDate(patient.createdAt) : '…'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order history */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Order History</h3>
              <span className="text-xs text-slate-500">{ordersQuery.isLoading ? '…' : `${patientOrders.length} orders`}</span>
            </div>
            {ordersQuery.isLoading ? (
              <div className="divide-y divide-slate-50">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 gap-3">
                    <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
                    <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /></div>
                  </div>
                ))}
              </div>
            ) : patientOrders.length === 0 ? (
              <div className="py-12 text-center">
                <ClipboardList size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No orders found for this patient.</p>
                <Link href="/orders/new" className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  <Plus size={13} /> Create first order
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {patientOrders.map((order) => (
                  <Link key={order._id} href={`/orders/${order._id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{order.orderId}</p>
                        <PriorityBadge priority={order.priority} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{order.orderedTests.map((t) => t.test.name).join(' · ')}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.netAmount)}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
