'use client';

import { useState, useMemo } from 'react';
import { useClinics } from '@/hooks';
import { clinicsService } from '@/lib/services/misc.service';
import { TableSkeleton, PageError } from '@/components/ui/Skeleton';
import {
  Building2, Search, Plus, MapPin, Phone, Mail, Globe,
  CheckCircle2, XCircle, X, Loader2, Landmark, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClinicsPage() {
  const { data, isLoading, error, refetch } = useClinics();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Clinic Form State
  const [formData, setFormData] = useState({
    clinicCode: '',
    name: '',
    branchCode: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    email: '',
    website: '',
  });

  const clinics = useMemo(() => {
    return (data?.data ?? []).map((c: any) => ({
      ...c,
      code: c.code || c.clinicCode || 'CLINIC',
      branchCode: c.branchCode || 'BRANCH',
      phone: c.phone || c.contact?.phone || '',
      email: c.email || c.contact?.email || '',
      website: c.website || c.contact?.website || '',
      address: c.address || {},
    }));
  }, [data]);

  const filteredClinics = useMemo(() => {
    return clinics.filter((c) => {
      const addr = c.address;
      const fullAddr = `${addr.line1 || ''} ${addr.city || ''} ${addr.state || ''}`;
      return (
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.branchCode.toLowerCase().includes(search.toLowerCase()) ||
        fullAddr.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [clinics, search]);

  const activeClinicsCount = clinics.filter((c) => c.isActive !== false).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clinicCode.trim()) {
      toast.error('Clinic code is required');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Clinic name is required');
      return;
    }
    if (!formData.branchCode.trim()) {
      toast.error('Branch code is required');
      return;
    }
    if (!formData.line1.trim() || !formData.city.trim() || !formData.state.trim() || !formData.postalCode.trim()) {
      toast.error('Complete address is required');
      return;
    }
    if (!formData.phone.trim() || !formData.email.trim()) {
      toast.error('Phone and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await clinicsService.create({
        clinicCode: formData.clinicCode.toUpperCase().trim(),
        name: formData.name.trim(),
        branchCode: formData.branchCode.toUpperCase().trim(),
        address: {
          line1: formData.line1.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country || 'India',
        },
        contact: {
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          website: formData.website.trim() || undefined,
        },
      } as any);

      toast.success('Laboratory clinic created successfully!');
      setIsModalOpen(false);
      setFormData({
        clinicCode: '',
        name: '',
        branchCode: '',
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: '',
        email: '',
        website: '',
      });
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create clinic branch';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinics & Collection Centres</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage central reference laboratories, branch diagnostic centres, and collection nodes.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-200"
        >
          <Plus size={15} /> Add Clinic Branch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Branches</p>
            <p className="text-xl font-bold text-slate-900">{isLoading ? '…' : clinics.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Laboratories</p>
            <p className="text-xl font-bold text-emerald-700">{isLoading ? '…' : activeClinicsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Primary Timezone</p>
            <p className="text-base font-bold text-slate-900">Asia/Kolkata (IST)</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search clinic name, code, city, branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
        />
      </div>

      {/* Clinics Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : filteredClinics.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
          No clinics found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClinics.map((clinic) => {
            const addr = clinic.address;
            const formattedAddress = [addr.line1, addr.city, addr.state, addr.postalCode]
              .filter(Boolean)
              .join(', ');

            return (
              <div
                key={clinic._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base flex-shrink-0">
                        <Landmark size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {clinic.code}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {clinic.branchCode}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mt-1">{clinic.name}</h2>
                      </div>
                    </div>

                    <div>
                      {clinic.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={11} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <XCircle size={11} /> Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                      <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{formattedAddress || 'Address not configured'}</span>
                    </div>

                    {clinic.phone && (
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <Phone size={14} className="text-slate-400 flex-shrink-0" />
                        <a href={`tel:${clinic.phone}`} className="hover:text-indigo-600 transition-colors">
                          {clinic.phone}
                        </a>
                      </div>
                    )}

                    {clinic.email && (
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <Mail size={14} className="text-slate-400 flex-shrink-0" />
                        <a href={`mailto:${clinic.email}`} className="hover:text-indigo-600 transition-colors">
                          {clinic.email}
                        </a>
                      </div>
                    )}

                    {clinic.website && (
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <Globe size={14} className="text-slate-400 flex-shrink-0" />
                        <a
                          href={clinic.website}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-indigo-600 transition-colors truncate"
                        >
                          {clinic.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Registered: {clinic.createdAt ? new Date(clinic.createdAt).toLocaleDateString() : '—'}</span>
                  <span className="font-mono text-slate-500">ID: {clinic._id.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Clinic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Building2 size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Clinic Branch</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Clinic Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CLINIC-003"
                    value={formData.clinicCode}
                    onChange={(e) => setFormData({ ...formData, clinicCode: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Branch Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. THA-COLL"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Clinic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Diagnostics & Collection Centre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Suite 201, City Centre, Station Road"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Thane"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Maharashtra"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="400601"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 22 2534 8800"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Lab Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="thane@labcarepro.internal"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://labcarepro.internal"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2 text-sm font-medium rounded-xl transition-all shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    'Create Clinic'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
