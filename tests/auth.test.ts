import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/users/user.model.js';
import { Role } from '../src/modules/roles/role.model.js';
import { SYSTEM_ROLES } from '../src/modules/roles/role.constants.js';
import { hashPassword } from '../src/common/utilities/crypto.util.js';

describe('Authentication & Session API Tests', () => {
  const app = createApp();

  it('should authenticate user and return AES-encrypted cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@labcarepro.internal',
        password: 'Admin@LabCarePro2026!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@labcarepro.internal');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    // Check Set-Cookie headers
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes('labcare_access_token'))).toBe(true);
    expect(cookies.some((c: string) => c.includes('labcare_refresh_token'))).toBe(true);
    expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
  });

  it('should set 30-day expiry on refresh token when rememberMe is true', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@labcarepro.internal',
        password: 'Admin@LabCarePro2026!',
        rememberMe: true
      });

    expect(res.status).toBe(200);
    const refreshTokenExpiresAt = new Date(res.body.data.refreshTokenExpiresAt);
    const daysUntilExpiry = Math.round(
      (refreshTokenExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    expect(daysUntilExpiry).toBe(30);
  });

  it('should refresh access token using valid refresh token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@labcarepro.internal',
        password: 'Admin@LabCarePro2026!'
      });

    const refreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
  });

  it('should reject login with invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@labcarepro.internal',
        password: 'WrongPassword123!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject login for inactive user account', async () => {
    const role = await Role.findOne({ name: SYSTEM_ROLES.LAB_TECHNICIAN });
    await User.create({
      email: 'inactive.tech@labcarepro.internal',
      passwordHash: await hashPassword('TechPass123!'),
      firstName: 'Inactive',
      lastName: 'Tech',
      roles: [role!._id],
      isActive: false
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'inactive.tech@labcarepro.internal',
        password: 'TechPass123!'
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('deactivated');
  });

  it('should revoke session on logout', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@labcarepro.internal',
        password: 'Admin@LabCarePro2026!'
      });

    const cookies = loginRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies)
      .send();

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toContain('logged out');
  });

  it('should authenticate protected endpoints using labcare_access_token cookie', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@labcarepro.internal',
        password: 'Admin@LabCarePro2026!'
      });

    const cookies = loginRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookies);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe('admin@labcarepro.internal');
  });

  it('should refresh tokens using only labcare_refresh_token cookie without request body', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@labcarepro.internal',
        password: 'Admin@LabCarePro2026!'
      });

    const cookies = loginRes.headers['set-cookie'] as string[];
    const refreshCookie = cookies.find((c) => c.startsWith('labcare_refresh_token='));
    expect(refreshCookie).toBeDefined();

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshCookie!])
      .send();

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();

    const newCookies = refreshRes.headers['set-cookie'] as string[];
    expect(newCookies.some((c) => c.startsWith('labcare_access_token='))).toBe(true);
    expect(newCookies.some((c) => c.startsWith('labcare_refresh_token='))).toBe(true);
  });

  it('should reject requests when access token has expired', async () => {
    const { encryptPayload } = await import('../src/common/utilities/crypto.util.js');
    const expiredPayload = JSON.stringify({
      userId: '60d5ec49f1b2c8b1f8e4e1a1',
      sessionId: '60d5ec49f1b2c8b1f8e4e1a2',
      exp: Date.now() - 1000 // expired 1s ago
    });
    const expiredToken = encryptPayload(expiredPayload);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`labcare_access_token=${expiredToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('expired');
  });

  it('should reject unauthorized access to protected endpoints', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
