import apiClient from '@/lib/api-client';
import { extractList } from '@/lib/api-helper';
import type { Report } from '@/types';

export const reportsService = {
  generate: async (orderId: string): Promise<Report> => {
    const res = await apiClient.post(`/reports/${orderId}/generate`);
    return res.data.data;
  },

  get: async (id: string): Promise<Report> => {
    const res = await apiClient.get(`/reports/${id}`);
    return res.data.data;
  },

  list: async (params: { page?: number; limit?: number } = {}): Promise<{ data: Report[]; pagination: object }> => {
    const res = await apiClient.get('/reports', { params });
    return extractList<Report>(res.data);
  },

  getDownloadUrl: (id: string, format: 'pdf' | 'docx'): string => {
    return `${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/download?format=${format}`;
  },

  download: async (id: string, format: 'pdf' | 'docx'): Promise<void> => {
    const res = await apiClient.get(`/reports/${id}/download`, {
      params: { format },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${id}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getPrintUrl: (id: string, format = 'MAIN'): string => {
    return `/print/slip/${id}?format=${format}`;
  },

  getVersions: async (id: string) => {
    const res = await apiClient.get(`/reports/${id}/versions`);
    return res.data.data;
  },

  getByPatient: async (patientId: string): Promise<Report[]> => {
    const res = await apiClient.get(`/reports/patient/${patientId}`);
    return res.data.data;
  },
};
