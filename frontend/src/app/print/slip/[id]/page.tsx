'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrder, useOrderResults } from '@/hooks';
import { ClinicalReportSlip, ReportSlipData } from '@/components/reports/ClinicalReportSlip';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StandalonePrintSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const formatParam = (searchParams.get('format') || 'MAIN') as
    | 'MAIN'
    | 'HEADERLESS'
    | 'SUMMARY'
    | 'COMPLETE';
  const selectedTestIdsParam = searchParams.get('tests');

  const orderQuery = useOrder(id);
  const resultsQuery = useOrderResults(id);

  const order = orderQuery.data;
  const results = resultsQuery.data ?? [];

  // Format today's date and registration date
  const formatSlipDateTime = (dateStr?: string | Date) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const slipData: ReportSlipData | null = useMemo(() => {
    if (!order) return null;

    const patient = order.patient as any;
    const patientName =
      patient?.fullName ||
      `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() ||
      'PATIENT';

    // Age string
    let patientAge = '28Y';
    if (patient?.ageYears) {
      patientAge = `${patient.ageYears}Y`;
    } else if (patient?.dateOfBirth) {
      const birth = new Date(patient.dateOfBirth);
      const age = new Date().getFullYear() - birth.getFullYear();
      patientAge = `${Math.max(1, age)}Y`;
    }

    const patientGender = (patient?.gender || 'MALE').toUpperCase();

    // Doctor info
    const doc = (order.referringDoctor || order.verifyingDoctor) as any;
    const referredByDoctor =
      doc?.displayName ||
      doc?.fullName ||
      (typeof order.referringDoctor === 'string' ? order.referringDoctor : 'SELF');

    const doctorQualification = doc?.qualification || 'M. B. B. S  M.D';
    const doctorSpecialization = doc?.specialization || 'MICROBIOLOGIST';
    const doctorRegNo = doc?.medicalRegistrationNumber || '41175';

    // Filter tests if specified
    const selectedIds = selectedTestIdsParam
      ? selectedTestIdsParam.split(',').filter(Boolean)
      : null;

    // Gather ordered tests
    const tests = (order.orderedTests || []).filter((ot: any) => {
      if (!selectedIds) return true;
      const testId = ot.test?._id || ot._id;
      return selectedIds.includes(testId);
    }).map((ot: any) => {
      const testObj = ot.test || {};
      const testId = testObj._id || ot._id;

      // Check if we have results recorded
      const matchedResult = results.find(
        (r: any) => (r.test?._id === testId || r.test === testId)
      );

      let parameters: any[] = [];
      if (matchedResult && matchedResult.parameters?.length > 0) {
        parameters = matchedResult.parameters.map((p: any) => ({
          name: p.name,
          value: p.value !== undefined ? p.value : '',
          unit: p.unit || '',
          referenceRange: p.referenceRange || '',
          flag: p.flag || 'normal',
        }));
      } else if (testObj.parameters && testObj.parameters.length > 0) {
        parameters = testObj.parameters.map((p: any) => ({
          name: p.name,
          value: '',
          unit: p.unit || '',
          referenceRange: p.referenceRanges?.[0]?.textRange || 'Normal',
          flag: 'normal',
        }));
      } else {
        parameters = [];
      }

      return {
        id: testId,
        testName: testObj.name || ot.name || 'Clinical Investigation',
        department: testObj.department || 'Pathology',
        parameters,
        remarks: matchedResult?.notes,
      };
    });

    const isVerified = order.status === 'verified' || order.status === 'published';
    const reportStatus = isVerified ? 'Verified' : 'Under Process';

    return {
      orderId: order.orderId || 'ORD-NEW',
      orderBarcode: order.orderBarcode,
      patientUniqueId: patient?.patientId || 'SH-1000000000',
      patientRegistrationNumber: patient?.patientId || 'SH-1000000000',
      patientName,
      patientAge,
      patientGender,
      mobileNo: patient?.phone || '',
      referredByDoctor,
      doctorQualification,
      doctorSpecialization,
      doctorRegNo,
      sampleRegdAt: formatSlipDateTime(order.createdAt),
      reportReleasedOn: isVerified ? formatSlipDateTime(new Date()) : '',
      reportStatus,
      clinicName: order.clinic?.name?.replace('LabCare Pro — ', '') || 'SHU LAB DIAGNOSTICS & RESEARCH CENTRE',
      clinicAddress: order.clinic?.address?.line1 || 'Hospital Road, Near JLNMCH, Bhagalpur, Bihar - 812001',
      clinicPhone: order.clinic?.contact?.phone || '+91 94312 00001',
      tests,
    };
  }, [order, results, selectedTestIdsParam]);

  if (orderQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="animate-spin text-blue-600" size={36} />
        <p className="text-sm font-semibold text-slate-600">
          Generating original report slip...
        </p>
      </div>
    );
  }

  if (orderQuery.error || !order || !slipData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-bold text-slate-800 mb-1">Report Slip Not Available</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          Could not load the requested test order. It may not exist or may have been removed.
        </p>
        <Link
          href="/orders"
          className="text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <ClinicalReportSlip
      data={slipData}
      format={formatParam}
      showBackLink={true}
      backHref={`/orders/${order._id}`}
    />
  );
}
