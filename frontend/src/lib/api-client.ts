import axios from 'axios';

const LIVE_RENDER_API = 'https://pathlab-api.onrender.com/api/v1';

const getBaseUrl = (): string => {
  // If explicitly configured with a custom non-localhost URL
  if (
    process.env.NEXT_PUBLIC_API_URL &&
    process.env.NEXT_PUBLIC_API_URL.startsWith('http') &&
    !process.env.NEXT_PUBLIC_API_URL.includes('localhost')
  ) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If in browser (client-side):
  if (typeof window !== 'undefined') {
    // When opened from mobile phones, Cloudflare tunnels, or Vercel, always point to live Render backend
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return LIVE_RENDER_API;
    }
    return process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  }

  return LIVE_RENDER_API;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Critical: sends HTTP-only cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

// Attach Bearer token from localStorage for maximum cross-origin reliability
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('labcare_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh interceptor on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Clear token and redirect to login on refresh failure
        if (typeof window !== 'undefined') {
          localStorage.removeItem('labcare_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
