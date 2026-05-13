export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details: {
    name: string | null;
    email: string | null;
  };
}

export interface CreatePaymentIntentPayload {
  amount: number;
  currency?: string;
  saveCard?: boolean;
}

export interface RefundPayload {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}
