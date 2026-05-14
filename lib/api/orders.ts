import { api } from './client';
import type { OrderConfirmation, PlaceOrderPayload, PlaceOrderResponse } from '@/types/order';

interface ApiEnvelope<T> {
  success?: boolean | number;
  data?: T;
  message?: string;
}

function unwrap<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data as T;
  }
  return response as T;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cartzii-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

export async function placeOrder(
  payload: PlaceOrderPayload,
): Promise<PlaceOrderResponse> {
  // Signed-in users: only send Authorization header (no guest token alongside JWT)
  const isAuthenticated = !!getAuthToken();
  const res = await api.post<ApiEnvelope<PlaceOrderResponse>>(
    '/api/v1/orders/place-order',
    payload,
    isAuthenticated ? { skipGuestToken: true } : undefined,
  );
  return unwrap(res);
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderConfirmation> {
  const res = await api.get<ApiEnvelope<OrderConfirmation>>(
    `/api/v1/orders/${encodeURIComponent(orderNumber)}`,
  );
  return unwrap(res);
}