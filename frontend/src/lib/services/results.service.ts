import apiClient from '@/lib/api-client';
import type { Result, ResultFlag } from '@/types';

export interface EnterResultPayload {
  parameters: Array<{
    name: string;
    value: string | number;
    unit?: string;
    flag?: ResultFlag;
  }>;
  notes?: string;
}

export const resultsService = {
  getByOrder: async (orderId: string): Promise<Result[]> => {
    const res = await apiClient.get(`/results/order/${orderId}`);
    return res.data.data;
  },

  enter: async (id: string, payload: EnterResultPayload): Promise<Result> => {
    const res = await apiClient.post(`/results/${id}/enter`, payload);
    return res.data.data;
  },

  verify: async (id: string, notes?: string): Promise<Result> => {
    const res = await apiClient.post(`/results/${id}/verify`, { notes });
    return res.data.data;
  },

  reject: async (id: string, reason: string): Promise<Result> => {
    const res = await apiClient.post(`/results/${id}/reject`, { reason });
    return res.data.data;
  },

  amend: async (id: string, payload: EnterResultPayload & { amendReason: string }): Promise<Result> => {
    const res = await apiClient.post(`/results/${id}/amend`, payload);
    return res.data.data;
  },
};
