# Agora Auth API Draft (Auth Only)

> **⚠️ IMPORTANT UPDATE:**
> All successful API responses are now wrapped in a standardized envelope: `{ "success": true, "message": "...", "data": { ... } }`. Please ensure your client parsers account for the nested `data` object!

This draft intentionally covers only core auth management:

- register
- login
- logout
- refresh
- verify email (request + confirm)
- reset password (request + confirm)
- JWKS

Everything else (user management, admin) is out of scope in this document for now.

## 1. Base URL

Examples:

- Production: `https://agora-auth.de`
- Local: `http://localhost:3000`

All endpoints are under `/api/auth/*` (except health endpoints, not covered here).

## 2. ERD-Based Core Data Types

Based on `src/db/db-layout-draft-mvp.dbml`, these are the main auth-related entities.

### 2.1 `users`

- `id: uuid`
- `public_id: string`
- `username: string`
- `email: string`
- `email_verified_at: string | null` (ISO timestamp)
- `status: 'pending' | 'active' | 'suspended'`
- `created_at: string`
- `updated_at: string`

### 2.2 `user_credentials`

- `user_id: uuid`
- `password_hash: string`

### 2.3 `verification_tokens`

- `user_id: uuid`
- `token_hash: string`
- `type: 'email_verification' | 'password_reset'`
- `expires_at: string`

### 2.4 `user_sessions`

- `user_id: uuid`
- `session_token_hash: string`
- `previous_session_token_hash: string | null`
- `expires_at: string`
- `revoked_at: string | null`

### 2.5 `api_clients`

- `client_id: string`
- `api_key_hash: string` (stored in DB only)
- `domain_name: string`
- `verify_email_path: string`
- `reset_password_path: string`

Important:

- API consumers should send a raw API key/secret, not `api_key_hash`.
- Server hashes incoming secret and compares to `api_key_hash`.

Global response-body note:

- ERD tables describe storage models, not direct API contracts.
- Response bodies in this draft are public DTO-like payloads (typically camelCase), not raw DB rows.
- Field names may change slightly when DTOs are implemented, but response intent should stay stable.

## 3. Standard Request/Response Basics

### 3.1 Content Type

- Request: `application/json`
- Response: `application/json`

### 3.2 Error Shape

```json
{
	"success": false,
	"error": "Human readable message",
	"code": "ERROR_CODE",
	"details": {}
}
```

Notes:

- `details` is optional and only present when additional context exists (for example flattened validation errors).
- For not-yet-implemented handlers the code can be `NOT_IMPLEMENTED` with HTTP `501`.

### 3.3 Relevant Error Codes (from `src/lib/errors.ts`)

- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `INVALID_CREDENTIALS` (401)
- `TOKEN_EXPIRED` (401)
- `TOKEN_INVALID` (400)
- `TOKEN_REVOKED` (401)
- `ACCOUNT_PENDING` (403)
- `ACCOUNT_SUSPENDED` (403)
- `EMAIL_EXISTS` (409)
- `USERNAME_EXISTS` (409)
- `NOT_IMPLEMENTED` (501)
- `INTERNAL` (500)

## 4. Client Identification (Recommended)

For external API usage, include client credentials.

Recommended headers:

- `x-client-id: <client_id>`
- `x-api-key: <raw_api_key>`

Do not duplicate `clientId` in the JSON body when it is already sent via headers.
Use one source of truth (headers) to avoid drift or spoofing ambiguity.

For first-party web app flow, this may be handled server-side and not sent by browser forms directly.

## 5. Endpoint Drafts

## 5.1 POST `/api/auth/register`

Creates user + credential, status usually starts as `pending`, sends verification email.

Request body (draft):

```json
{
	"username": "string",
	"email": "string",
	"password": "string"
}
```

Example request body:

```json
{
	"username": "new_user",
	"email": "new.user@example.com",
	"password": "VeryStrongPassword123!"
}
```

Success:

- `201 Created` with a public user payload (DTO-like draft)

Note:

- The response shape below is intentionally illustrative to guide implementation.
- Field names can change slightly when real DTOs are introduced, but the idea is to return a stable public user object (not raw DB row internals).

Example success body:

```json
{
	"success": true,
	"message": "User registered successfully.",
	"data": {
		"id": "uuid",
		"publicId": "string",
		"username": "string",
		"email": "string",
		"status": "pending",
		"emailVerifiedAt": null,
		"createdAt": "2026-03-15T12:00:00.000Z",
		"updatedAt": "2026-03-15T12:00:00.000Z",
		"lastSignInAt": null
	}
}
```

Possible errors:

- `VALIDATION_ERROR`
- `EMAIL_EXISTS`
- `USERNAME_EXISTS`
- `INTERNAL`

## 5.2 POST `/api/auth/login`

Authenticates user and starts session.

Request body (draft):

```json
{
	"identifier": "string",
	"password": "string"
}
```

Example request body:

```json
{
	"identifier": "new.user@example.com",
	"password": "VeryStrongPassword123!"
}
```

`identifier` can be email or username.

Possible success values:

- `200 OK` with user + token/session info

`expiresAt` means when the returned access token is no longer valid and must be refreshed.
If the access token is a JWT, this should match the JWT `exp` claim (same moment, different representation).

Example success body:

```json
{
	"success": true,
	"message": "Login successful.",
	"data": {
		"user": {
			"id": "uuid",
			"publicId": "string",
			"username": "new_user",
			"email": "new.user@example.com",
			"status": "active",
			"emailVerifiedAt": "2026-03-15T12:00:00.000Z",
			"createdAt": "2026-03-15T10:00:00.000Z",
			"updatedAt": "2026-03-15T10:00:00.000Z",
			"lastSignInAt": "2026-03-15T10:00:00.000Z"
		},
		"accessToken": "jwt_or_session_token",
		"refreshToken": "opaque_refresh_token",
		"expiresAt": "2026-03-15T13:00:00.000Z"
	}
}
```

Possible errors:

- `VALIDATION_ERROR`
- `INVALID_CREDENTIALS`
- `ACCOUNT_PENDING`
- `ACCOUNT_SUSPENDED`
- `INTERNAL`

## 5.3 POST `/api/auth/logout`

Invalidates current session.

Request body:

- no body

Possible success values:

- `200 OK`

Example success body:

```json
{
	"success": true,
	"message": "Logout successful.",
	"data": null
}
```

Possible errors:

- `UNAUTHORIZED`
- `INTERNAL`

## 5.4 POST `/api/auth/refresh`

Refreshes/rotates session token pair.

Request body:

- expects refresh token in JSON body

Example request body:

```json
{
	"refreshToken": "opaque_refresh_token"
}
```

Possible success values:

- `200 OK` with fresh access/refresh token info

`expiresAt` means when the newly returned access token expires.
If the access token is a JWT, this should match the JWT `exp` claim.

Example success body:

```json
{
	"success": true,
	"message": "Token refreshed successfully.",
	"data": {
		"accessToken": "new_access_token",
		"refreshToken": "new_refresh_token",
		"expiresAt": "2026-03-15T14:00:00.000Z"
	}
}
```

Possible errors:

- `UNAUTHORIZED`
- `TOKEN_EXPIRED`
- `TOKEN_REVOKED`
- `TOKEN_INVALID`

## 5.5 Verify Email Roots (Important)

### POST `/api/auth/verify-email/request`

Purpose:

- create/recreate verification token (`type = email_verification`)
- send verification email

Typical request body (draft):

```json
{
	"email": "string"
}
```

Example request body:

```json
{
	"email": "new.user@example.com"
}
```

Success:

- `200 OK` generic message

Example success body:

```json
{
	"success": true,
	"message": "If the account exists, a verification email has been sent.",
	"data": null
}
```

Errors:

- `VALIDATION_ERROR`
- `INTERNAL`

### POST `/api/auth/verify-email/confirm`

Purpose:

- consume verification token
- set `users.email_verified_at`
- move status from `pending` to `active` (if applicable)

Request body (draft):

```json
{
	"token": "string"
}
```

Example request body:

```json
{
	"token": "TOKEN_FROM_EMAIL"
}
```

Success:

- `200 OK` confirmation message

Example success body:

```json
{
	"success": true,
	"message": "Email verified successfully.",
	"data": null
}
```

Errors:

- `TOKEN_INVALID`
- `TOKEN_EXPIRED`
- `TOKEN_REVOKED`
- `INTERNAL`

Simple mental model:

- `request` = "send link"
- `confirm` = "link was clicked, now finalize"

## 5.6 Reset Password Roots (Important)

### POST `/api/auth/reset-password/request`

Purpose:

- create password reset token (`type = password_reset`)
- send reset email

Request body (draft):

```json
{
	"email": "string"
}
```

Example request body:

```json
{
	"email": "new.user@example.com"
}
```

Success:

- `200 OK` generic message (`If account exists, mail was sent`)

Example success body:

```json
{
	"success": true,
	"message": "If the account exists, a reset email has been sent.",
	"data": null
}
```

Errors:

- `VALIDATION_ERROR`
- `INTERNAL`

### POST `/api/auth/reset-password/confirm`

Purpose:

- consume reset token
- set new password hash
- invalidate old sessions

Request body (draft):

```json
{
	"token": "string",
	"password": "string"
}
```

Example request body:

```json
{
        "token": "TOKEN_FROM_EMAIL",
        "password": "AnotherStrongPassword123!"
	"data": null
}
```

Errors:

- `VALIDATION_ERROR`
- `TOKEN_INVALID`
- `TOKEN_EXPIRED`
- `TOKEN_REVOKED`
- `INTERNAL`

Simple mental model:

- `request` = "send reset link"
- `confirm` = "apply new password"

## 5.7 GET `/api/auth/jwks`

Purpose:

- expose public keys for JWT verification by external services.

Implementation note:

- The JWKS response is not the raw `JWT_PUBLIC_KEY` PEM string.
- The server should convert the public key into JWK format and return it inside `keys[]`.
- With one active key, return one object in `keys`; with key rotation, return multiple.

Request:

- no body

Success:

- `200 OK` JWKS JSON object (`{ keys: [...] }`)

Example success body:

```json
{
	"keys": [
		{
			"kty": "RSA",
			"kid": "v_aelhFSGMeC8k-jdPVq0GI9MaBL11WAFS_-TJQvu68",
			"use": "sig",
			"alg": "RS256",
			"n": "...",
			"e": "AQAB"
		}
	]
}
```

Errors:

- `INTERNAL`

## 6. Minimal Example Calls (`fetch`)

### Register

```ts
const registerRes = await fetch("http://localhost:3000/api/auth/register", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		"x-client-id": "agora_web_default",
		"x-api-key": "YOUR_RAW_CLIENT_KEY",
	},
	body: JSON.stringify({
		username: "new_user",
		email: "new.user@example.com",
		password: "VeryStrongPassword123!",
	}),
});

if (!registerRes.ok) {
	const err = await registerRes.json();
	console.error(err);
} else {
	const data = await registerRes.json();
	console.log(data);
}
```

### Verify email confirm

```ts
const verifyRes = await fetch("http://localhost:3000/api/auth/verify-email/confirm", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({ token: "TOKEN_FROM_EMAIL" }),
});

const verifyData = await verifyRes.json();
console.log(verifyData);
```

### Reset password confirm

```ts
const resetRes = await fetch("http://localhost:3000/api/auth/reset-password/confirm", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		token: "TOKEN_FROM_EMAIL",
                password: "AnotherStrongPassword123!",
const refreshRes = await fetch("http://localhost:3000/api/auth/refresh", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		refreshToken: "opaque_refresh_token",
	}),
});

const refreshData = await refreshRes.json();
console.log(refreshData);
```

### Logout (`200 OK`)

```ts
const logoutRes = await fetch("http://localhost:3000/api/auth/logout", {
	method: "POST",
});

if (logoutRes.status === 200) {
	console.log("Logged out successfully");
}
```

## 7. Implementation Status

This is still a draft spec.
Current route handlers may return `501 Not Implemented` until services are fully connected.
