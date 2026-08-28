export interface OrderItem {
  productId: number;
  productName: string;
  imageUrl?: string;
  quantity: number;
  /** Per-unit price in smallest currency unit (cents). */
  unitPrice: number;
  /** quantity × unitPrice, in smallest currency unit (cents). */
  totalPrice: number;
  /** Discount applied to the line in smallest currency unit (cents). */
  discount?: number;
  /** Tax for the line in smallest currency unit (cents). */
  taxAmount?: number;
  /** totalPrice + taxAmount, in smallest currency unit (cents). */
  finalPrice?: number;
  /** Seller information surfaced on the flat items[] for multi-seller orders. */
  sellerId?: number;
  sellerName?: string;
  /** Present on order history items returned by `/orders/my-orders`. */
  orderItemId?: number;
  /** Server-computed — never derive this client-side. True once the item has
   *  been delivered, is within the 30-day return window, and has no active
   *  (non-rejected) return request already open. */
  returnEligible?: boolean;
  /** ISO timestamp — when the return window closes for this item. */
  returnWindowExpiresAt?: string | null;
  /** The most recent return request's id for this item, if any — use this to
   *  link to `/account/returns/{id}` for the status/tracking detail view. */
  existingReturnId?: number | null;
  /** The most recent return request's statusid for this item, if any. */
  existingReturnStatusId?: number | null;
  /** The most recent return's shipment tracking status (e.g. "in_transit"),
   *  once a return label has been generated and the carrier has scanned it. */
  existingReturnShipmentStatus?: string | null;
  variantInfo?: string;
  currencyCode: string;
}

// Shared address shape — used by both OrderConfirmation and PlaceOrderPayload
export interface OrderShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
}

export interface TaxComponent {
  name: string;
  rate: number;
  label?: string;
}

export interface TaxBreakdown {
  taxName: string;
  stateName?: string;
  stateCode?: string;
  countryCode?: string;
  /** Combined effective tax rate (e.g. 0.13 for HST) */
  totalRate?: number;
  components?: TaxComponent[];
}

/** Response body of `GET /api/v1/orders/tax-estimate` (data envelope already unwrapped). */
export interface TaxEstimate {
  countryCode: string;
  stateCode: string;
  stateName?: string;
  taxApplicable: boolean;
  taxRate: number;
  taxName: string;
  components: TaxComponent[];
  subtotalCents: number;
  /** Shipping included in the taxable base. */
  shippingCents?: number;
  /** Goods + shipping — what the rate was applied to. */
  taxableBaseCents?: number;
  taxAmountCents: number;
  /** Goods + shipping + tax. The whole charge — do NOT add shipping again. */
  totalAmountCents: number;
  subtotalDollars: string;
  taxAmountDollars: string;
  totalAmountDollars: string;
}

/** Per-seller grouping on the order detail response.
 *  Monetary values come from the API in smallest currency unit (cents). */
export interface OrderSellerBreakdown {
  sellerId: number;
  sellerName?: string;
  itemCount: number;
  /** Subtotal in cents. */
  subtotal: number;
  /** Tax in cents. */
  taxAmount: number;
  /** Grand total in cents (subtotal + taxAmount). */
  total: number;
  taxRate?: number;
  items?: OrderItem[];
}

export interface OrderConfirmation {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  email: string;
  shippingAddress: OrderShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  /** Tax in major currency units (e.g. dollars), already calculated server-side. */
  taxAmount?: number;
  /** Combined tax rate (e.g. 0.13). */
  taxRate?: number;
  taxBreakdown?: TaxBreakdown;
  /** Per-seller grouping for multi-seller orders ("Sold by …" sections). */
  sellerBreakdown?: OrderSellerBreakdown[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  stripePaymentId: string;
  estimatedDelivery?: string;
  shipments?: OrderShipmentSummary[];
  /** Server-computed — true only while the order hasn't shipped yet. */
  cancelEligible?: boolean;
}

/** Shape of the `shippingAddress` block sent to `POST /api/v1/orders/place-order`. */
export interface PlaceOrderShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
}

export interface PlaceOrderItem {
  productId: number;
  /**
   * Which variant, when the product has them.
   *
   * Stock is held per variant, so this is what the server takes the units
   * from. It also narrows price validation: given a variant, the server
   * accepts only that variant's price instead of any price the product sells
   * at. Absent for products with no variants.
   */
  variantId?: number;
  quantity: number;
  /** Price per unit in smallest currency unit (cents). */
  unitPrice: number;
  /** quantity × unitPrice, in smallest currency unit (cents). */
  totalPrice: number;
  currencyCode: string;
}

/**
 * Per-seller shipping selection captured from `/api/v1/shipping/rates`.
 * The backend uses these to buy the carrier label after order creation.
 */
export interface PlaceOrderShippingSelection {
  sellerId: number;
  providerShipmentId: string;
  rateId: string;
  /**
   * What this seller's shipping added to the charge, in cents — 0 when their
   * free-shipping threshold was met.
   *
   * Used only to SPLIT the shipping total across sellers for their ledgers. The
   * server derives the total independently from the captured Stripe amount and
   * rejects a split that doesn't sum to it, so this cannot inflate the order.
   */
  amountCents?: number;
}

export interface PlaceOrderPayload {
  /** Stripe PaymentIntent id returned by Stripe after the card is confirmed. */
  paymentIntentId: string;
  /**
   * Which storefront portal the order was placed from ('us' or 'ca').
   * Derived from the URL locale, not sniffed from headers — used by the
   * backend for portal/country validation and for building portal-correct
   * links (e.g. the OTP login link) in transactional emails.
   */
  portal: 'us' | 'ca';
  currency: string;
  countryCode: string;
  shippingAddress: PlaceOrderShippingAddress;
  items: PlaceOrderItem[];
  /**
   * One entry per seller in the cart. Optional so we don't break clients that
   * haven't been upgraded yet, but the server needs this to buy labels.
   */
  shippingSelections?: PlaceOrderShippingSelection[];
  guest?: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

/** Per-seller split returned by `POST /place-order`.
 *  Amounts here come back from the API in major currency units (dollars). */
export interface PlaceOrderSellerSplit {
  sellerId: number;
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  taxRate?: number;
  total: number;
}

export interface PlaceOrderResponse {
  orderId: number;
  orderNumber: string;
  /** Server-calculated subtotal (major units). */
  subtotal?: number;
  /** Server-calculated tax amount (major units). */
  taxAmount?: number;
  /** Server-calculated grand total (major units). */
  totalAmount?: number;
  taxBreakdown?: TaxBreakdown;
  sellerBreakdown?: PlaceOrderSellerSplit[];
  currency?: string;
  accountCreated?: boolean;
  alreadyProcessed?: boolean;
}

/** Shipping address shape returned by `/orders/my-orders`.
 *  Note: uses `addressLine1` rather than `street`. */
export interface OrderHistoryShippingAddress {
  firstName?: string;
  lastName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** A single order row in `GET /api/v1/orders/my-orders`.
 *  All monetary fields are integer cents. */
export interface OrderHistoryRow {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  currency: string;
  countryCode?: string;
  /** Subtotal in cents. */
  subtotal: number;
  /** Tax in cents. */
  taxAmount: number;
  taxRate?: number;
  taxBreakdown?: TaxBreakdown | Record<string, number>;
  /** Grand total in cents. */
  totalAmount: number;
  orderStatusId?: number;
  paymentStatusId?: number;
  paymentStatus?: string;
  stripePaymentId?: string;
  /** Server-computed — true only while the order hasn't shipped yet. */
  cancelEligible?: boolean;
  shippingAddress?: OrderHistoryShippingAddress;
  itemCount: number;
  sellerCount?: number;
  sellerBreakdown?: OrderSellerBreakdown[];
  items: OrderItem[];
  /** Tracking code for the shipment, if one has been created. */
  trackingNumber?: string | null;
  /**
   * Real per-seller shipment/tracking info (a multi-seller order can have
   * one shipment per seller). Server-computed — use this to decide whether
   * to show a "Track Order" link, not the legacy `trackingNumber` above.
   */
  shipments?: OrderShipmentSummary[];
}

export interface OrderShipmentSummary {
  sellerId: number | null;
  sellerName: string | null;
  trackingCode: string | null;
  currentStatus: string | null;
  carrier: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
}

export interface OrderHistoryPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderHistoryResponse {
  orders: OrderHistoryRow[];
  pagination: OrderHistoryPagination;
}