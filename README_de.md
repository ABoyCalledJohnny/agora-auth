# Agora Auth

![Badge: Latest Release](https://img.shields.io/github/v/release/ABoyCalledJohnny/agora-auth)
![Badge: Last Commit](https://img.shields.io/github/last-commit/ABoyCalledJohnny/agora-auth)

> [!WARNING]
> **Aktive Entwicklung**
> Die **Kern-Authentifizierungslogik** (API-Routen, Server Actions, Zod-Schemas, Datenbankmodelle und typsichere Wrapper) ist weitgehend implementiert. Das Projekt konzentriert sich derzeit auf die Fertigstellung der Frontend-UI und die Anbindung von externen Benachrichtigungs-Diensten.

Eine robuste, sichere und moderne Authentifizierungs- und Benutzerverwaltungs-Lösung, die mit Next.js, Drizzle ORM und PostgreSQL entwickelt wurde.

## Inhaltsverzeichnis

- [Agora Auth](#agora-auth)
    - [Inhaltsverzeichnis](#inhaltsverzeichnis)
    - [Über das Projekt](#über-das-projekt)
        - [Hauptfunktionen (Geplant)](#hauptfunktionen-geplant)
    - [Tech-Stack](#tech-stack)
    - [Voraussetzungen](#voraussetzungen)
    - [Erste Schritte (In Arbeit)](#erste-schritte-in-arbeit)
    - [Konfiguration](#konfiguration)
    - [Deployment](#deployment)
    - [Projektstruktur](#projektstruktur)
    - [Entwicklungs-Workflow](#entwicklungs-workflow)
        - [Nützliche Befehle](#nützliche-befehle)
    - [Roadmap \& Dokumentation](#roadmap--dokumentation)
    - [Lizenz](#lizenz)

---

## Über das Projekt

Agora Auth ist eine umfassende Authentifizierungslösung, die für moderne Webanwendungen entwickelt wurde. Sie basiert auf Next.js Server Actions, Drizzle ORM und PostgreSQL, um ein sicheres und skalierbares Identitätsmanagementsystem bereitzustellen.

Das Ziel ist es, eine solide Grundlage für Benutzerregistrierung, Login, Profilverwaltung und sichere API-Interaktionen zu schaffen, wobei bewährte Sicherheitspraktiken wie HTTP-only-Cookies und strenge Eingabevalidierung höchste Priorität haben.

### Hauptfunktionen (Geplant)

- **Zustandslose JWT-Zugriffstoken:** In Kombination mit datenbankgestützten Sitzungen.
- **Sicheres Passwort-Hashing:** Unter Verwendung von Buns nativem Argon2.
- **Granulare Berechtigungen:** Unterscheidung zwischen öffentlichen und privaten Benutzerdaten mit rollenbasierter Zugriffskontrolle.
- **Admin-Dashboard:** Benutzeroberfläche zur Benutzerverwaltung (Auflisten, Sperren, Löschen von Konten).
- **Externe Client-API:** Sichere dienstübergreifende Verifizierung mittels RS256-Token-Signierung und einem öffentlichen JWKS-Endpunkt.

---

## Tech-Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Runtime & Tooling:** Bun
- **Datenbank:** PostgreSQL
- **ORM:** Drizzle ORM
- **Validierung:** Zod

---

## Voraussetzungen

- **Betriebssystem:** Linux, macOS oder Windows (via WSL) für die Entwicklung
- **Containerisierung:** Docker & Docker Compose
- **Runtime:** Bun

---

## Erste Schritte (In Arbeit)

> [!WARNING]
> **Projektstatus:** Während die wichtigsten Authentifizierungs-Endpunkte (Login, Registrierung, Refresh, Verifizierung, Passwort-Reset) funktionsfähig sind, befinden sich Frontend-UI-Integrationen, Admin-Abläufe und E-Mail-Benachrichtigungen noch in der aktiven Implementierung.

Aktuell verwendetes Mindest-Setup für die lokale Entwicklung in diesem Repository:

```bash
bun install
bun run docker:up
bun run dev
```

> [!NOTE]
> `bun run dev` startet bereits `docker:up`, bevor Next.js ausgeführt wird. Ein manueller `docker:up`-Schritt ist optional, wenn die lokalen Container bereits laufen.

---

## Konfiguration

Die Anwendung wird über Umgebungsvariablen und eine zentralisierte Konfigurationsdatei unter `src/config/index.ts` konfiguriert.

Für eine detaillierte Aufschlüsselung aller Umgebungsvariablen, Secrets und deployment-spezifischen Konfigurationen siehe bitte die Datei **[NOTES.md](NOTES.md)**.

Wichtige Umgebungsvariablen umfassen:

- `APP_ENV`, `APP_URL`
- Datenbank-Anmeldeinformationen (`DB_HOST`, `DB_PORT`, `POSTGRES_DB`, `APP_DB_USER`, `APP_DB_PASSWORD`)
- Authentifizierungsschlüssel (`JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`)
- SMTP-Einstellungen für den E-Mail-Versand (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`)

---

## Deployment

> [!IMPORTANT]
> Diese Anwendung ist mit einer hochspezifischen CI/CD-Pipeline und Infrastruktur ausgestattet, die auf eine benutzerdefinierte VPS-Umgebung mit Caddy und Docker zugeschnitten ist.
>
> **Sie ist nicht darauf ausgelegt, out-of-the-box von anderen bereitgestellt zu werden.** Ein unabhängiges Deployment dieses Systems würde umfangreiche Änderungen am Docker-Setup, an den Konfigurationsdateien und an den Bereitstellungspipelines erfordern, an denen derzeit aktiv gearbeitet wird.

Aktuelle Struktur des VPS-Deployment-Artefakts (vereinfacht):

```text
deployment/
    app_build/
        server.js
        package.json
        node_modules/
        .next/
            server/
            static/
            BUILD_ID
            app-path-routes-manifest.json
            build-manifest.json
            package.json
            prerender-manifest.json
            required-server-files.json
            routes-manifest.json
        public/
            robots.txt
            ...
    docker/
        app/
            Dockerfile
        migrator/
            Dockerfile
        postgres/
            init-db.sh
        caddy/
            Caddyfile
    compose.yaml
    compose.production.yaml
    compose.caddy.yaml
    .env
    .env.production
    .env.secrets.production.app
    .env.secrets.production.postgres
    .env.secrets.production.migrator
```

---

## Projektstruktur

Das Projekt folgt einer feature-getriebenen, modularen Struktur, die auf dem Next.js App Router aufbaut:

```bash
.
├── docker/                 # Infrastruktur und Docker-Konfiguration
│   ├── app/                # Dockerfile der Anwendung
│   ├── caddy/              # Caddy Reverse-Proxy-Konfiguration
│   ├── migrator/           # Skript zur Datenbankmigration
│   └── postgres/           # Skripte zur Datenbankinitialisierung
├── docs/                   # API-Dokumentation und Entwürfe
├── drizzle/                # Ausgabe der Datenbankmigrationen
├── messages/               # Übersetzungsdateien (i18n)
├── public/                 # Statische Ressourcen (robots.txt, etc.)
└── src/                    # Quellcode der Anwendung
    ├── app/                # Next.js App Router (Layout, Seiten und API-Routen)
    ├── components/         # Gemeinsam genutzte UI-Komponenten (Layout, Formulare, Tabellen)
    ├── config/             # Zentralisierte Anwendungs- und Umgebungskonfiguration
    ├── db/                 # Datenbankverbindung, Schemas und Seeding-Skripte
    ├── features/           # Feature-gesteuerte Logik (Auth, User, Admin)
    │   └── [feature]/      # Jedes Feature enthält spezifische Grenzen (Contracts, Dokumentation, Services, UI)
    │       ├── actions/    # Next.js Server Actions
    │       ├── components/ # Feature-spezifische UI-Komponenten
    │       ├── hooks/      # Feature-spezifische React-Hooks
    │       ├── services/   # Geschäftslogik und externe Aufrufe
    │       ├── contracts.ts# Zod-Validierungsschemata und DTOs
    │       ├── index.ts    # Öffentliche Feature-Exports
    │       └── types.ts    # TypeScript-Definitionen
    ├── hooks/              # Gemeinsam genutzte React-Hooks
    ├── lib/                # Kernfunktionen, Validierung und Wrapper
    ├── providers/          # Globale React-Context-Provider
    ├── repositories/       # Datenzugriffsschicht (Repositories)
    ├── i18n.ts             # Internationalisierungs-Setup
    ├── proxy.ts            # Proxy-Konfiguration
    └── types.ts            # Globale TypeScript-Definitionen
```

---

## Entwicklungs-Workflow

> [!NOTE]
> Die grundlegende Entwicklungsumgebung wurde etabliert. Mit zentralen Bun-Skripten lassen sich Datenbank-Migrationen, Typprüfungen, Formatierungen sowie der Next.js-Entwicklungsserver im Verbund mit dem lokalen Docker-Netzwerk nahtlos ausführen.

Die aktuellen Next.js- und Bun-Skripte in der `package.json` unterstützen bereits unter anderem folgende Operationen:

- Initialisierung der Datenbank und Ausführen von Drizzle-Migrationen.
- Entwicklung von Frontend/Backend mit dem Next.js-Entwicklungsserver.
- Formatierung und Typprüfung der Codebasis (via Prettier, ESLint und `bun typecheck`).

### Nützliche Befehle

| **Befehl**            | **Beschreibung**                                                   |
| --------------------- | ------------------------------------------------------------------ |
| `bun run dev`         | Startet Docker-Dienste und führt danach `next dev --turbopack` aus |
| `bun run build`       | Baut die Anwendung für die Produktionsumgebung                     |
| `bun run db:generate` | Generiert Drizzle SQL-Migrationen basierend auf Schema-Änderungen  |
| `bun run db:migrate`  | Wendet ausstehende Datenbankmigrationen an                         |
| `bun run db:push`     | Sendet Schema-Änderungen direkt an die Datenbank                   |
| `bun run db:studio`   | Öffnet Drizzle Studio zur Inspektion der Datenbank                 |
| `bun run db:reset`    | Setzt die Datenbank zurück und führt Seed-Skripte aus              |
| `bun run typecheck`   | Führt die TypeScript-Typprüfung im gesamten Projekt aus            |
| `bun run verify`      | Führt Linting, Typecheck und Format-Checks aus                     |
| `bun run docker:up`   | Startet die benötigten Docker-Container                            |
| `bun run docker:stop` | Stoppt die Docker-Container                                        |

---

## Roadmap & Dokumentation

Die vollständige Roadmap des Projekts, detaillierte Funktionsbeschreibungen und das Implementierungs-Backlog werden in der **[TODO.md](TODO.md)** festgehalten.
Alle Designentscheidungen, Architektur-Skizzen, Logikabläufe und Strategien zur Fehlerkonfiguration werden in den **[NOTES.md](NOTES.md)** dokumentiert.

Zusätzlich sind Entwürfe zur API-Dokumentation im Verzeichnis `docs/` zu finden:

- [API-Entwurf (EN)](docs/api_DRAFT.md)
- [API-Entwurf (DE)](docs/api_de_DRAFT.md)

---

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Weitere Details sind in der [LICENSE](LICENSE)-Datei zu finden.
