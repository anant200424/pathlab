'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTests, useDoctors, useClinics, usePatients } from '@/hooks';
import { ordersService } from '@/lib/services/orders.service';
import { patientsService } from '@/lib/services/patients.service';
import { testsService } from '@/lib/services/misc.service';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft, Search, Plus, Trash2, Save, Loader2,
  Calendar, Clock, User, Phone, MapPin, Building2,
  Stethoscope, CreditCard, Sparkles, CheckCircle2, AlertCircle,
  Printer, Download, ExternalLink, X
} from 'lucide-react';
import { SelectToPrintModal } from '@/components/ui/SelectToPrintModal';
import toast from 'react-hot-toast';

interface SelectedTestItem {
  _id?: string;
  testCode: string;
  name: string;
  department?: string;
  price: number;
  isCustom?: boolean;
}

const TITLE_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Master', 'Baby', 'Baby of', 'Dr.'];
const CITY_OPTIONS = ['Bhagalpur', 'Patna', 'Kolkata', 'Mumbai', 'Pune', 'Delhi', 'Bengaluru'];

export default function NewOrderPage() {
  const router = useRouter();
  const testsQuery = useTests({ limit: 100 });
  const doctorsQuery = useDoctors();
  const clinicsQuery = useClinics();
  const patientsQuery = usePatients({ limit: 100 });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderSuccess, setCreatedOrderSuccess] = useState<any | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Patient & Registration Information
  const [billOn, setBillOn] = useState('Patient Rate');
  const [collectionType, setCollectionType] = useState('At Lab');
  const [mobileNumber, setMobileNumber] = useState('');
  const [titlePrefix, setTitlePrefix] = useState('Mr.');
  const [patientName, setPatientName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState<number | ''>(28);
  const [ageUnit, setAgeUnit] = useState<'Year' | 'Month' | 'Day'>('Year');
  const [bloodGroup, setBloodGroup] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Bhagalpur');
  const [email, setEmail] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [remark, setRemark] = useState('');

  // Test Selection & Custom Test Creation
  const [selectedTestId, setSelectedTestId] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<SelectedTestItem[]>([]);

  // Custom test inputs
  const [showCustomTest, setShowCustomTest] = useState(false);
  const [customTestName, setCustomTestName] = useState('');
  const [customTestPrice, setCustomTestPrice] = useState<number | ''>(300);
  const [customTestDept, setCustomTestDept] = useState('Biochemistry');

  // Billing Calculations
  const [discountPercent, setDiscountPercent] = useState<number | ''>(0);
  const [discountAmount, setDiscountAmount] = useState<number | ''>(0);
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentRefNo, setPaymentRefNo] = useState('');

  const allTests = useMemo(() => {
    return (testsQuery.data?.data ?? []).map((t: any) => ({
      _id: t._id,
      testCode: t.code || t.testCode || 'TEST',
      name: t.name || 'Test',
      department: t.department || t.category || 'General',
      price: t.price ?? 200,
    }));
  }, [testsQuery.data]);

  const doctors = doctorsQuery.data?.data ?? [];
  const clinics = clinicsQuery.data?.data ?? [];
  const existingPatients = patientsQuery.data?.data ?? [];

  // Default clinic selection
  useEffect(() => {
    if (clinics.length > 0 && !selectedClinicId) {
      setSelectedClinicId(clinics[0]._id);
    }
  }, [clinics, selectedClinicId]);

  // Default doctor selection
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0]._id);
    }
  }, [doctors, selectedDoctorId]);

  // Auto gender from title prefix
  const handleTitleChange = (prefix: string) => {
    setTitlePrefix(prefix);
    if (prefix === 'Mr.' || prefix === 'Master') {
      setGender('male');
    } else if (prefix === 'Mrs.' || prefix === 'Ms.' || prefix === 'Miss') {
      setGender('female');
    }
  };

  // Phone lookup / autocomplete
  const handlePhoneLookup = (phone: string) => {
    setMobileNumber(phone);
    if (phone.length >= 10) {
      const match = existingPatients.find((p: any) => p.phone?.includes(phone.trim()));
      if (match) {
        const parts = (match.fullName || `${match.firstName || ''} ${match.lastName || ''}`).trim();
        setPatientName(parts);
        if (match.gender) setGender(match.gender as any);
        if (match.bloodGroup) setBloodGroup(match.bloodGroup);
        if (match.address?.line1 || match.address?.street) {
          setAddressLine1(match.address.line1 || match.address.street || '');
        }
        if (match.address?.city) setCity(match.address.city);
        if (match.email) setEmail(match.email);
        toast('Existing patient record loaded!', { icon: '👤' });
      }
    }
  };

  // Add existing test from dropdown
  const handleAddTest = (testId: string) => {
    if (!testId) return;
    const testToAdd = allTests.find((t) => t._id === testId);
    if (!testToAdd) return;

    if (selectedTests.some((t) => t._id === testId)) {
      toast.error('Test is already added to this bill');
      return;
    }

    setSelectedTests((prev) => [...prev, testToAdd]);
    setSelectedTestId('');
  };

  // Add custom test
  const handleAddCustomTest = () => {
    if (!customTestName.trim()) {
      toast.error('Please enter custom test name');
      return;
    }
    const price = Number(customTestPrice) || 0;
    if (price <= 0) {
      toast.error('Please enter a valid price for the custom test');
      return;
    }

    const customItem: SelectedTestItem = {
      testCode: `CUST_${Date.now().toString().slice(-4)}`,
      name: customTestName.trim(),
      department: customTestDept,
      price,
      isCustom: true,
    };

    setSelectedTests((prev) => [...prev, customItem]);
    setCustomTestName('');
    setCustomTestPrice(300);
    setShowCustomTest(false);
    toast.success(`Custom test "${customItem.name}" added!`);
  };

  // Remove test
  const handleRemoveTest = (index: number) => {
    setSelectedTests((prev) => prev.filter((_, i) => i !== index));
  };

  // Financial calculations
  const totalAmount = useMemo(() => {
    return selectedTests.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [selectedTests]);

  const calculatedDiscount = useMemo(() => {
    if (discountPercent && Number(discountPercent) > 0) {
      return Math.round((totalAmount * Number(discountPercent)) / 100);
    }
    return Number(discountAmount) || 0;
  }, [totalAmount, discountPercent, discountAmount]);

  const netAmount = Math.max(0, totalAmount - calculatedDiscount);

  // Set default received amount to net amount when net amount updates if user hasn't explicitly entered a different amount
  const actualReceived = receivedAmount === '' ? netAmount : Number(receivedAmount);
  const dueAmount = Math.max(0, netAmount - actualReceived);

  // F10 key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        document.getElementById('save-order-btn')?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!patientName.trim()) {
      toast.error('Please enter patient name');
      return;
    }
    if (!mobileNumber.trim()) {
      toast.error('Please enter mobile number');
      return;
    }
    if (selectedTests.length === 0) {
      toast.error('Please select or add at least one test');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Calculate approximate DOB from Age
      let dobString: string | undefined;
      if (age && Number(age) > 0) {
        const now = new Date();
        if (ageUnit === 'Year') {
          now.setFullYear(now.getFullYear() - Number(age));
        } else if (ageUnit === 'Month') {
          now.setMonth(now.getMonth() - Number(age));
        } else {
          now.setDate(now.getDate() - Number(age));
        }
        dobString = now.toISOString().split('T')[0];
      } else {
        dobString = '1995-01-01';
      }

      // 2. Register/Resolve Patient
      const fullName = `${titlePrefix ? titlePrefix + ' ' : ''}${patientName}`.trim();
      const patientRes = await patientsService.create({
        fullName,
        firstName: patientName.split(' ')[0] || patientName,
        lastName: patientName.split(' ').slice(1).join(' ') || ' ',
        gender,
        dateOfBirth: dobString,
        phone: mobileNumber.trim(),
        email: email.trim() || undefined,
        bloodGroup: bloodGroup || undefined,
        clinicId: selectedClinicId || undefined,
        address: {
          line1: addressLine1.trim() || undefined,
          street: addressLine1.trim() || undefined,
          line2: addressLine2.trim() || undefined,
          city: city || 'Bhagalpur',
          state: 'Bihar',
          country: 'India',
        },
      });

      const patientId = patientRes._id || (patientRes as any).id;

      // 3. Process Custom Tests if any (save to TestDefinition to get real IDs)
      const finalTestIds: string[] = [];
      for (const item of selectedTests) {
        if (item._id && !item.isCustom) {
          finalTestIds.push(item._id);
        } else {
          const createdTest = await testsService.create({
            testCode: item.testCode,
            name: item.name,
            department: item.department || 'Biochemistry',
            category: 'Custom',
            specimenType: 'Serum',
            price: Number(item.price),
            turnaroundTimeHours: 4,
          } as any);
          finalTestIds.push(createdTest._id);
        }
      }

      // 4. Create Order
      const order = await ordersService.create({
        patientId,
        clinicId: selectedClinicId,
        referringDoctorId: selectedDoctorId || undefined,
        priority: 'routine',
        testIds: finalTestIds,
        discountAmount: calculatedDiscount,
        notes: remark ? `[Remark: ${remark}] [Col: ${collectionType}] [Payment: ${paymentMode}]` : undefined,
      });

      toast.success(`Lab Order Booked Successfully! Order ID: ${order.orderId || 'ORD-NEW'}`);
      const selectedDoc = doctors.find((d: any) => d._id === selectedDoctorId);
      setCreatedOrderSuccess({
        ...order,
        patientName: fullName,
        doctorName: selectedDoc?.fullName || selectedDoc?.displayName || 'DR N UPADHYAY',
        tests: selectedTests,
      });
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to register patient and order';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDropdownTests = useMemo(() => {
    if (!testSearch.trim()) return allTests;
    return allTests.filter(
      (t) =>
        t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.testCode.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.department.toLowerCase().includes(testSearch.toLowerCase())
    );
  }, [allTests, testSearch]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <span className="text-slate-200">|</span>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Patient Registration & Diagnostic Test Billing
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar size={13} className="text-slate-400" />
            {new Date().toLocaleDateString('en-GB')}
          </span>
          <span className="bg-indigo-50 text-indigo-700 font-mono font-bold px-2.5 py-1 rounded-md border border-indigo-100">
            BILL-RATE: {billOn}
          </span>
        </div>
      </div>

      <form onSubmit={handleSaveOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Patient & Test Details (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Patient Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <User size={14} className="text-indigo-600" /> 1. Patient Demographics
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Bill On:</span>
                <select
                  value={billOn}
                  onChange={(e) => setBillOn(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium"
                >
                  <option value="Patient Rate">Patient Rate</option>
                  <option value="B2B / Referral Rate">B2B / Referral Rate</option>
                  <option value="Corporate Panel">Corporate Panel</option>
                </select>
              </div>
            </div>

            {/* Mobile Number & Auto-fill */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={mobileNumber}
                    onChange={(e) => handlePhoneLookup(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Title Prefix + Name Input (Exact UI from user screenshot) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={titlePrefix}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-24 px-2 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TITLE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Enter patient full name..."
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Age, Gender & Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age & Unit <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={150}
                    required
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={ageUnit}
                    onChange={(e) => setAgeUnit(e.target.value as any)}
                    className="flex-1 px-2 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Year">Years</option>
                    <option value="Month">Months</option>
                    <option value="Day">Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select (Optional)</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address #1</label>
                <input
                  type="text"
                  placeholder="Street / Colony / Ward"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address #2</label>
                <input
                  type="text"
                  placeholder="Landmark / Area"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  list="cities-list"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="cities-list">
                  {CITY_OPTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Ref By Doctor & Lab Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referred By (Doctor)
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">- Self / Direct Walk-In (-NA-) -</option>
                  {doctors.map((d: any) => (
                    <option key={d._id} value={d._id}>
                      {d.displayName || d.fullName} ({d.specialization || d.qualification || 'Doctor'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Branch</label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {clinics.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code || c.clinicCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Test Name Selection Card (With All Tests Dropdown + Add Custom Feature) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-600" /> 2. Diagnostic Tests Selection
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select from 40+ pre-configured pathology tests, or add any custom test with price.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomTest(!showCustomTest)}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 font-medium"
              >
                <Plus size={13} /> {showCustomTest ? 'Close Custom' : '+ Add Custom Test'}
              </button>
            </div>

            {/* Custom Test Inline Form */}
            {showCustomTest && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                <p className="text-xs font-bold text-indigo-900">Add Any Custom / New Test to Bill:</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Enter test name (e.g. Troponin I, Skin Biopsy)"
                    value={customTestName}
                    onChange={(e) => setCustomTestName(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <select
                    value={customTestDept}
                    onChange={(e) => setCustomTestDept(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                    <option value="Serology">Serology</option>
                    <option value="Histopathology">Histopathology</option>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="₹ Price"
                      value={customTestPrice}
                      onChange={(e) => setCustomTestPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-24 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTest}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Test Selection Dropdown (All Possible Tests) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Test Name : <span className="text-slate-400 font-normal">Select to add to invoice</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter test by name or code (e.g. CBC, Lipid, Thyroid, TSH, LFT)..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={selectedTestId}
                  onChange={(e) => handleAddTest(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Click here to select a test ({filteredDropdownTests.length} available) --</option>
                  {filteredDropdownTests.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} [{t.testCode}] — {formatCurrency(t.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Tests Box (Big Scrollable Area matching user's screenshot) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="bg-slate-100/80 px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                <span>Selected Tests ({selectedTests.length})</span>
                <span>Price (INR)</span>
              </div>

              <div className="min-h-[160px] max-h-[260px] overflow-y-auto divide-y divide-slate-100 p-1">
                {selectedTests.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No tests added yet. Select a test from the dropdown above or click "+ Add Custom Test".
                  </div>
                ) : (
                  selectedTests.map((test, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-slate-50 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{test.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {test.department || 'Lab Test'} · Code: {test.testCode}
                            {test.isCustom && (
                              <span className="ml-1 text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                                Custom
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <input
                            type="number"
                            min={0}
                            value={test.price}
                            onChange={(e) => {
                              const newPrice = Number(e.target.value) || 0;
                              setSelectedTests((prev) =>
                                prev.map((item, idx) => (idx === index ? { ...item, price: newPrice } : item))
                              );
                            }}
                            className="w-20 px-2 py-1 text-xs text-right font-bold border border-slate-200 rounded-lg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(index)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Remark field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Clinical Notes</label>
              <input
                type="text"
                placeholder="Fasting sample, STAT urgent, history of diabetes, etc."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Billing & Financials (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide pb-2 border-b border-slate-100 flex items-center gap-2">
              <CreditCard size={14} className="text-indigo-600" /> 3. Billing & Payment
            </h2>

            {/* Collection Type & Dates */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Collection Type</label>
                <select
                  value={collectionType}
                  onChange={(e) => setCollectionType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="At Lab">At Lab (Walk-In)</option>
                  <option value="Home Collection">Home Collection</option>
                  <option value="Hospital / In-Patient">Hospital / In-Patient</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / QR Code">UPI / QR Code</option>
                  <option value="Card (Debit/Credit)">Card (Debit/Credit)</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Credit / Due">Credit / Due</option>
                </select>
              </div>

              {paymentMode !== 'Cash' && paymentMode !== 'Credit / Due' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Payment Ref / UTR No.
                  </label>
                  <input
                    type="text"
                    placeholder="Transaction ID / Ref. No."
                    value={paymentRefNo}
                    onChange={(e) => setPaymentRefNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Financial Summary Table */}
            <div className="bg-slate-50 rounded-xl p-3.5 space-y-2.5 border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Total Amount:</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                <div>
                  <label className="block text-[10px] text-slate-500 font-medium">Discount %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => {
                      setDiscountPercent(e.target.value === '' ? '' : Number(e.target.value));
                      setDiscountAmount('');
                    }}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-medium">Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) => {
                      setDiscountAmount(e.target.value === '' ? '' : Number(e.target.value));
                      setDiscountPercent('');
                    }}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-right"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                <span className="text-slate-800 font-semibold">Net Payable:</span>
                <span className="font-bold text-indigo-700 text-sm">{formatCurrency(netAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600">Received / Paid:</span>
                <input
                  type="number"
                  min={0}
                  placeholder={String(netAmount)}
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-24 px-2 py-1 text-xs text-right font-bold border border-slate-200 rounded bg-white text-emerald-700"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-semibold">Due Balance:</span>
                <span className={`font-bold ${dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(dueAmount)}
                </span>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="space-y-2 pt-2">
              <button
                id="save-order-btn"
                type="submit"
                disabled={isSubmitting || selectedTests.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving Order…
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save & Book (F10)
                  </>
                )}
              </button>

              <Link
                href="/orders"
                className="block text-center py-2 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel & Return
              </Link>
            </div>
          </div>
        </div>
      </form>

      {/* Post-Registration Success Dialog with Immediate Original Slip Print */}
      {showSuccessModal && createdOrderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-800">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Registration & Order Booked!</h3>
                  <p className="text-xs text-emerald-100 font-mono">
                    Order ID: {createdOrderSuccess.orderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push(`/orders/${createdOrderSuccess._id}`);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Details */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Patient Name:</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {createdOrderSuccess.patientName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Doctor / Ref By:</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {createdOrderSuccess.doctorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Registration Date:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date().toLocaleString('en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-medium">Booked Tests:</span>
                  <span className="font-bold text-indigo-700">
                    {createdOrderSuccess.tests?.length || 0} Test(s)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => {
                    const url = `/print/slip/${createdOrderSuccess._id}?format=MAIN`;
                    window.open(url, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-200 cursor-pointer"
                >
                  <Printer size={16} /> Print Original Report Slip (MAIN)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowPrintModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Download size={14} /> Select Format / Tests
                  </button>

                  <Link
                    href={`/results/${createdOrderSuccess._id}`}
                    className="flex items-center justify-center gap-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Enter Test Results
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      // Reset form for next patient registration
                      setPatientName('');
                      setMobileNumber('');
                      setAge(28);
                      setSelectedTests([]);
                      setRemark('');
                      setShowSuccessModal(false);
                      toast('Form reset for next patient registration', { icon: '📝' });
                    }}
                    className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Book Next Patient
                  </button>

                  <Link
                    href={`/orders/${createdOrderSuccess._id}`}
                    className="flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-800 py-2.5 rounded-xl font-medium text-xs transition-colors"
                  >
                    View Order Details <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select to Print Modal (Screenshot 3) */}
      {createdOrderSuccess && (
        <SelectToPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          orderId={createdOrderSuccess._id}
          orderNumber={createdOrderSuccess.orderId}
          defaultFormat="MAIN"
          tests={(createdOrderSuccess.tests || []).map((t: any) => ({
            id: t._id || t.testCode,
            name: t.name,
            code: t.testCode,
          }))}
          onConfirmPrint={(selectedTestIds, format) => {
            setShowPrintModal(false);
            const query = selectedTestIds.join(',');
            const url = `/print/slip/${createdOrderSuccess._id}?format=${format}&tests=${query}`;
            window.open(url, '_blank');
          }}
        />
      )}
    </div>
  );
}
