# LabCare Pro - Next.js (Vercel) Integration Guide

This guide details how to integrate your **Next.js (App Router or Pages Router)** frontend deployed on **Vercel** with the **LabCare Pro Backend** deployed on **Render**, including AES-encrypted cookie management, **30-day Remember Me**, and automatic token refresh interceptors.

---

## 1. Environment Configuration in Next.js

In your Next.js project on Vercel (or `.env.local` locally):

```env
# URL of your Render backend
NEXT_PUBLIC_API_URL=https://labcare-pro-backend.onrender.com/api/v1
```

---

## 2. API Client with Credentials & Auto-Refresh Interceptor

Install Axios in your Next.js project:
```bash
npm install axios
```

Create `lib/api-client.ts`:

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // CRITICAL: Sends and receives HTTP-only AES cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Response Interceptor: Automatically handles AES token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If request failed with 401 UNAUTHORIZED and hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not attempt refresh if the failed request was already login or refresh
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue pending requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint with credentials (cookie labcare_refresh_token sent automatically)
        await apiClient.post('/auth/refresh');
        
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        // Clear client state or redirect to /login
        if (typeof window !== 'undefined') {
          window.location.href = '/login?session_expired=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 3. Login Implementation with "Remember Me" (30-Day Session)

When a user logs in, pass `rememberMe: true` if the user checked the "Remember Me" box.
- Standard session: 24 hours refresh token TTL.
- Remember Me: **30 days** refresh token TTL in DB and cookie `Expires` header.

Example Login Component:

```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        rememberMe, // Passed to backend to trigger 30-day cookie & session
      });

      if (response.data.success) {
        // AES-encrypted cookies (labcare_access_token & labcare_refresh_token)
        // are automatically saved by the browser because of withCredentials: true.
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>LabCare Pro Login</h2>
      
      {errorMsg && <div className="alert-error">{errorMsg}</div>}

      <input
        type="email"
        placeholder="user@labcarepro.internal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <span>Remember me for 30 days</span>
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

---

## 4. Logout Implementation

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      router.push('/login');
    }
  };

  return (
    <button onClick={handleLogout} className="logout-btn">
      Log Out
    </button>
  );
}
```

---

## 5. Next.js App Router Server-Side Cookie Forwarding

If calling LabCare Pro endpoints from Next.js Server Components or Server Actions:

```typescript
// app/dashboard/page.tsx
import { cookies } from 'next/headers';

async function getDashboardData() {
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/operational`, {
    headers: {
      Cookie: cookieHeader, // Forwards labcare_access_token & labcare_refresh_token
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  return res.json();
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <div>Welcome to LabCare Pro Dashboard</div>;
}
```

---

## 6. Summary of Security & Cross-Domain Settings

| Component | Setting | Required Value |
|---|---|---|
| **Render Backend** | `CORS_ORIGIN` | Exact Vercel URL (e.g., `https://your-frontend.vercel.app`) |
| **Render Backend** | `COOKIE_SAME_SITE` | `none` |
| **Render Backend** | `COOKIE_SECURE` | `true` |
| **Next.js Client** | `withCredentials` | `true` |
| **Next.js Interceptor**| Auto-refresh on 401 | Calls `/auth/refresh` with cookies |
