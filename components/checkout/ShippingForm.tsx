'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  shippingSchema,
  ShippingFormData,
  checkoutAddressSchema,
  CheckoutAddressFormData,
} from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Plus } from 'lucide-react';
import { useHydrated } from '@/hooks/useHydration';
import { useAuthStore } from '@/stores/authStore';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { AddressAutocompleteInput } from '@/components/checkout/AddressAutocompleteInput';
import { fetchUserAddresses, createAddress } from '@/lib/api/addresses';
import { fetchStatesByCountry } from '@/lib/api';
import { validatePostalCode } from '@/lib/validation/address';
import type { ApiAddress } from '@/types';

interface ShippingFormProps {
  onSubmit: (data: ShippingFormData) => void;
  defaultValues?: Partial<ShippingFormData>;
}

export function ShippingForm({ onSubmit, defaultValues }: ShippingFormProps) {
  const t = useTranslations('Checkout');
  const locale = useLocale();
  const normalizedLocale = locale.toLowerCase();
  const portalCountryISO =
    normalizedLocale === 'ca' || normalizedLocale.endsWith('-ca')
      ? 'CA'
      : normalizedLocale === 'us' || normalizedLocale.endsWith('-us')
      ? 'US'
      : null;
  const hydrated = useHydrated();

  // Persist address + clear stale rates whenever a new address is confirmed
  const setCheckoutAddress = useCheckoutStore((s) => s.setShippingAddress);
  const clearRates = useCheckoutStore((s) => s.clearRates);

  /** Wraps every onSubmit call to also persist the address and reset rates. */
  const handleConfirmedAddress = (data: ShippingFormData) => {
    setCheckoutAddress(data);
    clearRates();
    onSubmit(data);
  };

  // Real auth state from Zustand persist store (key: 'cartzii-auth')
  const authUserId = useAuthStore((s) => s.userId);
  const authFirstName = useAuthStore((s) => s.firstName);
  const authEmail = useAuthStore((s) => s.email);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<ApiAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new' | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Province dropdowns
  const [guestProvinces, setGuestProvinces] = useState<{ value: string; label: string }[]>([]);
  const [guestLoadingProvinces, setGuestLoadingProvinces] = useState(false);
  const [newAddrProvinces, setNewAddrProvinces] = useState<{ value: string; label: string }[]>([]);
  const [newAddrLoadingProvinces, setNewAddrLoadingProvinces] = useState(false);

  // Country conflict errors
  const [guestCountryError, setGuestCountryError] = useState<string | null>(null);
  const [newAddrCountryError, setNewAddrCountryError] = useState<string | null>(null);
  const [savedAddrConflictError, setSavedAddrConflictError] = useState<string | null>(null);
  const [guestPostalFormatError, setGuestPostalFormatError] = useState<string | null>(null);
  const [newAddrPostalFormatError, setNewAddrPostalFormatError] = useState<string | null>(null);

  // Static country options — CA and US only
  const COUNTRY_OPTIONS = [
    { value: '', label: t('selectCountry') },
    { value: 'CA', label: 'Canada' },
    { value: 'US', label: 'United States' },
  ];

  // Returns conflict message if selected country doesn't match portal
  const getConflictError = (selectedISO: string): string | null => {
    if (!portalCountryISO) return null;
    if (selectedISO !== portalCountryISO) {
      return t('addressCountryMismatch', {
        selected: selectedISO || '—',
        expected: portalCountryISO,
      });
    }
    return null;
  };

  // Guest form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { ...defaultValues, country: defaultValues?.country ?? '' },
  });

  const guestWatchedCountry = watch('country');
  const guestWatchedAddress = watch('address');

  // New address form (for logged-in users)
  const newAddressForm = useForm<CheckoutAddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: { country: '' },
  });

  const newAddrWatchedCountry = newAddressForm.watch('country');
  const newAddrWatchedStreet = newAddressForm.watch('street');

  const selectedSavedAddress =
    selectedAddressId && selectedAddressId !== 'new'
      ? savedAddresses.find((a) => a.id === selectedAddressId)
      : null;

  const isGuestCountryValid = !getConflictError(guestWatchedCountry || '');
  const isNewAddressCountryValid = !getConflictError(newAddrWatchedCountry || '');
  const isSavedSelectionCountryValid =
    selectedAddressId === null
      ? false
      : selectedAddressId === 'new'
      ? isNewAddressCountryValid
      : !getConflictError(selectedSavedAddress?.country || '');

  useEffect(() => {
    if (!portalCountryISO && process.env.NODE_ENV !== 'production') {
      console.warn(`[ShippingForm] Unknown locale "${locale}" — skipping country conflict enforcement.`);
    }
  }, [locale, portalCountryISO]);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated() || !authUserId) {
      setIsLoadingAddresses(false);
      return;
    }

    setIsLoggedIn(true);

    const loadAddresses = async () => {
      try {
        const addresses = await fetchUserAddresses(Number(authUserId));
        if (addresses.length > 0) {
          setSavedAddresses(addresses);
          const primary = addresses.find((a) => a.is_primary) ?? addresses[0];
          setSelectedAddressId(primary.id);
        }
        setIsLoadingAddresses(false);
      } catch {
        setFetchError(true);
        setIsLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load provinces for the guest / fetch-error form
  useEffect(() => {
    const country = guestWatchedCountry;
    if (!country) return;
    setGuestLoadingProvinces(true);
    setGuestCountryError(null);
    setGuestPostalFormatError(null);
    fetchStatesByCountry(country)
      .then((states) => {
        setGuestProvinces([
          { value: '', label: t('selectProvince') },
          ...states.map((s) => ({ value: s.isoCode, label: s.name })),
        ]);
        const currentState = watch('state');
        const validStateCodes = new Set(states.map((s) => s.isoCode));
        if (currentState && !validStateCodes.has(currentState)) {
          setValue('state', '', { shouldValidate: true, shouldDirty: true });
        }
      })
      .catch(() => setGuestProvinces([]))
      .finally(() => setGuestLoadingProvinces(false));
  }, [guestWatchedCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load provinces for the new address (logged-in) form
  useEffect(() => {
    const country = newAddrWatchedCountry;
    if (!country) return;
    setNewAddrLoadingProvinces(true);
    setNewAddrCountryError(null);
    setNewAddrPostalFormatError(null);
    fetchStatesByCountry(country)
      .then((states) => {
        setNewAddrProvinces([
          { value: '', label: t('selectProvince') },
          ...states.map((s) => ({ value: s.isoCode, label: s.name })),
        ]);
        const currentState = newAddressForm.getValues('state');
        const validStateCodes = new Set(states.map((s) => s.isoCode));
        if (currentState && !validStateCodes.has(currentState)) {
          newAddressForm.setValue('state', '', { shouldValidate: true, shouldDirty: true });
        }
      })
      .catch(() => setNewAddrProvinces([]))
      .finally(() => setNewAddrLoadingProvinces(false));
  }, [newAddrWatchedCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveNewAddressAndContinue = async (formData: CheckoutAddressFormData) => {
    const conflict = getConflictError(formData.country);
    if (conflict) {
      setNewAddrCountryError(conflict);
      return;
    }
    setNewAddrCountryError(null);
    if (formData.country === 'CA' || formData.country === 'US') {
      if (!validatePostalCode(formData.postal_code, formData.country)) {
        setNewAddrPostalFormatError(t('postalCodeInvalidFormat'));
        return;
      }
    }
    setNewAddrPostalFormatError(null);
    setIsSavingAddress(true);
    setSaveError(null);

    try {
      const result = await createAddress({
        userid: Number(authUserId),
        ...formData,
        is_primary: true,
        is_shipping: true,
      });

      if (result.error || !result.data) {
        setSaveError(result.error || t('saveAddressGenericError'));
        return;
      }

      const newAddr = result.data;
      const mappedData: ShippingFormData = {
        firstName: authFirstName || '',
        lastName: '',
        email: authEmail || '',
        phone: '',
        address: newAddr.street,
        addressLine2: '',
        city: newAddr.city,
        state: newAddr.state,
        zipCode: newAddr.postal_code,
        country: newAddr.country,
      };
      handleConfirmedAddress(mappedData);
    } catch {
      setSaveError(t('networkError'));
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleContinueToPayment = () => {
    // If the user has filled in a new address, save it then proceed
    if (selectedAddressId === 'new') {
      newAddressForm.handleSubmit(handleSaveNewAddressAndContinue)();
      return;
    }

    const selected = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!selected) return;

    const conflict = getConflictError(selected.country);
    if (conflict) {
      setSavedAddrConflictError(conflict);
      return;
    }
    setSavedAddrConflictError(null);

    const mappedData: ShippingFormData = {
      firstName: authFirstName || '',
      lastName: '',
      email: authEmail || '',
      phone: '',
      address: selected.street,
      addressLine2: '',
      city: selected.city,
      state: selected.state,
      zipCode: selected.postal_code,
      country: selected.country,
    };

    handleConfirmedAddress(mappedData);
  };

  const validateGuestPostalOnBlur = (postalCode: string) => {
    if (guestWatchedCountry === 'CA' || guestWatchedCountry === 'US') {
      if (!validatePostalCode(postalCode, guestWatchedCountry)) {
        setGuestPostalFormatError(t('postalCodeInvalidFormat'));
        return;
      }
    }
    setGuestPostalFormatError(null);
  };

  const validateNewAddressPostalOnBlur = (postalCode: string) => {
    if (newAddrWatchedCountry === 'CA' || newAddrWatchedCountry === 'US') {
      if (!validatePostalCode(postalCode, newAddrWatchedCountry)) {
        setNewAddrPostalFormatError(t('postalCodeInvalidFormat'));
        return;
      }
    }
    setNewAddrPostalFormatError(null);
  };

  const handleGuestSubmit = (data: ShippingFormData) => {
    const conflict = getConflictError(data.country);
    if (conflict) {
      setGuestCountryError(conflict);
      return;
    }
    if (data.country === 'CA' || data.country === 'US') {
      if (!validatePostalCode(data.zipCode, data.country)) {
        setGuestPostalFormatError(t('postalCodeInvalidFormat'));
        return;
      }
    }
    setGuestCountryError(null);
    setGuestPostalFormatError(null);
    handleConfirmedAddress(data);
  };

  // New address form fields (shared between "use new address" and "no saved addresses" flows)
  const newAddressFields = (
    <div className="space-y-4">
      <div className="w-full">
        <label htmlFor="new-address-line-1" className="label">
          {t('streetAddressLabel')}
        </label>
        <AddressAutocompleteInput
          value={newAddrWatchedStreet || ''}
          onChange={(nextValue) =>
            newAddressForm.setValue('street', nextValue, { shouldValidate: true, shouldDirty: true })
          }
          onSelect={(structured) => {
            newAddressForm.setValue('street', structured.addressLine1, { shouldValidate: true, shouldDirty: true });
            newAddressForm.setValue('city', structured.city, { shouldValidate: true, shouldDirty: true });
            newAddressForm.setValue('state', structured.stateOrProvince, { shouldValidate: true, shouldDirty: true });
            newAddressForm.setValue('postal_code', structured.postalCode, { shouldValidate: true, shouldDirty: true });
            newAddressForm.setValue('country', structured.country, { shouldValidate: true, shouldDirty: true });
            setNewAddrCountryError(null);
            setNewAddrPostalFormatError(null);
          }}
          onCountryMismatch={(selected, expected) =>
            setNewAddrCountryError(t('addressCountryMismatch', { selected, expected }))
          }
          placeholder={t('addressLine1Placeholder')}
          ariaLabel={t('addressLine1AriaLabel')}
          disabled={isSavingAddress}
          className={`input ${
            newAddressForm.formState.errors.street?.message
              ? 'border-red-500 focus:ring-red-300 focus:border-red-500'
              : ''
          }`}
        />
        {newAddressForm.formState.errors.street?.message && (
          <p className="error-text" role="alert">
            {newAddressForm.formState.errors.street?.message}
          </p>
        )}
      </div>
      <Input
        label={t('cityLabel')}
        placeholder={t('cityPlaceholder')}
        {...newAddressForm.register('city')}
        error={newAddressForm.formState.errors.city?.message}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t('countryLabel')}
          {...newAddressForm.register('country')}
          options={COUNTRY_OPTIONS}
          error={newAddressForm.formState.errors.country?.message}
        />
        <Select
          label={t('stateLabel')}
          {...newAddressForm.register('state')}
          options={
            newAddrLoadingProvinces
              ? [{ value: '', label: t('loadingProvinces') }]
              : newAddrProvinces.length > 0
              ? newAddrProvinces
              : [{ value: '', label: t('selectProvince') }]
          }
          disabled={!newAddrWatchedCountry || newAddrLoadingProvinces}
          error={newAddressForm.formState.errors.state?.message}
        />
      </div>
      <Input
        label={t('postalCodeLabel')}
        placeholder={t('postalCodePlaceholder')}
        {...newAddressForm.register('postal_code', {
          onBlur: (event) => validateNewAddressPostalOnBlur(event.target.value),
        })}
        error={newAddressForm.formState.errors.postal_code?.message || newAddrPostalFormatError || undefined}
      />
      {newAddrCountryError && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{newAddrCountryError}</span>
        </div>
      )}
    </div>
  );

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoadingAddresses) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full bg-slate-100 rounded-xl animate-pulse" />
        ))}
        <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── Fetch error: show warning + guest form ───────────────────────────────
  if (fetchError) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">{t('fetchAddressError')}</p>
        </div>
        <form onSubmit={handleSubmit(handleGuestSubmit)} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">{t('shippingAddress')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('firstName')} {...register('firstName')} error={errors.firstName?.message} />
            <Input label={t('lastName')} {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <Input label={t('email')} type="email" {...register('email')} error={errors.email?.message} />
          <Input label={t('phone')} type="tel" {...register('phone')} error={errors.phone?.message} />
          <div className="w-full">
            <label htmlFor="guest-address-line-1" className="label">
              {t('address')}
            </label>
            <AddressAutocompleteInput
              value={guestWatchedAddress || ''}
              onChange={(nextValue) => setValue('address', nextValue, { shouldValidate: true, shouldDirty: true })}
              onSelect={(structured) => {
                setValue('address', structured.addressLine1, { shouldValidate: true, shouldDirty: true });
                setValue('city', structured.city, { shouldValidate: true, shouldDirty: true });
                setValue('state', structured.stateOrProvince, { shouldValidate: true, shouldDirty: true });
                setValue('zipCode', structured.postalCode, { shouldValidate: true, shouldDirty: true });
                setValue('country', structured.country, { shouldValidate: true, shouldDirty: true });
                setGuestCountryError(null);
                setGuestPostalFormatError(null);
              }}
              onCountryMismatch={(selected, expected) =>
                setGuestCountryError(t('addressCountryMismatch', { selected, expected }))
              }
              placeholder={t('addressLine1Placeholder')}
              ariaLabel={t('addressLine1AriaLabel')}
              className={`input ${errors.address?.message ? 'border-red-500 focus:ring-red-300 focus:border-red-500' : ''}`}
            />
            {errors.address?.message && (
              <p className="error-text" role="alert">
                {errors.address?.message}
              </p>
            )}
          </div>
          <Input label={t('apartment')} {...register('addressLine2')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('city')} {...register('city')} error={errors.city?.message} />
            <Input
              label={t('zipCode')}
              {...register('zipCode', {
                onBlur: (event) => validateGuestPostalOnBlur(event.target.value),
              })}
              error={errors.zipCode?.message || guestPostalFormatError || undefined}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('country')}
              {...register('country')}
              options={COUNTRY_OPTIONS}
              error={errors.country?.message}
            />
            <Select
              label={t('state')}
              {...register('state')}
              options={
                guestLoadingProvinces
                  ? [{ value: '', label: t('loadingProvinces') }]
                  : guestProvinces.length > 0
                  ? guestProvinces
                  : [{ value: '', label: t('selectProvince') }]
              }
              disabled={!guestWatchedCountry || guestLoadingProvinces}
              error={errors.state?.message}
            />
          </div>
          {guestCountryError && (
            <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{guestCountryError}</span>
            </div>
          )}
          <Button type="submit" className="w-full mt-4" disabled={!isGuestCountryValid || !!guestPostalFormatError}>
            {t('continueToPayment')}
          </Button>
        </form>
      </div>
    );
  }

  // ── Logged-in with saved addresses ───────────────────────────────────────
  if (isLoggedIn && savedAddresses.length > 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold mb-4">{t('selectShippingAddress')}</h2>

        {savedAddresses.map((address) => (
          <label
            key={address.id}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
              ${
                selectedAddressId === address.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <input
              type="radio"
              name="shipping_address"
              value={address.id}
              checked={selectedAddressId === address.id}
              onChange={() => {
                setSelectedAddressId(address.id);
                setShowNewAddressForm(false);
              }}
              className="mt-1 accent-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">
                  {address.street}, {address.city}, {address.state} {address.postal_code},{' '}
                  {address.country}
                </span>
                {address.is_primary && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {t('primaryBadge')}
                  </span>
                )}
              </div>
            </div>
          </label>
        ))}

        {/* "Use a new address" card */}
        <label
          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all
            ${
              selectedAddressId === 'new'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <input
            type="radio"
            name="shipping_address"
            value="new"
            checked={selectedAddressId === 'new'}
            onChange={() => {
              setSelectedAddressId('new');
              setShowNewAddressForm(true);
              setSaveError(null);
            }}
            className="accent-blue-500"
          />
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{t('useNewAddress')}</span>
          </div>
        </label>

        {/* Animated new address form */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out
            ${showNewAddressForm ? 'max-h-[700px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
        >
          <div className="pt-2">
            {newAddressFields}
            {saveError && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-3">
                <AlertCircle className="w-4 h-4" />
                <span>{saveError}</span>
              </div>
            )}
          </div>
        </div>

        {savedAddrConflictError && (
          <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{savedAddrConflictError}</span>
          </div>
        )}

        <Button
          type="button"
          isLoading={isSavingAddress}
          disabled={
            selectedAddressId === null ||
            isSavingAddress ||
            !isSavedSelectionCountryValid ||
            (selectedAddressId === 'new' && !!newAddrPostalFormatError)
          }
          onClick={handleContinueToPayment}
          className="w-full mt-6"
        >
          {isSavingAddress ? t('savingAddress') : t('continueToPayment')}
        </Button>
      </div>
    );
  }

  // ── Logged-in with NO saved addresses ────────────────────────────────────
  if (isLoggedIn && savedAddresses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{t('noSavedAddressesInfo')}</span>
        </div>
        {newAddressFields}
        <Button
          type="button"
          isLoading={isSavingAddress}
          disabled={isSavingAddress || !isNewAddressCountryValid || !!newAddrPostalFormatError}
          onClick={newAddressForm.handleSubmit(handleSaveNewAddressAndContinue)}
          className="w-full mt-4"
        >
          {isSavingAddress ? t('savingAddress') : t('continueToPayment')}
        </Button>
        {saveError && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
            <AlertCircle className="w-4 h-4" />
            <span>{saveError}</span>
          </div>
        )}
      </div>
    );
  }

  // ── Guest (not logged in) form ───────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(handleGuestSubmit)} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{t('shippingAddress')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('firstName')} {...register('firstName')} error={errors.firstName?.message} />
        <Input label={t('lastName')} {...register('lastName')} error={errors.lastName?.message} />
      </div>
      <Input label={t('email')} type="email" {...register('email')} error={errors.email?.message} />
      <Input label={t('phone')} type="tel" {...register('phone')} error={errors.phone?.message} />
      <div className="w-full">
        <label htmlFor="guest-address-line-1" className="label">
          {t('address')}
        </label>
        <AddressAutocompleteInput
          value={guestWatchedAddress || ''}
          onChange={(nextValue) => setValue('address', nextValue, { shouldValidate: true, shouldDirty: true })}
          onSelect={(structured) => {
            setValue('address', structured.addressLine1, { shouldValidate: true, shouldDirty: true });
            setValue('city', structured.city, { shouldValidate: true, shouldDirty: true });
            setValue('state', structured.stateOrProvince, { shouldValidate: true, shouldDirty: true });
            setValue('zipCode', structured.postalCode, { shouldValidate: true, shouldDirty: true });
            setValue('country', structured.country, { shouldValidate: true, shouldDirty: true });
            setGuestCountryError(null);
            setGuestPostalFormatError(null);
          }}
          onCountryMismatch={(selected, expected) =>
            setGuestCountryError(t('addressCountryMismatch', { selected, expected }))
          }
          placeholder={t('addressLine1Placeholder')}
          ariaLabel={t('addressLine1AriaLabel')}
          className={`input ${errors.address?.message ? 'border-red-500 focus:ring-red-300 focus:border-red-500' : ''}`}
        />
        {errors.address?.message && (
          <p className="error-text" role="alert">
            {errors.address?.message}
          </p>
        )}
      </div>
      <Input label={t('apartment')} {...register('addressLine2')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('city')} {...register('city')} error={errors.city?.message} />
        <Input
          label={t('zipCode')}
          {...register('zipCode', {
            onBlur: (event) => validateGuestPostalOnBlur(event.target.value),
          })}
          error={errors.zipCode?.message || guestPostalFormatError || undefined}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t('country')}
          {...register('country')}
          options={COUNTRY_OPTIONS}
          error={errors.country?.message}
        />
        <Select
          label={t('state')}
          {...register('state')}
          options={
            guestLoadingProvinces
              ? [{ value: '', label: t('loadingProvinces') }]
              : guestProvinces.length > 0
              ? guestProvinces
              : [{ value: '', label: t('selectProvince') }]
          }
          disabled={!guestWatchedCountry || guestLoadingProvinces}
          error={errors.state?.message}
        />
      </div>
      {guestCountryError && (
        <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{guestCountryError}</span>
        </div>
      )}
      <Button type="submit" className="w-full mt-4" disabled={!isGuestCountryValid || !!guestPostalFormatError}>
        {t('continueToPayment')}
      </Button>
    </form>
  );
}
