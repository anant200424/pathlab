/**
 * Monetary and currency utility to ensure decimal-safe financial calculations.
 * Always works in minor units (cents / paise) internally to eliminate floating point drift.
 */

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function toUnits(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function addCurrency(a: number, b: number): number {
  return toUnits(toCents(a) + toCents(b));
}

export function subtractCurrency(a: number, b: number): number {
  return toUnits(toCents(a) - toCents(b));
}

export function multiplyCurrency(amount: number, factor: number): number {
  return toUnits(Math.round(toCents(amount) * factor));
}

export function calculateDiscount(
  subtotal: number,
  discountPercent: number,
  maxDiscountAmount?: number,
): number {
  if (discountPercent <= 0) return 0;
  const rawDiscount = multiplyCurrency(subtotal, discountPercent / 100);
  if (maxDiscountAmount !== undefined && maxDiscountAmount > 0) {
    return Math.min(rawDiscount, maxDiscountAmount);
  }
  return rawDiscount;
}
