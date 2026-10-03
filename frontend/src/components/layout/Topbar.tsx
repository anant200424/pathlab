'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Check, CheckCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useNotifications } from '@/hooks';
import { notificationsService } from '@/lib/services/misc.service';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/patients/new': 'Register Patient',
  '/orders': 'Orders',
  '/orders/new': 'New Order',
  '/results/pending': 'Verification Queue',
  '/reports': 'Reports',
  '/billing': 'Billing',
  '/inventory': 'Inventory',
  '/analytics': 'Analytics',
  '/tests': 'Test Catalogue',
  '/doctors': 'Doctor Management',
  '/clinics': 'Clinic Management',
  '/users': 'User Management',
  '/audit': 'Audit Log',
  '/settings': 'Settings',
  '/samples': 'Sample Collection',
};

function getTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith('/patients/') && !pathname.endsWith('/new')) return 'Patient Profile';
  if (pathname.startsWith('/orders/')) return 'Order Details';
  if (pathname.startsWith('/results/')) return 'Result Entry';
  if (pathname.startsWith('/reports/')) return 'Report Viewer';
  if (pathname.startsWith('/billing/')) return 'Invoice Details';
  return 'LabCare Pro';
}

export default function Topbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData = null, refetch } = useNotifications();
  const notifications = notificationsData ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const title = getTitle(pathname);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      refetch();
    } catch {
      toast.error('Could not mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      refetch();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Could not mark all as read');
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30">
      {/* Left: Title */}
      <div>
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">
          {greeting()}, {user?.firstName} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Right: Search + Notifications */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="topbar-search"
            type="text"
            placeholder="Search patients, orders…"
            className="pl-8 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-52 transition-all"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="topbar-notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{unreadCount} unread</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((notif) => (
                    <div
                      key={notif._id}
                      className={`flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.isRead ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif._id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
