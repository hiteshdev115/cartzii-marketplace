/**
 * Shipping error codes returned by the API (/api/v1/shipping/*).
 *
 * Aligned with the multi-seller shipping contract:
 *   - 1005 / 1006 are top-level (envelope.error) failures for the rates call.
 *   - 1007 / 1008 are per-seller failures inside `sellerQuotes[].error`.
 *   - 1052 is emitted by the tracking endpoint (unchanged).
 *
 * `NOT_CONFIGURED` is retained as a legacy top-level code the client may still
 * receive from older API deployments — treated as a blocking system-wide error.
 */
export const SHIPPING_ERROR_CODES = {
  /** Payload missing `sellerCarts` (or aliases). Top-level. */
  MISSING_SELLER_CARTS: 1005,
  /** Destination country is not US/CA. Top-level. */
  UNSUPPORTED_COUNTRY: 1006,
  /** Seller has no complete origin address. Per-seller. */
  NO_ORIGIN: 1007,
  /** Rate provider (EasyPost) returned an error for this seller. Per-seller. */
  RATE_FETCH_ERROR: 1008,
  /** Tracking code not found. Emitted by /shipping/tracking/:code. */
  TRACKING_NOT_FOUND: 1052,
  /** Legacy: EasyPost/shipping provider not configured on the API side. */
  NOT_CONFIGURED: 1047,
} as const;

export type ShippingErrorCode = (typeof SHIPPING_ERROR_CODES)[keyof typeof SHIPPING_ERROR_CODES];

/** Shipment status values as returned by the tracking API. */
export type ShipmentStatus =
  | 'label_created'
  | 'pre_transit'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'return_to_sender'
  | 'failure'
  | 'unknown';

/** Tailwind classes + label for each shipment status badge. */
export const STATUS_BADGE_MAP: Record<
  ShipmentStatus,
  { label: string; className: string }
> = {
  label_created: {
    label: 'Processing',
    className: 'bg-slate-100 text-slate-700',
  },
  pre_transit: {
    label: 'Pre-Transit',
    className: 'bg-blue-100 text-blue-700',
  },
  in_transit: {
    label: 'In Transit',
    className: 'bg-indigo-100 text-indigo-700',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    className: 'bg-amber-100 text-amber-700',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-100 text-emerald-700',
  },
  return_to_sender: {
    label: 'Return to Sender',
    className: 'bg-orange-100 text-orange-700',
  },
  failure: {
    label: 'Delivery Failed',
    className: 'bg-red-100 text-red-700',
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-slate-100 text-slate-500',
  },
};

/** Common carrier display names. */
export const CARRIER_DISPLAY_NAMES: Record<string, string> = {
  USPS: 'USPS',
  UPS: 'UPS',
  FEDEX: 'FedEx',
  DHL: 'DHL',
  CANADA_POST: 'Canada Post',
  PUROLATOR: 'Purolator',
};

export function getCarrierDisplay(carrier: string): string {
  return CARRIER_DISPLAY_NAMES[carrier.toUpperCase()] ?? carrier;
}

/** Progress order for non-problem statuses — lower means earlier in transit. */
const STATUS_PROGRESS_RANK: Record<string, number> = {
  label_created: 0,
  unknown: 0,
  pre_transit: 1,
  in_transit: 2,
  out_for_delivery: 3,
  delivered: 4,
};

/**
 * Rolls up a multi-seller order's per-shipment tracking statuses into one
 * customer-facing badge. An order isn't fully delivered until every seller's
 * shipment is, so the overall status reflects the LEAST-progressed shipment
 * (e.g. one seller delivered + one still in transit → shows "In Transit") —
 * except a failure/return anywhere takes priority since it needs attention
 * regardless of how far along the other shipments are. No shipments yet
 * (no seller has bought a label) falls back to the same "Processing" badge
 * used for a freshly-created shipment.
 */
export function getOrderStatusBadge(
  shipments: { currentStatus: string | null }[] | undefined,
): { label: string; className: string } {
  if (!shipments || shipments.length === 0) {
    return STATUS_BADGE_MAP.label_created;
  }

  const statuses = shipments.map((s) => s.currentStatus ?? 'unknown');

  if (statuses.includes('failure')) return STATUS_BADGE_MAP.failure;
  if (statuses.includes('return_to_sender')) return STATUS_BADGE_MAP.return_to_sender;

  const leastProgressed = statuses.reduce((worst, status) =>
    (STATUS_PROGRESS_RANK[status] ?? 0) < (STATUS_PROGRESS_RANK[worst] ?? 0) ? status : worst,
  );

  return STATUS_BADGE_MAP[leastProgressed as ShipmentStatus] ?? STATUS_BADGE_MAP.unknown;
}
