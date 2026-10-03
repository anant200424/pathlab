'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Microscope, FlaskConical, Atom, Dna, ArrowRight,
  ShieldCheck, CheckCircle2, Star, Sparkles, Award
} from 'lucide-react';

interface LandingHeroProps {
  onOpenAppointmentModal: () => void;
  onOpenReportTrackerModal: () => void;
}

export function LandingHero({
  onOpenAppointmentModal,
  onOpenReportTrackerModal,
}: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/40 to-teal-50/20 py-12 lg:py-20">
      {/* Background ambient lighting matching screenshot */}
      <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-cyan-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* ─── Left Side: Doctor Card matching Screenshot ─── */}
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-[420px]">
              {/* Main Card with rounded corners */}
              <div className="bg-white rounded-[36px] shadow-2xl shadow-cyan-900/10 border border-slate-100 overflow-hidden p-3 transition-transform hover:-translate-y-1 duration-300">
                {/* Doctor Image Container */}
                <div className="relative aspect-4/5 rounded-[28px] overflow-hidden bg-gradient-to-b from-cyan-500/20 via-teal-500/30 to-teal-700/80">
                  <Image
                    src="/images/hero-doctor.jpg"
                    alt="Chief Clinical Pathologist Jessica Miller"
                    fill
                    priority
                    className="object-cover object-top"
                  />

                  {/* Top-Left Floating Molecule Badge matching screenshot */}
                  <div className="absolute top-4 left-4 w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-teal-600 border border-teal-100/60 animate-pulse">
                    <Atom size={22} className="stroke-[2.2]" />
                  </div>

                  {/* Right Floating Chemical Flask Badge matching screenshot */}
                  <div className="absolute top-24 right-4 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-teal-600 border border-teal-100/60">
                    <FlaskConical size={20} className="stroke-[2.2]" />
                  </div>

                  {/* Floating Pill Badge: PHD in pathology - University of New York */}
                  <div className="absolute top-36 -left-3 sm:left-2 bg-white/90 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-white/80 flex items-center gap-2.5 max-w-[240px]">
                    <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center flex-shrink-0">
                      <Microscope size={17} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-900 leading-tight">
                        PHD in pathology
                      </p>
                      <p className="text-[9px] font-medium text-slate-500 leading-tight">
                        University of New York
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Details matching screenshot: Jessica Miller / Pathologist */}
                <div className="pt-5 pb-3 text-center">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    Jessica Miller
                  </h3>
                  <p className="text-sm font-bold text-teal-600 tracking-wide mt-0.5 font-sans">
                    Chief Pathologist & Lab Director
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-1.5">
                      4.9 (1.2k+ reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative background glow badge */}
              <div className="absolute -bottom-4 -right-4 -z-10 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl" />
            </div>
          </div>

          {/* ─── Right Side: Hero Content matching Screenshot ─── */}
          <div className="lg:col-span-7 space-y-7 order-1 lg:order-2 lg:pl-6">
            <div className="space-y-4">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold tracking-wide">
                <Sparkles size={14} className="text-teal-600" />
                <span>NABL Accredited & 100% Reliable Diagnostics</span>
              </div>

              {/* Main Headline matching Screenshot */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Providing Highest Standard of Clinical{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
                  Laboratory Service
                </span>
              </h1>

              {/* Subtitle matching Screenshot */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                We have world class pathologists & Lab assistants. We are equipped with best
                laboratory machinery & reagents. We ensure best quality findings.
              </p>
            </div>

            {/* Action Buttons matching Screenshot */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Button 1: Cyan/Turquoise Pill matching screenshot */}
              <a
                href="#services"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-500 hover:from-teal-500 hover:to-cyan-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-cyan-200/60 hover:shadow-cyan-300 transition-all transform hover:-translate-y-0.5 cursor-pointer text-center"
              >
                Get Patholab Services
              </a>

              {/* Button 2: Deep Navy Blue Pill matching screenshot */}
              <button
                onClick={onOpenAppointmentModal}
                className="px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all transform hover:-translate-y-0.5 cursor-pointer text-center"
              >
                Book A Lab Visit
              </button>

              {/* Button 3: Track Report Slip */}
              <button
                onClick={onOpenReportTrackerModal}
                className="px-6 py-4 rounded-full border-2 border-teal-500 text-teal-700 hover:bg-teal-50 font-bold text-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Track Report Slip</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Metrics Counters matching Screenshot (500+ / 2M+ / 100+) */}
            <div className="pt-8 border-t border-slate-200/70 grid grid-cols-3 gap-6 sm:gap-10">
              <div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-cyan-600 tracking-tight font-sans">
                  500+
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                  Patients Served Daily
                </p>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-cyan-600 tracking-tight font-sans">
                  2M+
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                  Reports Delivered
                </p>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-cyan-600 tracking-tight font-sans">
                  100+
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                  Expert Specialists
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
