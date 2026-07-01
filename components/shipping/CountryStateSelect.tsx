'use client';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { getStatesForCountry } from '@/lib/usCaStates';

interface CountryStateSelectProps {
  /** Currently selected country ISO code ('US' | 'CA' | ''). */
  country: string;
  /** Currently selected state/province code. */
  state: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  countryError?: string;
  stateError?: string;
  disabled?: boolean;
}

const COUNTRY_OPTIONS = [
  { value: '', label: 'Select Country' },
  { value: 'CA', label: 'Canada' },
  { value: 'US', label: 'United States' },
];

export function CountryStateSelect({
  country,
  state,
  onCountryChange,
  onStateChange,
  countryError,
  stateError,
  disabled,
}: CountryStateSelectProps) {
  const t = useTranslations('Checkout');

  const stateOptions =
    country === 'US' || country === 'CA'
      ? [
          { value: '', label: t('selectProvince') },
          ...getStatesForCountry(country as 'US' | 'CA').map((s) => ({
            value: s.value,
            label: s.label,
          })),
        ]
      : [{ value: '', label: t('selectProvince') }];

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t('country')} <span className="text-red-500">*</span>
        </label>
        <Select
          value={country}
          onChange={(e) => {
            onCountryChange(e.target.value);
            onStateChange(''); // reset state when country changes
          }}
          options={COUNTRY_OPTIONS}
          disabled={disabled}
        />
        {countryError && (
          <p className="mt-1 text-xs text-red-600">{countryError}</p>
        )}
      </div>

      {/* State / Province */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t('state')} <span className="text-red-500">*</span>
        </label>
        <Select
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          options={stateOptions}
          disabled={disabled || !country}
        />
        {stateError && (
          <p className="mt-1 text-xs text-red-600">{stateError}</p>
        )}
      </div>
    </div>
  );
}
