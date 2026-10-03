import apiClient from '@/lib/api-client';
import { extractList } from '@/lib/api-helper';
import type { Test, Doctor, Clinic, InventoryItem, DashboardKPIs, Notification, AuditLog } from '@/types';

export const testsService = {
  list: async (params: { search?: string; category?: string; page?: number; limit?: number } = {}): Promise<{ data: Test[]; pagination: object }> => {
    const res = await apiClient.get('/tests', { params });
    return extractList<Test>(res.data);
  },

  get: async (id: string): Promise<Test> => {
    const res = await apiClient.get(`/tests/${id}`);
    return res.data.data;
  },

  create: async (payload: Partial<Test>): Promise<Test> => {
    const res = await apiClient.post('/tests', payload);
    return res.data.data;
  },

  update: async (id: string, payload: Partial<Test>): Promise<Test> => {
    const res = await apiClient.patch(`/tests/${id}`, payload);
    return res.data.data;
  },

  listPackages: async () => {
    const res = await apiClient.get('/tests/packages');
    const result = extractList<any>(res.data);
    return result.data;
  },
};

export const doctorsService = {
  list: async (params: { clinicId?: string; type?: string; page?: number } = {}): Promise<{ data: Doctor[]; pagination: object }> => {
    const res = await apiClient.get('/doctors', { params });
    return extractList<Doctor>(res.data);
  },

  get: async (id: string): Promise<Doctor> => {
    const res = await apiClient.get(`/doctors/${id}`);
    return res.data.data;
  },

  create: async (payload: Partial<Doctor>): Promise<Doctor> => {
    const res = await apiClient.post('/doctors', payload);
    return res.data.data;
  },

  getByClinic: async (clinicId: string): Promise<Doctor[]> => {
    const res = await apiClient.get(`/clinics/${clinicId}/doctors`);
    const result = extractList<Doctor>(res.data);
    return result.data;
  },
};

export const clinicsService = {
  list: async (params: { search?: string; page?: number } = {}): Promise<{ data: Clinic[]; pagination: object }> => {
    const res = await apiClient.get('/clinics', { params });
    return extractList<Clinic>(res.data);
  },

  get: async (id: string): Promise<Clinic> => {
    const res = await apiClient.get(`/clinics/${id}`);
    return res.data.data;
  },

  create: async (payload: Partial<Clinic>): Promise<Clinic> => {
    const res = await apiClient.post('/clinics', payload);
    return res.data.data;
  },
};

export const inventoryService = {
  list: async (params: { page?: number; limit?: number } = {}): Promise<{ data: InventoryItem[]; pagination: object }> => {
    const res = await apiClient.get('/inventory', { params });
    return extractList<InventoryItem>(res.data);
  },

  addItem: async (payload: Partial<InventoryItem>): Promise<InventoryItem> => {
    const res = await apiClient.post('/inventory', payload);
    return res.data.data;
  },

  receipt: async (id: string, quantity: number, notes?: string): Promise<InventoryItem> => {
    const res = await apiClient.post(`/inventory/${id}/receipt`, { quantity, notes });
    return res.data.data;
  },

  consume: async (id: string, quantity: number, notes?: string): Promise<InventoryItem> => {
    const res = await apiClient.post(`/inventory/${id}/consume`, { quantity, notes });
    return res.data.data;
  },
};

export const analyticsService = {
  getDashboard: async (): Promise<DashboardKPIs> => {
    const res = await apiClient.get('/analytics/dashboard');
    return res.data.data;
  },
};

export const notificationsService = {
  list: async (): Promise<Notification[]> => {
    const res = await apiClient.get('/notifications');
    const result = extractList<Notification>(res.data);
    return result.data;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};

export const auditService = {
  list: async (params: { page?: number; limit?: number; resource?: string } = {}): Promise<{ data: AuditLog[]; pagination: object }> => {
    const res = await apiClient.get('/audit', { params });
    return extractList<AuditLog>(res.data);
  },
};

export const usersService = {
  list: async (params: { page?: number; limit?: number; search?: string } = {}): Promise<{ data: any[]; pagination: object }> => {
    const res = await apiClient.get('/users', { params });
    return extractList<any>(res.data);
  },
  create: async (payload: any): Promise<any> => {
    const res = await apiClient.post('/users', payload);
    return res.data.data;
  },
};
