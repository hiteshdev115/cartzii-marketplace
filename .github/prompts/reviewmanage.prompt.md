---
name: reviewmanage
description: I want to manage product reviews using API.
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->
Note: Post review is always enable for logged in csustomer only and get review for product is open for all with guest token also.
In the review form, user can upload image/video for review and also provide rating, title and comment for the product. image video updload is optional So, we need to use multipart/form-data for post review api.
# Manage product reviews using the following API endpoints:
# Product Reviews API
## Endpoints
# Review API Documentation

**API Prefix:** `/api/v1`

---

## Common Headers

| Header          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `Authorization` | String | Yes (POST) / Optional (GET) | `Bearer <accessToken>` for POST. Guest token for GET. |
| `Content-Type`  | String | POST only | `multipart/form-data` (supports media upload) |

---

## 1. Post a Review

**POST** `/postReview`

Submit a product review with optional image/video uploads. Requires an authenticated user (access token).

**Auth:** `verifyAccessToken` (Bearer token required)
**Body Limit:** 100 MB (supports media uploads)
**Content-Type:** `multipart/form-data`

### Request

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Form Fields:**

| Field         | Type     | Required | Description                                       |
| ------------- | -------- | -------- | ------------------------------------------------- |
| `productid`   | Integer  | Yes      | The product ID to review                          |
| `userid`      | Integer  | No       | User ID (auto-resolved from JWT token if omitted) |
| `rating`      | Float    | Yes      | Rating value between 1.0 and 5.0                 |
| `reviewtitle` | String   | No       | Title/headline for the review                     |
| `reviewtext`  | String   | Yes      | The review body text                              |
| `media`       | File[]   | No       | Image or video files (jpg, png, mp4, mov, etc.)   |

**Example (cURL):**

```bash
curl -X POST https://staging-api.cartzii.com/api/v1/postReview \
  -H "Authorization: Bearer <accessToken>" \
  -F "productid=14" \
  -F "rating=4.5" \
  -F "reviewtitle=Great product!" \
  -F "reviewtext=Really loved the build quality and design." \
  -F "media=@/path/to/photo1.jpg" \
  -F "media=@/path/to/photo2.jpg"
```

### Responses

**Success (200):**

```json
{
  "success": true,
  "data": {
    "reviewid": 10,
    "productid": 14,
    "userid": 3,
    "rating": 4.5,
    "reviewtitle": "Great product!",
    "reviewtext": "Really loved the build quality and design.",
    "reviewdate": "2026-04-19T20:00:00.000Z",
    "status": "pending",
    "createdat": "2026-04-19T20:00:00.000Z",
    "updatedat": "2026-04-19T20:00:00.000Z",
    "media": [
      {
        "mediaid": 1,
        "reviewid": 10,
        "mediaurl": "https://pub-e0f1bdc809544c0cb31dcf32dd668394.r2.dev/productImages/1776622000000-abc123.jpg",
        "mediatype": "image",
        "sortorder": 0,
        "createdat": "2026-04-19T20:00:00.000Z"
      },
      {
        "mediaid": 2,
        "reviewid": 10,
        "mediaurl": "https://pub-e0f1bdc809544c0cb31dcf32dd668394.r2.dev/productImages/1776622000001-def456.jpg",
        "mediatype": "image",
        "sortorder": 1,
        "createdat": "2026-04-19T20:00:00.000Z"
      }
    ],
    "users": {
      "userid": 3,
      "firstname": "John",
      "lastname": "Doe"
    }
  }
}
```

**Missing Required Fields (200):**

```json
{
  "error": 1022,
  "message": "Field required"
}
```

> Returned when `productid`, `userid`, `rating`, or `reviewtext` is missing, or when `rating` is not between 1 and 5.

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

## 2. Get Product Reviews

**GET** `/getProductReviews/:productid`

Retrieve all reviews for a specific product, along with rating statistics (average, distribution).

**Auth:** `verifyGuestToken` (guest token sufficient, no login required)

### Request

**Headers:**

```
Authorization: Bearer <guestToken>
```

**URL Params:**

| Param       | Type    | Required | Description      |
| ----------- | ------- | -------- | ---------------- |
| `productid` | Integer | Yes      | The product's ID |

**Example:**

```
GET /api/v1/getProductReviews/14
```

### Responses

**Success — Reviews Found (200):**

```json
{
  "success": true,
  "data": [
    {
      "reviewid": 10,
      "productid": 14,
      "userid": 3,
      "rating": 4.5,
      "reviewtitle": "Great product!",
      "reviewtext": "Really loved the build quality and design.",
      "reviewdate": "2026-04-19T20:00:00.000Z",
      "status": "pending",
      "createdat": "2026-04-19T20:00:00.000Z",
      "updatedat": "2026-04-19T20:00:00.000Z",
      "media": [
        {
          "mediaid": 1,
          "reviewid": 10,
          "mediaurl": "https://pub-e0f1bdc809544c0cb31dcf32dd668394.r2.dev/productImages/1776622000000-abc123.jpg",
          "mediatype": "image",
          "sortorder": 0,
          "createdat": "2026-04-19T20:00:00.000Z"
        }
      ],
      "users": {
        "userid": 3,
        "firstname": "John",
        "lastname": "Doe"
      }
    },
    {
      "reviewid": 8,
      "productid": 14,
      "userid": 5,
      "rating": 3.0,
      "reviewtitle": "Average",
      "reviewtext": "It's okay, nothing special.",
      "reviewdate": "2026-04-18T10:00:00.000Z",
      "status": "pending",
      "createdat": "2026-04-18T10:00:00.000Z",
      "updatedat": "2026-04-18T10:00:00.000Z",
      "media": [],
      "users": {
        "userid": 5,
        "firstname": "Jane",
        "lastname": "Smith"
      }
    }
  ],
  "stats": {
    "averageRating": 3.8,
    "totalReviews": 2,
    "ratingDistribution": [
      { "rating": 4.5, "count": 1 },
      { "rating": 3.0, "count": 1 }
    ]
  }
}
```

**Success — No Reviews (200):**

```json
{
  "success": true,
  "data": [],
  "stats": {
    "averageRating": 0,
    "totalReviews": 0,
    "ratingDistribution": []
  }
}
```

**Validation Error — Invalid Product ID (200):**

```json
{
  "success": false,
  "errorCode": 1002,
  "error": {
    "details": [
      {
        "message": "Field is required",
        "path": ["productid"],
        "type": "any.required"
      }
    ]
  }
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

| Code | Constant              | Description                |
| ---- | --------------------- | -------------------------- |
| 1002 | `INTERNAL_SERVER`     | Internal server error      |
| 1021 | `FAIL_TO_INSERT_DATA` | Failed to insert data      |
| 1022 | `FIELD_REQUIRED`      | Required field is missing  |

---

## Notes

- **Post Review** uses `multipart/form-data` because it supports file uploads (images and videos). The `media` field accepts multiple files.
- **Media types** are auto-detected from file extensions: `.mp4`, `.mov`, `.webm`, `.avi`, `.mkv` → `video`; everything else → `image`.
- **User resolution** for posting: The API first tries to extract `userid` from the JWT token, then falls back to `request.body.userid`.
- **Caching**: Product reviews are cached in Redis for 1 hour. Cache is invalidated when a new review is posted for that product.
- **Review status** defaults to `"pending"` and can be moderated by sellers via the seller portal.
- **Rating** is a float value (e.g., `4.5`), must be between `1.0` and `5.0`.

