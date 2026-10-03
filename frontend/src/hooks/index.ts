'use client';

import { useState, useCallback } from 'react';
import { useQuery } from './useQuery';
import { patientsService, type PatientsListParams } from '@/lib/services/patients.service';
import { ordersService, type OrdersListParams } from '@/lib/services/orders.service';
import { samplesService } from '@/lib/services/samples.service';
import { resultsService } from '@/lib/services/results.service';
import { reportsService } from '@/lib/services/reports.service';
import { billingService } from '@/lib/services/billing.service';
import {
  analyticsService,
  inventoryService,
  notificationsService,
  auditService,
  doctorsService,
  testsService,
  clinicsService,
  usersService,
} from '@/lib/services/misc.service';

// ─── Patients ─────────────────────────────────────────────────────────────────

export function usePatients(params: PatientsListParams = {}) {
  return useQuery(
    () => patientsService.list(params),
    [params.search, params.gender, params.page]
  );
}

export function usePatient(id: string) {
  return useQuery(() => patientsService.get(id), [id]);
}

export function usePatientHistory(id: string) {
  return useQuery(() => patientsService.history(id), [id]);
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useOrders(params: OrdersListParams = {}) {
  return useQuery(
    () => ordersService.list(params),
    [params.search, params.status, params.priority, params.page]
  );
}

export function useOrder(id: string) {
  return useQuery(() => ordersService.get(id), [id]);
}

export function usePendingVerificationOrders() {
  return useQuery(
    () => ordersService.list({ status: 'awaiting_verification', limit: 50 }),
    []
  );
}

// ─── Samples ──────────────────────────────────────────────────────────────────

export function useSamples(params: { status?: string; page?: number } = {}) {
  return useQuery(
    () => samplesService.list(params),
    [params.status, params.page]
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

export function useOrderResults(orderId: string) {
  return useQuery(() => resultsService.getByOrder(orderId), [orderId]);
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export function useReports(params: { page?: number } = {}) {
  return useQuery(() => reportsService.list(params), [params.page]);
}

export function useReport(id: string) {
  return useQuery(() => reportsService.get(id), [id]);
}

export function usePatientReports(patientId: string) {
  return useQuery(() => reportsService.getByPatient(patientId), [patientId]);
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export function useInvoices(params: { status?: string; page?: number } = {}) {
  return useQuery(
    () => billingService.listInvoices(params),
    [params.status, params.page]
  );
}

export function useInvoice(id: string) {
  return useQuery(() => billingService.getInvoice(id), [id]);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useDashboardKPIs() {
  return useQuery(() => analyticsService.getDashboard(), []);
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export function useInventory(params: { page?: number } = {}) {
  return useQuery(() => inventoryService.list(params), [params.page]);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery(() => notificationsService.list(), []);
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export function useAuditLog(params: { page?: number; resource?: string } = {}) {
  return useQuery(() => auditService.list(params), [params.page, params.resource]);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

export function useTests(params: { search?: string; category?: string; page?: number; limit?: number } = {}) {
  return useQuery(
    () => testsService.list(params),
    [params.search, params.category, params.page, params.limit]
  );
}

export function useTestPackages() {
  return useQuery(() => testsService.listPackages(), []);
}

export function useTest(id: string) {
  return useQuery(() => testsService.get(id), [id]);
}

// ─── Doctors ──────────────────────────────────────────────────────────────────

export function useDoctors(params: { clinicId?: string; type?: string; page?: number } = {}) {
  return useQuery(
    () => doctorsService.list(params),
    [params.clinicId, params.type, params.page]
  );
}

export function useDoctor(id: string) {
  return useQuery(() => doctorsService.get(id), [id]);
}

// ─── Clinics ──────────────────────────────────────────────────────────────────

export function useClinics(params: { search?: string; page?: number } = {}) {
  return useQuery(
    () => clinicsService.list(params),
    [params.search, params.page]
  );
}

export function useClinic(id: string) {
  return useQuery(() => clinicsService.get(id), [id]);
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function useUsers(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery(
    () => usersService.list(params),
    [params.search, params.page]
  );
}

// ─── Barcode lookup (lazy — triggered manually) ───────────────────────────────

export function useBarcodeScanner() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof samplesService.getByBarcode>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const sample = await samplesService.getByBarcode(barcode.trim());
      setResult(sample);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Sample not found';
      setError(msg);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, error, lookup };
}
