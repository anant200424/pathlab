import apiClient from '@/lib/api-client';
import type { LoginPayload, User } from '@/types';

export const authService = {
  login: async (payload: LoginPayload): Promise<User> => {
    const res = await apiClient.post('/auth/login', payload);
    const { user, accessToken } = res.data.data;
    if (typeof window !== 'undefined' && accessToken) {
      localStorage.setItem('labcare_token', accessToken);
    }
    return user;
  },

  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('labcare_token');
    }
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
