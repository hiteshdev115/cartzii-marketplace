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
  /** The shipping provider returned an error for this seller. Per-seller. */
  RATE_FETCH_ERROR: 1008,
  /** Tracking code not found. Emitted by /shipping/tracking/:code. */
  TRACKING_NOT_FOUND: 1052,
  /** Shipping provider not configured on the API side. */
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
 * An order-level rollup, not a carrier status.
 *
 * No parcel is ever "partially delivered" — an ORDER is, when one seller's
 * box has arrived and another's has not. Kept out of STATUS_BADGE_MAP so that
 * map stays exactly the vocabulary the carrier speaks and can never be handed
 * to StatusBadge for a single shipment.
 */
export const PARTIALLY_DELIVERED_BADGE = {
  label: 'Partially Delivered',
  className: 'bg-teal-100 text-teal-700',
};

/**
 * How much of a multi-seller order has actually arrived.
 *
 * A single order can carry one parcel per seller, and they do not land
 * together. Everything customer-facing that has to say "where is my order"
 * needs the same three facts, so they are derived once here rather than
 * recounted — differently — at each call site.
 */
export function getOrderDeliveryProgress(
  shipments: { currentStatus: string | null }[] | undefined,
): { total: number; delivered: number; allDelivered: boolean; partiallyDelivered: boolean } {
  const list = shipments ?? [];
  const delivered = list.filter((s) => s.currentStatus === 'delivered').length;
  return {
    total: list.length,
    delivered,
    allDelivered: list.length > 0 && delivered === list.length,
    partiallyDelivered: delivered > 0 && delivered < list.length,
  };
}

/**
 * Rolls up a multi-seller order's per-shipment tracking statuses into one
 * customer-facing badge.
 *
 * An order isn't fully delivered until every seller's shipment is, so the
 * overall status reflects the LEAST-progressed shipment — except:
 *
 *  - a failure/return anywhere takes priority, since it needs attention
 *    regardless of how far along the other shipments are;
 *  - when SOME parcels have landed and others have not, the badge says
 *    "Partially Delivered" rather than naming the laggard's status. Showing
 *    "In Transit" on an order the customer has already partly unpacked reads
 *    as though nothing had arrived at all.
 *
 * No shipments yet (no seller has bought a label) falls back to the same
 * "Processing" badge used for a freshly-created shipment.
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

  const { allDelivered, partiallyDelivered } = getOrderDeliveryProgress(shipments);
  if (allDelivered) return STATUS_BADGE_MAP.delivered;
  if (partiallyDelivered) return PARTIALLY_DELIVERED_BADGE;

  const leastProgressed = statuses.reduce((worst, status) =>
    (STATUS_PROGRESS_RANK[status] ?? 0) < (STATUS_PROGRESS_RANK[worst] ?? 0) ? status : worst,
  );

  return STATUS_BADGE_MAP[leastProgressed as ShipmentStatus] ?? STATUS_BADGE_MAP.unknown;
}

/**
 * The shipment carrying a given order line.
 *
 * Matched on seller, because that is what a shipment actually belongs to: one
 * seller packs one box for their own lines. Returns null for an item whose
 * seller has not bought a label yet — which is a real state ("still being
 * prepared"), not an error.
 *
 * A seller with more than one shipment row on the same order (a duplicate
 * label purchase — now blocked server-side, but historical rows remain)
 * resolves to the LEAST-progressed of them, so an item is never shown as
 * delivered on the strength of a stale duplicate.
 */
export function findItemShipment<T extends { sellerId: number | null; currentStatus: string | null }>(
  item: { sellerId?: number | null },
  shipments: T[] | undefined,
): T | null {
  if (item.sellerId == null) return null;
  const mine = (shipments ?? []).filter((s) => s.sellerId === item.sellerId);
  if (mine.length === 0) return null;
  return mine.reduce((worst, s) =>
    (STATUS_PROGRESS_RANK[s.currentStatus ?? 'unknown'] ?? 0) <
    (STATUS_PROGRESS_RANK[worst.currentStatus ?? 'unknown'] ?? 0)
      ? s
      : worst,
  );
}
