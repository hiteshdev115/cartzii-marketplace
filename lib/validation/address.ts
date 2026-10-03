const CA_POSTAL = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/i;
const US_POSTAL = /^\d{5}(-\d{4})?$/;

export function normalizeAddressCountry(value: string, supportedCountries: readonly string[]): string {
  const normalized = value.trim().toUpperCase();
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  return supportedCountries.find((code) =>
    code.toUpperCase() === normalized || names.of(code.toUpperCase())?.toUpperCase() === normalized,
  )?.toUpperCase() ?? normalized;
}

export function validatePostalCode(code: string, country: 'CA' | 'US'): boolean {
  if (!code) return true;
  if (country === 'CA') return CA_POSTAL.test(code.trim());
  if (country === 'US') return US_POSTAL.test(code.trim());
  return true;
}
