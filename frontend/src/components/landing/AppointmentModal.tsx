'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, User, Phone, MapPin, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPackage?: string;
}

export function AppointmentModal({
  isOpen,
  onClose,
  defaultPackage,
}: AppointmentModalProps) {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState(defaultPackage || 'Executive Full Body Health Checkup');
  const [collectionType, setCollectionType] = useState<'home' | 'lab'>('home');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('08:00 AM - 10:00 AM (Fasting)');
  const [address, setAddress] = useState('Hospital Road, Bhagalpur');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error('Please enter patient name');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success('Lab appointment booked successfully!');
    }, 700);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setPatientName('');
    setPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight">Make A Lab Appointment</h3>
            <p className="text-xs text-cyan-100">At-Lab Diagnostic Testing or Doorstep Blood Collection</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">Appointment Booked!</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Thank you, <strong>{patientName}</strong>. Your appointment for <strong>{serviceType}</strong> on <strong>{date}</strong> ({timeSlot}) is scheduled.
              </p>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono">
                Booking ID: APT-{Date.now().toString().slice(-6)}
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="px-6 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCollectionType('home')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  collectionType === 'home'
                    ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🏠 Free Home Collection
              </button>
              <button
                type="button"
                onClick={() => setCollectionType('lab')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  collectionType === 'lab'
                    ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🏥 Visit Laboratory
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Patient Full Name</label>
              <div className="relative mt-1">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Anant Kumar Singh"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Mobile Number (For Report SMS & Call)</label>
              <div className="relative mt-1">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="10-digit Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Selected Test or Health Package</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 mt-1 cursor-pointer"
              >
                <option value="Executive Full Body Health Checkup">Executive Full Body Health Checkup (72 Tests)</option>
                <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC) with ESR</option>
                <option value="Advanced Diabetic & Metabolic Care">Advanced Diabetic Care (HbA1c + Sugar)</option>
                <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</option>
                <option value="Lipid Profile Complete">Lipid Profile Complete</option>
                <option value="Thyroid Profile (T3, T4, TSH)">Thyroid Profile (T3, T4, TSH)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Preferred Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 mt-1 cursor-pointer font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 mt-1 cursor-pointer"
                >
                  <option value="07:00 AM - 09:00 AM">07:00 AM - 09:00 AM</option>
                  <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                  <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                  <option value="04:00 PM - 07:00 PM">04:00 PM - 07:00 PM</option>
                </select>
              </div>
            </div>

            {collectionType === 'home' && (
              <div>
                <label className="text-xs font-semibold text-slate-700">Doorstep Address</label>
                <input
                  type="text"
                  placeholder="Street / House No, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 mt-1"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold text-sm shadow-md shadow-cyan-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Scheduling Appointment…
                </>
              ) : (
                'Confirm & Book Appointment'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
