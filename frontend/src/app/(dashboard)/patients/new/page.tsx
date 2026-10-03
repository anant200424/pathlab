'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, UserPlus, User } from 'lucide-react';
import Link from 'next/link';
import { patientsService } from '@/lib/services/patients.service';

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

function FormField({ label, id, error, required, children }: {
  label: string; id: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all';
const selectCls = inputCls + ' cursor-pointer';

export default function NewPatientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [titlePrefix, setTitlePrefix] = useState('Mr.');
  const [ageYears, setAgeYears] = useState<number | ''>('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: { gender: 'male', bloodGroup: '', city: 'Bhagalpur' },
  });

  const handleTitleChange = (prefix: string) => {
    setTitlePrefix(prefix);
    if (prefix === 'Mr.' || prefix === 'Master') {
      setValue('gender', 'male');
    } else if (prefix === 'Mrs.' || prefix === 'Ms.' || prefix === 'Miss') {
      setValue('gender', 'female');
    }
  };

  const handleAgeChange = (ageVal: string) => {
    const num = parseInt(ageVal);
    if (!isNaN(num) && num >= 0) {
      setAgeYears(num);
      const d = new Date();
      d.setFullYear(d.getFullYear() - num);
      setValue('dateOfBirth', d.toISOString().split('T')[0]);
    } else {
      setAgeYears('');
    }
  };

  const onSubmit = async (data: PatientForm) => {
    setIsLoading(true);
    try {
      const fullName = `${titlePrefix ? titlePrefix + ' ' : ''}${data.firstName || ''} ${data.lastName || ''}`.trim();
      const patient = await patientsService.create({
        fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        email: data.email || undefined,
        bloodGroup: data.bloodGroup || undefined,
        address: {
          line1: data.street || '',
          street: data.street,
          city: data.city || 'Bhagalpur',
          state: data.state || 'Bihar',
          postalCode: data.postalCode,
        },
      });
      const id = patient._id || (patient as any).id;
      const displayId = patient.patientId || id;
      toast.success(`Patient registered! ID: ${displayId}`);
      if (id) {
        router.push(`/patients/${id}`);
      } else {
        router.push('/patients');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to register patient';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft size={14} /> Back to Patients
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-indigo-50 rounded-lg"><User size={15} className="text-indigo-600" /></div>
            <h2 className="text-sm font-semibold text-slate-900">Personal Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Prefix & First Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={titlePrefix}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-24 px-2 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Master', 'Baby', 'Baby of', 'Dr.'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="First name"
                  className={inputCls}
                />
              </div>
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>

            <FormField label="Last Name" id="lastName" error={errors.lastName?.message} required>
              <input id="lastName" {...register('lastName')} placeholder="Last name" className={inputCls} />
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Age (Years)</label>
                <input
                  type="number"
                  min={0}
                  max={130}
                  placeholder="e.g. 28"
                  value={ageYears}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className={inputCls}
                />
              </div>
              <FormField label="Gender" id="gender" error={errors.gender?.message} required>
                <select id="gender" {...register('gender')} className={selectCls}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
            </div>

            <FormField label="Date of Birth" id="dateOfBirth" error={errors.dateOfBirth?.message} required>
              <input id="dateOfBirth" type="date" {...register('dateOfBirth')} className={inputCls} />
            </FormField>

            <FormField label="Blood Group" id="bloodGroup" error={errors.bloodGroup?.message}>
              <select id="bloodGroup" {...register('bloodGroup')} className={selectCls}>
                <option value="">Select blood group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5">Contact Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone Number" id="phone" error={errors.phone?.message} required>
              <input id="phone" type="tel" {...register('phone')} placeholder="+91 98765 43210" className={inputCls} />
            </FormField>
            <FormField label="Email Address" id="email" error={errors.email?.message}>
              <input id="email" type="email" {...register('email')} placeholder="patient@email.com" className={inputCls} />
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5">Address (Optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Street Address" id="street" error={errors.street?.message}>
                <input id="street" {...register('street')} placeholder="12, MG Road" className={inputCls} />
              </FormField>
            </div>
            <FormField label="City" id="city" error={errors.city?.message}>
              <input id="city" {...register('city')} placeholder="Bhagalpur" className={inputCls} />
            </FormField>
            <FormField label="State" id="state" error={errors.state?.message}>
              <input id="state" {...register('state')} placeholder="Bihar" className={inputCls} />
            </FormField>
            <FormField label="Postal Code" id="postalCode" error={errors.postalCode?.message}>
              <input id="postalCode" {...register('postalCode')} placeholder="560001" className={inputCls} />
            </FormField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/patients" className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button
            id="register-patient-submit-btn"
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-200"
          >
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Registering…</> : <><UserPlus size={14} /> Register Patient</>}
          </button>
        </div>
      </form>
    </div>
  );
}
