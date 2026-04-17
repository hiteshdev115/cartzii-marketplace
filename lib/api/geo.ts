import { api } from './client';

export interface CountryOption {
  name: string;
  isoCode: string;
  flag: string;
  phonecode: string;
  currency: string;
}

export interface StateOption {
  name: string;
  isoCode: string;
  countryCode: string;
}

export async function fetchAllCountries(): Promise<CountryOption[]> {
  try {
    const res = await api.get<CountryOption[] | { errorCode: number }>('/api/v1/getAllCountry');
    if (!Array.isArray(res)) return [];
    return res;
  } catch {
    return [];
  }
}

export async function fetchStatesByCountry(countryCode: string): Promise<StateOption[]> {
  if (!countryCode) return [];
  try {
    const res = await api.get<StateOption[] | { errorCode: number }>(
      `/api/v1/getStateByCountry/${encodeURIComponent(countryCode)}`,
    );
    if (!Array.isArray(res)) return [];
    return res;
  } catch {
    return [];
  }
}
