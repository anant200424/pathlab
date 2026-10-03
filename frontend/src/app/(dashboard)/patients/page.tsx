'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePatients } from '@/hooks';
import { formatDate, calcAge, patientFullName } from '@/lib/utils';
import { TableSkeleton, PageError } from '@/components/ui/Skeleton';
import { Search, UserPlus, User, Phone, Droplet, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const BLOOD_GROUP_COLORS: Record<string, string> = {
  'A+': 'bg-red-50 text-red-700', 'A-': 'bg-red-50 text-red-700',
  'B+': 'bg-orange-50 text-orange-700', 'B-': 'bg-orange-50 text-orange-700',
  'AB+': 'bg-purple-50 text-purple-700', 'AB-': 'bg-purple-50 text-purple-700',
  'O+': 'bg-blue-50 text-blue-700', 'O-': 'bg-blue-50 text-blue-700',
};

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, error, refetch } = usePatients({
    search: debouncedSearch || undefined,
    gender: genderFilter !== 'all' ? genderFilter : undefined,
  });

  const patients = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{isLoading ? '…' : `${total} patients registered`}</p>
        <Link
          href="/patients/new"
          id="register-patient-btn"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          <UserPlus size={15} /> Register Patient
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="patients-search"
            type="text"
            placeholder="Search by name, ID, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'male', 'female', 'other'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                genderFilter === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Patient</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">ID</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Age / Gender</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Contact</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Blood Group</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Registered</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <User size={13} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{patientFullName(patient)}</p>
                          <p className="text-xs text-slate-500">{patient.address?.city ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{patient.patientId}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">{calcAge(patient.dateOfBirth)}</p>
                      <p className="text-xs text-slate-500 capitalize">{patient.gender}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-sm text-slate-700">
                        <Phone size={11} className="text-slate-400" />
                        {patient.phone}
                      </div>
                      {patient.email && <p className="text-xs text-slate-500 mt-0.5">{patient.email}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      {patient.bloodGroup ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${BLOOD_GROUP_COLORS[patient.bloodGroup] ?? 'bg-slate-100 text-slate-700'}`}>
                          <Droplet size={10} /> {patient.bloodGroup}
                        </span>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">{formatDate(patient.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/patients/${patient._id}`}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View <ChevronRight size={12} />
                      </Link>
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
