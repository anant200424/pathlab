import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageProvider } from './storage.interface.js';
import { env } from '../config/env.js';
import { AppError } from '../common/errors/app-error.js';

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.OBJECT_STORAGE_BUCKET;
    this.client = new S3Client({
      region: env.OBJECT_STORAGE_REGION,
      endpoint: env.OBJECT_STORAGE_ENDPOINT,
      credentials:
        env.OBJECT_STORAGE_ACCESS_KEY && env.OBJECT_STORAGE_SECRET_KEY
          ? {
              accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY,
              secretAccessKey: env.OBJECT_STORAGE_SECRET_KEY
            }
          : undefined
    });
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ key: string; location: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata
    });

    await this.client.send(command);

    return {
      key,
      location: `s3://${this.bucket}/${key}`
    };
  }

  async getBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    try {
      const response = await this.client.send(command);
      if (!response.Body) {
        throw AppError.notFound(`Storage object "${key}" is empty or not found.`);
      }
      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch {
      throw AppError.notFound(`Storage object "${key}" not found.`);
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    await this.client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
