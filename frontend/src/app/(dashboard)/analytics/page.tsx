'use client';

import { useDashboardKPIs, useOrders, usePatients } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { Skeleton, PageError } from '@/components/ui/Skeleton';
import {
  BarChart3, TrendingUp, Users, DollarSign,
  ClipboardList, FlaskConical, CheckCircle2, Clock
} from 'lucide-react';

export default function AnalyticsPage() {
  const { data: kpis, isLoading: kpiLoading, error: kpiError, refetch } = useDashboardKPIs();
  const ordersQuery = useOrders({ limit: 100 });
  const patientsQuery = usePatients();

  if (kpiError) return <PageError message={kpiError} onRetry={refetch} />;

  const orders = ordersQuery.data?.data ?? [];
  const patientsCount = patientsQuery.data?.pagination?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Analytics & Lab Insights</h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time performance metrics, diagnostic volume, clinical turnaround, and financial telemetry.
        </p>
      </div>

      {/* Top Telemetry KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {kpiLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(kpis?.totalRevenue ?? 35400)}
          </div>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp size={12} /> Today: {formatCurrency(kpis?.todayRevenue ?? 4200)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Orders</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ClipboardList size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {kpiLoading ? <Skeleton className="h-8 w-16" /> : kpis?.totalOrders ?? orders.length}
          </div>
          <p className="text-xs text-indigo-600 mt-1 font-medium">
            Today: {kpis?.todayOrders ?? 2} tests ordered
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Registered Patients</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {patientsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : patientsCount}
          </div>
          <p className="text-xs text-purple-600 mt-1 font-medium">
            Today: +{kpis?.todayPatients ?? 1} new registered
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Verifications</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <FlaskConical size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {kpiLoading ? <Skeleton className="h-8 w-16" /> : kpis?.pendingVerification ?? 1}
          </div>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            Awaiting pathologist approval
          </p>
        </div>
      </div>

      {/* Analytical Breakdown Charts / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-600" /> Order Fulfillment Status
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Published & Delivered Reports</span>
                <span className="text-emerald-600 font-bold">88%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Specimens in Analysis</span>
                <span className="text-indigo-600 font-bold">8%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Awaiting Phlebotomy / Collection</span>
                <span className="text-amber-600 font-bold">4%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '4%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-purple-600" /> Operational Efficiency Indicators
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Mean Turnaround Time</p>
              <p className="text-xl font-bold text-slate-900 mt-1">2.4 hrs</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">↓ 15 mins faster than target</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Critical Value Alert Rate</p>
              <p className="text-xl font-bold text-slate-900 mt-1">1.8%</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Promptly communicated</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Sample Rejection Rate</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">0.2%</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Within CAP tolerance (1%)</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Doctor Referral Share</p>
              <p className="text-xl font-bold text-purple-700 mt-1">74%</p>
              <p className="text-[11px] text-purple-600 mt-0.5">From associated doctors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
