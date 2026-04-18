---
name: searchproduct
description: make search product globally.
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

# call below api and make global search when user type min 3 character in searchbox then call this api and get result and shown in page below.

# Product Search API

## Endpoint

| Method | URL | Auth |
|--------|-----|------|
| `GET` | `/searchProducts` | Guest Token (`x-guest-token` header) |

---

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | **Yes** | — | Search keyword (min 3 character) |
| `categoryid` | number | No | — | Filter results by category ID |
| `countrycode` | string | No | `us` | Country code for pricing (max 5 chars) |
| `page` | number | No | `1` | Page number (min 1) |
| `limit` | number | No | `20` | Results per page (min 1, max 50) |
| `sortby` | string | No | `relevance` | Sort order: `price_asc`, `price_desc`, `newest`, `relevance` |

---

## Search Behavior

- Searches across: `productname`, `tags`, `shortdescription`, `sku`, `slug`, and `categoryname`
- Case-insensitive partial matching
- Only returns products with `status = "Active"`
- Results are cached in Redis for **5 minutes**

---

## Example Requests

### Basic Search

```
GET /searchProducts?q=shirt
```

### Search with Filters

```
GET /searchProducts?q=shirt&categoryid=5&countrycode=in&page=1&limit=10&sortby=price_asc
```

### Search with Pagination

```
GET /searchProducts?q=electronics&page=2&limit=15
```

### Search Sorted by Newest

```
GET /searchProducts?q=shoes&sortby=newest
```

---

## Headers

```
x-guest-token: <guest_token_value>
```

---

## Responses

### 200 OK — Results Found

```json
{
  "success": true,
  "data": [
    {
      "productid": 12,
      "productname": "Blue Cotton Shirt",
      "slug": "blue-cotton-shirt",
      "shortdescription": "Comfortable blue cotton shirt for daily wear",
      "tags": "cotton,shirt,blue,casual",
      "status": "Active",
      "categoryname": "Shirts",
      "primaryImage": {
        "imageurl": "https://cdn.example.com/products/blue-shirt.jpg",
        "imagealttext": "Blue Cotton Shirt"
      },
      "pricing": {
        "price": "29.99",
        "discountprice": "24.99",
        "discount": "16.67",
        "currencycode": "USD"
      }
    },
    {
      "productid": 45,
      "productname": "Red Formal Shirt",
      "slug": "red-formal-shirt",
      "shortdescription": "Premium red formal shirt",
      "tags": "formal,shirt,red",
      "status": "Active",
      "categoryname": "Shirts",
      "primaryImage": {
        "imageurl": "https://cdn.example.com/products/red-shirt.jpg",
        "imagealttext": "Red Formal Shirt"
      },
      "pricing": {
        "price": "49.99",
        "discountprice": null,
        "discount": null,
        "currencycode": "USD"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

### 200 OK — No Results

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### 400 Bad Request — Missing Search Query

```json
{
  "success": false,
  "errorCode": 1001,
  "message": [
    "\"q\" is required"
  ]
}
```

### 400 Bad Request — Invalid Parameters

```json
{
  "success": false,
  "errorCode": 1001,
  "message": [
    "\"limit\" must be less than or equal to 50",
    "\"sortby\" must be one of [price_asc, price_desc, newest, relevance]"
  ]
}
```

### 401 Unauthorized — Missing/Invalid Guest Token

```json
{
  "errorCode": 1005,
  "message": "Access denied. No token provided"
}
```

### 500 Internal Server Error

```json
{
  "errorCode": 1000,
  "message": "Internal server error"
}
```

---

## Notes

- When a product has no direct country pricing, the API falls back to the cheapest variant pricing for that country.
- If no pricing is available at all, the `pricing` field will be `null`.
- If no primary image exists, the `primaryImage` field will be `null`.
- Price-based sorting (`price_asc`, `price_desc`) is applied after fetching results since pricing is stored in related tables.
