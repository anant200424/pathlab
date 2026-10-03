'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Microscope, PhoneCall, Search, Menu, X, ChevronDown, UserCircle, Calendar, FileText } from 'lucide-react';

interface LandingNavbarProps {
  onOpenAppointmentModal: () => void;
  onOpenReportTrackerModal: () => void;
}

export function LandingNavbar({
  onOpenAppointmentModal,
  onOpenReportTrackerModal,
}: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* ─── Logo matching Screenshot (patholab LABORATORY) ─── */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-cyan-200 group-hover:scale-105 transition-transform">
              <Microscope size={22} className="stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-slate-900 tracking-tight leading-none font-sans">
                patholab
              </span>
              <span className="text-[10px] font-bold text-teal-600 tracking-[0.25em] uppercase leading-none mt-1 font-mono">
                LABORATORY
              </span>
            </div>
          </Link>

          {/* ─── Navigation Links matching Screenshot ─── */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <Link
              href="/"
              className="text-teal-600 font-bold flex items-center gap-1 hover:text-teal-700 transition-colors"
            >
              Home <ChevronDown size={14} />
            </Link>
            <a
              href="#services"
              className="hover:text-teal-600 transition-colors flex items-center gap-1"
            >
              Services <ChevronDown size={14} />
            </a>
            <a
              href="#packages"
              className="hover:text-teal-600 transition-colors"
            >
              Health Packages
            </a>
            <button
              onClick={onOpenReportTrackerModal}
              className="hover:text-teal-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <FileText size={14} className="text-teal-500" />
              <span>Track Report Slip</span>
            </button>
            <a
              href="#doctors"
              className="hover:text-teal-600 transition-colors"
            >
              Our Pathologists
            </a>
            <a
              href="#contact"
              className="hover:text-teal-600 transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* ─── Right CTA Action Buttons matching Screenshot ─── */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-full border border-slate-200 transition-all flex items-center gap-1.5"
            >
              <UserCircle size={15} />
              <span>Lab Portal</span>
            </Link>

            <button
              onClick={onOpenAppointmentModal}
              id="make-appointment-btn"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-500 hover:from-teal-500 hover:to-cyan-600 text-white font-bold text-sm shadow-md shadow-cyan-200 hover:shadow-lg hover:shadow-cyan-300 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <Calendar size={15} />
              <span>Make Appointment</span>
            </button>
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenAppointmentModal}
              className="px-3 py-1.5 rounded-full bg-teal-500 text-white text-xs font-bold"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 py-4 px-2 space-y-3 bg-white animate-in slide-in-from-top-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-teal-600"
            >
              Home
            </Link>
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Services
            </a>
            <a
              href="#packages"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Health Packages
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReportTrackerModal();
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <FileText size={15} className="text-teal-600" />
              <span>Track Report Slip</span>
            </button>
            <a
              href="#doctors"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Our Pathologists
            </a>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAppointmentModal();
                }}
                className="w-full py-2.5 rounded-full bg-teal-500 text-white font-bold text-sm text-center"
              >
                Make Appointment
              </button>
              <Link
                href="/login"
                className="w-full py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold text-sm text-center"
              >
                Staff Portal Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
