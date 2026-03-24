# Agora Auth

> [!WARNING]
> **Active Development**
> The **core authentication logic** (API routes, server actions, Zod schemas, database models, and strict type-safe wrappers) is heavily implemented. The project is currently focusing on frontend UI completion and hooking up external notification services.

A robust, secure, and modern authentication and user management system built with Next.js, Drizzle ORM, and PostgreSQL.

## Table of Contents

- [Agora Auth](#agora-auth)
    - [Table of Contents](#table-of-contents)
    - [About the Project](#about-the-project)
        - [Key Features (Planned)](#key-features-planned)
    - [Tech Stack](#tech-stack)
    - [Prerequisites](#prerequisites)
    - [Getting Started (WIP)](#getting-started-wip)
    - [Configuration](#configuration)
    - [Deployment](#deployment)
    - [Project Structure](#project-structure)
    - [Development Workflow](#development-workflow)
        - [Useful Commands](#useful-commands)
    - [Roadmap \& Reference Documentation](#roadmap--reference-documentation)
    - [License](#license)

---

## About the Project

Agora Auth is a comprehensive authentication solution designed for modern web applications. It leverages Next.js Server Actions, Drizzle ORM, and PostgreSQL to provide a secure and scalable identity management system.

It aims to provide a solid foundation for user registration, login, profile management, and secure API interactions, prioritising security best practices like HTTP-only cookies and strict input validation.

### Key Features (Planned)

- **Stateless JWT Access Tokens:** Paired with database-backed sessions.
- **Secure Password Hashing:** Using Bun's native Argon2.
- **Granular Permissions:** Distinguishing between public and private user data with role-based access control.
- **Admin Dashboard:** Interface for user management (listing, suspending, deleting accounts).
- **External Client API:** Secure cross-service verification using RS256 token signing and a public JWKS endpoint.

---

## Tech Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Runtime & Tooling:** Bun
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Validation:** Zod

---

## Prerequisites

- **Operating System:** Linux, macOS, or Windows (via WSL) for Development
- **Containerisation:** Docker & Docker Compose
- **Runtime:** Bun

---

## Getting Started (WIP)

> [!WARNING]
> **Project Status:** While the core authentication endpoints (Login, Register, Refresh, Verify, Reset) are functional, frontend UI integrations, admin flows, and email notifications are still under active implementation.

Minimum local setup currently used in this repository:

```bash
bun install
bun run docker:up
bun run dev
```

> [!NOTE]
> `bun run dev` already starts Docker via `docker:up` before launching Next.js. Running `docker:up` manually is optional if your local containers are already running.

---

## Configuration

The application is configured via environment variables and a centralised configuration file located at `src/config/index.ts`.

For a detailed breakdown of all environment variables, secrets, and deployment-specific configurations, please refer to the **[NOTES.md](NOTES.md)** file.

Key environment variables include:

- `APP_ENV`, `APP_URL`
- Database credentials (`DB_HOST`, `DB_PORT`, `POSTGRES_DB`, `APP_DB_USER`, `APP_DB_PASSWORD`)
- Authentication keys (`JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`)
- SMTP settings for email delivery (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`)

---

## Deployment

> [!IMPORTANT]
> This application is built with a highly specific CI/CD pipeline and infrastructure setup tailored to a custom VPS environment using Caddy and Docker.
>
> **It is not designed to be deployed by others out-of-the-box.** Deploying this system independently would require extensive modifications to the Docker setup, configuration files, and deployment pipelines, which are currently active works in progress.

---

## Project Structure

The project follows a feature-driven, modular structure built on top of Next.js App Router:

```bash
.
├── docker/                 # Infrastructure and Docker configuration
│   ├── app/                # Application Dockerfile
│   ├── caddy/              # Caddy reverse proxy config
│   ├── migrator/           # Database migration runner
│   └── postgres/           # Database initialisation scripts
├── docs/                   # API documentation and drafts
├── drizzle/                # Database migrations output
├── messages/               # Internationalisation (i18n) translation files
├── public/                 # Static assets (robots.txt, etc.)
└── src/                    # Application source code
    ├── app/                # Next.js App Router layout, pages, and API routes
    ├── components/         # Shared UI components (layout, forms, tables)
    ├── config/             # Centralised application and environment configuration
    ├── db/                 # Database connection, schemas, and seeding scripts
    ├── features/           # Feature-driven logic (auth, user, admin)
    │   └── [feature]/      # Each feature contains boundaries (contracts, docs, services, UI)
    │       ├── actions/    # Next.js Server Actions
    │       ├── components/ # Feature-specific UI components
    │       ├── hooks/      # Feature-specific React hooks
    │       ├── services/   # Business logic and external calls
    │       ├── contracts.ts# Zod validation schemas and DTOs
    │       ├── index.ts    # Public exports for the feature
    │       └── types.ts    # TypeScript definitions
    ├── hooks/              # Shared React hooks
    ├── lib/                # Core utilities, validation, and wrappers
    ├── providers/          # Global React context providers
    ├── repositories/       # Database data access layer
    ├── i18n.ts             # Internationalisation setup
    ├── proxy.ts            # Proxy configuration
    └── types.ts            # Global TypeScript definitions
```

---

## Development Workflow

> [!NOTE]
> The foundational development workflow has been established. You can run database migrations, formatting, type checking, and the Next.js development server with its associated local container network seamlessly via Bun scripts.

Current Next.js and Bun scripts in `package.json` already support operations such as:

- Initialising the database and running Drizzle migrations.
- Developing the frontend/backend using the Next.js dev server.
- Formatting and type-checking the codebase (via Prettier, ESLint, and `bun typecheck`).

### Useful Commands

| **Command**           | **Description**                                             |
| --------------------- | ----------------------------------------------------------- |
| `bun run dev`         | Starts Docker services and then runs `next dev --turbopack` |
| `bun run build`       | Builds the application for production                       |
| `bun run db:generate` | Generates Drizzle SQL migrations based on schema changes    |
| `bun run db:migrate`  | Applies pending database migrations                         |
| `bun run db:push`     | Pushes database schema changes directly                     |
| `bun run db:studio`   | Opens Drizzle Studio to inspect the database                |
| `bun run db:reset`    | Resets the database, pushes schema, and seeds data          |
| `bun run typecheck`   | Runs TypeScript type checking across the project            |
| `bun run verify`      | Runs lint, typecheck, and format checks                     |
| `bun run docker:up`   | Starts the necessary Docker containers                      |
| `bun run docker:stop` | Stops the Docker containers                                 |

---

## Roadmap & Reference Documentation

The project's entire roadmap, detailed feature descriptions, and implementation backlog are tracked in **[TODO.md](TODO.md)**.
All design decisions, architecture sketches, logic flows, and error configuration strategies are kept in **[NOTES.md](NOTES.md)**.

Additionally, API documentation drafts can be found in the `docs/` directory:

- [API Draft (EN)](docs/api_DRAFT.md)
- [API Draft (DE)](docs/api_de_DRAFT.md)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
