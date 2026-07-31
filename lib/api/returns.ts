import { api } from './client';

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

export interface ReturnReason {
  id: number;
  reason: string;
}

export interface ReturnEvent {
  status: string;
  description: string | null;
  occurredAt: string;
}

export interface ReturnRequest {
  returnId: number;
  orderItemId: number;
  userId: number;
  sellerId: number;
  returnReasonId: number;
  reason: string | null;
  statusId: number;
  customerNote: string | null;
  sellerNote: string | null;
  refundAmount: number;
  /** The item's currency (CAD for /ca/ orders, USD for /us/) — never assume USD. */
  currency: string;
  requestedAt: string;
  approvedAt: string | null;
  refundedAt: string | null;
  labelUrl: string | null;
  trackingCode: string | null;
  shipmentStatus: string | null;
  /** Only populated by `getReturnById`, not the list endpoints. */
  orderId?: number | null;
  orderNumber?: string | null;
  productName?: string;
  productImageUrl?: string | null;
  events?: ReturnEvent[];
}

export interface ReturnsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MyReturnsResponse {
  returns: ReturnRequest[];
  pagination: ReturnsPagination;
}

export async function getReturnReasons(): Promise<ReturnReason[]> {
  const res = await api.get<ApiEnvelope<ReturnReason[]>>('/api/v1/returns/reasons');
  return unwrap(res);
}

export interface RequestReturnPayload {
  orderitemid: number;
  returnreasonid: number;
  customerNote?: string;
}

export async function requestReturn(payload: RequestReturnPayload): Promise<ReturnRequest> {
  const res = await api.post<ApiEnvelope<ReturnRequest>>('/api/v1/returns', payload, { skipGuestToken: true });
  return unwrap(res);
}

export interface MyReturnsParams {
  page?: number;
  limit?: number;
}

export async function getMyReturns(params: MyReturnsParams = {}): Promise<MyReturnsResponse> {
  const res = await api.get<ApiEnvelope<MyReturnsResponse>>('/api/v1/returns/my-returns', {
    params: { page: params.page, limit: params.limit },
    skipGuestToken: true,
  });
  return unwrap(res);
}

export async function getReturnById(returnId: number): Promise<ReturnRequest> {
  const res = await api.get<ApiEnvelope<ReturnRequest>>(`/api/v1/returns/${returnId}`, {
    skipGuestToken: true,
  });
  return unwrap(res);
}
