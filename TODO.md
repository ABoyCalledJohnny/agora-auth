# TODO Agora Auth

## To-do Overview

- **[Project Roadmap](#project-roadmap)**
    1. **[Preparation and Planning](#1-preparation-and-planning)**
        1. [Core and Strategy](#11-core-and-strategy): Define project identity, MVP scope, tech stack, infrastructure, workflow, and research goals.
        2. [Architecture and Data](#12-architecture-and-data): Model database schema, plan services and API, map logic flows, define configuration and error standards, security strategy, and frontend architecture.
        3. [Frontend and Design](#13-frontend-and-design): Write UI copy for all target languages.
        4. [Plan Finalisation](#14-plan-finalisation): Review consistency and MVP scope, establish development plan and timeline, verify strategy integrity.
    2. **[Setup](#2-setup)**
        1. [Project Initialisation](#21-project-initialisation): Create Git repository, scaffold directory layout and infrastructure from Turbine.
        2. [Configuration](#22-configuration): Set up local environment secrets.
        3. [Project Identity](#23-project-identity): Draft README and API docs, verify project identifiers across all config and documentation files.
        4. [Dependencies](#24-dependencies): Update and install packages via Bun.
        5. [Verification and Initial Commit](#25-verification-and-initial-commit): Launch development environment, verify connectivity, and release initial commit.
    3. **[Development](#3-development)**
        1. [Infrastructure and Core Setup](#31-infrastructure-and-core-setup-days-1-6): Shared validation, database layer, repositories, core library wrappers, frontend shell, and UI primitives.
        2. [Features](#32-features): Iterative development of [Auth](#feature-auth-days-7-12), [User Management](#feature-user-management-days-13-15), and [Admin Dashboard](#feature-admin-dashboard-days-15-16).
    4. **[Site Health and Standards](#4-site-health-and-standards):** _Out of scope for this project._
    5. **[Documentation](#5-documentation-day-17):** Finalise README, API documentation, and prepare project presentation.
    6. **[Initial Major Release and Deployment](#6-initial-major-release-and-deployment-days-16-17):** Configure DNS, Docker, Caddy, CI/CD pipeline, and deploy to production.

> [!NOTE]
> **Design & Reference**
> All design decisions, research, feature backlogs, and detailed architecture notes can be found in **[NOTES.md](NOTES.md)**.

---

## To-do

### Project Roadmap

#### 1. Preparation and Planning

##### 1.1 Core and Strategy

- **Identity and Goal Definition:**
    - [x] **Project Name:** Determine the project's display name (e.g., "Agora Auth"), URL-safe slug (e.g., `agora-auth`), and production domain.
    - **Description:** Define the specific problem this project solves.
        - [x] Add tagline.
        - [x] Add main description.
    - [x] **MVP Scope:** Define MVP scope and feature list.
        - [x] **Optional Functionality:** Define optional functionality ("nice to have" for future enhancements) in backlog.
        - [x] Add important considerations and priorities.
    - [x] **Usage Rights:** Determine usage rights and choose license (defaults to MIT, several others can be found in `.template/licenses/`).
- **Tech Stack:**
    - [x] **Prerequisites:** Define system and software prerequisites.
    - [x] **Languages/Runtime:** Choose programming languages and runtime environment.
    - [x] **Database:** Select database system.
    - [x] **Frameworks:** Select core frameworks for frontend and backend.
    - [x] **Key Libraries:** Identify essential libraries and packages.
- **Infrastructure Planning:**
    - [x] **Domain:** Acquire target domain(s).
    - [x] **Hosting:** Evaluate and select a hosting provider (VPS or CaaS) based on cost, performance, and features.
- **Workflow Setup:**
    - [x] **To-Do List Adjustment:** Adjust boilerplate to-do list and overview to fit the specific project's needs.
    - [x] **Note Synchronisation:** Set up `systemd` service to synchronise Obsidian vault project notes (`README.md` and `TODO.md`) to project repository documentation.
- **Research:**
    - [x] **Learning List:** Create learning list (using notes as basis).
    - [ ] **Practice and Documentation:** Learn and practice unknown technologies/patterns and create cheat sheets.

##### 1.2 Architecture and Data

- **Data Modelling and Validation:**
    - [x] **Database Schema:** Diagram the database entities and relationships (ERD) (e.g., on https://dbdiagram.io/).
    - [x] **Validation Strategy:** Define core domain rules (e.g., Password complexity, user roles, user settings and preferences) (e.g., for `src/lib/validation.ts`).
- **Service Architecture and Logic:**
    - [x] **Business Logic:** Define dedicated services for core operations (e.g., user management, authentication, token lifecycle) to decouple logic from the transport layer.
    - [x] **Transport/API:** Plan the REST API structure and Next.js Server Actions for client-server communication, ensuring consistent validation and error handling (define standard `ApiSuccessResponse` and `ApiErrorResponse` shapes).
    - [x] **Logic Flow:** Map out critical data flows (e.g., authentication lifecycle, complex transactions).
- **Core Configuration and Standards:**
    - [x] **Error Types and Messages:** Define necessary error types / codes, messages, and HTTP statuses.
    - [x] **Environment and Configuration:** Define project-specific environment variables and configuration constants for both development and production contexts.
- [x] **Security Strategy:** Define authentication and authorisation rules (protected routes and resources) implementation.
- **Frontend Architecture:**
    - [x] **Components:** Define needed components (additional base UI primitives, shared app-specific components, feature-isolated components).
    - [x] **Providers:** Plan global context providers.
    - [x] **Hooks:** Define global and feature hooks.
- [x] **Feature Considerations:** Write down any questions or important considerations or characteristics in [NOTES.md - Features](NOTES.md#32-features).

##### 1.3 Frontend and Design

- **Content Planning:**
    - [x] **Copy:** Write headlines, button labels, form placeholders, and success/error messages for all target languages.

##### 1.4 Plan Finalisation

- **Plan Review:**
    - [x] **Consistency Check:** Review sections 1.1–1.3 for internal consistency, completeness, and any gaps or contradictions.
    - [x] **MVP Scope Review:** Audit the feature list against the MVP definition to cut scope creep and confirm nothing essential is missing or accidentally deferred.
- [x] **Development Plan:** Establish a concrete development plan in [3. Development](#3-development): Break down and detail all implementation steps required for the MVP (infrastructure and features).
- [x] **Timeline and Schedule:** Define a rough timeline/schedule and milestones for the project and development phases.

---

#### 2. Setup

##### 2.1 Project Initialisation

- [x] **Git Repository:** Initialise local Git repository, create remote on GitHub, and link them.
- [x] **Repository Layout:** Create project directory layout (using Turbine as a basis).
- [x] **Infrastructure:** Copy, update/complete documentation, basic infrastructure and configuration files (from Turbine).
- [x] **Application Scaffold:** Copy reusable application structure from Turbine (layout, components, utilities). Feature-specific adaptations happen during development (Section 3).
- [x] **File Skeleton Creation:** Scaffold additional project directories and empty placeholder files (UI components, repositories, providers, database scripts) identified during the architecture phase to establish a visual roadmap in the codebase before writing logic.

##### 2.2 Configuration

- [x] **Local Secrets:** Copy `.env.local.example` to `.env.local` and fill in real values (SMTP, JWT keys) if already available.
- [x] **Local Docker Overrides:** Copy `compose.override.example.yaml` to `compose.override.yaml` and adjust local container behaviours (such as disabling auto-restarts).

##### 2.3 Project Identity

- [x] **Readme:** Create first `README.md` draft (include GDPR/privacy notice).
- [x] **API Documentation Draft:** Write initial `api.md` from the API Design spec (endpoints, methods, auth requirements, error codes). Send to classmate alongside the live API URL.
- **Project Identifiers:** Ensure the project name and all derived values (DB names, email addresses, domains etc.) are correct across
    - [x] Documentation: `README.md`, `TODO.md`, `LICENSE`
    - [x] Environment and app config: `.env` files, `src/config/*` `errors.ts` (error class name)
    - [x] Project config: `package.json`, `Caddyfile`, `compose*.yaml`

##### 2.4 Dependencies

- [x] **Update:** Run `bun update:deps` to pull latest compatible versions. Use `bun update <pkg> --latest` for major bumps. _(optional)_
- [x] **Install:** Run `bun install` to generate a clean `bun.lock`.

##### 2.5 Verification and Initial Commit

- [x] **Launch:** Start Docker containers / development servers and verify basic functionality (`bun verify:build`, check `http://localhost:3000/api/health` in the browser).
- [x] **Finalisation and Release:** Do cleanup and preflight checks, update documentation, and release new repository version (milestone: `project-init`).
- [x] **Cooperation:** Message classmate date for first connection test, initial `api_DRAFT_de.md`, client data.

---

#### 3. Development

##### 3.1 Infrastructure and Core Setup (Days 1-6)

- [x] **Preparation:** Do pre-development checks before starting work.
- **Development:**
    - **Shared Validation and Domain Rules:**
        - [x] **Validation module:** Create validation.ts to centralise reusable Zod schemas (password requirements, username parsing) with i18n support, and define composite structural JSON validation (`UserPreferences`, `PrivacySettings`) mapping to database domains.
        - [x] **Global types:** Create `src/types.ts` to define system-wide interfaces like `ApiErrorResponse`, `ApiSuccessResponse`, and standard action states for uniform client-server communication as well es `PaginatedList`s.
    - **Database Layer:**
        - **Drizzle schemas:** Translate the ERD into Drizzle schema and relation files.
            - **Validation:** Import shared constants and types from `constants.ts` and `validation.ts` where applicable.
            - **Types:** Export inferred TypeScript types from Drizzle schemas (e.g., `User`, `Session`, `Role`).
            - [x] Users Tables (`users.ts`)
            - [x] Auth Tables (`auth.ts`)
            - [x] Role Tables (`rbac.ts`)
            - [x] Client Table (`client.ts`)
        - [x] **Migrations:** Generate and apply the initial migration (`bun run db:generate` and `bun run db:migrate:dev`).
        - **Repositories:** Create repositories as well as interfaces:
            - [x] **`UserRepository`:** Data access for user records in `src/repositories/`. Shared across Auth and User features.
            - [x] **`SessionRepository`:** Session CRUD (create, find, revoke, rotate) in `src/repositories/`.
            - [x] **`VerificationTokenRepository`:** Token storage and lookup in `src/repositories/`.
            - [x] **`RoleRepository`:** Role and user-role assignment queries in `src/repositories/`.
            - [x] **`ApiClientRepository`:** API client lookup and domain validation in `src/repositories/`.
        - [x] **Bootstrap script:** Implement `src/db/bootstrap.ts` to automatically create mandatory system data on startup (roles: `admin`, `user`; initial admin account; default API client). Ensure inserts use `ON CONFLICT DO NOTHING` for idempotency. Run script (`bun run db:bootstrap:dev`).
        - [x] **Seed script:** Update `src/db/seed.ts` to generate development-only dummy data (e.g., fake users) and run script (`bun run db:seed`).
    - **Core Library:**
        - [x] **`withApiHandler`:** Implement API route wrapper (`src/lib/api-wrapper.ts`) - Zod input validation, structured JSON error responses, authentication/authorisation guards (via options like `{ auth: true, roles: ['admin'] }`), cookie management (set/clear `HttpOnly`, `Secure`, `SameSite=Lax` cookies), cache-control headers for authenticated routes, and redirect to `/login?next=…` on auth failure.
        - [ ] **`withActionHandler`:** Implement Server Action wrapper (`src/lib/action-wrapper.ts`) - Zod input validation, structured error state, authentication/authorisation guards, cookie management, and redirect to `/login?next=…` on auth failure.
    - **Frontend Shell:**
        - [ ] **Root layout:** Set up `layout.tsx` with `NextIntlClientProvider` and `Toaster`. (`SessionProvider` is created and added later in the Auth feature.)
        - [ ] **Landing page:** Implement `/` route (`page.tsx`) — marketing/welcome page.
        - [ ] **Header and footer:** Implement `header.tsx` (top navigation/branding bar) and `footer.tsx` (bottom site info/links).
        - [ ] **Navigation:** Implement `nav.tsx` with static placeholder links and two navigation patterns (desktop-only MVP):
            - [ ] **Desktop nav:** Horizontal link bar in the header.
            - [ ] **User menu:** `Sheet` slide-in panel triggered by a user/avatar button (placeholder for now — auth-aware content is added in the Auth feature).
        - [ ] **Error pages:** Implement `error.tsx`, `not-found.tsx`, `global-error.tsx`, `unauthorized.tsx`, `forbidden.tsx`.
        - [ ] **Loading UI:** Add root-level `loading.tsx` (Suspense boundary).
        - **UI primitives:** Port and adapt reusable components from Turbine:
            - [ ] Layout/Architecture: `Container`, `Card`, `Sheet` (slide-in panel for user menu).
            - [ ] Form: `Form`, `Input`, `Label`, `InputField`, `PasswordField`.
            - [ ] General: `Button`, `Alert`, `Toast` (via `sonner`).
            - [ ] Table: `Table` ecosystem, `DataTable`/`TableWrapper`, `Pagination`.
            - _Deferred to respective features or backlog:_ `SearchInput`, `Select`, `Tabs`, `Avatar`, `Modal`, `Pill`.
- [ ] **Finalisation and Release:** Do cleanup and preflight checks, update documentation, and release new repository version (milestone: `infrastructure-setup`).

##### 3.2 Features

###### Feature: Auth (Days 7-12)

- [x] **Preparation:** Do pre-development checks before starting work.
- **Development:**
    - **Validation and Contracts:**
        - [x] Create Zod validation schemas (`registerSchema`, `loginSchema`, `resetPasswordSchema`, `newPasswordSchema`) in `src/features/auth/contracts.ts`. Export inferred TypeScript types from schemas (e.g., `RegisterInput`, `LoginInput`) for type-safe request handling.
    - **Services:**
        - [x] **`AuthService`:** Registration and login orchestration.
        - [x] **`SessionService`:** DB session CRUD and Refresh Token Rotation.
        - [x] **`JwtService`:** Pure RS256 JWT signing/verification via `jose` (no DB access - callable from `proxy.ts`).
        - [x] **`VerificationTokenService`:** Single-use hashed tokens for email verification and password reset.
        - [ ] **`NotificationService`:** Email abstraction using `nodemailer`.
            - [ ] Create HTML templates (welcome/verification, password reset).
            - [ ] Implement service in `AuthService` etc.
        - [x] **`ApiClientService`:** Verify external API clients (validate API keys, check allowed domains) before granting access to core services.
    - **API Routes and Server Actions:**
        - Implement auth endpoints (dual-channel: API route returning JSON + Server Action for forms). Use `withApiHandler`/`withActionHandler` wrappers with Zod validation. Endpoints marked 🔒 require authentication:
        - [x] `POST /api/auth/register` - Register new user.
        - [x] `POST /api/auth/login` - Authenticate and establish session. Set access/refresh cookies.
        - [x] 🔒 `POST /api/auth/logout` - Invalidate session and clear cookies.
        - [x] (🔒) `POST /api/auth/refresh` - Rotate tokens using valid refresh cookie.
        - [x] `POST /api/auth/verify-email` - Confirm email via token.
        - [x] `POST /api/auth/verify-email/resend` - Re-issue verification email.
        - [x] `POST /api/auth/reset-password` - Initiate password reset (resend email).
        - [x] `POST /api/auth/reset-password/confirm` - Set new password via reset token.
        - [x] `GET /api/auth/jwks` - Public JWKS endpoint for external JWT verification.
    - **Auth Infrastructure:**
        - [x] **`auth.ts`:** Implement `getSession()`, `authenticate()`, and `authorize()` - connect to `JwtService`/`SessionService`.
        - [ ] **`proxy.ts`:** Implement request interceptor - verify access-token JWT, pass through expired tokens (server-side `getSession()` handles refresh), redirect unauthenticated users to `/login?next=…` (appends original path), block `/admin/*` for non-admin roles.
    - **Frontend:**
        - [ ] **`SessionProvider`:** Create in `src/providers/` - React Context with `useSession()` hook. Hydrate from `layout.tsx` via server-side `getSession()`. Add to root layout.
        - [ ] **`nav.tsx`:** Update with auth-aware rendering — guest links (Login, Register) vs. authenticated (Profile, Settings, Logout) vs. admin (Admin) using `useSession()`. Populate user menu `Sheet` with authenticated links.
        - [ ] **Auth forms:** Build `LoginForm` (reads and validates `?next=` param - must start with `/` - passes to login action for post-login redirect), `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `VerifyEmailPrompt`. Use `useActionState` for pending/error states.
        - [ ] **Auth hooks:** `useRegister`, `useLogin`, `useLogout`, `useVerifyEmail`, `useResetPassword` in `src/features/auth/hooks/`.
- [ ] **Finalisation and Release:** Do cleanup and preflight checks, update documentation, and release new repository version (milestone: `auth`).

###### Feature: User Management (Days 13-15)

- [ ] **Preparation:** Do pre-development checks before starting work.
- **Development:**
    - **Validation and Contracts:**
        - [ ] Create Zod validation schemas (`updateProfileSchema`, `updateEmailSchema`, `updateUsernameSchema`, `updatePasswordSchema`, `deleteAccountSchema`) in `src/features/user/contracts.ts`.
        - [ ] Define response-shaping TypeScript types (`FrontendUser`, `PublicUser`) as field projections for output filtering.
    - **Services:**
        - [ ] **`UserService`:** Profile CRUD (public vs. private field filtering via `FrontendUser`/`PublicUser` types), public ID generation via `nanoid`, email change, username change, password change, account deletion. Enforce resource ownership.
            - Set `username` as `display_name`?
        - [ ] **`RoleService`:** Handle user role retrieval and assignments, encapsulating authorisation queries.
    - **API Routes and Server Actions:**
        - Implement user endpoints (dual-channel). All routes require authentication via `{ auth: true }`:
        - [ ] 🔒 `GET /api/user/profile` - Authenticated user's full profile.
        - [ ] 🔒 `PATCH /api/user/profile` - Update display name, bio, etc.
        - [ ] 🔒 `PATCH /api/user/email` - Initiate email change (triggers verification).
        - [ ] 🔒 `PATCH /api/user/username` - Change username.
        - [ ] 🔒 `PATCH /api/user/password` - Change password (requires current password).
        - [ ] 🔒 `DELETE /api/user` - Self-serve account deletion (requires current password).
        - [ ] 🔒 `GET /api/users/:username` - Public profile (authenticated users only, strictly public fields, respects profile visibility settings).
    - **Frontend:**
        - [ ] **`UserProfile`:** Public profile page at `/profile/[username]`.
        - [ ] **`SettingsPage`:** Settings shell with `Tabs` component (Profile tab, Account tab).
        - [ ] **`ProfileTab`:** Display name and bio form with save + success toast.
        - [ ] **`AccountTab`:** Display current values with Change buttons, inline edit forms (`EditEmailForm`, `EditUsernameForm`, `EditPasswordForm`), and `DeleteAccountSection`.
        - [ ] **User hooks:** `useGetProfile`, `useUpdateProfile`, `useUpdateEmail`, `useUpdateUsername`, `useUpdatePassword`, `useDeleteAccount`, `useGetPublicProfile` in `src/features/user/hooks/`.
- [ ] **Finalisation and Release:** Do cleanup and preflight checks, update documentation, and release new repository version (milestone: `user`).
    - [ ] Enable email authentication for default client.
    - [ ] Remove debug logs.

###### Feature: Admin Dashboard (Days 15-16)

- [ ] **Preparation:** Do pre-development checks before starting work.
- **Development:**
    - **API Routes and Server Actions:**
        - Implement admin endpoints (dual-channel). All routes require authentication and admin role via `{ auth: true, roles: ['admin'] }`:
        - [ ] 🔒 `GET /api/admin/users` - List all users (paginated).
        - [ ] 🔒 `PATCH /api/admin/users/:id/status` - Suspend/activate a user.
        - [ ] 🔒 `DELETE /api/admin/users/:id` - Delete a user account.
    - **Frontend:**
        - [ ] **`AdminUserTable`:** Paginated table of all users with quick actions (suspend/activate, delete). Built with `DataTable` + `Pagination` primitives. Table uses `overflow-x-auto` for horizontal scroll on mobile (full responsive layout deferred to backlog).
        - [ ] **Admin hooks:** `useAdminUsers` (for list/pagination), `useUpdateUserStatus`, `useDeleteUser` in `src/features/admin/hooks/`.
- [ ] **Finalisation and Release:** Do cleanup and preflight checks, update documentation, and release new repository version (milestone: `admin`).

---

#### 4. Site Health and Standards

_Out of scope for this project._

---

#### 5. Documentation (Day 17)

- [ ] **Project Readme:** Finalise `README.md` from initial draft.
- [ ] **API Documentation:** Finalise `api.md` (and `api_de.md`) documenting all public endpoints, request/response schemas, authentication requirements, and example usage - share with classmate consuming the API.
- [ ] **Code quality:** Add JSDoc/DocBlocks and helpful inline comments to complex functions and components (where missing).
- [ ] **Presentation:** Prepare project presentation.

---

#### 6. Initial Major Release and Deployment (Days 16-17)

##### Configuration as Code

- [x] **Preparation:** Do pre-development checks before starting work.
- **Development:**
    - **Application Runtime (Docker and Compose)**
        - [x] Finalise the production/staging `Dockerfile`s and `compose.{environment}.yaml` to configure necessary services, custom networks, and persistent volumes.
        - [x] Prepare for remote DB access via SSH tunnelling:
            - Bind the PostgreSQL container port to the VPS localhost in `compose.production.yaml` (for port tunnelling).
            - Add the database superuser credentials to `.env.local` to permanently override development environment variables (or set up a dedicated script/command to specify which DB to access).
    - **CI/CD Pipeline**
        - [x] Build full `deploy.yaml` with CI and CD build needs (not activated yet) and remove `ci.yaml`.
- [x] **Finalisation and Release:** Do cleanup and preflight checks, update documentation, and release new repository version (milestone: `user`).

##### DevOps and Deployment

- **DNS and Domain Management**
    - [x] Integrate domain into Dogado mail hosting provider, create email account and add config data to `env.local`.
    - [x] Configure DNS records (A/AAAA) to point your domain(s) to the production IP addresses.
    - [x] Set up DNS records for email delivery (SPF, DKIM, DMARC, MX) if applicable.
- **CI/CD Pipeline Setup**
    - [x] Inject all required production environment variables into your repository's CI/CD secret manager.
    - [x] Set read/write permissions for GitHub workflows in repository `Actions` settings.
- **Production Server**
    - [x] Clean old Docker infrastructure.
    - [x] Enable continuous deployment.
    - [x] Establish a secure SSH port forwarding tunnel to verify database connection (`ssh -p 53345 -L 5433:127.0.0.1:5432 admin@server.meeplelabs.de`) and run `bunx drizzle-kit studio` locally to verify introspection and remote connection.
- **Client Integration and Seeding**
    - [x] Create client entry for classmate in db and share access data (`name`, `domain_name`, `verify_email_path`, `reset_password_path`. `client_id`, `api_key_hash`).
