import { IStorageProvider } from './storage.interface.js';
import { LocalStorageProvider } from './local-storage.service.js';
import { S3StorageProvider } from './s3-storage.service.js';
import { env } from '../config/env.js';
import { logger } from '../common/logging/logger.js';

let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageInstance) {
    if (env.OBJECT_STORAGE_PROVIDER === 's3' && env.OBJECT_STORAGE_ACCESS_KEY && env.OBJECT_STORAGE_SECRET_KEY) {
      logger.info('Initializing S3/R2 Object Storage Provider.');
      storageInstance = new S3StorageProvider();
    } else {
      logger.info('Initializing Local Disk Storage Provider fallback.');
      storageInstance = new LocalStorageProvider();
    }
  }
  return storageInstance;
}

export function setStorageProvider(customProvider: IStorageProvider): void {
  storageInstance = customProvider;
}
