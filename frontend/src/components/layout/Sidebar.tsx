'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { hasAnyPermission } from '@/lib/utils';
import { authService } from '@/lib/services/auth.service';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, ClipboardList, FlaskConical,
  TestTube, FileText, CreditCard, Package, BarChart3,
  Building2, UserCog, Settings, Shield, ChevronRight,
  LogOut, Stethoscope, Activity, X,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permissions?: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       href: '/dashboard',        icon: LayoutDashboard },
  { label: 'Patients',        href: '/patients',         icon: Users,          permissions: ['patients:read'] },
  { label: 'Orders',          href: '/orders',           icon: ClipboardList,  permissions: ['orders:read'] },
  { label: 'Samples',         href: '/samples',          icon: TestTube,       permissions: ['samples:collect', 'samples:process'] },
  { label: 'Results',         href: '/results/pending',  icon: FlaskConical,   permissions: ['results:enter', 'results:verify'] },
  { label: 'Reports',         href: '/reports',          icon: FileText,       permissions: ['reports:publish', 'reports:download'] },
  { label: 'Billing',         href: '/billing',          icon: CreditCard,     permissions: ['billing:read', 'billing:manage'] },
  { label: 'Inventory',       href: '/inventory',        icon: Package,        permissions: ['inventory:read'] },
  { label: 'Analytics',       href: '/analytics',        icon: BarChart3,      permissions: ['analytics:read'] },
  { label: 'Test Catalogue',  href: '/tests',            icon: Activity,       permissions: ['tests:manage'] },
  { label: 'Doctors',         href: '/doctors',          icon: Stethoscope,    permissions: ['doctors:manage'] },
  { label: 'Clinics',         href: '/clinics',          icon: Building2,      permissions: ['clinics:manage'] },
  { label: 'Users',           href: '/users',            icon: UserCog,        permissions: ['users:manage'] },
  { label: 'Audit Log',       href: '/audit',            icon: Shield,         permissions: ['audit:read'] },
  { label: 'Settings',        href: '/settings',         icon: Settings,       permissions: ['settings:manage'] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, clearUser } = useAuthStore();
  const permissions = user?.permissions ?? [];

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      !item.permissions ||
      hasAnyPermission(permissions, item.permissions)
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore errors — still clear local state
    } finally {
      clearUser();
      toast.success('Signed out successfully');
      window.location.href = '/login';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-50 shadow-xl md:shadow-sm transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo & Close on mobile */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-indigo-600 rounded-xl shadow-sm shadow-indigo-200 flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">LabCare Pro</p>
              <p className="text-[10px] text-slate-500 leading-tight">Enterprise LIMS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100 group',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={12} className="text-indigo-400" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-600">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user?.roles?.[0] ?? 'Staff'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
            title="Sign out"
            id="sidebar-logout-btn"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
