import apiClient from '@/lib/api-client';
import { extractList } from '@/lib/api-helper';
import type { Invoice } from '@/types';

export interface RecordPaymentPayload {
  method: 'cash' | 'card' | 'upi' | 'net_banking';
  amount: number;
  reference?: string;
}

export const billingService = {
  createInvoice: async (orderId: string): Promise<Invoice> => {
    const res = await apiClient.post('/billing/invoices', { orderId });
    return res.data.data;
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const res = await apiClient.get(`/billing/invoices/${id}`);
    return res.data.data;
  },

  listInvoices: async (params: { status?: string; page?: number; limit?: number } = {}): Promise<{ data: Invoice[]; pagination: object }> => {
    const res = await apiClient.get('/billing/invoices', { params });
    return extractList<Invoice>(res.data);
  },

  recordPayment: async (payload: RecordPaymentPayload & { invoiceId: string }): Promise<Invoice> => {
    const res = await apiClient.post('/billing/payments', payload);
    return res.data.data;
  },

  issueRefund: async (invoiceId: string, amount: number, reason: string): Promise<Invoice> => {
    const res = await apiClient.post('/billing/refunds', { invoiceId, amount, reason });
    return res.data.data;
  },

  getDailyCollections: async (date?: string) => {
    const res = await apiClient.get('/billing/daily-collections', { params: { date } });
    return res.data.data;
  },
};
