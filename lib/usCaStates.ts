/** US states and Canadian provinces/territories for shipping forms. */

export interface StateEntry {
  value: string; // 2-letter ISO code
  label: string;
  country: 'US' | 'CA';
}

export const US_STATES: StateEntry[] = [
  { value: 'AL', label: 'Alabama', country: 'US' },
  { value: 'AK', label: 'Alaska', country: 'US' },
  { value: 'AZ', label: 'Arizona', country: 'US' },
  { value: 'AR', label: 'Arkansas', country: 'US' },
  { value: 'CA', label: 'California', country: 'US' },
  { value: 'CO', label: 'Colorado', country: 'US' },
  { value: 'CT', label: 'Connecticut', country: 'US' },
  { value: 'DE', label: 'Delaware', country: 'US' },
  { value: 'FL', label: 'Florida', country: 'US' },
  { value: 'GA', label: 'Georgia', country: 'US' },
  { value: 'HI', label: 'Hawaii', country: 'US' },
  { value: 'ID', label: 'Idaho', country: 'US' },
  { value: 'IL', label: 'Illinois', country: 'US' },
  { value: 'IN', label: 'Indiana', country: 'US' },
  { value: 'IA', label: 'Iowa', country: 'US' },
  { value: 'KS', label: 'Kansas', country: 'US' },
  { value: 'KY', label: 'Kentucky', country: 'US' },
  { value: 'LA', label: 'Louisiana', country: 'US' },
  { value: 'ME', label: 'Maine', country: 'US' },
  { value: 'MD', label: 'Maryland', country: 'US' },
  { value: 'MA', label: 'Massachusetts', country: 'US' },
  { value: 'MI', label: 'Michigan', country: 'US' },
  { value: 'MN', label: 'Minnesota', country: 'US' },
  { value: 'MS', label: 'Mississippi', country: 'US' },
  { value: 'MO', label: 'Missouri', country: 'US' },
  { value: 'MT', label: 'Montana', country: 'US' },
  { value: 'NE', label: 'Nebraska', country: 'US' },
  { value: 'NV', label: 'Nevada', country: 'US' },
  { value: 'NH', label: 'New Hampshire', country: 'US' },
  { value: 'NJ', label: 'New Jersey', country: 'US' },
  { value: 'NM', label: 'New Mexico', country: 'US' },
  { value: 'NY', label: 'New York', country: 'US' },
  { value: 'NC', label: 'North Carolina', country: 'US' },
  { value: 'ND', label: 'North Dakota', country: 'US' },
  { value: 'OH', label: 'Ohio', country: 'US' },
  { value: 'OK', label: 'Oklahoma', country: 'US' },
  { value: 'OR', label: 'Oregon', country: 'US' },
  { value: 'PA', label: 'Pennsylvania', country: 'US' },
  { value: 'RI', label: 'Rhode Island', country: 'US' },
  { value: 'SC', label: 'South Carolina', country: 'US' },
  { value: 'SD', label: 'South Dakota', country: 'US' },
  { value: 'TN', label: 'Tennessee', country: 'US' },
  { value: 'TX', label: 'Texas', country: 'US' },
  { value: 'UT', label: 'Utah', country: 'US' },
  { value: 'VT', label: 'Vermont', country: 'US' },
  { value: 'VA', label: 'Virginia', country: 'US' },
  { value: 'WA', label: 'Washington', country: 'US' },
  { value: 'WV', label: 'West Virginia', country: 'US' },
  { value: 'WI', label: 'Wisconsin', country: 'US' },
  { value: 'WY', label: 'Wyoming', country: 'US' },
  { value: 'DC', label: 'District of Columbia', country: 'US' },
];

export const CA_PROVINCES: StateEntry[] = [
  { value: 'AB', label: 'Alberta', country: 'CA' },
  { value: 'BC', label: 'British Columbia', country: 'CA' },
  { value: 'MB', label: 'Manitoba', country: 'CA' },
  { value: 'NB', label: 'New Brunswick', country: 'CA' },
  { value: 'NL', label: 'Newfoundland and Labrador', country: 'CA' },
  { value: 'NS', label: 'Nova Scotia', country: 'CA' },
  { value: 'NT', label: 'Northwest Territories', country: 'CA' },
  { value: 'NU', label: 'Nunavut', country: 'CA' },
  { value: 'ON', label: 'Ontario', country: 'CA' },
  { value: 'PE', label: 'Prince Edward Island', country: 'CA' },
  { value: 'QC', label: 'Quebec', country: 'CA' },
  { value: 'SK', label: 'Saskatchewan', country: 'CA' },
  { value: 'YT', label: 'Yukon', country: 'CA' },
];

/** Returns states/provinces for US or CA. */
export function getStatesForCountry(countryCode: 'US' | 'CA'): StateEntry[] {
  return countryCode === 'US' ? US_STATES : CA_PROVINCES;
}
