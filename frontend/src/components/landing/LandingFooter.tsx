'use client';

import React from 'react';
import Link from 'next/link';
import { Microscope, Phone, Mail, MapPin, ShieldCheck, Clock, Award, ArrowUp } from 'lucide-react';

export function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-cyan-900/40">
                <Microscope size={22} className="stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white tracking-tight leading-none">
                  patholab
                </span>
                <span className="text-[10px] font-bold text-teal-400 tracking-[0.25em] uppercase leading-none mt-1 font-mono">
                  LABORATORY
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pr-4">
              Providing highest standard of clinical laboratory service. State-of-the-art diagnostic
              machinery, automated hematology analyzers, and post-graduate pathologist verification on every slip.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-teal-300 font-mono">
                NABL Accredited
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-teal-300 font-mono">
                ISO 15189:2022
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#services" className="hover:text-teal-400 transition-colors">Our Services</a></li>
              <li><a href="#packages" className="hover:text-teal-400 transition-colors">Health Packages</a></li>
              <li><a href="#doctors" className="hover:text-teal-400 transition-colors">Pathologist Team</a></li>
              <li><Link href="/login" className="hover:text-teal-400 transition-colors">Staff Portal Login</Link></li>
              <li><Link href="/orders/new" className="hover:text-teal-400 transition-colors">Direct Reception Entry</Link></li>
            </ul>
          </div>

          {/* Clinical Departments */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Departments</h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400">Clinical Hematology & Blood Bank</li>
              <li className="text-slate-400">Clinical Biochemistry & Immunoassay</li>
              <li className="text-slate-400">Medical Microbiology & Mycology</li>
              <li className="text-slate-400">Molecular Diagnostics & Viral PCR</li>
              <li className="text-slate-400">Histopathology & Cytology</li>
            </ul>
          </div>

          {/* Lab Contact Details */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Central Laboratory</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-400">Hospital Road, Near JLNMCH, Bhagalpur, Bihar - 812001</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-teal-400 flex-shrink-0" />
                <span className="text-slate-200 font-bold font-mono">+91 94312 00001 / +91 94312 00002</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={15} className="text-teal-400 flex-shrink-0" />
                <span className="text-emerald-400 font-semibold">Open 24 Hours / 7 Days a Week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 patholab laboratory - ShuLab Diagnostics Systems. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Back to Top"
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
