import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";

const BCRYPT_SALT_ROUNDS = 12;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte key from SESSION_SECRET for AES-256
 */
function getEncryptionKey(): Buffer {
  return crypto.createHash("sha256").update(env.SESSION_SECRET).digest();
}

/**
 * Encrypt a payload string using AES-256-GCM.
 * Output format: iv:authTag:encryptedHex (URL-safe and tamper-proof)
 */
export function encryptPayload(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted payload string.
 * Returns null if decryption fails or authentication tag does not match.
 */
export function decryptPayload(cipherTextWithMeta: string): string | null {
  try {
    const parts = cipherTextWithMeta.split(":");
    if (parts.length !== 3) {
      return null;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    if (!ivHex || !authTagHex || !encryptedHex) {
      return null;
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      return null;
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    return null;
  }
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  plainText: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
