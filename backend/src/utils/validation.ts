/**
 * Safely parses and validates an ID parameter.
 * Returns a positive integer or null if invalid or NaN.
 */
export function parseNumericId(val: any): number | null {
  if (val === undefined || val === null || val === '') {
    return null;
  }
  const num = Number(val);
  if (!Number.isInteger(num) || isNaN(num) || num <= 0) {
    return null;
  }
  return num;
}
