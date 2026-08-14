import { api } from './client';
import type {
  OrderConfirmation,
  OrderHistoryResponse,
  PlaceOrderPayload,
  PlaceOrderResponse,
  TaxEstimate,
} from '@/types/order';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';

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

export interface CancelOrderResult {
  orderId: number;
  refunded: boolean;
}

export async function cancelOrder(orderNumber: string): Promise<CancelOrderResult> {
  const res = await api.post<ApiEnvelope<CancelOrderResult>>(
    `/api/v1/orders/${encodeURIComponent(orderNumber)}/cancel`,
    undefined,
    { skipGuestToken: true },
  );
  return unwrap(res);
}

export interface TaxEstimateParams {
  countryCode: string;
  stateCode: string;
  /** Subtotal in the smallest currency unit (e.g. cents). */
  subtotalCents: number;
}

export async function getTaxEstimate(params: TaxEstimateParams): Promise<TaxEstimate> {
  const isAuthenticated = !!getAuthToken();
  const res = await api.get<ApiEnvelope<TaxEstimate>>(
    '/api/v1/orders/tax-estimate',
    {
      params: {
        countryCode: params.countryCode,
        stateCode: params.stateCode,
        subtotalCents: params.subtotalCents,
      },
      ...(isAuthenticated ? { skipGuestToken: true } : {}),
    },
  );
  return unwrap(res);
}

export interface MyOrdersParams {
  page?: number;
  /** Max 100. */
  limit?: number;
  /** Optional `orders.statusid` filter. */
  status?: number;
  /** Optional `orders.paymentstatusid` filter. */
  paymentStatusId?: number;
}

export async function fetchMyOrders(
  params: MyOrdersParams = {},
): Promise<OrderHistoryResponse> {
  const res = await api.get<ApiEnvelope<OrderHistoryResponse>>(
    '/api/v1/orders/my-orders',
    {
      params: {
        page: params.page,
        limit: params.limit,
        status: params.status,
        paymentStatusId: params.paymentStatusId,
      },
      skipGuestToken: true,
    },
  );
  return unwrap(res);
}

interface OrdersStreamTicket {
  token: string;
}

async function requestOrdersStreamToken(): Promise<string> {
  const res = await api.post<ApiEnvelope<OrdersStreamTicket>>(
    '/api/v1/orders/stream-token',
    undefined,
    { skipGuestToken: true },
  );
  const { token } = unwrap(res);
  return token;
}

export interface OrderUpdatePing {
  orderId: number;
  orderNumber?: string;
}

/**
 * Subscribes to live "one of your orders changed" pings. Browsers'
 * EventSource can't send an Authorization header, so this first exchanges
 * the customer's normal session for a short-lived, single-purpose ticket
 * (via `requestOrdersStreamToken`) before opening the stream — the ticket
 * only proves identity at connection time and expires quickly, so it's
 * never treated as a general bearer token. On a dropped connection this
 * reconnects with a fresh ticket rather than relying on EventSource's
 * native retry, since the old ticket may have expired by then.
 *
 * Returns an unsubscribe function for the caller's effect cleanup.
 */
export function subscribeToOrderUpdates(onUpdate: (ping: OrderUpdatePing) => void): () => void {
  let source: EventSource | null = null;
  let stopped = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  async function connect() {
    if (stopped) return;

    let token: string;
    try {
      token = await requestOrdersStreamToken();
    } catch {
      return; // not logged in, or the request failed — order history still works via the normal fetch
    }
    if (stopped) return;

    source = new EventSource(`${API_BASE_URL}/api/v1/orders/stream?token=${encodeURIComponent(token)}`);
    source.onmessage = (event) => {
      try {
        onUpdate(JSON.parse(event.data) as OrderUpdatePing);
      } catch {
        // malformed event — ignore
      }
    };
    source.onerror = () => {
      source?.close();
      source = null;
      if (!stopped) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };
  }

  void connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    source?.close();
  };
}