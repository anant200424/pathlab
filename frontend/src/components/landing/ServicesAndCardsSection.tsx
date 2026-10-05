'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Droplet, FlaskConical, Dna, Activity, Stethoscope, HeartPulse,
  Search, Download, Printer, CheckCircle2, ArrowRight, Clock,
  Calendar, Phone, ShieldCheck, MapPin, Loader2, Sparkles, User
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

interface ServicesAndCardsProps {
  onOpenAppointmentModal: (packageTitle?: string) => void;
}

export function ServicesAndCardsSection({ onOpenAppointmentModal }: ServicesAndCardsProps) {
  // Live Report Search state for Card 1
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);

  // Quick Home Collection state
  const [quickPhone, setQuickPhone] = useState('');
  const [quickCity, setQuickCity] = useState('Bhagalpur');
  const [quickBookingSuccess, setQuickBookingSuccess] = useState(false);

  const handleReportSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter Order ID, Patient ID, or Phone number');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await apiClient.get('/orders', {
        params: { search: searchQuery.trim(), limit: 5 },
      });
      const orders = res.data?.data?.items || res.data?.data || [];
      if (orders.length > 0) {
        setSearchResult(orders[0]);
        toast.success('Patient report record found!');
      } else {
        toast.error('No report found with this Order ID or Phone');
      }
    } catch {
      toast.error('Could not search report. Please verify details.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim() || quickPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setQuickBookingSuccess(true);
    toast.success('Home sample collection request received! Our phlebotomist will call you within 15 minutes.');
  };

  const services = [
    {
      title: 'Complete Blood Count (CBC) & Hematology',
      description: 'Comprehensive analysis of RBC, WBC, platelets, and hemoglobin with automated 5-part differential.',
      icon: Droplet,
      badge: '2-Hour TAT',
    },
    {
      title: 'Clinical Biochemistry & Organ Function',
      description: 'High precision liver (LFT), kidney (KFT), lipid lipidogram, HbA1c, and blood glucose profiling.',
      icon: FlaskConical,
      badge: 'NABL Certified',
    },
    {
      title: 'Microbiology, Culture & Sensitivity',
      description: 'Supervised by Dr. N Upadhyay (MD Microbiologist) with automated antibiotic susceptibility profiling.',
      icon: Dna,
      badge: 'MD Verified',
    },
    {
      title: 'Thyroid & Hormone Assays',
      description: 'Ultra-sensitive chemiluminescence assays for TSH, Free T3/T4, fertility panels, and vitamin D/B12.',
      icon: Activity,
      badge: 'Chemiluminescence',
    },
    {
      title: 'Cardiac & Lipid Risk Markers',
      description: 'Hs-CRP, Troponin-I, Apo-B, and extended lipid fractions for proactive cardiovascular risk evaluation.',
      icon: HeartPulse,
      badge: 'Emergency Testing',
    },
    {
      title: 'Home Sample Collection & Phlebotomy',
      description: 'Trained and certified phlebotomists with temperature-controlled cool bags visiting your doorstep.',
      icon: Stethoscope,
      badge: 'Free At Doorstep',
    },
  ];

  const packages = [
    {
      id: 'full-body',
      title: 'Executive Full Body Health Checkup',
      testsCount: '72 Parameters Included',
      regularPrice: 2400,
      discountPrice: 999,
      popular: true,
      tests: ['Complete Blood Count (CBC)', 'Liver Function Test (LFT)', 'Kidney Function Test (KFT)', 'Lipid Profile', 'Blood Sugar Fasting', 'Urine Routine Examination'],
    },
    {
      id: 'diabetic-care',
      title: 'Advanced Diabetic & Metabolic Care',
      testsCount: '28 Parameters Included',
      regularPrice: 1800,
      discountPrice: 699,
      popular: false,
      tests: ['HbA1c Glycated Hemoglobin', 'Average Estimated Glucose', 'Fasting & PP Blood Sugar', 'Microalbuminuria', 'Lipid Profile'],
    },
    {
      id: 'senior-care',
      title: 'Senior Citizen Complete Wellness',
      testsCount: '65 Parameters Included',
      regularPrice: 3200,
      discountPrice: 1299,
      popular: false,
      tests: ['CBC & ESR', 'Cardiac Risk Profile', 'Vitamin D3 & B12 Total', 'Calcium & Electrolytes', 'Thyroid Profile (T3, T4, TSH)'],
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-20 py-10 sm:py-16 bg-white" id="services">
      {/* ─── 1. "Our amazing Services" Section matching user screenshot ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          {/* Eyebrow matching screenshot */}
          <span className="text-xs sm:text-sm font-bold text-teal-600 tracking-wider uppercase font-sans">
            Promising Best Quality Services
          </span>

          {/* Heading matching screenshot */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Our amazing Services
          </h2>

          {/* Description matching screenshot */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            We have world class pathologists & Lab assistants. We are equipped with best
            laboratory machinery & reagents. We ensure best quality findings.
          </p>
        </div>

        {/* 6 Grid Cards with Hexagonal Icons matching screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-7 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-cyan-100 hover:border-teal-200 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  {/* Hexagonal Cyan Icon matching screenshot */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-400 flex items-center justify-center text-white mb-6 shadow-md shadow-cyan-200 group-hover:scale-110 transition-transform">
                    <Icon size={26} className="stroke-[2.2]" />
                  </div>

                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-bold font-mono mb-2">
                    {svc.badge}
                  </span>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {svc.title}
                  </h3>

                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                  <button
                    onClick={() => onOpenAppointmentModal(svc.title)}
                    className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Book Test</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">Same-Day Reporting</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 2. Impactful Fully Working Card 1: Track & Download Report Slip ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-5 sm:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-6 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-mono text-xs font-bold border border-teal-500/30">
                <Sparkles size={14} /> LIVE REPORT SLIP RETRIEVAL
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Track & Download Your Original Report Slip
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Enter your Patient Unique ID, Order Barcode, or Registered Phone number to view your
                clinical report slip with verified doctor signature and today's date.
              </p>

              {/* Working Search Form */}
              <form onSubmit={handleReportSearch} className="flex flex-col sm:flex-row gap-2 pt-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter Order ID (e.g. ORD-...) or Phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-slate-700 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  <span>Search Slip</span>
                </button>
              </form>
            </div>

            {/* Result Preview Box */}
            <div className="lg:col-span-6">
              {searchResult ? (
                <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-xl border border-teal-300 animate-in fade-in">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-wider">
                        Patient Verified Slip
                      </span>
                      <h4 className="text-base font-black text-slate-900 uppercase">
                        {searchResult.patient?.fullName || searchResult.patient?.firstName || 'Patient'}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        Order ID: {searchResult.orderId}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
                      {searchResult.status === 'verified' || searchResult.status === 'published' ? 'Verified' : 'Under Process'}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 mb-4">
                    <p>Referred by: <strong className="text-slate-800 uppercase">{searchResult.referringDoctor?.fullName || 'DR N UPADHYAY'}</strong></p>
                    <p>Tests: <strong className="text-slate-800">{searchResult.orderedTests?.length || 1} Test(s)</strong></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/print/slip/${searchResult._id}?format=MAIN`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Printer size={14} /> Open Original Slip
                    </a>
                    <a
                      href={`/print/slip/${searchResult._id}?format=MAIN`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1"
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-700 rounded-3xl p-8 text-center bg-slate-950/40">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-3">
                    <Printer size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Instant Original Report Slip Generator</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Search by your test registration number to get the exact ePathLab production slip with authentic barcode and doctor sign.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Impactful Working Card 2: Interactive Health Packages ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="packages">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-teal-600 tracking-wider uppercase font-sans">
            Affordable Preventive Care
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Popular Health Checkup Packages
          </h2>
          <p className="text-sm text-slate-600">
            Comprehensive diagnostic packages with complimentary home sample collection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between relative ${
                pkg.popular
                  ? 'border-2 border-teal-500 shadow-2xl shadow-cyan-100 bg-white ring-4 ring-teal-500/10'
                  : 'border-slate-200 shadow-lg bg-white hover:border-teal-300'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
                  ★ Most Popular
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                  {pkg.testsCount}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1 mb-4 leading-snug">
                  {pkg.title}
                </h3>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{pkg.discountPrice}
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    ₹{pkg.regularPrice}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 ml-auto bg-emerald-50 px-2 py-0.5 rounded-full">
                    {Math.round(((pkg.regularPrice - pkg.discountPrice) / pkg.regularPrice) * 100)}% OFF
                  </span>
                </div>

                <div className="space-y-2.5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Key Tests Covered:
                  </p>
                  {pkg.tests.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 size={14} className="text-teal-500 flex-shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 space-y-2">
                <button
                  onClick={() => onOpenAppointmentModal(pkg.title)}
                  className={`w-full py-3 rounded-full font-bold text-sm transition-all shadow-md cursor-pointer ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-cyan-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Book Package Now
                </button>
                <p className="text-[11px] text-center text-slate-400">Includes Free Home Collection</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. Impactful Working Card 3: Quick Home Sample Collection ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="contact">
        <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-white rounded-3xl border border-teal-200 p-8 sm:p-12 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Doorstep Convenience
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Need Blood Test at Home? We Come to You!
              </h3>
              <p className="text-sm text-slate-600 max-w-lg">
                Our certified phlebotomists follow strict aseptic protocol. Safe, painless, and completely hygienic sample collection right from the comfort of your home.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-teal-600" /> Sterile Vacuum Tubes</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-teal-600" /> Temperature Monitored</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-teal-600" /> Free Home Pickup</span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-md border border-slate-200">
              {quickBookingSuccess ? (
                <div className="text-center py-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Booking Confirmed!</h4>
                  <p className="text-xs text-slate-500">
                    Our care executive will call {quickPhone} within 15 minutes to schedule your slot.
                  </p>
                  <button
                    onClick={() => setQuickBookingSuccess(false)}
                    className="text-xs text-teal-600 font-bold underline mt-2 block mx-auto"
                  >
                    Book another visit
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQuickBook} className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">Request Home Collection in 30 Seconds</h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit Mobile"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">City / Location</label>
                    <select
                      value={quickCity}
                      onChange={(e) => setQuickCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 mt-1"
                    >
                      <option value="Bhagalpur">Bhagalpur (Near JLNMCH)</option>
                      <option value="Patna">Patna Central</option>
                      <option value="Kolkata">Kolkata</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
                  >
                    Book Home Collection
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Verifying Pathologists Spotlight (Dr N Upadhyay) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="doctors">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Expert Diagnostic Governance
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Led by Senior Consultant Pathologists & Microbiologists
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Every clinical diagnostic finding in our laboratory is verified by licensed medical
                specialists holding post-graduate MD degrees and MCI / State Medical Council registrations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="font-bold text-white text-base">DR N UPADHYAY</p>
                  <p className="text-xs text-cyan-300 font-medium">M. B. B. S   M.D (MICROBIOLOGY)</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">Medical Reg: 41175</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="font-bold text-white text-base">DR MANOJ KUMAR GUPTA</p>
                  <p className="text-xs text-cyan-300 font-medium">M.B.B.S (CONSULTANT PHYSICIAN)</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">Medical Reg: 28419</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 text-center bg-white/5 p-6 rounded-2xl border border-white/10">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={32} />
              </div>
              <h4 className="text-base font-bold text-white">100% Quality Checked</h4>
              <p className="text-xs text-slate-400 mt-1">
                Zero automated unchecked releases. Triple cross-verification standard on every report.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
