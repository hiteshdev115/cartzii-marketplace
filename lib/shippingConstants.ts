/** Shipping error codes returned by the API (/api/v1/shipping/*). */
export const SHIPPING_ERROR_CODES = {
  NOT_CONFIGURED: 1047,
  UNSUPPORTED_COUNTRY: 1048,
  RATE_FETCH_ERROR: 1049,
  NO_ORIGIN: 1050,
  TRACKING_NOT_FOUND: 1052,
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
    label: 'Label Created',
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
