---
name: PersonalProfileUpdate
description: I want to make Personal information update
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

# Implement below api in personal information update.
# User Profile Update API Documentation

## Endpoint

| Method | URL | Auth | Content-Type |
|--------|-----|------|--------------|
| `PUT` | `/api/v1/users/:id` | Bearer Token (JWT) | `multipart/form-data` |

---

## Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer <access_token>` |
| `Content-Type` | Yes | `multipart/form-data` |

---

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | The user's `userid` |

---

## Request Body (form-data)

All fields are **optional**. Only provided fields will be updated.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `firstname` | String | No | Min 2 characters | User's first name |
| `lastname` | String | No | Allows empty string | User's last name |
| `email` | String | No | Valid email format | User's email address |
| `password` | String | No | Min 6, Max 20 characters | New password (will be hashed with bcrypt) |
| `phonenumber` | String | No | Min 10, Max 15 characters | User's phone number |
| `gender` | String | No | `male`, `female`, `other`, or empty | User's gender |
| `dateofbirth` | String | No | Allows empty string | Date of birth (e.g. `1990-01-01`) |
| `profilepicture` | File | No | Image file | Profile picture (uploaded to Cloudflare R2) |

---

## Sample Request

### Using form-data (with profile picture)

```
PUT /api/v1/users/42
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="firstname"
John
--boundary
Content-Disposition: form-data; name="lastname"
Doe
--boundary
Content-Disposition: form-data; name="email"
john@gmail.com
--boundary
Content-Disposition: form-data; name="phonenumber"
+1234567890
--boundary
Content-Disposition: form-data; name="gender"
male
--boundary
Content-Disposition: form-data; name="dateofbirth"
1990-01-01
--boundary
Content-Disposition: form-data; name="profilepicture"; filename="photo.jpg"
Content-Type: image/jpeg
<binary file data>
--boundary--
```

### Using form-data (without profile picture — partial update)

```
PUT /api/v1/users/42
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="firstname"
Jane
--boundary
Content-Disposition: form-data; name="phonenumber"
+19876543210
--boundary--
```

### Using form-data (password change only)

```
PUT /api/v1/users/42
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="password"
newSecurePass123
--boundary--
```

---

## Responses

### Success (200 OK)

```json
{
  "success": 1000,
  "message": "Profile updated successfully!",
  "data": {
    "userid": 42,
    "roleid": 3,
    "userstatusid": 1,
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@gmail.com",
    "phonenumber": "+1234567890",
    "addressid": 0,
    "profilepicture": "https://r2.cartzii.com/userProfilePictures/photo.jpg",
    "createdat": "2026-03-15T10:30:00.000Z",
    "updatedat": "2026-04-17T14:25:00.000Z",
    "lastloginat": "2026-04-17T08:00:00.000Z",
    "isverified": true,
    "lastipaddress": "",
    "referralcode": "",
    "referredby": "",
    "loyaltypoints": "0",
    "newslettersubscribed": "false",
    "preferredlanguage": "en",
    "dateofbirth": "1990-01-01",
    "gender": "male",
    "accounttype": "personal"
  }
}
```

> **Note:** Sensitive fields (`passwordhash`, `passwordresetcode`, `resetpasswordexpiry`, `verificationcode`) are stripped from the response.

---

### Validation Error (200 OK)

```json
{
  "errorCode": 1005,
  "error": "First name should have at least 2 characters"
}
```

#### Other validation error messages:

| Field | Validation | Error Message |
|-------|-----------|---------------|
| `firstname` | Min 2 chars | `First name should have at least 2 characters` |
| `email` | Invalid format | `Invalid email format` |
| `password` | Min 6 chars | `Please enter min 6 alphanumeric password length` |
| `password` | Max 20 chars | `Please enter max 20 character long password` |
| `phonenumber` | Min 10 chars | `Phone number must be at least 10 characters` |
| `phonenumber` | Max 15 chars | `Phone number cannot exceed 15 characters` |
| `gender` | Not in allowed values | `Gender must be male, female or other` |

---

### User Not Found (200 OK)

```json
{
  "errorCode": 1003,
  "message": "Data not found"
}
```

---

### Unauthorized — No Token (403 Forbidden)

```json
{
  "errorCode": 1009,
  "message": "Access denied. No token provided."
}
```

---

### Unauthorized — Invalid Token (403 Forbidden)

```json
{
  "errorCode": 1010,
  "message": "Invalid token"
}
```

---

### Internal Server Error (500)

```json
{
  "errorCode": 1015,
  "message": "User create email server has been problem! please reach out to our tech support!"
}
```

---

## Error Codes Reference

| Code | Constant | Description |
|------|----------|-------------|
| 1000 | `SUCCESS` | Operation successful |
| 1003 | `DATA_NOT_FOUND` | User with given ID not found |
| 1005 | `VALIDATION_ERROR` | Request body validation failed |
| 1009 | `ACCESS_DENIED` | No authorization token provided |
| 1010 | `INVALID_TOKEN` | JWT token is invalid or expired |
| 1015 | `PROFILE_UPDATE_ERROR` | Server error during profile update |

---

## Notes

- **Authentication**: Requires a valid JWT access token in the `Authorization` header.
- **Partial Updates**: Only send the fields you want to update. Fields not included in the request will remain unchanged.
- **Password**: If provided, the password is hashed using bcrypt (10 salt rounds) before storing.
- **Profile Picture**: Uploaded to Cloudflare R2 storage. The returned `profilepicture` field contains the full public URL.
- **Cache**: After a successful update, Redis cache keys `user:{userid}` and `allUser` are invalidated.
- **Body Limit**: Maximum request body size is 100 MB (to accommodate profile picture uploads).
