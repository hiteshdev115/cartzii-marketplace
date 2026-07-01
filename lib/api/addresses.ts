import { api } from './client';
import type { ApiAddress, CreateAddressPayload, UpdateAddressPayload } from '@/types';

interface AddressSuccessResponse {
  success: number;
  message: string;
  data: ApiAddress;
}

interface DeleteSuccessResponse {
  success: number;
  message: string;
}

interface ErrorResponse {
  errorCode: number;
  message?: string;
  error?: string;
}

type AddressMutationResponse = AddressSuccessResponse | ErrorResponse;
type AddressListResponse = ApiAddress[] | ErrorResponse;
type AddressSingleResponse = ApiAddress | ErrorResponse;
type AddressDeleteResponse = DeleteSuccessResponse | ErrorResponse;

function isErrorResponse(res: unknown): res is ErrorResponse {
  return typeof res === 'object' && res !== null && 'errorCode' in res;
}

export async function fetchUserAddresses(userId: number): Promise<ApiAddress[]> {
  const res = await api.get<AddressListResponse>(`/api/v1/addresses/user/${userId}`);
  if (isErrorResponse(res)) return [];
  return res;
}

export async function fetchAddress(id: number): Promise<ApiAddress | null> {
  const res = await api.get<AddressSingleResponse>(`/api/v1/addresses/${id}`);
  if (isErrorResponse(res)) return null;
  return res;
}

export async function createAddress(
  payload: CreateAddressPayload,
): Promise<{ data?: ApiAddress; error?: string }> {
  const res = await api.post<AddressMutationResponse>('/api/v1/addresses', payload);
  if (isErrorResponse(res)) return { error: res.message || res.error || 'Failed to create address' };
  return { data: res.data };
}

export async function updateAddress(
  id: number,
  payload: UpdateAddressPayload,
): Promise<{ data?: ApiAddress; error?: string }> {
  const res = await api.put<AddressMutationResponse>(`/api/v1/addresses/${id}`, payload);
  if (isErrorResponse(res)) return { error: res.message || res.error || 'Failed to update address' };
  return { data: res.data };
}

export async function deleteAddress(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  const res = await api.delete<AddressDeleteResponse>(`/api/v1/addresses/${id}`);
  if (isErrorResponse(res)) return { success: false, error: res.message || 'Failed to delete address' };
  return { success: true };
}
