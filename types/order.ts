export interface OrderItem {
  productId: number;
  productName: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  stripePaymentId: string;
  estimatedDelivery?: string;
}

// Alias kept so existing imports of PlaceOrderShippingAddress still work
export type PlaceOrderShippingAddress = OrderShippingAddress;

export interface PlaceOrderItem {
  productId: number;
  variantId: number | null;
  quantity: number;
  /** Price in smallest currency unit (e.g. cents) */
  unitPrice: number;
  /** quantity × unitPrice, in smallest currency unit */
  totalPrice: number;
  currencyCode: string;
}

export interface PlaceOrderPayload {
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
  currency?: string;
  accountCreated?: boolean;
  alreadyProcessed?: boolean;
}