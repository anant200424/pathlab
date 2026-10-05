export interface IStorageProvider {
  upload(key: string, buffer: Buffer, contentType: string, metadata?: Record<string, string>): Promise<{ key: string; location: string }>;
  getBuffer(key: string): Promise<Buffer>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
