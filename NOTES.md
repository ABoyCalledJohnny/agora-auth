# NOTES Agora Auth

## Overview

> [!NOTE]
> **Design & Reference**
> Design decisions, research, specifications, and reference material that informed the [project roadmap](TODO.md#project-roadmap).

1. **[Preparation and Planning](#1-preparation-and-planning)**
    1. [Core and Strategy](#11-core-and-strategy): Identity and goal definition, MVP scope, tech stack prerequisites and choices, research topics.
    2. [Architecture and Data](#12-architecture-and-data): DB schema and validation rules, service architecture and logic flows, configuration and error standards, security strategy, frontend architecture.
    3. [Frontend and Design](#13-frontend-and-design): Content planning (i18n message files).
    4. [Finalisation](#14-finalisation): Project time frame and schedule.
2. **[Development](#3-development)**
    1. [Infrastructure and Core Setup](#31-infrastructure-and-core-setup): _(notes added during implementation)_
    2. [Features](#32-features): Auth and component considerations and questions.
    3. [Backlog](#backlog): Deferred MVP features, future enhancements, settings, UX improvements, infrastructure, and admin ideas.
3. **[Documentation](#5-documentation):** Presentation scheduling notes.
4. **[Initial Major Release and Deployment](#6-initial-major-release-and-deployment):** _(notes added during implementation)_

---

## 1. Preparation and Planning

### 1.1 Core and Strategy

#### Identity and Goal Definition

##### Name

- Display name: "Agora Auth"
- URL-safe slug: `agora-auth `
- Domain name: `agora-auth.de`

##### Description

**Short Description:**
A robust, secure, and modern authentication and user management system built with Next.js, Drizzle ORM, and PostgreSQL.

**Project Description:**
Agora Auth is a comprehensive authentication solution designed for modern web applications. Built on the Turbine boilerplate, it leverages Next.js Server Actions, Drizzle ORM, and PostgreSQL to provide a secure and scalable identity management system. Key features include stateless JWT access tokens paired with database-backed sessions, secure password hashing (via Bun's native Argon2), a granular permission system distinguishing between public and private user data, and an admin dashboard for user management (with a paginated user table for listing, suspending, and deleting accounts). It aims to provide a solid foundation for user registration, login, profile management, and secure API interactions, prioritising security best practices like HTTP-only cookies and strict input validation.

##### MVP Scope

**Core Authentication**

- **Registration & Verification:** Secure sign-up with duplicate checks, password hashing, and email verification.
- **Login:** Credential verification.
- **Password Management:** Secure password reset flows via email.
- **Logout:** Server-side session invalidation and cookie clearance.

**External API & Clients**

- **Client Authentication:** Extensible API allowing third-party services to consume Agora Auth (client management handled manually via DB for MVP).
- **Asymmetrical JWTs:** RS256 token signing with public JWKS endpoint for secure cross-service verification.

**User Management**

- **User Profile:** Protected page for authenticated users (minimal).
- **User Settings:** Self-service profile updates and preferences (minimal).
    - **Account Deletion:** Self-service account removal.

**Access Control**

- **Role-Based Authorisation:** Distinction between 'User' and 'Admin' roles (more can be added at a later date).
- **Protected Routes:** Middleware/pipeline redirects for unauthenticated access attempts.
- **Resource Ownership:** Logic ensuring users can only modify their own data (unless admin).

**Admin Dashboard**

- **User Management GUI:** Admin interface to list, suspend/activate, and delete users (`AdminUserTable` with pagination and quick actions).

**Deferred to Backlog**

- **"Remember Me":** Toggle between persistent and session cookies.
- See the [Backlog](#backlog) for additional planned features and ideas.

**Considerations/Priorities:**

- **Intentional Engineering:** Prioritise reliability and correctness. Take the time to understand the underlying tools and design decisions rather than blindly accepting AI-generated output ("vibe coding"). Use AI as a force multiplier through deliberate context engineering - providing structured, relevant context to get high-quality assistance - not as a substitute for understanding.
- **Production-Oriented Mindset:** Aim to build an MVP that handles errors and edge cases gracefully, moving beyond a simple "happy path" demonstration.
- **Automation & Quality:** Try to establish a clean workflow for linting and deployment early in the development process to build good habits.
- **Modularity:** Practice designing components and logic to be reusable, independent, and easily composable.
- **Security First:** Treat security as a core requirement by learning and implementing defence-in-depth strategies to the best of current abilities.
- **Modern Tech Stack:** Learn and leverage current best practices and stable features of the chosen framework stack (Next.js, Bun, Drizzle).
- **Clean Architecture:** Strive for a clean separation of concerns and practice writing maintainable, self-documenting code.

##### Usage Rights

MIT

#### Tech Stack

##### Prerequisites

- Linux, macOS, or Windows (WSL) for Development
- Linux for Production
- Docker & Docker Compose
- VPS (Deployment)

##### Language/Runtime

- TypeScript
- Bun (Runtime & Package Manager)

##### Database

- PostgreSQL

##### Frameworks

- Next.js (with React)
- Tailwind

##### Libraries

- `react`: Core UI framework.
- `postgres`, `drizzle`: PostgreSQL driver and Drizzle ORM for type-safe database interactions.
- `zod`, `drizzle-zod`, `@hookform/resolvers`: Schema declaration and validation (re-used across DB, API, and frontend).
- `react-hook-form`: Flexible forms with easy validation and state management.
- `jose`: For stateless JWT generation and verification. Edge-runtime compatible for Next.js middleware.
- `nodemailer`: Sending operational and transactional emails (verification, reset).
- `next-intl`: Internationalisation (i18n) for Next.js.
- `nanoid`: Fast, URL-friendly unique string identifier generator (useful for tokens and IDs).
- `sonner`: Toast notifications for elegant asynchronous UI feedback.

#### Research

- React
    - Error Boundary
    - Suspense
    - Server Actions & Mutations verbessern und lernen
    - Form actions
- Next.js
    - https://nextjs.org/docs/app/getting-started (everything)
        - https://dev.to/rajaerobinson/understanding-hydration-in-nextjs-b5m
    - https://nextjs.org/docs/app/guides
        - https://nextjs.org/docs/app/guides/authentication
        - https://nextjs.org/docs/app/guides/backend-for-frontend
        - https://nextjs.org/docs/app/guides/caching
        - https://nextjs.org/docs/app/guides/data-security
        - https://nextjs.org/docs/app/guides/forms
        - https://nextjs.org/docs/app/guides/incremental-static-regeneration
        - https://nextjs.org/docs/app/guides/lazy-loading
        - https://nextjs.org/docs/app/guides/redirecting
- Security
    - Access/refresh token pattern
    - CORS
    - CSRF, SOP
    - XSS/CSP
    - HTTP security headers
    - Was von Security-Overview noch?

### 1.2 Architecture and Data

#### Data Modelling and Validation

##### DB Schema

https://dbdiagram.io/d/Auth-Wright-695f8d2ed6e030a024753b90

##### Validation

**Enums and Status Values:**

- User roles: `admin`, `user`
- User status: `pending`, `active`, `suspended`
- Verification token types: `email_verification`, `password_reset`

**Username Rules:**

- 3–30 characters, lowercase letters (a-z), numbers, hyphens, and underscores: `/^[a-z0-9_-]{3,30}$/`
- Must not be a reserved word (e.g., `admin`, `api`, `support`, `root`, `system`, `help`, `info`, `contact`, `webmaster`, `test`, `dev`, `billing`, `sales`, `security`, `administrator`, `hilfe`, `kontakt`, `team`, `impressum`, `datenschutz`, `rechtliches`, `service`, `presse`, `jobs`, `karriere`, `bewerbung`, `rechnung`, `pay`, `zahlungen`).

**Password Rules:**

- Minimum 12 characters; at least one lowercase letter, one uppercase letter, one number, and one special character.

**User Settings (JSON columns):**

- Privacy: `profileVisibility` (`'public' | 'members_only' | 'private'`), `showOnlineStatus`, `allowIndexing`
- Preferences:
    - `theme: 'system' | 'light' | 'dark'`
    - `language`
    - `notifications`:
        - `email`: `transactional`, `marketing`, `security`, `newsletter`
        - `push`: `messages`, `mentions`, `updates`, `posts`

#### Service Architecture and Logic

##### Services

- **`UserService`**: Handles user data operations (creation, profile updates, deletion). Generates public user IDs via `nanoid`. Ensures data privacy by filtering returned fields (Public vs. Private DTOs).
- **`AuthService`**: Orchestrates high-level auth flows (login, register, logout). It connects validation, password hashing, and session creation.
- **`SessionService`**: Manages database sessions. Responsible for creating, validating, and revoking refresh tokens/sessions.
- **`JwtService`**: A pure utility service for generating and verifying stateless JWTs (Access Tokens). No database dependencies.
- **`VerificationTokenService`**: Manages stateful tokens for email verification and password reset (generate, hash, store, verify).
- **`ApiClientService`**: Verifies external API clients (validates API keys, checks allowed domains, resolves client-specific auth page path templates) before granting them access to core services.
- **`NotificationService`**: Abstraction layer for sending emails (welcome, password reset, verification). Decouples business logic from specific email providers.

##### API Design

_Note: The core functionality described below will be implemented using a "dual-channel" approach. Every feature will be accessible as a standard REST API route (returning JSON) for external clients, and additionally wrapped as a Next.js Server Action for seamless, type-safe integration with frontend React Forms._

**Authentication (`/api/auth/*`)**

- `POST /register`: Register a new user account.
- `POST /login`: Authenticate and establish a session.
- `POST /logout`: Invalidate the current session and clear cookies.
- `POST /refresh`: Issue a new access token using a valid session/refresh cookie.
- `POST /verify-email/confirm`: Confirm a user's email using a token.
- `POST /verify-email/request`: Request or re-issue the email verification token/email.
- `POST /reset-password/request`: Initiate the password reset flow (send email).
- `POST /reset-password/confirm`: Set a new password using a valid reset token.

_Important distinction:_ `POST /api/auth/*/confirm` endpoints consume tokens. User-facing frontend routes remain `/verify-email/[token]` and `/reset-password/[token]`.

**User Management (`/api/user/*`)**

- `GET /profile`: Retrieve the authenticated user's complete profile data (including private fields).
- `PATCH /profile`: Update profile details (e.g., display name, bio).
- `PATCH /email`: Initiate an email change (requires new verification).
- `PATCH /username`: Change the unique account username.
- `PATCH /password`: Change password while already authenticated (requires current password).
- `DELETE /`: Self-serve account deletion.

**Public Profiles (`/api/users/*`)** _(authenticated users only)_

- `GET /:username`: Retrieve a specified user's public profile (requires authentication, strictly public fields, respects profile visibility settings).

**Public JWKS (`/api/auth/jwks`)**

- `GET /`: Returns the JSON Web Key Set (public keys) so other services can verify the JWTs issued by this system.

**Admin User Management (`/api/admin/users/*`)**

- `GET /`: List all users (with pagination, filtering, sorting).
- `PATCH /:id/status`: Change a user's status (e.g., suspend, activate).
- `DELETE /:id`: Administrator account deletion.

##### Logic Flow

_Note: The core logic executed by Services is the same across environments. The "transport layer" (Controller) dictates the response: **Server Actions** redirect the user or revalidate cached data (`revalidatePath`), whereas **API Routes** return JSON data (tokens and user objects)._

**Authentication & Session**

1. **Registration Flow:**
    - **Step 1 (Submit):** User submits form -> Controller validates input (Zod) -> Controller calls `AuthService.register()`.
    - **Step 2 (Service):** `AuthService` checks duplicates (email/username) via `UserService` -> `AuthService` hashes password -> `UserService` creates DB User (status `pending`) -> `VerificationTokenService` generates and stores hashed token -> `NotificationService` sends verification email.
    - **Step 3 (Response):** Controller redirects to a dedicated "Check Email" prompt page (`/verify-email`).
    - **Step 4 (Verify):** User clicks email link -> Controller extracts token -> `VerificationTokenService` validates token -> `UserService` updates User status to `active` and sets `email_verified_at` -> `VerificationTokenService` deletes token -> Controller redirects to Login page with success message.
2. **Login Flow:**
    - **Step 1 (Submit):** User submits form -> Controller validates input -> Controller calls `AuthService.login()`.
    - **Step 2 (Service):** `AuthService` verifies user exists and password is correct via `UserService` -> `AuthService` checks account status (active/suspended) -> `SessionService` creates DB Session -> `JwtService` generates stateless Access JWT -> `AuthService` returns `User` object and tokens to Controller.
    - **Step 3 (Response):**
        - _Server Action:_ Sets `HttpOnly` secure cookies (Access + Refresh) -> Redirects to intended URL.
        - _API Route:_ Returns JSON containing `User` object, `accessToken`, and `refreshToken`.
3. **Session Refresh Flow:**
    - **Step 1 (Detect):** An incoming request carries an expired Access JWT. `proxy.ts` (Edge middleware) does **not** attempt to refresh - it only handles hard redirects (unauthenticated users to `/login?next=...`, non-admins from `/admin/*`). Expired-but-present tokens are let through. The expiry is detected server-side by `authenticate()` (called from `withApiHandler`, `withActionHandler`, or Server Components), or by an external client calling `POST /api/auth/refresh`.
    - **Step 2 (Validate):** The Refresh token is extracted - from the `HttpOnly` cookie (web app) or from the JSON request body (external API client). `SessionService` validates the Refresh token hash against the DB session.
    - **Step 3 (Rotate & Issue):** If valid, `SessionService` rotates the Refresh Token and `JwtService` issues a new Access JWT.
    - **Step 4 (Response):**
        - _Web app:_ `authenticate()` performs the rotation directly via `SessionService` (Node.js) and sets updated `HttpOnly` cookies. The original request continues.
        - _External API client:_ Returns new `accessToken` and `refreshToken` in the JSON response.
    - **Step 5 (Failure):** If the Refresh token is invalid or expired, cookies are cleared and the user is redirected to `/login?next=...` (web app) or a 401 is returned (API client).

**Account Recovery**

4. **Password Reset Flow:**
    - **Step 1 (Request):** User requests reset with email -> Controller calls `AuthService.requestPasswordReset()`.
    - **Step 2 (Service):** `AuthService` checks if user exists via `UserService` (silently - no error if not found, to prevent enumeration) -> `VerificationTokenService` generates and stores hashed token -> `NotificationService` sends reset email.
    - **Step 3 (Response):** Controller shows generic "If an account exists, an email was sent" message.
    - **Step 4 (Fulfillment):** User clicks link -> Controller validates token via `VerificationTokenService` -> User submits new password -> `AuthService` hashes password -> `UserService` updates User -> `VerificationTokenService` deletes token -> `SessionService` invalidates _all_ active user sessions -> Controller redirects to Login page.

**High-Security Actions**

5. **Email Change Flow:**
    - **Step 1 (Request):** User submits new email and current password -> Controller validates input (Zod) -> Controller calls `AuthService.verifyPassword(userId, currentPassword)` -> if valid, Controller calls `UserService.initiateEmailChange(userId, newEmail)`.
    - **Step 2 (Service):** `UserService` checks new email for duplicates -> `VerificationTokenService` generates token with `metadata: { newEmail }` and stores hashed token -> `NotificationService` sends verification email to the _new_ address. _(Note: DB record retains old email to prevent lockout until new one is verified.)_
    - **Step 3 (Response):** Controller redirects / notifies user to check email.
    - **Step 4 (Complete):** User clicks link -> `VerificationTokenService` validates token and extracts `metadata.newEmail` -> `UserService` updates User record to new email -> `VerificationTokenService` deletes token -> Controller redirects back to User Settings with a success message.

#### Core Configuration and Standards

##### Error Types and Messages

Implement a unified `AgoraError` class driven by a fixed union of `ErrorCode` types. This ensures type safety across boundaries, while actual user-facing string translations are seamlessly managed in the frontend via `next-intl` JSON dictionaries (`messages/en.json` and `messages/de.json`).

| Error Code (`ErrorCode`)       | HTTP | HTTP Meaning | English Translation (`en.json`)                    | German Translation (`de.json`)                             |
| :----------------------------- | :--- | :----------- | :------------------------------------------------- | :--------------------------------------------------------- |
| **Standard Application Codes** |      |              |                                                    |                                                            |
| `VALIDATION_ERROR`             | 400  | Bad Request  | The provided data is invalid.                      | Die angegebenen Daten sind ungültig.                       |
| `NOT_FOUND`                    | 404  | Not Found    | The requested resource could not be found.         | Die angeforderte Ressource konnte nicht gefunden werden.   |
| `INTERNAL`                     | 500  | Server Error | An unexpected internal server error occurred.      | Ein unerwarteter Serverfehler ist aufgetreten.             |
| **Auth & Access**              |      |              |                                                    |                                                            |
| `UNAUTHORIZED`                 | 401  | Unauthorized | You must be logged in to perform this action.      | Du musst angemeldet sein, um diese Aktion auszuführen.     |
| `FORBIDDEN`                    | 403  | Forbidden    | You do not have permission to perform this action. | Du hast keine Berechtigung für diese Aktion.               |
| `INVALID_CREDENTIALS`          | 401  | Unauthorized | The email or password provided is incorrect.       | Die angegebene E-Mail oder das Passwort ist falsch.        |
| `TOKEN_EXPIRED`                | 401  | Unauthorized | Your session or verification token has expired.    | Deine Sitzung oder dein Bestätigungs-Token ist abgelaufen. |
| `TOKEN_INVALID`                | 400  | Bad Request  | The provided token is invalid or malformed.        | Das angegebene Token ist ungültig oder fehlerhaft.         |
| `TOKEN_REVOKED`                | 401  | Unauthorized | This token has been revoked.                       | Dieses Token wurde widerrufen.                             |
| **Account State**              |      |              |                                                    |                                                            |
| `ACCOUNT_SUSPENDED`            | 403  | Forbidden    | Your account has been suspended.                   | Dein Konto wurde gesperrt.                                 |
| `ACCOUNT_PENDING`              | 403  | Forbidden    | Your account is pending verification.              | Dein Konto wartet auf Bestätigung.                         |
| **Conflicts**                  |      |              |                                                    |                                                            |
| `EMAIL_EXISTS`                 | 409  | Conflict     | A user with this email address already exists.     | Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.  |
| `USERNAME_EXISTS`              | 409  | Conflict     | This username is not available.                    | Dieser Benutzername ist nicht verfügbar.                   |

##### Environment and Config Variables

> [!NOTE]
> **Project Scope**
>
> - This project only uses `development` and `production` environments. There are no dedicated test or staging environments - the staging/test columns below are included for reference and completeness only.
> - This list serves as a comprehensive reference guide for the underlying boilerplate. Not all environment variables listed in these tables (e.g., `RATE_LIMIT_*`, `UPLOAD_DIR`, `MAX_UPLOAD_SIZE`) are actively used or strictly required by the current project scope.

**Secrets - Secret Manager (Bitwarden etc. / CI/CD)**

All values in this table are **never committed** to version control. They are stored in the project's secret manager entry and injected by the CI/CD pipeline as runtime environment variables during deployment.

| Secret Manager Key               | → Runtime Env Var        |   Env   | Purpose                                                 |
| :------------------------------- | :----------------------- | :-----: | :------------------------------------------------------ |
| **Database**                     |                          |         |                                                         |
| `PROD_APP_DB_USER`               | `APP_DB_USER`            |  prod   | App-level DB user (limited privileges, runtime queries) |
| `PROD_APP_DB_PASSWORD`           | `APP_DB_PASSWORD`        |  prod   | App-level DB password                                   |
| `PROD_POSTGRES_USER`             | `POSTGRES_USER`          |  prod   | Superuser for Docker init and migrations (DDL)          |
| `PROD_POSTGRES_PASSWORD`         | `POSTGRES_PASSWORD`      |  prod   | Superuser password                                      |
| `STAGING_APP_DB_USER`            | `APP_DB_USER`            | staging | App-level DB user                                       |
| `STAGING_APP_DB_PASSWORD`        | `APP_DB_PASSWORD`        | staging | App-level DB password                                   |
| `STAGING_POSTGRES_USER`          | `POSTGRES_USER`          | staging | Superuser for Docker init and migrations                |
| `STAGING_POSTGRES_PASSWORD`      | `POSTGRES_PASSWORD`      | staging | Superuser password                                      |
| **Auth & Bootstrapping**         |                          |         |                                                         |
| `PROD_AUTH_SECRET`               | `AUTH_SECRET`            |  prod   | Cookie / session signing key                            |
| `STAGING_AUTH_SECRET`            | `AUTH_SECRET`            | staging | Cookie / session signing key                            |
| `PROD_JWT_PRIVATE_KEY`           | `JWT_PRIVATE_KEY`        |  prod   | RS256 private key for signing access JWTs               |
| `PROD_JWT_PUBLIC_KEY`            | `JWT_PUBLIC_KEY`         |  prod   | RS256 public key (served via JWKS endpoint)             |
| `STAGING_JWT_PRIVATE_KEY`        | `JWT_PRIVATE_KEY`        | staging | RS256 private key for signing access JWTs               |
| `STAGING_JWT_PUBLIC_KEY`         | `JWT_PUBLIC_KEY`         | staging | RS256 public key (served via JWKS endpoint)             |
| `PROD_INITIAL_ADMIN_EMAIL`       | `INITIAL_ADMIN_EMAIL`    |  prod   | Email for the initial admin account                     |
| `PROD_INITIAL_ADMIN_PASSWORD`    | `INITIAL_ADMIN_PASSWORD` |  prod   | Password for the initial admin account                  |
| `PROD_DEFAULT_CLIENT_SECRET`     | `DEFAULT_CLIENT_SECRET`  |  prod   | Raw API Key for the default system client               |
| `STAGING_INITIAL_ADMIN_EMAIL`    | `INITIAL_ADMIN_EMAIL`    | staging | Email for the initial admin account (staging)           |
| `STAGING_INITIAL_ADMIN_PASSWORD` | `INITIAL_ADMIN_PASSWORD` | staging | Password for the initial admin account (staging)        |
| `STAGING_DEFAULT_CLIENT_SECRET`  | `DEFAULT_CLIENT_SECRET`  | staging | Raw API Key for the default system client (staging)     |
| **Email (SMTP)**                 |                          |         |                                                         |
| `PROD_SMTP_HOST`                 | `SMTP_HOST`              |  prod   | SMTP server hostname                                    |
| `PROD_SMTP_PORT`                 | `SMTP_PORT`              |  prod   | SMTP server port (typically `587`)                      |
| `PROD_SMTP_USER`                 | `SMTP_USER`              |  prod   | SMTP authentication username                            |
| `PROD_SMTP_PASSWORD`             | `SMTP_PASSWORD`          |  prod   | SMTP authentication password                            |
| `STAGING_SMTP_HOST`              | `SMTP_HOST`              | staging | SMTP server hostname (can be a catch-all like Mailtrap) |
| `STAGING_SMTP_PORT`              | `SMTP_PORT`              | staging | SMTP server port                                        |
| `STAGING_SMTP_USER`              | `SMTP_USER`              | staging | SMTP authentication username                            |
| `STAGING_SMTP_PASSWORD`          | `SMTP_PASSWORD`          | staging | SMTP authentication password                            |
| **Infrastructure**               |                          |         |                                                         |
| `PROD_CRON_SECRET`               | `CRON_SECRET`            |  prod   | Bearer token for cron / webhook endpoints               |
| `STAGING_CRON_SECRET`            | `CRON_SECRET`            | staging | Bearer token for cron / webhook endpoints               |

> [!NOTE]
> **Details**
>
> - `POSTGRES_DB` is **not** a secret - it stays in the committed `.env.staging` / `.env.production` files alongside the other environments. The secret manager only holds credentials that grant access.
> - The app and superuser credentials inject into their respective env var names (`APP_DB_USER` vs. `POSTGRES_USER`). `config/index.ts` uses the **app user** creds while `drizzle.config.ts` uses the **superuser** creds.
> - `DATABASE_URL` is composed at runtime in `config/index.ts` - no env var needed.
> - `CRON_SECRET` is a bearer token used when an external scheduler (cron daemon, GitHub Actions, etc.) calls your app's `/api/cron/*` endpoints to prove it is a trusted caller. Not needed in project.
> - `AUTH_SECRET` follows the standard Next.js Auth convention for cookie/session signing. It is distinct from `JWT_PRIVATE_KEY` which signs the stateless access JWTs. Not needed in project.
> - **Bootstrapping Variables** (`INITIAL_ADMIN_*`, `DEFAULT_CLIENT_SECRET`) are only consumed once during initialization scripts, bypassing typical lifetime persistence, but should remain correctly set for infrastructure recovery.

**Key generation reference:**

```bash
# AUTH_SECRET
openssl rand -base64 32

# DEFAULT_CLIENT_SECRET (raw API key)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# JWT RS256 key pair
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in private.pem -pubout -out public.pem
```

**Local Development Secrets (`.env.local`)**

Secrets needed for local development that cannot go in committed env files. Copy `.env.local.example` to `.env.local` and fill in real values.

```ini
# --- SMTP (e.g. Mailtrap sandbox for local email testing) ---
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""

# --- App DB User (required for config validation during `next build`) ---
# For local Docker development, use the same values as in `.env.development`.
APP_DB_USER=""
APP_DB_PASSWORD=""

# --- JWT Asymmetric Keys (RS256) ---
# Generate a dev-only key pair:
#   openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
#   openssl rsa -in private.pem -pubout -out public.pem
# Paste the PEM contents (use double quotes and \n for line breaks).
JWT_PRIVATE_KEY=""
JWT_PUBLIC_KEY=""

# --- Optional ---
# CRON_SECRET=""     # Only needed if testing cron endpoints locally
# MAIL_FROM=""       # Override sender address (default: noreply@localhost)
```

> [!NOTE]
> **Details**
>
> - `AUTH_SECRET` is already set as a dummy in `.env.development` - no need to duplicate here.
> - `POSTGRES_*` are already set as dummy values in `.env.development`.
> - `APP_DB_USER` and `APP_DB_PASSWORD` must also be present in `.env.local` for local `next build` runs. Build mode loads `.env.production` + `.env.local` (not `.env.development`), and `config/index.ts` validates these fields at import time.
> - JWT keys are structurally complex PEM files (unlike `AUTH_SECRET` which is just a random string). A dummy won't work - real dev-only keys are needed. Alternatively, you could auto-generate in dev mode at startup.
> - For tests, SMTP and JWT are typically mocked; `.env.test` does not need real secrets for these.

**Environment-Specific Configuration Files**

Complete matrix of every variable across all committed `.env` files. Replace `{project}` with your project slug (e.g., `agora_auth`) and `{domain}` with your domain (e.g., `agora-auth.de`).

> [!NOTE]
> `.env.local` is intentionally excluded from this matrix because it is machine-local and gitignored. For local builds, `APP_DB_USER` and `APP_DB_PASSWORD` should still be set in `.env.local` so `next build` can pass config validation.
>
> The current repository includes `.env`, `.env.development`, and `.env.production`. Columns for `.env.test` and `.env.staging` are reference targets for future setup.

| Variable                          | `.env` (base) |      `.env.development`      |          `.env.test`          |       `.env.staging`       | `.env.production`  |
| :-------------------------------- | :-----------: | :--------------------------: | :---------------------------: | :------------------------: | :----------------: |
| **App**                           |               |                              |                               |                            |                    |
| `APP_ENV`                         |               |        `development`         |            `test`             |         `staging`          |    `production`    |
| `APP_URL`                         |               | `http://localhost:${PORT}`¹  |  `http://localhost:${PORT}`¹  | `https://staging.{domain}` | `https://{domain}` |
| **Networking**                    |               |                              |                               |                            |                    |
| `HOSTNAME`                        |   `0.0.0.0`   |              -               |               -               |             -              |         -          |
| `PORT`                            |    `3000`     |              -               |            `3001`             |             -              |         -          |
| **Database**                      |               |                              |                               |                            |                    |
| `DB_HOST`                         |  `localhost`  |              -               |               -               |         `postgres`         |     `postgres`     |
| `DB_PORT`                         |    `5432`     |            `5433`            |            `5433`             |             -              |         -          |
| `POSTGRES_DB`                     |               |       `{project}_dev`        |       `{project}_test`        |    `{project}_staging`     |  `{project}_prod`  |
| `POSTGRES_USER`                   |               |  `{project}_dev_super_user`  |  `{project}_test_super_user`  |          🔒 CI/CD          |      🔒 CI/CD      |
| `POSTGRES_PASSWORD`               |               |   `{project}_dev_password`   |   `{project}_test_password`   |          🔒 CI/CD          |      🔒 CI/CD      |
| `APP_DB_USER`                     |               |   `{project}_dev_app_user`   |   `{project}_test_app_user`   |          🔒 CI/CD          |      🔒 CI/CD      |
| `APP_DB_PASSWORD`                 |               | `{project}_dev_app_password` | `{project}_test_app_password` |          🔒 CI/CD          |      🔒 CI/CD      |
| **Auth & Bootstrapping**          |               |                              |                               |                            |                    |
| `AUTH_SECRET`                     |               |      `dev_dummy_secret`      |      `test_dummy_secret`      |          🔒 CI/CD          |      🔒 CI/CD      |
| `JWT_PRIVATE_KEY`                 |               |       🔒 `.env.local`        |      mock / `.env.local`      |          🔒 CI/CD          |      🔒 CI/CD      |
| `JWT_PUBLIC_KEY`                  |               |       🔒 `.env.local`        |      mock / `.env.local`      |          🔒 CI/CD          |      🔒 CI/CD      |
| `INITIAL_ADMIN_EMAIL`             |               |      `admin@localhost`       |       `admin@localhost`       |          🔒 CI/CD          |      🔒 CI/CD      |
| `INITIAL_ADMIN_PASSWORD`          |               |     `dev_dummy_password`     |     `test_dummy_password`     |          🔒 CI/CD          |      🔒 CI/CD      |
| `DEFAULT_CLIENT_SECRET`           |               |  `dev_dummy_client_secret`   |  `test_dummy_client_secret`   |          🔒 CI/CD          |      🔒 CI/CD      |
| **Email (SMTP)**                  |               |                              |                               |                            |                    |
| `SMTP_HOST`                       |               |       🔒 `.env.local`        |             mock              |          🔒 CI/CD          |      🔒 CI/CD      |
| `SMTP_PORT`                       |               |       🔒 `.env.local`        |             mock              |          🔒 CI/CD          |      🔒 CI/CD      |
| `SMTP_USER`                       |               |       🔒 `.env.local`        |             mock              |          🔒 CI/CD          |      🔒 CI/CD      |
| `SMTP_PASSWORD`                   |               |       🔒 `.env.local`        |             mock              |          🔒 CI/CD          |      🔒 CI/CD      |
| `MAIL_FROM`                       |               |     `noreply@localhost`      |   `noreply@test.localhost"`   | `noreply@staging.{domain}` | `noreply@{domain}` |
| **Feature Flags**                 |               |                              |                               |                            |                    |
| `NEXT_PUBLIC_ENABLE_REGISTRATION` |    `true`     |              -               |               -               |             -              |      `false`       |
| **Files & Uploads**               |               |                              |                               |                            |                    |
| `UPLOAD_DIR`                      |  `./uploads`  |              -               |     `./tmp/test-uploads`      |             -              |         -          |
| `MAX_UPLOAD_SIZE`                 |   `5242880`   |              -               |               -               |             -              |         -          |
| **Logging**                       |               |                              |                               |                            |                    |
| `LOG_LEVEL`                       |    `info`     |           `debug`            |            `error`            |          `debug`           |       `warn`       |
| **Rate Limiting**                 |               |                              |                               |                            |                    |
| `RATE_LIMIT_MAX`                  |     `100`     |              -               |               -               |             -              |         -          |
| `RATE_LIMIT_WINDOW`               |     `60`      |              -               |               -               |             -              |         -          |
| **Infrastructure**                |               |                              |                               |                            |                    |
| `CRON_SECRET`                     |               |                              |                               |          🔒 CI/CD          |      🔒 CI/CD      |

> [!NOTE]
> **Details**
> **Legend:** `-` = inherits from base `.env` · 🔒 = secret, not in committed files · empty cell = not set / not applicable
>
> ¹ `${PORT}` is interpolated by Bun's built-in env variable expansion. `.env` loads first and sets `PORT=3000`, so `.env.development` resolves to `http://localhost:3000`. `.env.test` overrides `PORT=3001` before `APP_URL`, so it resolves to `http://localhost:3001`.

**Application Configuration (`src/config/index.ts` - committed)**

Hardcoded, non-secret defaults that live in code. The `config/index.ts` module is the **single entry point** for all configuration - application code imports from here and never reads `process.env` directly. Environment variables override defaults where applicable; Zod validates everything at startup to fail fast on missing or invalid config.

| Category            | Key                       | Default / Source                                                                    | Notes                                          |
| :------------------ | :------------------------ | :---------------------------------------------------------------------------------- | :--------------------------------------------- |
| **App**             | `name`                    | `"Agora Auth"`                                                                      |                                                |
|                     | `tagline`                 | `"A robust, secure, and modern authentication and user management system."`         | For meta tags, emails                          |
|                     | `url`                     | `env.APP_URL \|\| "http://localhost:3000"`                                          | Server-side only                               |
|                     | `env`                     | `env.APP_ENV \|\| "development"`                                                    | `development \| test \| staging \| production` |
| **i18n**            | `locales`                 | `["en", "de"]`                                                                      |                                                |
|                     | `defaultLocale`           | `"en"`                                                                              |                                                |
| **Database**        | `url`                     | composed from `DB_HOST`, `DB_PORT`, `POSTGRES_DB`, `APP_DB_USER`, `APP_DB_PASSWORD` | Single URL used by the application at runtime  |
| **Auth Cookies**    | `cookieName`              | `"agora_session"`                                                                   | HTTP-only refresh cookie                       |
|                     | `cookieMaxAge`            | `7 * 24 * 60 * 60`                                                                  | 7 days (seconds)                               |
|                     | `cookieSameSite`          | `"lax"`                                                                             |                                                |
| **Auth Tokens**     | `accessTokenExpiry`       | `"15m"`                                                                             | Stateless JWT lifespan                         |
|                     | `refreshTokenExpiry`      | `"7d"`                                                                              | DB-backed session lifespan                     |
|                     | `verificationTokenExpiry` | `"24h"`                                                                             | Email verification / password reset            |
| **Auth · Security** | `allowSessionIpChange`    | `true`                                                                              | If `false`, session is revoked on IP change    |
|                     | `allowSessionAgentChange` | `true`                                                                              | If `false`, session is revoked on UA change    |
| **Clients**         | `defaultClientId`         | `"agora_web_default"`                                                               | Internal app client for Server Actions         |
| **Email**           | `mailFrom`                | `env.MAIL_FROM \|\| "noreply@localhost"`                                            | Sender address                                 |
| **Rate Limiting**   | `rateLimitMax`            | `Number(env.RATE_LIMIT_MAX) \|\| 100`                                               | Per IP per window                              |
|                     | `rateLimitWindow`         | `Number(env.RATE_LIMIT_WINDOW) \|\| 60`                                             | Seconds                                        |
| **Files**           | `uploadDir`               | `env.UPLOAD_DIR \|\| "./uploads"`                                                   |                                                |
|                     | `maxUploadSize`           | `Number(env.MAX_UPLOAD_SIZE) \|\| 5_242_880`                                        | Bytes (5 MB)                                   |
| **Logging**         | `logLevel`                | `env.LOG_LEVEL \|\| "info"`                                                         | `debug \| info \| warn \| error`               |

> [!NOTE]
> **Details**
> **Pattern:** `.env` files → Next.js injects into `process.env` → `config/index.ts` reads, applies defaults, composes URLs, validates with Zod → application code imports `appConfig`. This gives type safety, runtime validation, and a single source of truth while keeping `.env` files for Docker Compose and CI/CD which also need them.
>
> **Why not move `HOSTNAME`/`PORT` to `config/index.ts`?** - Next.js reads these _before_ your app code runs to decide which interface and port to bind. They must stay in `.env` files. Same applies to `NEXT_PUBLIC_*` flags which are inlined at build time. Everything else that your app reads at runtime belongs in `config/index.ts`.

#### Security Strategy

**Core Defences (MVP Scope):**

- **Strict Input Validation:** Complete boundary validation on all inputs (using Zod to enforce rigid schemas), prevent SQL/XSS injections (Drizzle), and apply strong password rules (stored centrally in `src/lib/validation.ts`).
- **Token Architecture:** Utilising a secure, separated token lifecycle:
    - _Access Tokens:_ Fast, stateless JWTs with short lifespans (e.g., 15 minutes).
    - _Refresh Tokens:_ Opaque, DB-backed hashes stored purely in `HttpOnly`, `Secure`, `SameSite=Lax` cookies to prevent JavaScript access.
    - _Verification Tokens:_ Single-use, hashed hashes used strictly for email/password resets, rendering useless upon first consumption.
- **Refresh Token Rotation:** Moving from static refresh tokens to rolling ones, enabling the system to immediately detect token theft and automatically revoke the compromised session.
- **Enumeration Prevention ('User Not Found' Leaks):** Strict usage of standard, ambiguous error messages (`INVALID_CREDENTIALS` or `USERNAME_EXISTS`) during login and registration to ensure bad actors cannot map existing accounts.
- **Open Redirect Protection:** Ensuring any dynamic `redirect_url` properties or post-login routing are strictly validated against a known whitelist (e.g., matching the `api_clients.domain_name` or strictly starting with `/` for internal relative routes).
- **HTTP Security Headers:** Applying robust Content Security Policy (CSP), HSTS, and X-Content-Type-Options via `next.config.js` headers.
- **Request Consistency:** Zod schemas at the boundary enforce that requests contain only the expected fields - no extraneous data, no duplicate identifiers (e.g., ID in path and body). Schemas are the single source of truth for what each endpoint accepts.
- **Cache Safety:** Authenticated routes that return private data opt out of Next.js caching (via `withApiHandler`/`withActionHandler` wrappers or `dynamic = 'force-dynamic'`) to prevent stale private data from being served to the wrong user.

**Production-Ready Roadmap (Post-MVP Enhancements):**

_The following features are vital for enterprise hardening but are deferred to the backlog to respect the 13-day MVP timeline:_

- **Rate Limiting:** Implementing a Redis-backed rate limiter (e.g., `upstash/ratelimit`) on `/login`, `/register`, and `/reset-password` routes to mitigate brute-force and credential-stuffing attacks.
- **Bot Protection:** Integrating a privacy-first Captcha (e.g., `altcha`) on unauthenticated forms to prevent automated spam registrations.
- **Advanced Monitoring & Alerts:**
    - Tracking IPs and User Agents to automatically dispatch "New Login from Unrecognised Device" warning emails.
    - Building a user-facing complete "Session Management" interface so users can manually revoke access on other (or all) devices.
- **Advanced Cookie Handling:** Introducing cryptographic cookie signing to verify integrity alongside standard `HttpOnly` flags.
- **Audit Logging:** Systematically track and store immutable logs (via `audit_logs` table) for all sensitive security events (e.g., role changes, password resets) to aid in forensic investigation.
- **Granular Permissions System:** Evolving from simple RBAC (Role-Based Access Control) to a more advanced, resource-level permission system alongside specific "User Limits" to prevent abuse.
- **Multi-Factor Authentication (MFA):** Adding TOTP logic and generating hashed one-time fallback recovery codes (via `mfa_recovery_codes` table).
- **Session IP/Agent Binding:** Introducing strict optionally-enabled configurations that immediately sever a session if the associated IP address or User Agent abruptly changes mid-session.
- **User Suspension Workflow:** Advanced suspension features like reason logging, appeal process, and automatic expiry (basic suspend/activate is part of the MVP Admin Dashboard).

#### Frontend Architecture

**Main site components**

- `page.tsx`: The unique UI content of a route segment.
- `layout.tsx`: Shared UI wrapper that preserves state across routes (e.g., HTML/body tags, overall page skeleton).
- `header.tsx`: Top navigation and branding bar.
- `footer.tsx`: Bottom site information and links.
- `nav.tsx`: Auth-aware navigation component. Uses `useSession()` to conditionally render guest links (Login, Register) vs. authenticated links (Profile, Settings, Logout) and admin-only links (Admin). Can be injected into header or sidebar.
- `loading.tsx`: Root-level loading UI (Suspense boundary). Displays a spinner or skeleton during route transitions and data fetching.
- `globals.css`: The root stylesheet for global CSS variables, Tailwind directives, and base styles.

**Error Components/Boundaries**

- `global-error.tsx`: The ultimate root-level fallback UI. It catches errors within the root `layout.tsx` itself.
- `error.tsx`: Segment-level React Error Boundary that catches runtime errors occurring in its children.
- `not-found.tsx`: Renders the 404 UI when a route doesn't exist or a `notFound()` function is called.
- `forbidden.tsx`: Custom 403 error page (client-side render) shown when a logged-in user lacks the required role/permissions for a screen.
- `unauthorized.tsx`: Custom 401 error page shown when an unauthenticated user attempts to view a protected route.

**Provider and Hooks**

_Providers:_

- `SessionProvider`: A React Context provider that wraps the app to store and share the currently authenticated user's state globally. This allows client components to check if a user is logged in without prop drilling or hitting the backend repeatedly.
- `Toaster` (via `sonner`): Mounted in root layout alongside `SessionProvider`. Provides the toast notification container for the entire app.

_Data/Action Hooks:_
These hooks wrap Server Actions via `useActionState` (React 19), which returns `[state, formAction, isPending]`. Each hook calls a Server Action, manages `isPending`/`error` state, and returns a `formAction` compatible with `<form action={…}>`. (`useTransition` is only needed for imperative Server Action calls outside of forms.)

- Auth: `useRegister`, `useLogin`, `useLogout`, `useRefresh`, `useVerifyEmail`, `useResetPassword`
- User Profile: `useGetProfile`, `useUpdateProfile`, `useUpdateEmail`, `useUpdateUsername`, `useUpdatePassword`, `useDeleteAccount`
- Public: `useGetPublicProfile`
- Admin: `useAdminUsers`, `useUpdateUserStatus`, `useDeleteUser`

**Reusable UI Primitives (Design System)**

- **Form Components**
    - `Form`: Wrapper for consistent form styling, submission handling, and global error displays.
    - `Input`: Base text input element.
    - `Label`: Accessible form label.
    - `InputField`: Composed component combining `Label`, `Input`, and error message mapping.
    - `PasswordField`: Extension of `InputField` with a toggle-able eye icon for text visibility.
- **Table Components**
    - `Table` ecosystem: Modular primitives mapping to semantic HTML table elements.
        - `Table`: Core wrapper (`<table>`).
        - `TableHeader` / `TableBody` / `TableFooter`: Semantic section wrappers (`<thead>`, `<tbody>`, `<tfoot>`).
        - `TableRow`: Row wrapper (`<tr>`).
        - `TableHead`: Header cell (`<th>`).
        - `TableCell`: Standard data cell (`<td>`).
        - `TableCaption`: Semantic table title or description (`<caption>`).
    - `DataTable` / `TableWrapper`: A composite layout component to wrap the `Table` alongside external controls like a top toolbar (search, filters, headlines) and bottom controls like `Pagination`.
    - `Pagination`: Reusable component for navigating through pages of data, usually placed outside and below the table.
- **General / Feedback**
    - `Button`: Core interactive element with variants (primary, secondary, danger, ghost, loading state).
    - `Tabs` (or `TabGroup`/`TabPanel`): For navigating sections without page reloads (e.g., in Settings).
    - `Toast` (via `sonner`): For asynchronous notifications (e.g., "Settings saved", "Check your email"). No need to build from scratch; just map the `Toaster` provider.
    - `Alert`: For inline page-level alerts (e.g., static error messages at the top of a form).

**Route Structure**

| Route                     | Page / Component     | Auth   | Description                                                                                   |
| :------------------------ | :------------------- | :----- | :-------------------------------------------------------------------------------------------- |
| `/`                       | Landing / Home       | Public | Marketing or welcome page.                                                                    |
| `/login`                  | `LoginForm`          | Guest  | Login form. Reads optional `?next=` param for post-login redirect.                            |
| `/register`               | `RegisterForm`       | Guest  | Registration form.                                                                            |
| `/forgot-password`        | `ForgotPasswordForm` | Guest  | Request a password reset email.                                                               |
| `/reset-password/[token]` | `ResetPasswordForm`  | Guest  | Set new password via email link token.                                                        |
| `/verify-email`           | `VerifyEmailPrompt`  | Public | "Check your email" prompt after registration (with resend button).                            |
| `/verify-email/[token]`   | `VerifyEmailToken`   | Public | Consumes token, shows minimal success/error info, then forwards to `/login`.                  |
| `/profile/[username]`     | `UserProfile`        | Auth   | Members-only public profile (authenticated users only, respects profile visibility settings). |
| `/settings`               | `SettingsPage`       | Auth   | Settings shell with tab navigation (Profile, Account).                                        |
| `/admin`                  | `AdminUserTable`     | Admin  | Paginated user management table.                                                              |

> [!NOTE]
> **Route Authentication & Redirection**
> **Auth column legend:** Public = anyone, Guest = unauthenticated only (redirect to `/settings` if logged in), Auth = authenticated only, Admin = admin role only.
>
> **Redirect-after-login:** When middleware redirects an unauthenticated user to `/login`, it appends `?next=/original-path`. The `LoginForm` reads this param and passes it to the login Server Action, which redirects there on success (after validating the path starts with `/` to prevent open redirects). Default post-login destination: `/settings` for regular users, `/admin` for admins.
>
> **Token routes:** Keep both `/verify-email` (prompt/resend UI) and `/verify-email/[token]` (token-consumption entry route). For password reset, `/forgot-password` sends the mail and `/reset-password/[token]` is where the new password is submitted.

> [!NOTE]
> **API Client Redirect Metadata**
> For third-party clients, `api_clients.domain_name` is not enough on its own for email links. Store client-specific path templates as well (e.g., `verify_email_path = '/verify-email/{token}'`, `reset_password_path = '/reset-password/{token}'`) and build links as `https://{domain_name}{path_with_token}`.

**Frontend -> Server Action -> API Mapping (Auth Flows)**

_Rule of thumb:_ frontend routes are UX pages, API routes are transport endpoints, and both should call the same service logic.

| User Flow               | Frontend Route            | Frontend Component   | Server Action (Web App)                          | API Endpoint (External/JSON)            | Notes                                                                                 |
| :---------------------- | :------------------------ | :------------------- | :----------------------------------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------ |
| Register                | `/register`               | `RegisterForm`       | `registerAction`                                 | `POST /api/auth/register`               | Creates account, sends verification mail.                                             |
| Verify prompt + resend  | `/verify-email`           | `VerifyEmailPrompt`  | `requestEmailVerificationAction`                 | `POST /api/auth/verify-email/request`   | Includes button to retrigger verification mail.                                       |
| Verify token consume    | `/verify-email/[token]`   | `VerifyEmailToken`   | `confirmEmailVerificationAction(token)`          | `POST /api/auth/verify-email/confirm`   | Token comes from URL on frontend; in API variant token comes from request body/query. |
| Forgot password request | `/forgot-password`        | `ForgotPasswordForm` | `requestPasswordResetAction`                     | `POST /api/auth/reset-password/request` | Sends reset mail if account exists (generic response).                                |
| Reset password submit   | `/reset-password/[token]` | `ResetPasswordForm`  | `confirmResetPasswordAction(token, newPassword)` | `POST /api/auth/reset-password/confirm` | Token is in URL for web UX; API variant receives token in payload.                    |

> [!NOTE]
> **Why `/verify-email/[token]` and `/reset-password/[token]` exist on frontend**
> Users click links in emails. Those links need page routes to land on.
> The page can be minimal, but it must exist in App Router (`page.tsx`).
>
> Typical behaviour:
>
> - `/verify-email/[token]`: validate token on load, show short status text (e.g. "Email verified, forwarding to login..."), then redirect to `/login`.
> - `/reset-password/[token]`: show form for new password, submit with token.

**Feature-Specific Components**
_Auth Flow:_

- `LoginForm`: Handles credentials and submission. Reads `?next=` search param for post-login redirect.
- `RegisterForm`: Handles signup data and validation.
- `ForgotPasswordForm`: Form to request a password reset email.
- `ResetPasswordForm`: Form to enter the new password (accessed via email link).
- `VerifyEmailPrompt`: UI telling the user to check their email (could include resend button).

_User Management:_

- `UserProfile`: Minimal view for the public or personal protected profile.
- `SettingsPage`: Outer shell with page heading and tab navigation.
- `ProfileTab`: Tab content for updating display name, bio, etc.
- `AccountTab`: Tab content showing account fields (email, username, password) in display mode. Each field has an Edit/Change button that reveals an inline form.
    - `EditEmailForm`: Inline form to change email (requires current password).
    - `EditUsernameForm`: Inline form to change username.
    - `EditPasswordForm`: Inline form to change password (requires current password).
    - `DeleteAccountSection`: Danger zone at the bottom for permanent account deletion (requires current password).

_Admin:_

- `AdminUserTable`: Paginated table of all users with quick actions (suspend/activate, delete).

### 1.3 Frontend and Design

#### Content Planning

See `./messages/{language}.json`

### 1.4 Finalisation

#### Project Time Frame

| **Week**         | **Date** | **Time (Days)** |                   |
| ---------------- | -------- | --------------- | ----------------- |
|                  |          |                 |                   |
| **1**            | 16/03/26 | 0.5             | Zahnarzttermin    |
|                  | 17/03/26 | 1               |                   |
|                  | 18/03/26 | 1               |                   |
|                  | 19/03/26 | 1               |                   |
|                  | 20/03/26 | 1               |                   |
|                  | 22/03/26 | 0.25            |                   |
|                  |          |                 |                   |
| **2**            | 23/03/26 | 1               |                   |
|                  | 24/03/26 | 1               |                   |
|                  | 25/03/26 | 1               |                   |
|                  | 26/03/26 | 1               |                   |
|                  | 27/03/26 | 1               |                   |
|                  | 29/03/26 | 0.25            |                   |
|                  |          |                 |                   |
| **3**            | 30/03/26 | 1               |                   |
|                  | 31/03/26 | 1               |                   |
|                  | 01/04/26 | 1               |                   |
|                  | 02/04/26 | 0.5             | Rehearsal         |
|                  | 03/04/26 | 0.25            | Karfreitag        |
|                  |          |                 |                   |
| **4 (holidays)** | 06/04/26 | 0               | Ostermontag       |
|                  | 07/04/26 | 1               |                   |
|                  | 08/04/26 | 0               | Familientag       |
|                  | 09/04/26 | 1               |                   |
|                  | 10/04/26 | 1               |                   |
|                  | 12/04/26 | 0.25            |                   |
|                  |          |                 |                   |
| **5**            | 13/04/26 | 1               |                   |
|                  | 14/04/26 | 1               |                   |
|                  | 15/04/26 | 1               |                   |
|                  | 16/04/26 | 0               | Präsentation      |
|                  |          |                 |                   |
|                  |          | **20**          | **Days in total** |

#### Schedule

| Task                                      | Est. | Dates         | Notes                                                                                          |
| :---------------------------------------- | :--- | :------------ | :--------------------------------------------------------------------------------------------- |
| **1. Preparation and Planning**           | Pre  | before 16/03  | Completed before development starts.                                                           |
| **2. Setup**                              | Pre  | before 16/03  | Mostly pre-development. 2.3 (Project Identity) spills into Day 1.                              |
| **3.1 Infrastructure & Core Setup**       | ~4   | 16/03 - 20/03 | Validation, DB, repos, wrappers.                                                               |
| **3.2 Auth - Backend**<br>**5. API Docs** | ~4.5 | 20/03 - 27/03 | 6 services, 9 dual-channel endpoints, `auth.ts`, `proxy.ts`. <br>Final `api.md`                |
| **6. Deploy**<br>**External connection**  | ~1.5 | 27/03 - 31/03 | Docker, Pipeline, DNS, client and seeding<br>External client hookup.                           |
| **3.1 Frontend Shell**                    | ~1.5 | 31/03 - 02/04 | Root layout, landing page, header/footer, nav, error pages, UI primitives.                     |
| **3.2 User Mgmt - Backend**               | ~2   | 02/04 - 07/04 | UserService, 7 endpoints. Patterns from Auth. Easter break (03-06/04) in between.              |
| **3.2 Auth - Frontend**                   | ~1.5 | 07/04 - 09/04 | Minimal forms, SessionProvider, nav update, hooks.                                             |
| **3.2 Admin Dashboard**                   | ~1   | 09/04 - 10/04 | 3 endpoints, AdminUserTable (primitives from 3.1).                                             |
| **6. CI/CD + 5. Docs + Presentation**     | ~1   | 10/04 - 13/04 | Pipeline, env vars, README, presentation prep.                                                 |
| **4. Site Health & Standards**            | -    | -             | Out of scope for this project.                                                                 |
| _Buffer_                                  | ~2.5 | 13/04 - 15/04 | Overflow, polish, bug fixes. **User profile + settings frontend if time allows.** Pres: 16/04. |

---

## 3. Development

### 3.1 Infrastructure and Core Setup

### 3.2 Features

**Auth**

- https://nextjs.org/docs/app/guides/authentication
- Usage of `revalidatePath()`
- Brauche ich `export const dynamic = 'force-dynamic'`?
- Use `import 'server-only'`

**Components**

- Was bester Weg für Anpassung von Komponenten (Farben etc.)
- How do I set page title on `page.tsx` if `<head>` is in `layout.tsx`?

### 3.3 Backlog

**Deferred MVP Features**

- **"Remember Me":** Toggle between persistent and session cookies on login.

**Features**

- **Localised App Routing (`next-intl`):** Map internal route IDs to locale-specific paths so app URLs can differ per language while resolving to the same internal routes.
- **Modal Login:** Implement Intercepting Routes for login/register to open in a modal overlay.
- **File Uploads:** Requires S3/Blob storage setup, strict file validation, and drag-and-drop UI.
- **External Auth:** Support for third-party auth providers (Google, GitHub, etc.).
- **Newsletter:** Email subscription and delivery system.
- **React Native Support:** Mobile client integration (cookie handling for native?).
- **Multi-tenant IdP:** Evaluate and implement Agora Auth as a standalone identity provider capable of serving multiple independent applications.

**Settings (Additional Tabs)**

- **Sessions:** `ActiveSessionsList` - table/list of active devices with "Revoke" buttons.
    - `GET /api/user/sessions`: List all active sessions across devices for the user.
    - `DELETE /api/user/sessions`: Revoke all sessions (except current) to log out everywhere else.
    - `DELETE /api/user/sessions/:id`: Revoke a specific session (remote logout).
- **Cookies:** Cookie consent and preferences management.
- **Privacy:** Profile visibility and data sharing settings.
- **Preferences:** Theme, language, notification settings.
    - `PATCH /api/user/settings`: Change basic settings like language or theme.

**UX**

- **Shake Effect:** Animation for failed login attempts.
- **Real-Time Password Feedback:** Per-rule checklist UI during password entry (using `createPasswordRules` with i18n).

**Infrastructure**

- **Database Housekeeping:** Background jobs/crons to sweep expired or revoked tokens.
- **Security Hardening:** See [Production-Ready Roadmap (Post-MVP Enhancements)](#production-ready-roadmap-post-mvp-enhancements).
- **`cache()` for Session Deduplication:** Wrap `verifySession()` in React's `cache()` to memoize the session check within a single render pass, avoiding duplicate DB queries when multiple Server Components call it.
- **`taintUniqueValue`:** Use React's `taintUniqueValue` API to prevent sensitive session data (e.g., tokens, secrets) from accidentally leaking to Client Components via the `SessionProvider`.
- Port remaining utilities from Turbine as needed.

**Questions**

- Wieso brauche ich für API keine Cookies, wie Google zusätzlich zu API einsetzt?
- Multi-tenant IdP
    - Macht das überhaupt Sinn? Als Auth-Provider?
    - Wieso brauche ich für API keine Cookies, wie Google zusätzlich zu API einsetzt?

- **`AuditService`**: Centralised logging for security-critical actions (e.g., "User X updated profile", "Failed login attempt").

**User Overview**

- **Public User Directory:** Browse/search page listing public user profiles (with pagination and filtering).
- **Enhanced Public Profiles:** Richer profile pages with activity feeds, badges, or extended bio sections.

**Admin**

- **Admin Dashboard:** Overview/landing page with key metrics (total users, recent registrations, active sessions).
- **Admin User Table Enhancements:** Extend the MVP table with advanced filtering, sorting, search, and bulk actions.
- **Admin User Detail View:** Detailed account view for a specific user (`GET /api/admin/users/:id`).
- **Admin User Creation:** Manually create new users (e.g., staff accounts) (`POST /api/admin/users`).
- **Admin User Editing:** Edit another user's details (`PATCH /api/admin/users/:id`).
- **API Client Management:** UI form to register and manage additional API clients (beyond the default `agora_web_default` in config).

## 5. Documentation

- Exact time for presentation(s)

## 6. Initial Major Release and Deployment
