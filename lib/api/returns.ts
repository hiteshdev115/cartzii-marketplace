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

/** 'seller' pays the return label, or 'buyer' does. */
export type FaultParty = 'seller' | 'buyer';

export interface ReturnReason {
  id: number;
  reason: string;
  /**
   * Who the reason attributes the return to — and therefore who pays for the
   * return label. Public so the buyer can see, before they choose, that
   * "changed my mind" costs them return shipping and "arrived damaged" does
   * not.
   */
  faultParty: FaultParty;
  returnShippingPaidBy: FaultParty;
}

/**
 * What a return would actually pay out, quoted before the buyer commits.
 *
 * The whole point of this shape is that every number the buyer is held to was
 * shown to them first. A return-shipping deduction that was never disclosed is
 * one Cartzii will not charge.
 */
export interface ReturnPreview {
  faultParty: FaultParty;
  reasonId: number;
  reason: string;
  currency: string;
  /** The item price, refunded in full. */
  refundItemCents: number;
  /** Sales tax on the item, refunded in full. */
  refundTaxCents: number;
  /**
   * Tax charged on this line's share of the original delivery. NOT refunded —
   * the delivery was made, and tax follows the money.
   */
  nonRefundableShippingTaxCents: number;
  /** Cheapest return label quoted. Null when the seller pays, or unquotable. */
  returnShippingQuotedCents: number | null;
  /** What will actually be deducted. Zero whenever the seller is at fault. */
  returnShippingFeeCents: number;
  /** The bottom line: what lands back on the buyer's card. */
  refundAmountCents: number;
  returnShippingPaidBy: FaultParty;
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
  /** The refund itemised, so `refundAmount` can be explained rather than just shown. */
  refundBreakdown: {
    itemCents: number;
    taxCents: number;
    returnShippingCents: number;
    totalCents: number;
  };
  faultParty: FaultParty;
  faultOverridden: boolean;
  returnShippingPaidBy: FaultParty;
  returnShippingQuotedCents: number | null;
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

/**
 * Quotes a return before it is requested.
 *
 * Called whenever the buyer picks a reason, because the reason is what decides
 * whether they pay for the return label.
 */
export async function previewReturn(params: {
  orderitemid: number;
  returnreasonid: number;
}): Promise<ReturnPreview> {
  const res = await api.get<ApiEnvelope<ReturnPreview>>('/api/v1/returns/preview', {
    params,
    skipGuestToken: true,
  });
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
