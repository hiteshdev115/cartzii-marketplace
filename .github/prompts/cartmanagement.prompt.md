---
name: cartmanagement
description: I want to make cart management using API.
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

# Manage shopping cart using the following API endpoints:
# Shopping Cart API Guide

## Overview
Complete cart management system supporting:
- Product-level cart items (products without variants)
- Variant-level cart items (products with specific variants like size/color)
- Country-specific pricing
- Stock validation
- Logged-in user cart management

## Database Table: `shoppingcart`

### Schema
```sql
cartid       INT PRIMARY KEY (auto-increment)
userid       INT (foreign key to users)
productid    INT (foreign key to products)
variantid    INT (nullable, foreign key to productvariants)
quantity     INT
isactive     BOOLEAN (default: true)
price        VARCHAR(255)
countrycode  VARCHAR(5) (nullable)
currencycode VARCHAR(5) (nullable)
addedat      TIMESTAMP
updatedat    TIMESTAMP
```

### Key Features
- **Variant Support**: `variantid` field allows adding specific product variants (e.g., "Red Shirt - Size M")
- **Country Pricing**: `countrycode` and `currencycode` enable multi-country pricing
- **Soft Delete**: `isactive` flag for soft deletion (preserves cart history)
- **Stock Validation**: Automatic stock checking before add/update

---

## API Endpoints

### 1) Add Item to Cart

**Endpoint:**
```
POST /api/v1/cart/add
```

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userid": 123,
  "productid": 456,
  "variantid": 789,
  "quantity": 2,
  "price": "29.99",
  "countrycode": "US",
  "currencycode": "USD"
}
```

**Required Fields:**
- `userid` (integer)
- `productid` (integer)
- `quantity` (integer, min: 1)
- `price` (string)

**Optional Fields:**
- `variantid` (integer) - Use when product has variants
- `countrycode` (string, max 5 chars)
- `currencycode` (string, max 5 chars)

**Behavior:**
- If item already exists in cart (same product/variant/countrycode), quantity will be incremented
- Validates product/variant existence
- Checks stock availability
- Returns error if insufficient stock

**Success Response (200 OK):**
```json
{
  "success": 1000,
  "message": "Item added to cart successfully",
  "data": {
    "cartid": 101,
    "userid": 123,
    "productid": 456,
    "variantid": 789,
    "quantity": 2,
    "price": "29.99",
    "countrycode": "US",
    "currencycode": "USD",
    "isactive": true,
    "addedat": "2026-04-22T10:30:00.000Z",
    "updatedat": "2026-04-22T10:30:00.000Z"
  }
}
```

**Error Responses:**
```json
// Missing required fields
{
  "error": 1022,
  "message": "Field required"
}

// Product not found
{
  "error": 1003,
  "message": "Product not found"
}

// Variant not found
{
  "error": 1031,
  "message": "Product variant not found"
}

// Insufficient stock
{
  "error": 1020,
  "message": "Insufficient stock"
}
```

---

### 2) Get Cart Items

**Endpoint:**
```
GET /api/v1/cart/:userid
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Path Parameters:**
- `userid` (integer, required)

**Success Response (200 OK):**
```json
{
  "success": 1000,
  "message": "Cart items retrieved successfully",
  "data": {
    "cart": [
      {
        "cartid": 101,
        "userid": 123,
        "productid": 456,
        "variantid": 789,
        "quantity": 2,
        "price": "29.99",
        "countrycode": "US",
        "currencycode": "USD",
        "subtotal": "59.98",
        "addedat": "2026-04-22T10:30:00.000Z",
        "updatedat": "2026-04-22T10:30:00.000Z",
        "product": {
          "productid": 456,
          "productname": "Cotton T-Shirt",
          "slug": "cotton-t-shirt",
          "sku": "SHIRT-001",
          "shortdescription": "Premium cotton t-shirt",
          "stockquantity": 50,
          "status": "Active",
          "category": {
            "categoryid": 5,
            "categoryname": "Clothing",
            "categoryslug": "clothing"
          },
          "image": "https://example.com/images/shirt.jpg"
        },
        "variant": {
          "variantid": 789,
          "sku": "SHIRT-001-RED-M",
          "stockquantity": 20,
          "attributes": [
            {
              "attributeName": "Color",
              "value": "Red"
            },
            {
              "attributeName": "Size",
              "value": "M"
            }
          ],
          "image": "https://example.com/images/shirt-red.jpg"
        }
      }
    ],
    "summary": {
      "totalItems": 2,
      "totalAmount": "59.98",
      "currencycode": "USD"
    }
  }
}
```

**Empty Cart Response (200 OK):**
```json
{
  "error": 1003,
  "message": "Cart is empty",
  "data": {
    "cart": [],
    "summary": {
      "totalItems": 0,
      "totalAmount": "0.00",
      "currencycode": "USD"
    }
  }
}
```

---

### 3) Update Cart Item

**Endpoint:**
```
PUT /api/v1/cart/update
```

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "cartid": 101,
  "quantity": 5,
  "price": "28.99"
}
```

**Required Fields:**
- `cartid` (integer)
- `quantity` (integer, min: 1)

**Optional Fields:**
- `price` (string) - Update price if needed

**Behavior:**
- Updates quantity and/or price of existing cart item
- Validates stock availability before update
- Returns error if insufficient stock

**Success Response (200 OK):**
```json
{
  "success": 1000,
  "message": "Cart item updated successfully",
  "data": {
    "cartid": 101,
    "userid": 123,
    "productid": 456,
    "variantid": 789,
    "quantity": 5,
    "price": "28.99",
    "countrycode": "US",
    "currencycode": "USD",
    "isactive": true,
    "addedat": "2026-04-22T10:30:00.000Z",
    "updatedat": "2026-04-22T11:15:00.000Z"
  }
}
```

**Error Responses:**
```json
// Cart item not found
{
  "error": 1003,
  "message": "Cart item not found"
}

// Insufficient stock
{
  "error": 1020,
  "message": "Insufficient stock"
}
```

---

### 4) Remove Item from Cart

**Endpoint:**
```
DELETE /api/v1/cart/remove/:cartid/:userid
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Path Parameters:**
- `cartid` (integer, required)
- `userid` (integer, required)

**Behavior:**
- Soft deletes cart item (sets `isactive = false`)
- Verifies cart item belongs to the specified user

**Success Response (200 OK):**
```json
{
  "success": 1019,
  "message": "Item removed from cart successfully"
}
```

**Error Responses:**
```json
// Cart item not found or doesn't belong to user
{
  "error": 1003,
  "message": "Cart item not found"
}

// Missing parameters
{
  "error": 1022,
  "message": "Cart ID and User ID are required"
}
```

---

### 5) Clear Cart

**Endpoint:**
```
DELETE /api/v1/cart/clear/:userid
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Path Parameters:**
- `userid` (integer, required)

**Behavior:**
- Soft deletes all active cart items for the user
- Sets `isactive = false` for all items

**Success Response (200 OK):**
```json
{
  "success": 1000,
  "message": "Cart cleared successfully"
}
```

**Error Responses:**
```json
// Cart already empty
{
  "error": 1003,
  "message": "Cart is already empty"
}
```

---

### 6) Get Cart Item Count

**Endpoint:**
```
GET /api/v1/cart/count/:userid
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Path Parameters:**
- `userid` (integer, required)

**Success Response (200 OK):**
```json
{
  "success": 1000,
  "message": "Cart count retrieved successfully",
  "data": {
    "userid": 123,
    "itemCount": 5
  }
}
```

**Note:** `itemCount` represents the total quantity of all items in cart (sum of all quantities).

---

## Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 1000 | Success | Operation completed successfully |
| 1002 | Internal server error | Server error occurred |
| 1003 | Data not found | Resource not found |
| 1019 | Deleted successfully | Item deleted successfully |
| 1020 | Operation failed | General operation failure |
| 1021 | Failed to insert data | Database insert failed |
| 1022 | Field required | Required field missing |
| 1031 | Variant not found | Product variant doesn't exist |

---

## Usage Examples

### Example 1: Add Product WITHOUT Variant
```json
POST /api/v1/cart/add
{
  "userid": 123,
  "productid": 456,
  "quantity": 1,
  "price": "49.99",
  "countrycode": "US",
  "currencycode": "USD"
}
```

### Example 2: Add Product WITH Variant (Color + Size)
```json
POST /api/v1/cart/add
{
  "userid": 123,
  "productid": 456,
  "variantid": 789,
  "quantity": 2,
  "price": "29.99",
  "countrycode": "US",
  "currencycode": "USD"
}
```

### Example 3: Update Quantity
```json
PUT /api/v1/cart/update
{
  "cartid": 101,
  "quantity": 3
}
```

### Example 4: Get Full Cart Details
```
GET /api/v1/cart/123
```

### Example 5: Remove Single Item
```
DELETE /api/v1/cart/remove/101/123
```

### Example 6: Clear Entire Cart
```
DELETE /api/v1/cart/clear/123
```

---

## Implementation Notes

### Stock Management
- System validates stock before adding/updating cart items
- For variants: checks `productvariants.stockquantity`
- For products without variants: checks `products.stockquantity`
- Returns error if requested quantity exceeds available stock

### Duplicate Prevention
- System checks for existing cart items before inserting
- Matching criteria: same `userid`, `productid`, `variantid`, and `countrycode`
- If match found, quantity is incremented instead of creating duplicate entry

### Soft Delete Strategy
- Cart items are never hard-deleted (preserves history)
- `isactive = false` marks items as removed
- Only `isactive = true` items appear in cart queries
- Allows potential "restore" or analytics features

### Multi-Country Support
- Each cart item can have a specific `countrycode`
- Enables different prices for same product in different regions
- Frontend should send user's current country code when adding items

### Product vs Variant
- **Product without variants**: `variantid` = null
- **Product with variants**: `variantid` = specific variant ID
- System handles both scenarios seamlessly

---

## Authentication & Authorization

All cart endpoints require:
- Valid JWT access token in `Authorization` header
- Token must contain valid `userid`
- User can only access/modify their own cart items