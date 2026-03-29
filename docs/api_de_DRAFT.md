# Agora Auth API Entwurf (Nur Auth)

> **⚠️ WICHTIGES UPDATE:**
> Alle erfolgreichen API-Antworten sind jetzt in einen Standard-Umschlag gewrapped: `{ "success": true, "message": "...", "data": { ... } }`. Bitte passe deine Client-Parser entsprechend an und beachte das verschachtelte `data`-Objekt!

Dieser Entwurf deckt absichtlich nur die Kernbereiche der Authentifizierung ab:

- register
- login
- logout
- refresh
- verify email (request + confirm)
- reset password (request + confirm)
- JWKS

Alles andere (User-Management, Admin) ist in diesem Dokument aktuell nicht enthalten.

## 1. Base URL

Beispiele:

- Produktion: `https://agora-auth.de`
- Lokal: `http://localhost:3000`

Alle Endpunkte liegen unter `/api/auth/*` (Health-Endpunkte sind hier nicht enthalten).

## 2. ERD-basierte Kern-Datentypen

Basierend auf `src/db/db-layout-draft-mvp.dbml` sind das die wichtigsten Auth-Entitäten.

### 2.1 `users`

- `id: uuid`
- `public_id: string`
- `username: string`
- `email: string`
- `email_verified_at: string | null` (ISO-Zeitstempel)
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
- `api_key_hash: string` (nur in der DB gespeichert)
- `domain_name: string`
- `verify_email_path: string`
- `reset_password_path: string`

Wichtig:

- API-Clients sollen einen rohen API-Key/Secret senden, nicht `api_key_hash`.
- Der Server hasht das eingehende Secret und vergleicht es mit `api_key_hash`.

Globaler Hinweis zu Response-Bodies:

- ERD-Tabellen beschreiben das Speichermodell, nicht direkt den API-Vertrag.
- Responses in diesem Entwurf sind öffentliche DTO-ähnliche Payloads (typisch camelCase), keine rohen DB-Zeilen.
- Feldnamen können sich bei der echten DTO-Implementierung noch leicht ändern, die fachliche Bedeutung sollte aber stabil bleiben.

## 3. Standard für Request/Response

### 3.1 Content Type

- Request: `application/json`
- Response: `application/json`

### 3.2 Error-Format

```json
{
	"error": "Human readable message",
	"code": "ERROR_CODE"
}
```

### 3.3 Relevante Error-Codes (aus `src/lib/errors.ts`)

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
- `INTERNAL` (500)

## 4. Client-Identifikation (Empfohlen)

Bei externer API-Nutzung sollen Client-Credentials mitgesendet werden.

Empfohlene Header:

- `x-client-id: <client_id>`
- `x-api-key: <raw_api_key>`

`clientId` nicht zusätzlich im JSON-Body senden, wenn die Identifikation bereits über Header erfolgt.
Eine einzige Quelle (Header) verhindert Abweichungen und Unklarheiten.

Für den First-Party-Webflow kann das serverseitig erledigt werden, ohne direkte Browser-Formulare dafür zu nutzen.

## 5. Endpunkt-Entwürfe

## 5.1 POST `/api/auth/register`

Erstellt User + Credentials, Status startet normalerweise mit `pending`, und versendet eine Verifizierungs-E-Mail.

Request-Body (Entwurf):

```json
{
	"username": "string",
	"email": "string",
	"password": "string"
}
```

Beispiel Request-Body:

```json
{
	"username": "new_user",
	"email": "new.user@example.com",
	"password": "VeryStrongPassword123!"
}
```

Erfolg:

- `201 Created` mit öffentlicher User-Payload (DTO-ähnlicher Entwurf)

Hinweis:

- Die Response-Form unten ist absichtlich beispielhaft zur Orientierung.
- Feldnamen können bei echten DTOs noch leicht angepasst werden. Idee bleibt: stabiles öffentliches User-Objekt, keine internen DB-Felder.

Beispiel Success-Body:

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

Mögliche Fehler:

- `VALIDATION_ERROR`
- `EMAIL_EXISTS`
- `USERNAME_EXISTS`
- `INTERNAL`

## 5.2 POST `/api/auth/login`

Authentifiziert den User und startet eine Session.

Request-Body (Entwurf):

```json
{
	"identifier": "string",
	"password": "string"
}
```

Beispiel Request-Body:

```json
{
	"identifier": "new.user@example.com",
	"password": "VeryStrongPassword123!"
}
```

`identifier` kann E-Mail oder Username sein.

Mögliche Erfolgswerte:

- `200 OK` mit User + Token/Session-Info

`expiresAt` bedeutet, wann der zurückgegebene Access-Token ungültig wird und erneuert werden muss.
Wenn der Access-Token ein JWT ist, sollte das dem JWT-Claim `exp` entsprechen (gleicher Zeitpunkt, andere Darstellung).

Beispiel Success-Body:

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

Mögliche Fehler:

- `VALIDATION_ERROR`
- `INVALID_CREDENTIALS`
- `ACCOUNT_PENDING`
- `ACCOUNT_SUSPENDED`
- `INTERNAL`

## 5.3 POST `/api/auth/logout`

Beendet/invalidiert die aktuelle Session.

Request-Body:

- kein Body

Mögliche Erfolgswerte:

- `200 OK`

Beispiel für erfolgreiche Antwort:

```json
{
	"success": true,
	"message": "Logout successful.",
	"data": null
}
```

Mögliche Fehler:

- `UNAUTHORIZED`
- `INTERNAL`

## 5.4 POST `/api/auth/refresh`

Erneuert/rotiert das Session-Token-Paar.

Request-Body:

- erwartet den Refresh-Token im JSON-Body

Beispiel Request-Body:

```json
{
	"refreshToken": "opaque_refresh_token"
}
```

Mögliche Erfolgswerte:

- `200 OK` mit neuem Access-/Refresh-Token

`expiresAt` bedeutet, wann der neu zurückgegebene Access-Token abläuft.
Wenn der Access-Token ein JWT ist, sollte das dem JWT-Claim `exp` entsprechen.

Beispiel Success-Body:

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

Mögliche Fehler:

- `UNAUTHORIZED`
- `TOKEN_EXPIRED`
- `TOKEN_REVOKED`
- `TOKEN_INVALID`

## 5.5 Verify-Email-Wurzeln (Wichtig)

### POST `/api/auth/verify-email/request`

Zweck:

- erstellt/erneuert einen Verifizierungs-Token (`type = email_verification`)
- sendet die Verifizierungs-E-Mail

Typischer Request-Body (Entwurf):

```json
{
	"email": "string"
}
```

Beispiel Request-Body:

```json
{
	"email": "new.user@example.com"
}
```

Erfolg:

- `200 OK` generische Nachricht

Beispiel Success-Body:

```json
{
	"success": true,
	"message": "If the account exists, a verification email has been sent.",
	"data": null
}
```

Fehler:

- `VALIDATION_ERROR`
- `INTERNAL`

### POST `/api/auth/verify-email/confirm`

Zweck:

- verarbeitet den Verifizierungs-Token
- setzt `users.email_verified_at`
- wechselt Status von `pending` auf `active` (falls zutreffend)

Request-Body (Entwurf):

```json
{
	"token": "string"
}
```

Beispiel Request-Body:

```json
{
	"token": "TOKEN_FROM_EMAIL"
}
```

Erfolg:

- `200 OK` Bestätigungsnachricht

Beispiel Success-Body:

```json
{
	"success": true,
	"message": "Email verified successfully.",
	"data": null
}
```

Fehler:

- `TOKEN_INVALID`
- `TOKEN_EXPIRED`
- `TOKEN_REVOKED`
- `INTERNAL`

Einfaches Modell im Kopf:

- `request` = "Link senden"
- `confirm` = "Link wurde geklickt, jetzt finalisieren"

## 5.6 Reset-Password-Wurzeln (Wichtig)

### POST `/api/auth/reset-password/request`

Zweck:

- erstellt einen Passwort-Reset-Token (`type = password_reset`)
- sendet die Reset-E-Mail

Request-Body (Entwurf):

```json
{
	"email": "string"
}
```

Beispiel Request-Body:

```json
{
	"email": "new.user@example.com"
}
```

Erfolg:

- `200 OK` generische Nachricht (`If account exists, mail was sent`)

Beispiel Success-Body:

```json
{
	"success": true,
	"message": "If the account exists, a reset email has been sent.",
	"data": null
}
```

Fehler:

- `VALIDATION_ERROR`
- `INTERNAL`

### POST `/api/auth/reset-password/confirm`

Zweck:

- verarbeitet den Reset-Token
- setzt neuen Passwort-Hash
- invalidiert alte Sessions

Request-Body (Entwurf):

```json
{
	"token": "string",
	"password": "string"
}
```

Beispiel Request-Body:

````json
{
        "token": "TOKEN_FROM_EMAIL",
        "password": "AnotherStrongPassword123!"
- `200 OK` Passwort aktualisiert

Beispiel Success-Body:

```json
{
	"success": true,
	"message": "Password updated successfully.",
	"data": null
}
````

Fehler:

- `VALIDATION_ERROR`
- `TOKEN_INVALID`
- `TOKEN_EXPIRED`
- `TOKEN_REVOKED`
- `INTERNAL`

Einfaches Modell im Kopf:

- `request` = "Reset-Link senden"
- `confirm` = "Neues Passwort anwenden"

## 5.7 GET `/api/auth/jwks`

Zweck:

- stellt öffentliche Schlüssel bereit, damit externe Services JWTs verifizieren können.

Implementierungs-Hinweis:

- Die JWKS-Response ist nicht der rohe `JWT_PUBLIC_KEY`-PEM-String.
- Der Server konvertiert den Public Key in JWK-Format und liefert ihn in `keys[]` zurück.
- Bei einem aktiven Key: ein Objekt in `keys`; bei Key-Rotation: mehrere.

Request:

- kein Body

Erfolg:

- `200 OK` JWKS-JSON-Objekt (`{ keys: [...] }`)

Beispiel Success-Body:

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

Fehler:

- `INTERNAL`

## 6. Minimale Beispielaufrufe (`fetch`)

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

### Logout (`204 No Content`)

```ts
const logoutRes = await fetch("http://localhost:3000/api/auth/logout", {
	method: "POST",
});

if (logoutRes.status === 200) {
	console.log("Logged out successfully");
}
```

## 7. Routenübersicht

| Methode    | Endpunkt                           | Auth   | Beschreibung                                       | Status        |
| :--------- | :--------------------------------- | :----- | :------------------------------------------------- | :------------ |
| **Auth**   |                                    |        |                                                    |               |
| `POST`     | `/api/auth/register`               | Public | Neues Benutzerkonto registrieren                   | Implementiert |
| `POST`     | `/api/auth/login`                  | Public | Authentifizieren und Sitzung erstellen             | Implementiert |
| `POST`     | `/api/auth/logout`                 | 🔒     | Sitzung beenden und Cookies löschen                | Implementiert |
| `POST`     | `/api/auth/refresh`                | Cookie | Token-Rotation über gültiges Refresh-Cookie        | Implementiert |
| `GET`      | `/api/auth/jwks`                   | Public | Öffentlicher JWKS-Endpunkt (RS256 Public Key)      | Implementiert |
| `POST`     | `/api/auth/verify-email/request`   | Public | E-Mail-Bestätigungslink anfordern / erneut senden  | Implementiert |
| `POST`     | `/api/auth/verify-email/confirm`   | Public | E-Mail per Token bestätigen                        | Implementiert |
| `POST`     | `/api/auth/reset-password/request` | Public | Passwort-Zurücksetzung per E-Mail anfordern        | Implementiert |
| `POST`     | `/api/auth/reset-password/confirm` | Public | Neues Passwort per Reset-Token setzen              | Implementiert |
| **User**   |                                    |        |                                                    |               |
| `GET`      | `/api/user/profile`                | 🔒     | Vollständiges Profil des authentifizierten Nutzers | Geplant       |
| `PATCH`    | `/api/user/profile`                | 🔒     | Profildetails aktualisieren                        | Geplant       |
| `PATCH`    | `/api/user/email`                  | 🔒     | E-Mail-Änderung einleiten (löst Verifizierung aus) | Geplant       |
| `PATCH`    | `/api/user/username`               | 🔒     | Benutzernamen ändern                               | Geplant       |
| `PATCH`    | `/api/user/password`               | 🔒     | Passwort ändern (aktuelles Passwort erforderlich)  | Geplant       |
| `DELETE`   | `/api/user`                        | 🔒     | Selbstständige Kontolöschung                       | Geplant       |
| `GET`      | `/api/users/:username`             | 🔒     | Öffentliches Nutzerprofil abrufen                  | Geplant       |
| **Admin**  |                                    |        |                                                    |               |
| `GET`      | `/api/admin/users`                 | Admin  | Alle Nutzer auflisten (paginiert)                  | Geplant       |
| `PATCH`    | `/api/admin/users/:id/status`      | Admin  | Nutzer sperren oder aktivieren                     | Geplant       |
| `DELETE`   | `/api/admin/users/:id`             | Admin  | Nutzerkonto löschen                                | Geplant       |
| **System** |                                    |        |                                                    |               |
| `GET`      | `/api/health`                      | Public | Datenbank- und Anwendungs-Healthcheck              | Implementiert |
| `GET`      | `/api/live`                        | Public | Liveness-Probe                                     | Implementiert |

## 8. Implementierungsstatus

Das ist weiterhin ein Draft/Entwurf.
Aktuelle Route-Handler können `501 Not Implemented` zurückgeben, bis die Services komplett verbunden sind.
