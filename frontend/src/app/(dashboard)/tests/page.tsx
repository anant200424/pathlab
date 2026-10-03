'use client';

import { useState, useMemo } from 'react';
import { useTests, useTestPackages } from '@/hooks';
import { testsService } from '@/lib/services/misc.service';
import { formatCurrency } from '@/lib/utils';
import { TableSkeleton, PageError } from '@/components/ui/Skeleton';
import {
  Activity, Search, Plus, Clock, Droplets, CheckCircle2,
  XCircle, X, Loader2, Layers, Tag, FlaskConical, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TestsCataloguePage() {
  const { data, isLoading, error, refetch } = useTests();
  const packagesQuery = useTestPackages();

  const [activeTab, setActiveTab] = useState<'tests' | 'packages'>('tests');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Test Form State
  const [formData, setFormData] = useState({
    testCode: '',
    name: '',
    department: 'Biochemistry',
    category: 'Routine',
    specimenType: 'Serum',
    turnaroundTimeHours: 4,
    price: 250,
    parameterName: '',
    parameterUnit: 'mg/dL',
    refLow: 70,
    refHigh: 110,
  });

  const tests = useMemo(() => {
    return (data?.data ?? []).map((t: any) => ({
      ...t,
      code: t.code || t.testCode || 'TEST',
      name: t.name || 'Unnamed Test',
      category: t.category || t.department || 'General',
      department: t.department || t.category || 'General',
      price: t.price ?? 0,
      turnaroundTime: t.turnaroundTime ?? t.turnaroundTimeHours ?? 4,
      sampleType: t.sampleType || t.specimenType || 'Serum',
      parameters: t.parameters || [],
    }));
  }, [data]);

  const packages = packagesQuery.data ?? [];

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    tests.forEach((t) => {
      if (t.department) set.add(t.department);
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tests]);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase()) ||
        (t.sampleType && t.sampleType.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (categoryFilter !== 'all') {
        return t.department === categoryFilter || t.category === categoryFilter;
      }
      return true;
    });
  }, [tests, search, categoryFilter]);

  const filteredPackages = useMemo(() => {
    return packages.filter((p: any) => {
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.packageCode && p.packageCode.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [packages, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testCode.trim()) {
      toast.error('Test code is required');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Test name is required');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);
    try {
      await testsService.create({
        testCode: formData.testCode.toUpperCase().trim(),
        name: formData.name.trim(),
        department: formData.department,
        category: formData.category,
        specimenType: formData.specimenType,
        turnaroundTimeHours: Number(formData.turnaroundTimeHours),
        price: Number(formData.price),
        parameters: formData.parameterName.trim()
          ? [
              {
                parameterCode: `${formData.testCode.toUpperCase().trim()}_1`,
                name: formData.parameterName.trim(),
                unit: formData.parameterUnit,
                dataType: 'numeric',
                referenceRanges: [
                  {
                    low: Number(formData.refLow),
                    high: Number(formData.refHigh),
                    unit: formData.parameterUnit,
                  },
                ],
                displayOrder: 1,
              },
            ]
          : [],
      } as any);

      toast.success('Test added to catalogue successfully!');
      setIsModalOpen(false);
      setFormData({
        testCode: '',
        name: '',
        department: 'Biochemistry',
        category: 'Routine',
        specimenType: 'Serum',
        turnaroundTimeHours: 4,
        price: 250,
        parameterName: '',
        parameterUnit: 'mg/dL',
        refLow: 70,
        refHigh: 110,
      });
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create test definition';
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Test Catalogue & Packages</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure laboratory tests, reference ranges, specimen tubes, and health packages.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-200"
        >
          <Plus size={15} /> Add New Test
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Available Tests</p>
            <p className="text-xl font-bold text-slate-900">{isLoading ? '…' : tests.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Health Packages</p>
            <p className="text-xl font-bold text-purple-700">
              {packagesQuery.isLoading ? '…' : packages.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Turnaround</p>
            <p className="text-xl font-bold text-blue-700">
              {isLoading
                ? '…'
                : tests.length > 0
                ? `${Math.round(tests.reduce((acc, t) => acc + (t.turnaroundTime || 4), 0) / tests.length)} hrs`
                : '4 hrs'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'tests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FlaskConical size={13} /> Tests ({tests.length})
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'packages' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles size={13} /> Packages ({packages.length})
            </button>
          </div>

          {activeTab === 'tests' && categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'tests' ? 'Search tests, code, specimen...' : 'Search health packages...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Content Table */}
      {activeTab === 'tests' ? (
        isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Test Code</th>
                  <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Test Name</th>
                  <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Department</th>
                  <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Specimen Type</th>
                  <th className="text-xs font-medium text-slate-500 px-5 py-3.5">Turnaround</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-5 py-3.5">Base Price</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                      No tests found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTests.map((test) => (
                    <tr key={test._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                          {test.code}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{test.name}</p>
                        {test.parameters?.length > 0 && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {test.parameters.length} parameter{test.parameters.length > 1 ? 's' : ''} (
                            {test.parameters.map((p: any) => p.name).slice(0, 2).join(', ')}
                            {test.parameters.length > 2 ? '…' : ''})
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          <Tag size={10} /> {test.department || test.category}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Droplets size={12} className="text-rose-500" />
                          {test.sampleType}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock size={12} className="text-slate-400" />
                          {test.turnaroundTime} hrs
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(test.price)}</span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        {test.isActive !== false ? (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Health Packages Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
              No health packages found.
            </div>
          ) : (
            filteredPackages.map((pkg: any) => (
              <div
                key={pkg._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {pkg.packageCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pkg.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Included Tests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(pkg.tests || []).map((t: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/60"
                        >
                          {t.testCode || t.code || t.name || 'Test'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">Package Price</p>
                    <p className="text-lg font-bold text-indigo-600">{formatCurrency(pkg.packagePrice)}</p>
                  </div>
                  {pkg.discountPercentage && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                      {pkg.discountPercentage}% OFF
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Activity size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Test to Catalogue</h3>
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
                    Test Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TSH, LFT"
                    value={formData.testCode}
                    onChange={(e) => setFormData({ ...formData, testCode: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Test Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thyroid Stimulating Hormone"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Serology">Serology</option>
                    <option value="Immunology">Immunology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Specimen / Tube <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EDTA Whole Blood, Serum"
                    value={formData.specimenType}
                    onChange={(e) => setFormData({ ...formData, specimenType: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Base Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="250"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Turnaround (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.turnaroundTimeHours}
                    onChange={(e) => setFormData({ ...formData, turnaroundTimeHours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Primary Parameter Config */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Primary Parameter & Reference Range
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Parameter Name (e.g. TSH Level)"
                    value={formData.parameterName}
                    onChange={(e) => setFormData({ ...formData, parameterName: e.target.value })}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. µIU/mL, mg/dL)"
                    value={formData.parameterUnit}
                    onChange={(e) => setFormData({ ...formData, parameterUnit: e.target.value })}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Normal Min (e.g. 0.4)"
                    value={formData.refLow}
                    onChange={(e) => setFormData({ ...formData, refLow: Number(e.target.value) })}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Normal Max (e.g. 4.0)"
                    value={formData.refHigh}
                    onChange={(e) => setFormData({ ...formData, refHigh: Number(e.target.value) })}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
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
                    'Add Test'
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
