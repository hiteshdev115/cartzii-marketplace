---
name: ProfileAddress
description: Implement Addresses section
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

Implement the Addresses section of the Profile page. This section should allow users to view, add, edit, and delete their addresses. Each address should include fields for street, city, state, zip code, and country. The user interface should be intuitive and responsive, ensuring a seamless experience across different devices. Additionally, implement validation to ensure that all required fields are filled out correctly before allowing users to save their addresses.

below is an api endpoints with sample request and response for managing addresses:
# Address Management API

All endpoints require JWT authentication via the `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Add New Address
## base endpoint: `/api/v1/`
**POST** `/addresses`

### Request Body

```json
{
  "userid": 123,
  "street": "123 Main St",
  "city": "Ontario",
  "state": "ON",
  "postal_code": "L6R3L7",
  "country": "CA",
  "is_primary": true,
  "is_shipping": false,
  "is_billing": true
}
```

### Fields

| Field         | Type    | Required | Notes                                              |
| ------------- | ------- | -------- | -------------------------------------------------- |
| `userid`      | integer | Yes      |                                                    |
| `street`      | string  | Yes      | max 255 chars                                      |
| `city`        | string  | Yes      | max 100 chars                                      |
| `state`       | string  | Yes      | max 100 chars                                      |
| `postal_code` | string  | Yes      | max 20 chars                                       |
| `country`     | string  | Yes      | max 100 chars                                      |
| `is_primary`  | boolean | No       | Default `false`. Setting `true` unsets previous primary |
| `is_shipping` | boolean | No       | Default `false`                                    |
| `is_billing`  | boolean | No       | Default `false`                                    |

### Success Response — `200 OK`

```json
{
  "success": 1000,
  "message": "Address created successfully",
  "data": {
    "id": 1,
    "userid": 123,
    "street": "123 Main St",
    "city": "Ontario",
    "state": "ON",
    "postal_code": "L6R3L7",
    "country": "CA",
    "is_primary": true,
    "is_shipping": false,
    "is_billing": true,
    "is_active": true,
    "created_at": "2026-04-17T10:00:00.000Z",
    "updated_at": "2026-04-17T10:00:00.000Z"
  }
}
```

### Validation Error — `200 OK`

```json
{
  "errorCode": 1005,
  "error": "Field is required"
}
```

### Server Error — `500`

```json
{
  "errorCode": 1042,
  "message": "Failed to create address"
}
```

---

## 2. Update Address

**PUT** `/addresses/:id`

### URL Params

| Param | Type    | Description |
| ----- | ------- | ----------- |
| `id`  | integer | Address ID  |

### Request Body (all fields optional)

```json
{
  "street": "456 Oak Ave",
  "city": "Toronto",
  "state": "ON",
  "postal_code": "M5V2T6",
  "country": "CA",
  "is_primary": false,
  "is_shipping": true,
  "is_billing": false,
  "is_active": false
}
```

### Fields

| Field         | Type    | Required | Notes                                              |
| ------------- | ------- | -------- | -------------------------------------------------- |
| `street`      | string  | No       | max 255 chars                                      |
| `city`        | string  | No       | max 100 chars                                      |
| `state`       | string  | No       | max 100 chars                                      |
| `postal_code` | string  | No       | max 20 chars                                       |
| `country`     | string  | No       | max 100 chars                                      |
| `is_primary`  | boolean | No       | Setting `true` unsets previous primary              |
| `is_shipping` | boolean | No       |                                                    |
| `is_billing`  | boolean | No       |                                                    |
| `is_active`   | boolean | No       | Set `false` to deactivate                          |

### Success Response — `200 OK`

```json
{
  "success": 1000,
  "message": "Address updated successfully",
  "data": {
    "id": 1,
    "userid": 123,
    "street": "456 Oak Ave",
    "city": "Toronto",
    "state": "ON",
    "postal_code": "M5V2T6",
    "country": "CA",
    "is_primary": false,
    "is_shipping": true,
    "is_billing": false,
    "is_active": false,
    "created_at": "2026-04-17T10:00:00.000Z",
    "updated_at": "2026-04-17T11:30:00.000Z"
  }
}
```

### Not Found — `200 OK`

```json
{
  "errorCode": 1041,
  "message": "Address not found"
}
```

---

## 3. Get All User Addresses

**GET** `/addresses/user/:userid`

### URL Params

| Param    | Type    | Description |
| -------- | ------- | ----------- |
| `userid` | integer | User ID     |

> Only active addresses (`is_active: true`) are returned. Results are sorted with primary address first.

### Success Response — `200 OK`

```json
[
  {
    "id": 1,
    "userid": 123,
    "street": "123 Main St",
    "city": "Ontario",
    "state": "ON",
    "postal_code": "L6R3L7",
    "country": "CA",
    "is_primary": true,
    "is_shipping": false,
    "is_billing": true,
    "is_active": true,
    "created_at": "2026-04-17T10:00:00.000Z",
    "updated_at": "2026-04-17T10:00:00.000Z"
  },
  {
    "id": 2,
    "userid": 123,
    "street": "789 Elm Blvd",
    "city": "Vancouver",
    "state": "BC",
    "postal_code": "V5K0A1",
    "country": "CA",
    "is_primary": false,
    "is_shipping": true,
    "is_billing": false,
    "is_active": true,
    "created_at": "2026-04-17T11:00:00.000Z",
    "updated_at": "2026-04-17T11:00:00.000Z"
  }
]
```

### No Data Found — `200 OK`

```json
{
  "errorCode": 1003,
  "message": "Data not found"
}
```

---

## 4. Get Single Address

**GET** `/addresses/:id`

### URL Params

| Param | Type    | Description |
| ----- | ------- | ----------- |
| `id`  | integer | Address ID  |

### Success Response — `200 OK`

```json
{
  "id": 1,
  "userid": 123,
  "street": "123 Main St",
  "city": "Ontario",
  "state": "ON",
  "postal_code": "L6R3L7",
  "country": "CA",
  "is_primary": true,
  "is_shipping": false,
  "is_billing": true,
  "is_active": true,
  "created_at": "2026-04-17T10:00:00.000Z",
  "updated_at": "2026-04-17T10:00:00.000Z"
}
```

### Not Found — `200 OK`

```json
{
  "errorCode": 1041,
  "message": "Address not found"
}
```

---

## 5. Delete Address (Soft Delete)

**DELETE** `/addresses/:id`

### URL Params

| Param | Type    | Description |
| ----- | ------- | ----------- |
| `id`  | integer | Address ID  |

> This is a **soft delete** — sets `is_active` to `false` rather than removing the record.

### Success Response — `200 OK`

```json
{
  "success": 1000,
  "message": "Deleted successfully"
}
```

### Not Found — `200 OK`

```json
{
  "errorCode": 1041,
  "message": "Address not found"
}
```

---

## Common Error Responses

### Unauthorized — `403 Forbidden`

Returned when no JWT token is provided or token is invalid.

```json
{
  "errorCode": 1009,
  "message": "Access denied. No token provided."
}
```

### Invalid Token — `403 Forbidden`

```json
{
  "errorCode": 1009,
  "message": "Invalid token"
}
```

### Internal Server Error — `500`

```json
{
  "errorCode": 1002,
  "message": "Internal server error"
}
```

