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
  taxAmountCents: number;
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
  quantity: number;
  /** Price per unit in smallest currency unit (cents). */
  unitPrice: number;
  /** quantity × unitPrice, in smallest currency unit (cents). */
  totalPrice: number;
  currencyCode: string;
}

export interface PlaceOrderPayload {
  /** Stripe PaymentIntent id returned by Stripe after the card is confirmed. */
  paymentIntentId: string;
  currency: string;
  countryCode: string;
  shippingAddress: PlaceOrderShippingAddress;
  items: PlaceOrderItem[];
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
  shippingAddress?: OrderHistoryShippingAddress;
  itemCount: number;
  sellerCount?: number;
  sellerBreakdown?: OrderSellerBreakdown[];
  items: OrderItem[];
  /** Tracking code for the shipment, if one has been created. */
  trackingNumber?: string | null;
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