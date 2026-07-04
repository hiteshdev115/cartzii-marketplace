'use client';

import type { SearchBoxRetrieveResponse, SearchBoxFeatureSuggestion } from '@mapbox/search-js-core';
import type { SearchBoxRefType } from '@mapbox/search-js-react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

const SearchBox = dynamic(() => import('@mapbox/search-js-react').then((m) => m.SearchBox), {
  ssr: false,
  loading: () => null,
});

interface StructuredAddress {
  addressLine1: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: StructuredAddress) => void;
  onCountryMismatch?: (selectedCountry: string, expectedCountry: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

const extractStructuredAddress = (feature: SearchBoxFeatureSuggestion): StructuredAddress => {
  const props = feature.properties;
  const context = props.context ?? {};

  return {
    addressLine1: props.address || props.full_address || props.name || '',
    city: context.place?.name || context.locality?.name || '',
    stateOrProvince: context.region?.region_code || context.region?.name || '',
    postalCode: context.postcode?.name || '',
    country: context.country?.country_code?.toUpperCase() || '',
  };
};

export function AddressAutocompleteInput({
  value,
  onChange,
  onSelect,
  onCountryMismatch,
  placeholder,
  ariaLabel,
  disabled,
  className,
}: AddressAutocompleteInputProps) {
  const locale = useLocale();
  const t = useTranslations('Checkout');
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  const searchRef = useRef<SearchBoxRefType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fallbackToManual, setFallbackToManual] = useState(false);
  const [suggestionAnnouncement, setSuggestionAnnouncement] = useState('');

  const { expectedCountry, language } = useMemo(() => {
    const normalizedLocale = locale.toLowerCase();

    const mappedCountry =
      normalizedLocale === 'ca' || normalizedLocale.endsWith('-ca')
        ? 'CA'
        : normalizedLocale === 'us' || normalizedLocale.endsWith('-us')
        ? 'US'
        : undefined;

    return {
      expectedCountry: mappedCountry,
      language: normalizedLocale.startsWith('fr') ? 'fr' : 'en',
    };
  }, [locale]);

  useEffect(() => {
    if (!expectedCountry && process.env.NODE_ENV !== 'production') {
      console.warn(`[AddressAutocompleteInput] Unknown locale "${locale}" — skipping country restriction.`);
    }
  }, [expectedCountry, locale]);

  useEffect(() => {
    if (fallbackToManual || !token) return;
    const timer = setTimeout(() => {
      const input = containerRef.current?.querySelector('input');
      if (input) {
        input.setAttribute('aria-label', ariaLabel || t('addressLine1AriaLabel'));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [ariaLabel, fallbackToManual, token, t]);

  const handleValueChange = (nextValue: string) => {
    onChange(nextValue);
    if (!token || fallbackToManual) return;

    const trimmed = nextValue.trim();
    if (!trimmed) {
      setSuggestionAnnouncement('');
      return;
    }
  };

  const manualInput = (
    <input
      type="text"
      value={value}
      onChange={(e) => handleValueChange(e.target.value)}
      placeholder={placeholder || t('addressLine1Placeholder')}
      disabled={disabled}
      className={className || 'input'}
      aria-label={ariaLabel || t('addressLine1AriaLabel')}
    />
  );

  if (!token || fallbackToManual) {
    return manualInput;
  }

  return (
    <div ref={containerRef}>
      <SearchBox
        ref={searchRef}
        accessToken={token}
        value={value}
        onChange={handleValueChange}
        onSuggest={(res) => {
          const count = res.suggestions?.length ?? 0;
          setSuggestionAnnouncement(
            count > 0 ? t('addressSuggestionsAvailable', { count: String(count) }) : ''
          );
        }}
        onSuggestError={(error) => {
          setFallbackToManual(true);
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[AddressAutocompleteInput] Mapbox suggest failed; falling back to manual input.', error);
          }
        }}
        onRetrieve={(result: SearchBoxRetrieveResponse) => {
          const feature = result?.features?.[0];
          if (!feature) return;

          const structured = extractStructuredAddress(feature);
          if (expectedCountry && structured.country && structured.country !== expectedCountry) {
            onCountryMismatch?.(structured.country, expectedCountry);
            return;
          }
          onSelect(structured);
        }}
        onClear={() => setSuggestionAnnouncement('')}
        options={expectedCountry ? { country: expectedCountry, language } : { language }}
        placeholder={placeholder || t('addressLine1Placeholder')}
        theme={{
          variables: {
            fontFamily: 'inherit',
            fontWeight: '400',
          },
        }}
      />
      <div className="sr-only" aria-live="polite">
        {suggestionAnnouncement}
      </div>
    </div>
  );
}
