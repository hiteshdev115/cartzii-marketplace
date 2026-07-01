# Customer Marketplace — Shipping Integration Update

> **Context:** The backend now computes real-time shipping quotes per seller (via EasyPost). It supports multi-seller carts, per-variant weight/dimensions, and returns one carrier list per seller. The customer marketplace front end needs to wire this into cart + checkout and (optionally) display product measurements. No existing endpoint contracts have been broken.

---

## 1. Shipping Rates Endpoint

`POST /api/v1/shipping/rates`
Auth: **public** (no access token required — works for guest checkout too)
Content-Type: `application/json`

### 1a. Request payload

Use the exact key names below. `sellerCarts` is preferred (aliases `sellerGroups` / `sellerItems` are also accepted). Include `variantId` on any item where the customer selected a variant — this is what unlocks accurate rates for large/heavy variants (e.g. XXL, gift box).

```json
{
  "destination": {
    "name": "Hitesh",
    "street1": "8 Polar Bear Pl",
    "city": "Brampton",
    "state": "ON",
    "zip": "L6R3L7",
    "country": "CA"
  },
  "currency": "CAD",
  "sellerCarts": [
    {
      "sellerId": 1,
      "items": [
        { "productId": 12, "quantity": 1 },
        { "productId": 13, "quantity": 2 },
        { "productId": 14, "variantId": 27, "quantity": 2 }
      ]
    },
    {
      "sellerId": 2,
      "items": [
        { "productId": 20, "variantId": 41, "quantity": 1 }
      ]
    }
  ]
}
```

**Rules**

| Field | Required | Notes |
|---|---|---|
| `destination.city` | ✅ | |
| `destination.country` | ✅ | 2-letter ISO code, must be `US` or `CA` (others rejected — see error 1006) |
| `destination.street1` / `address1` / `street` | ✅ | any one is fine |
| `destination.state` / `province` | ✅ | any one is fine |
| `destination.postalCode` / `postalcode` / `zip` | ✅ | any one is fine |
| `currency` | optional | 3-letter ISO, uppercased server-side |
| `sellerCarts` | ✅ | at least one entry, each with `sellerId` + `items[]` |
| `items[].productId` | ✅ | int |
| `items[].variantId` | optional | int or null — send when a variant was selected |
| `items[].quantity` | ✅ | int ≥ 1 |

### 1b. Response payload

```json
{
  "error": 0,
  "message": "Shipping rates fetched successfully",
  "data": {
    "sellerQuotes": [
      {
        "sellerId": 1,
        "providerShipmentId": "shp_abc123",
        "rates": [
          {
            "rateId": "rate_xyz1",
            "carrier": "USPS",
            "service": "Priority",
            "rate": 12.45,
            "currency": "USD",
            "estDeliveryDays": 3
          },
          {
            "rateId": "rate_xyz2",
            "carrier": "UPS",
            "service": "Ground",
            "rate": 15.10,
            "currency": "USD",
            "estDeliveryDays": 2
          }
        ]
      },
      {
        "sellerId": 2,
        "providerShipmentId": null,
        "rates": [],
        "error": {
          "code": 1007,
          "message": "Seller 2 does not have a complete origin address"
        }
      }
    ]
  }
}
```

**Key points**

- One entry in `sellerQuotes` per `sellerId` you sent.
- Each entry may have an `error` object (e.g. missing seller origin address, or missing weight/dims on every product). Render a per-seller warning **without** blocking checkout on other sellers.
- `providerShipmentId` and `rateId` must be **remembered** — you send them back when placing the order.

### 1c. Top-level error codes to handle

| Code | Meaning | UI action |
|---|---|---|
| `1005` | Payload missing `sellerCarts` (or aliases) | Fix client — should not happen if you follow this doc |
| `1006` | `UNSUPPORTED_COUNTRY` — country not US/CA | Show "Shipping unavailable to this country" and hide the rate list |
| `1007` | `NO_ORIGIN` (per seller, inside `sellerQuotes[].error`) | Show per-seller warning |
| `1008` | `RATE_FETCH_ERROR` (per seller, inside `sellerQuotes[].error`) | Show per-seller warning |

---

## 2. Cart Page Changes

1. **Group cart items by seller** in the UI (probably already done — this is the "multi-cart" concept).
2. Optional **shipping estimator widget**: let the guest enter city + country + postal code and call `/api/v1/shipping/rates` to preview costs before login.
3. When an item's selected variant changes, refresh the shipping estimate (variant weight/dims may differ).

---

## 3. Checkout Page Changes

1. Once the customer confirms their shipping address, call `POST /api/v1/shipping/rates` with the full cart grouped by seller and the `destination` from that address.
2. Render **one shipping-method picker per seller** in the checkout summary. Each picker lists that seller's `rates[]`. Recommended default: cheapest rate per seller.
3. Display carrier + service + rate + ETA per option, e.g. `USPS Priority — $12.45 (3 days)`.
4. **Handle per-seller errors** — if a seller's `rates` is empty and it has an `error`, show a warning like:
   > "Shipping is temporarily unavailable for **Seller Name**. Please contact support or remove these items to proceed with the rest of your order."
5. **Sum selected rates into the order total** (`Shipping = Σ selected.rate` across sellers). Convert currencies if you support multi-currency — the response `currency` is the carrier's currency, which is usually the seller-origin country.
6. **Block "Place Order"** until every seller cart has a rate selected (or the customer has explicitly removed the erroring seller's items).

---

## 4. Order Placement Payload

When calling your existing create-order endpoint, include the chosen rate per seller so the backend can buy the label later:

```json
{
  "shippingSelections": [
    { "sellerId": 1, "providerShipmentId": "shp_abc123", "rateId": "rate_xyz2" },
    { "sellerId": 2, "providerShipmentId": "shp_def456", "rateId": "rate_uvw3" }
  ]
}
```

> ⚠️ Confirm the exact field name your create-order controller expects — the shape above is the recommended contract for the shipping layer.

---

## 5. Product Detail Page (PDP) — Optional Display

All product read endpoints (`GET /getAllProductLists`, `GET /getProductBySlug/:slug`, `GET /getProductDetailsByCust/:productid`) now include six optional shipping fields on every product:

```json
{
  "weight": 0.25,
  "weightunit": "kg",
  "length": 30,
  "width": 22,
  "height": 2,
  "dimensionunit": "cm"
}
```

**Render rules**

- Only show a "Specifications" block when at least one of `weight` / `length` / `width` / `height` is non-null.
- Display with the saved unit:
  - Weight → `0.25 kg`
  - Dimensions → `30 × 22 × 2 cm`
- **Variant override**: when the customer selects a variant that has its own weight/dims (all four present on the variant), prefer the variant values in the specs block. Otherwise fall back to the product values. This matches how the backend picks values for shipping.

---

## 6. Guest Order Tracking

`GET /api/v1/tracking/:trackingCode` (unchanged — mentioned here for completeness). Use this on the order status / email links after label purchase.

---

## 7. Definition of Done

- [ ] Cart is grouped by seller and displays per-seller subtotals.
- [ ] Checkout calls `/api/v1/shipping/rates` with `sellerCarts` + `variantId` where applicable.
- [ ] One shipping picker rendered per seller; per-seller errors handled gracefully.
- [ ] Selected `rateId` + `providerShipmentId` per seller are stored client-side and sent to create-order.
- [ ] Shipping total added to order summary.
- [ ] "Place Order" is disabled until every seller cart has a rate (or its items were removed).
- [ ] Non-US/CA destinations show an "unsupported country" message and hide the rate list.
- [ ] PDP shows weight + dimensions with correct unit suffix when populated.
- [ ] Variant-selected PDP swaps to per-variant weight/dims when they exist.
- [ ] Smoke test: single-seller cart → rates load → pick rate → order places successfully.
- [ ] Smoke test: multi-seller cart with one seller missing origin address → other seller still checks out, erroring seller shows warning.
