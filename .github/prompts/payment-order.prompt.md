You are working in a Next.js 14 App Router project (TypeScript) called cartzii-marketplace.

## Problem to Fix
The file `components/checkout/PaymentForm.tsx` currently calls `/api/v1/payments/create-intent` on component mount (page load), which creates unwanted entries in Stripe. This must be fixed.

## Tasks

### 1. Fix the PaymentForm — defer /create-intent to Pay Now button click

Refactor `components/checkout/PaymentForm.tsx` so that:
- On component mount, do NOT call `/create-intent`. Only load the Stripe Elements UI shell.
- When the user clicks the "Pay Now" button:
  1. First call `POST /api/v1/payments/create-intent` with `{ amount, currency, country }` from cart/shipping state to get a `clientSecret`.
  2. Use the returned `clientSecret` to call `stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement } })`.
  3. If payment succeeds, call the `onSubmit(paymentResult)` callback, passing the `paymentIntentId` and full `paymentResult`.
  4. If payment fails, show an inline error message inside the form (do NOT crash or redirect).
- Show a loading spinner on the button while the API calls / Stripe confirmation is in progress.
- Disable the button during processing to prevent double-clicks.
- Use `try/catch` with proper user-facing error messages.

### 2. Update CheckoutPageContent.tsx

In `app/[locale]/checkout/CheckoutPageContent.tsx`:
- Update `handlePaymentSubmit` to accept `paymentResult: { paymentIntentId: string, amount: number, currency: string }`.
- After receiving payment success, call `POST /api/v1/orders/place-order` (see API server prompt) with:
  ```json
  {
    "paymentIntentId": "pi_xxx",
    "shippingAddress": { ...shippingFormData },
    "items": [ ...cartItems ],
    "currency": "usd",
    "countryCode": "us"
  }
  ```
On success, receive { orderNumber, orderId } from the API.
Set orderNumber and orderId in state, clearCart(), and navigate to /{locale}/order-confirmation/{orderNumber}.
Show a full-screen loading overlay while the place-order API call is in progress.

### 3. Create a new Order Confirmation Page
Create app/[locale]/order-confirmation/[orderNumber]/page.tsx (server component wrapper) and app/[locale]/order-confirmation/[orderNumber]/OrderConfirmationContent.tsx (client component).

The confirmation page should:

Fetch order details from GET /api/v1/orders/{orderNumber} on mount.
While loading, show a skeleton/spinner.
On success, render a clean, professional invoice-style confirmation UI:
Layout:

Top: Large green ✅ checkmark icon + "Order Confirmed!" heading.
Below: Order number in mono font, date/time, estimated delivery.
Invoice Card (white card with shadow, rounded corners, border):
Header row: "Invoice" label left, order number + date right.
"Bill To" section: customer name, email, shipping address.
Items Table with columns: Product Image (small thumbnail) | Product Name + Variant | Qty | Unit Price | Total
Divider line.
Subtotal, Shipping (Free / amount), Discount (if any), Total Paid (bold, larger font).
Footer: Payment method (Card ending in ••••), Transaction ID.
Print Button: A prominent "🖨️ Print Order" button (top right of the invoice card). On click, call window.print(). Use CSS @media print to hide the navbar, footer, and all buttons, showing only the invoice card.
Continue Shopping button linking back to /products.
Styling: Use Tailwind CSS consistent with the existing design system (slate colors, rounded-xl, shadow-md). Make it fully responsive — looks great on mobile and desktop.

### 4. Types & Utilities
In types/order.ts (create if not exists), define:

TypeScript
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

export interface OrderConfirmation {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  email: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  stripePaymentId: string;
}
### 5. API client helper
In lib/api/orders.ts (create if not exists), add:

TypeScript
export async function placeOrder(payload: PlaceOrderPayload): Promise<{ orderNumber: string; orderId: number }>
export async function getOrderByNumber(orderNumber: string): Promise<OrderConfirmation>
Use the existing API base URL config pattern used throughout the project.

Code Quality Requirements
All new code must be TypeScript with proper types (no any).
Use existing i18n useTranslations patterns for all user-facing strings.
Add translation keys to messages/en.json (and any other locale files) for: "Placing your order...", "Order Confirmed!", "Invoice", "Bill To", "Items", "Subtotal", "Shipping", "Total Paid", "Print Order", "Transaction ID", "Payment Method".
Follow existing component file structure and import aliases (@/components, @/lib, etc.).
Do not introduce new npm packages unless absolutely necessary.
Handle API error states gracefully with user-friendly error messages.
