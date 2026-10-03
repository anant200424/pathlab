'use client';

import { useState, useMemo } from 'react';
import { useDoctors, useClinics } from '@/hooks';
import { doctorsService } from '@/lib/services/misc.service';
import { formatDate } from '@/lib/utils';
import { TableSkeleton, PageError } from '@/components/ui/Skeleton';
import {
  Stethoscope, Search, Plus, Phone, Mail, Building2,
  CheckCircle2, XCircle, X, Loader2, Award, FileSignature, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorsPage() {
  const { data, isLoading, error, refetch } = useDoctors();
  const clinicsQuery = useClinics();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'referring' | 'pathologist'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Doctor Form State
  const [formData, setFormData] = useState({
    fullName: '',
    qualification: '',
    specialization: '',
    medicalRegistrationNumber: '',
    phone: '',
    email: '',
    clinicId: '',
    isReferringDoctor: true,
    isVerifyingDoctor: false,
    reportFooterText: '',
  });

  const doctors = useMemo(() => {
    return (data?.data ?? []).map((doc: any) => ({
      ...doc,
      displayName: doc.displayName || doc.fullName || 'Unknown Doctor',
      phone: doc.phone || doc.contact?.phone || '',
      email: doc.email || doc.contact?.email || '',
    }));
  }, [data]);

  const clinics = clinicsQuery.data?.data ?? [];

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSearch =
        doc.displayName.toLowerCase().includes(search.toLowerCase()) ||
        (doc.specialization && doc.specialization.toLowerCase().includes(search.toLowerCase())) ||
        (doc.qualification && doc.qualification.toLowerCase().includes(search.toLowerCase())) ||
        (doc.medicalRegistrationNumber && doc.medicalRegistrationNumber.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType === 'referring') return doc.isReferringDoctor;
      if (filterType === 'pathologist') return doc.isVerifyingDoctor;
      return true;
    });
  }, [doctors, search, filterType]);

  const totalDoctors = doctors.length;
  const referringCount = doctors.filter((d) => d.isReferringDoctor).length;
  const verifyingCount = doctors.filter((d) => d.isVerifyingDoctor).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Doctor full name is required');
      return;
    }
    if (!formData.qualification.trim()) {
      toast.error('Qualification is required');
      return;
    }
    if (!formData.medicalRegistrationNumber.trim()) {
      toast.error('Medical registration number is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    const selectedClinicId = formData.clinicId || (clinics.length > 0 ? clinics[0]._id : undefined);
    if (!selectedClinicId) {
      toast.error('Please select an associated clinic');
      return;
    }

    setIsSubmitting(true);
    try {
      await doctorsService.create({
        fullName: formData.fullName.trim(),
        qualification: formData.qualification.trim(),
        specialization: formData.specialization.trim() || undefined,
        medicalRegistrationNumber: formData.medicalRegistrationNumber.trim(),
        contact: {
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
        },
        associatedClinics: [selectedClinicId],
        isReferringDoctor: formData.isReferringDoctor,
        isVerifyingDoctor: formData.isVerifyingDoctor,
        reportFooterText: formData.reportFooterText.trim() || undefined,
      } as any);

      toast.success('Doctor registered successfully!');
      setIsModalOpen(false);
      setFormData({
        fullName: '',
        qualification: '',
        specialization: '',
        medicalRegistrationNumber: '',
        phone: '',
        email: '',
        clinicId: '',
        isReferringDoctor: true,
        isVerifyingDoctor: false,
        reportFooterText: '',
      });
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to register doctor';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header & Stats Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Doctors Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage consulting physicians, referring doctors, and verifying pathologists.</p>
        </div>
        <button
          onClick={() => {
            if (clinics.length > 0 && !formData.clinicId) {
              setFormData((prev) => ({ ...prev, clinicId: clinics[0]._id }));
            }
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-200"
        >
          <Plus size={15} /> Add Doctor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Stethoscope size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Doctors</p>
            <p className="text-xl font-bold text-slate-900">{isLoading ? '…' : totalDoctors}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Referring Doctors</p>
            <p className="text-xl font-bold text-emerald-700">{isLoading ? '…' : referringCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <FileSignature size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Verifying Pathologists</p>
            <p className="text-xl font-bold text-purple-700">{isLoading ? '…' : verifyingCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, specialization, reg no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 self-start sm:self-auto">
          {(['all', 'referring', 'pathologist'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filterType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'all' ? 'All Doctors' : t === 'referring' ? 'Referring' : 'Pathologists'}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Doctor</th>
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Qualification & Reg #</th>
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Contact</th>
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Roles & Privileges</th>
                <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    No doctors found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  const initials = doc.displayName
                    .replace(/^Dr\.\s*/i, '')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'DR';

                  return (
                    <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{doc.displayName}</p>
                            <p className="text-xs text-slate-500">{doc.specialization || 'General Practitioner'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-slate-800">{doc.qualification || '—'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {doc.medicalRegistrationNumber ? `Reg: ${doc.medicalRegistrationNumber}` : '—'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {doc.phone && (
                            <a
                              href={`tel:${doc.phone}`}
                              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-indigo-600 transition-colors"
                            >
                              <Phone size={12} className="text-slate-400" />
                              {doc.phone}
                            </a>
                          )}
                          {doc.email && (
                            <a
                              href={`mailto:${doc.email}`}
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                              <Mail size={12} className="text-slate-400" />
                              {doc.email}
                            </a>
                          )}
                          {!doc.phone && !doc.email && <span className="text-xs text-slate-400">—</span>}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {doc.isReferringDoctor && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <UserCheck size={11} /> Referring
                            </span>
                          )}
                          {doc.isVerifyingDoctor && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              <FileSignature size={11} /> Verifier
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {doc.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 size={13} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                            <XCircle size={13} /> Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Stethoscope size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Doctor</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma, MD"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Qualification <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, MD (Path)"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Medical Reg # <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MCI-48291-MH"
                    value={formData.medicalRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, medicalRegistrationNumber: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clinical Pathology"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Associated Clinic <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.clinicId}
                    onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {clinics.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.code || c.clinicCode})
                      </option>
                    ))}
                  </select>
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
                    placeholder="+91 98201 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="doctor@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Roles */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Roles & Privileges</p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isReferringDoctor}
                      onChange={(e) => setFormData({ ...formData, isReferringDoctor: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Referring Doctor
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isVerifyingDoctor}
                      onChange={(e) => setFormData({ ...formData, isVerifyingDoctor: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Verifying Pathologist (Signatory)
                  </label>
                </div>
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
                    'Save Doctor'
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
