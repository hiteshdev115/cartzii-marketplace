import { api } from './client';
import type {
  CreatePaymentIntentPayload,
  PaymentIntentResponse,
  PaymentMethod,
  RefundPayload,
} from '@/types/payment';

export async function createPaymentIntent(
  payload: CreatePaymentIntentPayload,
): Promise<PaymentIntentResponse> {
  const normalised: CreatePaymentIntentPayload = {
    ...payload,
    currency: payload.currency?.toLowerCase(),
    country: payload.country?.toUpperCase(),
  };
  const res = await api.post<{ success: boolean; data: PaymentIntentResponse }>(
    '/api/v1/payments/create-intent',
    normalised,
  );
  return res.data;
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await api.get<{ success: boolean; data: PaymentMethod[] }>('/api/v1/payments/methods');
  return res.data ?? [];
}

export async function deletePaymentMethod(id: string): Promise<void> {
  return api.delete<void>(`/api/v1/payments/methods/${encodeURIComponent(id)}`);
}

export async function createRefund(payload: RefundPayload): Promise<unknown> {
  return api.post<unknown>('/api/v1/payments/refund', payload);
}


