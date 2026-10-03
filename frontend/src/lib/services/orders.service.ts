import apiClient from '@/lib/api-client';
import { extractList } from '@/lib/api-helper';
import type { Order, OrderStatus } from '@/types';

export interface OrdersListParams {
  search?: string;
  status?: string;
  priority?: string;
  clinicId?: string;
  page?: number;
  limit?: number;
}

export interface OrdersListResponse {
  data: Order[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface CreateOrderPayload {
  patientId: string;
  clinicId: string;
  referringDoctorId?: string;
  priority: 'routine' | 'urgent' | 'stat';
  testIds: string[];
  discountAmount?: number;
  notes?: string;
}

export const ordersService = {
  list: async (params: OrdersListParams = {}): Promise<OrdersListResponse> => {
    const res = await apiClient.get('/orders', { params });
    return extractList<Order>(res.data);
  },

  get: async (id: string): Promise<Order> => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const res = await apiClient.post('/orders', payload);
    return res.data.data;
  },

  advanceStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const res = await apiClient.patch(`/orders/${id}/status`, { status });
    return res.data.data;
  },
};
