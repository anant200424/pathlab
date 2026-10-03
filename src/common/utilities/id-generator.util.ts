import crypto from "crypto";

export function generateCustomId(prefix: string, length = 6): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .toUpperCase()
    .slice(0, length);
  return `${prefix}-${dateStr}-${randomHex}`;
}

export function generateBarcodeNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `${timestamp}${random}`;
}
