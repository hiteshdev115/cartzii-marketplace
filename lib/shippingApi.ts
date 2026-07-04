// ---------------------------------------------------------------------------
// Shipping API client — storefront (buyer-side)
// ---------------------------------------------------------------------------
// Mirrors the auth pattern used by POST /api/v1/orders/place-order:
//   - Authenticated users: skip guest token, send ******
//   - Guest users: include x-guest-token (default behaviour of `api`).
// Public endpoints (e.g. tracking lookup) send no auth headers at all.
// ---------------------------------------------------------------------------

import { api } from './api/client';

// ---- Request / response types ---------------------------------------------

export interface RatesDestination {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface RatesCartItem {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export interface SellerCart {
  sellerId: number;
  items: RatesCartItem[];
  subtotalCents?: number;
}

export interface RatesRequest {
  destination: RatesDestination;
  currency: string;
  sellerCarts: SellerCart[];
}

export interface ShippingRate {
  rateId: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  estDeliveryDays?: number | null;
}

export interface SellerRateQuote {
  sellerId: number;
  providerShipmentId?: string;
  rates: ShippingRate[];
  error?: { code: number; message: string };
}

export interface RatesData {
  sellerQuotes: SellerRateQuote[];
}

export type RatesResult =
  | { ok: true; data: RatesData }
  | { ok: false; errorCode?: number; message: string };

// ---- Tracking types -------------------------------------------------------

export interface TrackingEvent {
  eventId: number;
  status: string;
  description: string;
  location: string | null;
  occurredAt: string;
}

export interface TrackingData {
  shipmentId: number;
  orderId: number;
  orderNumber: string;
  carrier: string;
  service: string;
  costCents: number;
  currencyCode: string;
  trackingCode: string;
  labelUrl?: string | null;
  currentStatus: string;
  estimatedDeliveryDate?: string | null;
  actualDeliveryDate?: string | null;
  createdAt: string;
  events: TrackingEvent[];
}

export type TrackingResult =
  | { ok: true; data: TrackingData }
  | { ok: false; errorCode?: number; message: string };

// ---- API envelope ---------------------------------------------------------

interface ApiEnvelope<T> {
  success?: boolean | number;
  data?: T;
  message?: string;
  errorCode?: number;
  error?: number;
}

// ---- Auth helper (same approach as lib/api/orders.ts) ---------------------

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cartzii-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

// ---- Exported functions ---------------------------------------------------

/**
 * Fetch real-time shipping rates for the cart items.
 * Uses the same auth pattern as POST /api/v1/orders/place-order.
 */
export async function getRatesForCart(req: RatesRequest): Promise<RatesResult> {
  try {
    const isAuthenticated = !!getAuthToken();
    const envelope = await api.post<ApiEnvelope<RatesData>>(
      '/api/v1/shipping/rates',
      req,
      isAuthenticated ? { skipGuestToken: true } : undefined,
    );
    if (envelope && typeof envelope === 'object' && 'data' in envelope && envelope.data) {
      return { ok: true, data: envelope.data };
    }
    const errorCode =
      typeof envelope?.error === 'number'
        ? envelope.error
        : typeof envelope?.errorCode === 'number'
          ? envelope.errorCode
          : undefined;
    return {
      ok: false,
      errorCode,
      message: envelope?.message ?? 'Failed to get shipping rates',
    };
  } catch (err: unknown) {
    const anyErr = err as { status?: number; body?: { errorCode?: number; message?: string } };
    const errorCode = anyErr?.body?.errorCode ?? anyErr?.status;
    const message =
      anyErr?.body?.message ?? (err instanceof Error ? err.message : 'Failed to get shipping rates');
    return { ok: false, errorCode, message };
  }
}

/**
 * Fetch tracking information for a shipment.
 * This is a public endpoint — no auth header is sent.
 */
export async function getTracking(trackingCode: string): Promise<TrackingResult> {
  try {
    const envelope = await api.get<ApiEnvelope<TrackingData>>(
      `/api/v1/shipping/tracking/${encodeURIComponent(trackingCode)}`,
      // Public endpoint — skip both guest token and auth
      { skipGuestToken: true },
    );
    if (envelope && typeof envelope === 'object' && 'data' in envelope && envelope.data) {
      return { ok: true, data: envelope.data };
    }
    const errorCode =
      typeof envelope?.error === 'number'
        ? envelope.error
        : typeof envelope?.errorCode === 'number'
          ? envelope.errorCode
          : undefined;
    return {
      ok: false,
      errorCode,
      message: envelope?.message ?? 'Tracking information not found',
    };
  } catch (err: unknown) {
    const anyErr = err as { status?: number; body?: { errorCode?: number; message?: string } };
    const errorCode = anyErr?.body?.errorCode ?? anyErr?.status;
    const message =
      anyErr?.body?.message ?? (err instanceof Error ? err.message : 'Tracking information not found');
    return { ok: false, errorCode, message };
  }
}
