# Phase 3 — Storefront Shipping Integration

> **Status:** Complete  
> **Target branch:** `feature/dev`

---

## Overview

Phase 3 integrates the shipping API (deployed in Phase 1) into the buyer-facing marketplace. Buyers can now see real carrier rates during checkout and track their shipments after purchase.

---

## What was added / changed

### New files

| File | Purpose |
|---|---|
| `lib/shippingApi.ts` | Typed fetch wrapper for `/api/v1/shipping/rates` and `/api/v1/shipping/tracking/:code` |
| `lib/usCaStates.ts` | Static list of US states + CA provinces/territories |
| `lib/shippingConstants.ts` | `SHIPPING_ERROR_CODES`, `STATUS_BADGE_MAP`, carrier display names |
| `stores/checkoutStore.ts` | Zustand (persisted) store for locked shipping address, seller rate quotes, and selected rates |
| `components/shipping/StatusBadge.tsx` | Coloured badge for shipment status |
| `components/shipping/TrackingTimeline.tsx` | Vertical timeline of tracking events |
| `components/shipping/CountryStateSelect.tsx` | Reusable US/CA country + dependent state/province dropdowns |
| `components/shipping/SellerRateSelector.tsx` | Radio-selectable rate cards for a single seller |
| `components/shipping/RateSelectorPanel.tsx` | Multi-seller wrapper: fetches rates on address change (300 ms debounce), renders `SellerRateSelector` per seller group |
| `components/shipping/TrackingLookupForm.tsx` | Manual tracking code entry form |
| `app/[locale]/track/page.tsx` | `/track` — tracking lookup landing page |
| `app/[locale]/track/[trackingCode]/page.tsx` | `/track/:code` — live tracking detail page |
| `.env.local.example` | Documents required environment variables |

### Modified files

| File | Change |
|---|---|
| `components/checkout/ShippingForm.tsx` | Persists the confirmed address to `checkoutStore`; clears stale rate quotes on address change |
| `components/checkout/OrderSummary.tsx` | Shipping line now shows the total of selected rates from `checkoutStore` |
| `app/[locale]/checkout/CheckoutPageContent.tsx` | Inserts `RateSelectorPanel` between the locked shipping address and the payment form; `orderAmountCents` includes selected shipping cost; PaymentForm only renders when rates are eligible |
| `app/[locale]/account/orders/OrdersContent.tsx` | Adds a **Track Order** link per order row when `trackingNumber` is present |
| `types/order.ts` | Additively adds `trackingNumber?: string \| null` to `OrderHistoryRow` |
| `messages/en.json`, `messages/fr.json` | Appended `Shipping` and `Tracking` namespaces; new `Checkout` keys |

---

## Checkout flow (after Phase 3)

```
1. Shipping Form (address entry)
   └─ address confirmed → stored in checkoutStore, rate quotes cleared
2. RateSelectorPanel (auto-fetches rates, 300 ms debounce)
   └─ rates selected → stored in checkoutStore
3. PaymentForm (Stripe)
   └─ renders only when rates eligible + tax estimate ready
4. Order placed (Stripe PaymentIntent + /place-order)
5. Confirmation page
```

---

## Shipping API error handling

| Code | Meaning | UX |
|---|---|---|
| 1047 | NOT_CONFIGURED | Orange banner in `RateSelectorPanel`; blocks PaymentForm |
| 1048 | UNSUPPORTED_COUNTRY | Prevented by ShippingForm (US/CA only) |
| 1049 | RATE_FETCH_ERROR | Per-seller error card with Retry button |
| 1050 | NO_ORIGIN | Per-seller error card; blocks PaymentForm |
| 1052 | TRACKING_NOT_FOUND | Empty state on `/track/:code` page |

---

## Multi-seller support (Phase 4C)

Multi-seller grouping is fully implemented as of Phase 4C. The `Product` type
now carries `sellerId` (and optional `sellerName`), and `RateSelectorPanel`
groups cart items by real `sellerId` before calling `/api/v1/shipping/rates`,
sending each seller its own `subtotalCents`.

---

## Scope guardrails honoured

- ✅ `PaymentForm` and Stripe wiring unchanged
- ✅ Zustand cart store public shape unchanged
- ✅ Existing i18n keys unchanged (only appended)
- ✅ 4-step `CheckoutSteps` flow unchanged (steps are visual only)
- ✅ No existing types renamed or removed (only additive additions)
- ✅ `next-intl` middleware / i18n routing config untouched
- ✅ Auth header pattern mirrors `POST /api/v1/orders/place-order`


## Phase 4C: Free Shipping UX (marketplace) — COMPLETE

**Buyer-facing features:**
1. **Cart page:** Per-seller banners driven by `POST /api/v1/sellers/shipping-thresholds`
   - 🎉 "Free shipping unlocked from {storeName}!" when seller subtotal >= threshold
   - ⚡ "Add {remaining} more from {storeName} for free shipping!" when 0 < subtotal < threshold
   - No banner when threshold is null (unconfigured seller)
   - Instant 🎉 banner when threshold is 0 (unconditional free shipping seller)

2. **Checkout page:** Per-seller free-shipping visuals in `SellerRateSelector`
   - Green "🎉 Free shipping applied" banner above rate cards for eligible sellers
   - Rate prices rendered as ~~$X.XX~~ **FREE** (strike-through + green FREE label)
   - Accessible: `aria-label="Was $6.42, now free"` on each strike-through
   - Rate selection behavior unchanged — cheapest still auto-selected, buyer can still change

3. **Financial correctness:**
   - `checkoutStore.getTotalShippingCents()` returns 0 for free-shipping sellers
   - `OrderSummary.tsx` shipping line reflects free-shipping-adjusted total
   - Stripe PaymentIntent `amount` excludes shipping cost for free-shipping sellers
   - `POST /place-order` unchanged — backend independently verifies threshold + charges accordingly

**Silent-fail UX:** Threshold API failure = no banners shown, no toast, no broken layout. Checkout still works normally (uses `freeShippingApplied` from `/shipping/rates` directly).
