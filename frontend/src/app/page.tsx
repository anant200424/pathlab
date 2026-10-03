'use client';

import React, { useState } from 'react';
import { TopLabVideoBanner } from '@/components/landing/TopLabVideoBanner';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { ServicesAndCardsSection } from '@/components/landing/ServicesAndCardsSection';
import { AppointmentModal } from '@/components/landing/AppointmentModal';
import { ReportTrackerModal } from '@/components/landing/ReportTrackerModal';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function HomePage() {
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [reportTrackerModalOpen, setReportTrackerModalOpen] = useState(false);
  const [selectedPackageForBooking, setSelectedPackageForBooking] = useState<string | undefined>(undefined);

  const handleOpenAppointment = (packageName?: string) => {
    setSelectedPackageForBooking(packageName);
    setAppointmentModalOpen(true);
  };

  const handleOpenReportTracker = () => {
    setReportTrackerModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* ─── Top Clinical Laboratory Animation Video Showcase ─── */}
      <TopLabVideoBanner />

      {/* ─── Navigation Header matching Screenshot (patholab LABORATORY) ─── */}
      <LandingNavbar
        onOpenAppointmentModal={() => handleOpenAppointment()}
        onOpenReportTrackerModal={handleOpenReportTracker}
      />

      {/* ─── Hero Section with Pathologist Card and Headline matching Screenshot ─── */}
      <LandingHero
        onOpenAppointmentModal={() => handleOpenAppointment()}
        onOpenReportTrackerModal={handleOpenReportTracker}
      />

      {/* ─── "Our amazing Services" and Impactful Working Cards ─── */}
      <ServicesAndCardsSection
        onOpenAppointmentModal={handleOpenAppointment}
      />

      {/* ─── Interactive Booking & Appointment Modal ─── */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        defaultPackage={selectedPackageForBooking}
      />

      {/* ─── Live Report Slip Lookup Modal ─── */}
      <ReportTrackerModal
        isOpen={reportTrackerModalOpen}
        onClose={() => setReportTrackerModalOpen(false)}
      />

      {/* ─── Footer ─── */}
      <LandingFooter />
    </main>
  );
}
