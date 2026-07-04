const CA_POSTAL = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/i;
const US_POSTAL = /^\d{5}(-\d{4})?$/;

export function validatePostalCode(code: string, country: 'CA' | 'US'): boolean {
  if (!code) return true;
  if (country === 'CA') return CA_POSTAL.test(code.trim());
  if (country === 'US') return US_POSTAL.test(code.trim());
  return true;
}
