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
  accountCreated?: boolean;
  alreadyProcessed?: boolean;
}