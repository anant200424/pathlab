import apiClient from '@/lib/api-client';
import { extractList } from '@/lib/api-helper';
import type { Patient } from '@/types';

export interface PatientsListParams {
  search?: string;
  gender?: string;
  page?: number;
  limit?: number;
}

export interface PatientsListResponse {
  data: Patient[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface CreatePatientPayload {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  clinicId?: string;
  address?: {
    line1?: string;
    line2?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export const patientsService = {
  list: async (params: PatientsListParams = {}): Promise<PatientsListResponse> => {
    const res = await apiClient.get('/patients', { params });
    return extractList<Patient>(res.data);
  },

  get: async (id: string): Promise<Patient> => {
    const res = await apiClient.get(`/patients/${id}`);
    const data = res.data.data;
    return (data?.patient || data) as Patient;
  },

  create: async (payload: CreatePatientPayload): Promise<Patient> => {
    const res = await apiClient.post('/patients', payload);
    const data = res.data.data;
    return (data?.patient || data) as Patient;
  },

  update: async (id: string, payload: Partial<CreatePatientPayload>): Promise<Patient> => {
    const res = await apiClient.patch(`/patients/${id}`, payload);
    return res.data.data;
  },

  history: async (id: string) => {
    const res = await apiClient.get(`/patients/${id}/history`);
    return res.data.data;
  },
};
