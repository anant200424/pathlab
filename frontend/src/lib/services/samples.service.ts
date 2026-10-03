import apiClient from '@/lib/api-client';
import { extractList } from '@/lib/api-helper';
import type { Sample } from '@/types';

export const samplesService = {
  list: async (params: { status?: string; page?: number; limit?: number } = {}): Promise<{ data: Sample[]; pagination: object }> => {
    const res = await apiClient.get('/samples', { params });
    return extractList<Sample>(res.data);
  },

  getByBarcode: async (barcode: string): Promise<Sample> => {
    const res = await apiClient.get(`/samples/barcode/${barcode}`);
    return res.data.data;
  },

  collect: async (id: string): Promise<Sample> => {
    const res = await apiClient.post(`/samples/${id}/collect`);
    return res.data.data;
  },

  accept: async (id: string): Promise<Sample> => {
    const res = await apiClient.post(`/samples/${id}/accept`);
    return res.data.data;
  },

  reject: async (id: string, reason: string): Promise<Sample> => {
    const res = await apiClient.post(`/samples/${id}/reject`, { reason });
    return res.data.data;
  },

  recollect: async (id: string): Promise<Sample> => {
    const res = await apiClient.post(`/samples/${id}/recollect`);
    return res.data.data;
  },
};
