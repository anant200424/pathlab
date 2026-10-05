import fs from 'fs/promises';
import path from 'path';
import { IStorageProvider } from './storage.interface.js';
import { env } from '../config/env.js';
import { AppError } from '../common/errors/app-error.js';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || env.OBJECT_STORAGE_LOCAL_DIR;
  }

  private getFilePath(key: string): string {
    // Prevent path traversal
    const safeKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.baseDir, safeKey);
  }

  async upload(key: string, buffer: Buffer): Promise<{ key: string; location: string }> {
    const fullPath = this.getFilePath(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return {
      key,
      location: `file://${fullPath}`
    };
  }

  async getBuffer(key: string): Promise<Buffer> {
    const fullPath = this.getFilePath(key);
    try {
      return await fs.readFile(fullPath);
    } catch {
      throw AppError.notFound(`Storage object with key "${key}" not found.`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSignedUrl(key: string, _expiresInSeconds = 900): Promise<string> {
    // In local dev/test mode, return local API download URL route
    return `/api/v1/storage/download?key=${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFilePath(key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // Ignore if already deleted
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.getFilePath(key);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
