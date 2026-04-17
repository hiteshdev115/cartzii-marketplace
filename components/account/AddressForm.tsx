'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { addressSchema, type AddressFormData } from '@/lib/validators';
import { fetchAllCountries, fetchStatesByCountry } from '@/lib/api';
import type { CountryOption, StateOption } from '@/lib/api';
import { getCountryFromLocale } from '@/config/countries';
import type { ApiAddress } from '@/types';
import { X } from 'lucide-react';

interface AddressFormProps {
  address?: ApiAddress;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/** Map portal country code (us/ca) → ISO code the API uses */
const PORTAL_TO_ISO: Record<string, string> = { ca: 'CA', us: 'US' };

export function AddressForm({ address, onSubmit, onCancel, loading }: AddressFormProps) {
  const t = useTranslations('Account');
  const locale = useLocale();
  const portalCountry = getCountryFromLocale(locale); // "ca" | "us"
  const defaultIso = PORTAL_TO_ISO[portalCountry] ?? '';

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  const [form, setForm] = useState<AddressFormData>({
    street: address?.street ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postal_code: address?.postal_code ?? '',
    country: address?.country ?? defaultIso,
    is_primary: address?.is_primary ?? false,
    is_shipping: address?.is_shipping ?? false,
    is_billing: address?.is_billing ?? false,
  });

  // ---- Fetch countries on mount ----
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const all = await fetchAllCountries();
      if (cancelled) return;

      // If portal is /ca/, only show Canada; otherwise show all
      const filtered =
        portalCountry === 'ca'
          ? all.filter((c) => c.isoCode === 'CA')
          : all;

      const opts = [
        { value: '', label: t('selectCountry') },
        ...filtered.map((c) => ({ value: c.isoCode, label: c.name })),
      ];
      setCountryOptions(opts);
    }
    load();
    return () => { cancelled = true; };
  }, [portalCountry, t]);

  // ---- Fetch states when country changes ----
  useEffect(() => {
    if (!form.country) {
      setStateOptions([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingStates(true);
      const states = await fetchStatesByCountry(form.country);
      if (cancelled) return;
      setStateOptions([
        { value: '', label: t('selectState') },
        ...states.map((s) => ({ value: s.isoCode, label: s.name })),
      ]);
      setLoadingStates(false);
    }
    load();
    return () => { cancelled = true; };
  }, [form.country, t]);

  function update(field: keyof AddressFormData, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset state when country changes
      if (field === 'country') next.state = '';
      return next;
    });
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = addressSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">
          {address ? t('editAddress') : t('addAddress')}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
          aria-label={t('cancel')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <Input
        label={t('street')}
        name="street"
        value={form.street}
        onChange={(e) => update('street', e.target.value)}
        error={errors.street}
        maxLength={255}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('city')}
          name="city"
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
          error={errors.city}
          maxLength={100}
          required
        />
        <Select
          label={t('stateProvince')}
          name="state"
          value={form.state}
          onChange={(e) => update('state', e.target.value)}
          error={errors.state}
          options={stateOptions.length > 0 ? stateOptions : [{ value: '', label: t('selectCountryFirst') }]}
          disabled={!form.country || loadingStates}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('postalCode')}
          name="postal_code"
          value={form.postal_code}
          onChange={(e) => update('postal_code', e.target.value)}
          error={errors.postal_code}
          maxLength={20}
          required
        />
        <Select
          label={t('country')}
          name="country"
          value={form.country}
          onChange={(e) => update('country', e.target.value)}
          error={errors.country}
          options={countryOptions.length > 0 ? countryOptions : [{ value: '', label: t('loadingCountries') }]}
        />
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_primary}
            onChange={(e) => update('is_primary', e.target.checked)}
            className="rounded border-gray-300 text-primary"
          />
          {t('setPrimary')}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_shipping}
            onChange={(e) => update('is_shipping', e.target.checked)}
            className="rounded border-gray-300 text-primary"
          />
          {t('shippingAddress')}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_billing}
            onChange={(e) => update('is_billing', e.target.checked)}
            className="rounded border-gray-300 text-primary"
          />
          {t('billingAddress')}
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? t('saving') : t('saveChanges')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
