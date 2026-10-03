import { describe, it, expect } from 'vitest';
import { encryptPayload, decryptPayload, hashPassword, verifyPassword } from '../src/common/utilities/crypto.util.js';
import { addCurrency, subtractCurrency, multiplyCurrency, calculateDiscount } from '../src/common/utilities/currency.util.js';

describe('Crypto & Security Utilities', () => {
  it('should encrypt and decrypt payload successfully using AES-256-GCM', () => {
    const originalText = JSON.stringify({ userId: 'user-123', clinicId: 'clinic-456', exp: 1711920000 });
    const encrypted = encryptPayload(originalText);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(originalText);
    expect(encrypted.split(':').length).toBe(3); // iv:authTag:cipher

    const decrypted = decryptPayload(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('should fail decryption if payload is corrupted or tampered', () => {
    const originalText = 'secret-session-token';
    const encrypted = encryptPayload(originalText);

    // Tamper with the ciphertext
    const parts = encrypted.split(':');
    parts[2] = parts[2]!.slice(0, -2) + 'aa';
    const tampered = parts.join(':');

    const result = decryptPayload(tampered);
    expect(result).toBeNull();
  });

  it('should securely hash and verify passwords using bcrypt', async () => {
    const rawPass = 'SuperSecurePass123!';
    const hashed = await hashPassword(rawPass);

    expect(hashed).toBeDefined();
    expect(hashed).not.toEqual(rawPass);

    const valid = await verifyPassword(rawPass, hashed);
    expect(valid).toBe(true);

    const invalid = await verifyPassword('WrongPassword', hashed);
    expect(invalid).toBe(false);
  });
});

describe('Decimal-Safe Currency Utilities', () => {
  it('should accurately add monetary values without floating point drift', () => {
    // 0.1 + 0.2 in JS is 0.30000000000000004
    const sum = addCurrency(0.1, 0.2);
    expect(sum).toBe(0.3);
  });

  it('should accurately subtract monetary values', () => {
    const result = subtractCurrency(100.55, 30.25);
    expect(result).toBe(70.3);
  });

  it('should accurately multiply monetary values and calculate discounts', () => {
    const subtotal = 1500;
    const discount = calculateDiscount(subtotal, 15); // 15% of 1500 = 225
    expect(discount).toBe(225);

    const net = subtractCurrency(subtotal, discount);
    expect(net).toBe(1275);
  });
});
