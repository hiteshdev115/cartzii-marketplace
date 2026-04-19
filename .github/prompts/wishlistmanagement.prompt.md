---
name: wishlistmanagement
description: want to apply api on wislists operation
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->
# wishlist always enable for logged in user only
# Apply below api to add/remove/list wished product for specific user

# Wishlist API
# Wishlist API Documentation

---

## Common Headers

All wishlist endpoints require an **Access Token** for authentication.

| Header          | Type   | Required | Description                        |
| --------------- | ------ | -------- | ---------------------------------- |
| `Authorization` | String | Yes      | Bearer token. `Bearer <accessToken>` |
| `Content-Type`  | String | Yes (POST only) | `application/json`          |

---

## 1. Add Product to Wishlist

**POST** `/api/v1/addWishListProd`

Adds a product to the user's wishlist.

### Request

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body (JSON):**

| Field       | Type    | Required | Description          |
| ----------- | ------- | -------- | -------------------- |
| `userid`    | Integer | Yes      | The user's ID        |
| `productid` | Integer | Yes      | The product's ID     |

```json
{
  "userid": 5,
  "productid": 12
}
```

### Responses

**Success (200):**

```json
{
  "success": 1000,
  "message": "Operation success"
}
```

**Already Exists (200):**

```json
{
  "error": 1023,
  "message": "Item already exists"
}
```

**Missing Fields (200):**

```json
{
  "error": 1022,
  "message": "Field required"
}
```

**Insert Failure (200):**

```json
{
  "error": 1021,
  "message": "Failed to insert data"
}
```

**Internal Server Error (500):**

```json
{
  "errorCode": 1002,
  "message": "Internal server error"
}
```

---

## 2. Get Wishlist Items by User

**GET** `/api/v1/getWisheListItems/:userid`

Returns all wishlist items for a user with full product details including images, pricing, category, and variants.

### Request

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Params:**

| Param    | Type    | Required | Description    |
| -------- | ------- | -------- | -------------- |
| `userid` | Integer | Yes      | The user's ID  |

**Example:**

```
GET /getWisheListItems/5
```

### Responses

**Success (200):**

```json
[
  {
    "wishlistid": 1,
    "userid": 5,
    "added_at": "2026-04-15T10:30:00.000Z",
    "product": {
      "productid": 12,
      "productname": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-t-shirt",
      "shortdescription": "Comfortable everyday cotton t-shirt",
      "productdescription": "Premium quality 100% cotton t-shirt with a classic fit...",
      "sku": "SKU-TS-001",
      "stockquantity": 150,
      "status": "Active",
      "tags": "cotton,t-shirt,casual,men",
      "category": {
        "categoryid": 3,
        "categoryname": "T-Shirts",
        "categoryslug": "t-shirts",
        "categoryimage": "/uploads/categories/tshirts.jpg"
      },
      "images": [
        {
          "imageid": 101,
          "productid": 12,
          "imageurl": "/uploads/productImages/tshirt-front.jpg",
          "imagetype": "main",
          "imagealttext": "Classic Cotton T-Shirt Front View",
          "isprimary": true,
          "isactive": true,
          "createdat": "2026-04-10T08:00:00.000Z",
          "updatedat": "2026-04-10T08:00:00.000Z"
        },
        {
          "imageid": 102,
          "productid": 12,
          "imageurl": "/uploads/productImages/tshirt-back.jpg",
          "imagetype": "gallery",
          "imagealttext": "Classic Cotton T-Shirt Back View",
          "isprimary": false,
          "isactive": true,
          "createdat": "2026-04-10T08:00:00.000Z",
          "updatedat": "2026-04-10T08:00:00.000Z"
        }
      ],
      "pricing": {
        "price": "29.99",
        "discountprice": "24.99",
        "discount": "17",
        "currencycode": "USD",
        "countrycode": "US"
      },
      "variants": [
        {
          "variantid": 7,
          "sku": "SKU-TS-001-RED-M",
          "stockquantity": 40,
          "pricing": [
            {
              "pricingid": 15,
              "variantid": 7,
              "countrycode": "US",
              "currencycode": "USD",
              "price": "29.99",
              "discountprice": "24.99",
              "discount": "17",
              "isactive": true,
              "createdat": "2026-04-10T08:00:00.000Z",
              "updatedat": "2026-04-10T08:00:00.000Z"
            }
          ],
          "images": [
            {
              "imageid": 201,
              "variantid": 7,
              "imageurl": "/uploads/productImages/tshirt-red.jpg",
              "imagealttext": "Red Cotton T-Shirt",
              "isprimary": true,
              "isactive": true,
              "createdat": "2026-04-10T08:00:00.000Z",
              "updatedat": "2026-04-10T08:00:00.000Z"
            }
          ],
          "attributes": [
            {
              "attributename": "Color",
              "value": "Red",
              "colorcode": "#FF0000"
            },
            {
              "attributename": "Size",
              "value": "M",
              "colorcode": null
            }
          ]
        },
        {
          "variantid": 8,
          "sku": "SKU-TS-001-BLUE-L",
          "stockquantity": 35,
          "pricing": [
            {
              "pricingid": 16,
              "variantid": 8,
              "countrycode": "US",
              "currencycode": "USD",
              "price": "29.99",
              "discountprice": null,
              "discount": null,
              "isactive": true,
              "createdat": "2026-04-10T08:00:00.000Z",
              "updatedat": "2026-04-10T08:00:00.000Z"
            }
          ],
          "images": [],
          "attributes": [
            {
              "attributename": "Color",
              "value": "Blue",
              "colorcode": "#0000FF"
            },
            {
              "attributename": "Size",
              "value": "L",
              "colorcode": null
            }
          ]
        }
      ]
    }
  }
]
```

**No Items Found (200):**

```json
{
  "error": 1003,
  "message": "Data not found"
}
```

**Internal Server Error (500):**

```json
{
  "errorCode": 1002,
  "message": "Internal server error"
}
```

---

## 3. Remove Product from Wishlist

**DELETE** `/api/v1/removeWishListProd/:userid/:productid`

Removes a specific product from the user's wishlist.

### Request

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Params:**

| Param       | Type    | Required | Description      |
| ----------- | ------- | -------- | ---------------- |
| `userid`    | Integer | Yes      | The user's ID    |
| `productid` | Integer | Yes      | The product's ID |

**Example:**

```
DELETE /removeWishListProd/5/12
```

### Responses

**Success (200):**

```json
{
  "success": 1019,
  "message": "Deleted successfully"
}
```

**Not Found (200):**

```json
{
  "error": 1003,
  "message": "Data not found"
}
```

**Missing Params (200):**

```json
{
  "error": 1022,
  "message": "Field required"
}
```

**Internal Server Error (500):**

```json
{
  "errorCode": 1002,
  "message": "Internal server error"
}
```

---

## Error Codes Reference

| Code | Constant              | Description            |
| ---- | --------------------- | ---------------------- |
| 1000 | `SUCCESS`             | Operation success      |
| 1002 | `INTERNAL_SERVER`     | Internal server error  |
| 1003 | `DATA_NOT_FOUND`      | Data not found         |
| 1019 | `DELETED_SUCCESSFULLY`| Deleted successfully   |
| 1021 | `FAIL_TO_INSERT_DATA` | Failed to insert data  |
| 1022 | `FIELD_REQUIRED`      | Field required         |
| 1023 | `ALREADY_EXISTS`      | Item already exists    |
