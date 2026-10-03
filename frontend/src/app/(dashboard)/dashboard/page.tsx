'use client';

import { StatCard } from '@/components/ui/StatCard';
import { StatCardSkeleton, PageError } from '@/components/ui/Skeleton';
import { OrderStatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { useDashboardKPIs, useOrders, useNotifications } from '@/hooks';
import { formatCurrency, formatDateTime, patientFullName } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, ClipboardList, FlaskConical, AlertTriangle,
  TrendingUp, DollarSign, Clock, CheckCircle2,
  ArrowRight, Activity,
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, subDays } from 'date-fns';
import { MOCK_REVENUE_TREND, MOCK_TEST_VOLUME } from '@/lib/mock-data';

// Revenue trend uses mock until a dedicated /analytics/revenue endpoint is exposed
const revenueTrend = MOCK_REVENUE_TREND;
const testVolume = MOCK_TEST_VOLUME;

export default function DashboardPage() {
  const kpiQuery = useDashboardKPIs();
  const ordersQuery = useOrders({ limit: 5 });
  const notificationsQuery = useNotifications();

  const kpis = kpiQuery.data;
  const recentOrders = ordersQuery.data?.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const pendingVerificationOrders = recentOrders.filter((o) => o.status === 'awaiting_verification');

  if (kpiQuery.error) {
    return <PageError message={kpiQuery.error} onRetry={kpiQuery.refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Grid row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Today's Orders"
              value={kpis?.todayOrders ?? 0}
              subtitle={`${kpis?.totalOrders ?? 0} total all-time`}
              icon={ClipboardList}
              color="indigo"
            />
            <StatCard
              title="Pending Results"
              value={kpis?.pendingResults ?? 0}
              subtitle="Awaiting entry"
              icon={FlaskConical}
              color="amber"
            />
            <StatCard
              title="Awaiting Verification"
              value={kpis?.pendingVerification ?? 0}
              subtitle="Pathologist review needed"
              icon={AlertTriangle}
              color="rose"
            />
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(kpis?.todayRevenue ?? 0)}
              subtitle={`${formatCurrency(kpis?.totalRevenue ?? 0)} total`}
              icon={DollarSign}
              color="emerald"
            />
          </>
        )}
      </div>

      {/* KPI Grid row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Today's Patients"
              value={kpis?.todayPatients ?? 0}
              subtitle={`${kpis?.totalPatients ?? 0} registered total`}
              icon={Users}
              color="blue"
            />
            <StatCard title="Avg TAT" value="4.2h" subtitle="Average turnaround time" icon={Clock} color="violet" />
            <StatCard title="Reports Published" value="—" subtitle="This month" icon={CheckCircle2} color="emerald" />
            <StatCard title="Tests Performed" value="—" subtitle="This month" icon={Activity} color="indigo" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Revenue Trend</h2>
              <p className="text-xs text-slate-500">Last 7 days</p>
            </div>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), 'dd MMM')}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenue']}
                labelFormatter={(label) => format(parseISO(label as string), 'dd MMM yyyy')}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Top Tests</h2>
            <p className="text-xs text-slate-500">By volume this month</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={testVolume} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={52} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
            <Link href="/orders" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {ordersQuery.isLoading ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 gap-3">
                  <div className="flex gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-slate-100 animate-pulse rounded w-40" />
                      <div className="h-3 bg-slate-100 animate-pulse rounded w-64" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-14 bg-slate-100 animate-pulse rounded-full" />
                    <div className="h-5 w-20 bg-slate-100 animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <ClipboardList size={14} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {patientFullName(order.patient)}
                        {order.patient?.patientId && (
                          <span className="ml-2 text-xs text-slate-500">{order.patient.patientId}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.orderId} · {order.orderedTests?.length ?? 0} test{(order.orderedTests?.length ?? 0) !== 1 ? 's' : ''} · {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={order.priority} />
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {pendingVerificationOrders.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">Awaiting Verification</h3>
              </div>
              {pendingVerificationOrders.map((order) => (
                <Link key={order._id} href={`/results/${order._id}`} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0 hover:opacity-80">
                  <div>
                    <p className="text-xs font-medium text-amber-900">{patientFullName(order.patient)}</p>
                    <p className="text-xs text-amber-700">{order.orderId}</p>
                  </div>
                  <PriorityBadge priority={order.priority} />
                </Link>
              ))}
              <Link href="/results/pending" className="mt-3 flex items-center gap-1 text-xs text-amber-700 font-medium hover:text-amber-800">
                Go to verification queue <ArrowRight size={11} />
              </Link>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Recent Alerts</h3>
            </div>
            {notificationsQuery.isLoading ? (
              <div className="divide-y divide-slate-50">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-slate-100 animate-pulse rounded w-28" />
                      <div className="h-2.5 bg-slate-100 animate-pulse rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {unreadNotifications.slice(0, 4).map((notif) => (
                  <div key={notif._id} className="flex gap-3 px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-800">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                  </div>
                ))}
                {unreadNotifications.length === 0 && (
                  <p className="px-4 py-4 text-xs text-slate-400 text-center">No unread notifications</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
