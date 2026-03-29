# Präsentationsnotizen — Agora Auth

> **Dauer:** ~30 Min (25 Min Vortrag + 5 Min Fragen)
> **Format:** Kein PowerPoint. Live-Walkthrough durch Doku, Code, ERD, Pipeline und App.
> **Vorbereitung:** README.md (GitHub/Preview), dbdiagram.io, VS Code, GitHub Actions, Live-App im Browser öffnen.

---

## 1. Projektvorstellung + Ziele (~2 Min) ⏱ spätestens 0:02

**Zeigen:** NOTES.md §1.1 oder README "About the Project"

- Was ist Agora Auth? → Ein vollständiges Authentifizierungs- und Benutzerverwaltungssystem.
- Zielgruppe: moderne Webanwendungen, die eine eigene Auth-Lösung brauchen statt Third-Party-Dienste.
- MVP-Umfang kurz umreißen: Registrierung, Login, E-Mail-Verifizierung, Passwort-Reset, Admin-Dashboard, externe API für Drittanbieter.
- Kontext: Abschlussprojekt, alleine entwickelt, ~13 Arbeitstage für die Entwicklung.

---

## 2. Prioritäten / Herangehensweise (~2 Min) ⏱ spätestens 0:04

**Zeigen:** NOTES.md §1.1 "Considerations/Priorities"

- **Intentional Engineering:** Bewusst verstehen statt blind AI-Output übernehmen. AI als Multiplikator, nicht als Ersatz.
- **Production-Oriented Mindset:** Über den Happy Path hinaus — Fehlerbehandlung und Edge Cases von Anfang an.
- **Security First:** Sicherheit als Kernanforderung, nicht als Nachgedanke.
- **Clean Architecture:** Klare Trennung von Zuständigkeiten, Feature-basierte Modulstruktur.

---

## 3. Tech Stack (~2 Min) ⏱ spätestens 0:06

**Zeigen:** README "Tech Stack"

- **Next.js + React** — Framework (App Router, Server Actions, API Routes)
- **Bun** — Runtime und Package Manager (+ natives Argon2 für Password Hashing)
- **PostgreSQL + Drizzle ORM** — Datenbank mit typsicherem ORM
- **Zod** — Schema-Validierung (einmal definiert, überall genutzt: DB, API, Frontend)
- **Caddy** — Reverse Proxy mit automatischem TLS
- **Docker + GitHub Actions** — Containerisierung und CI/CD

---

## 4. Architektur + Projektstruktur (~4-5 Min) ⏱ spätestens 0:11

**Zeigen:** README "Project Structure", dann in VS Code die Ordnerstruktur öffnen

- Feature-driven Architektur erklären: `src/features/auth/`, `src/features/user/`, `src/features/admin/`
- Jedes Feature hat: `contracts.ts` (Zod-Schemas), `services/`, `actions/`, `components/`, `hooks/`
- Schichtenmodell zeigen: Route/Action → Service → Repository → DB
- **Dual-Channel-Ansatz:** Dieselbe Logik als Server Action (für eigenes Frontend) UND als REST API (für externe Clients)

**Dann kurz zeigen (jeweils ~30 Sek):**

- **`config/index.ts`** öffnen → Zentralisierte Konfiguration, Validierung der Env-Vars beim Start, typsicher
- **`lib/errors.ts`** öffnen → `AgoraError`-Klasse mit festen `ErrorCode`-Typen, HTTP-Mapping, einheitlich über alle Grenzen
- **`messages/en.json`** + `i18n.ts` → Internationalisierung via `next-intl`, alle UI-Texte in JSON, Deutsch + Englisch

---

## 5. Datenbankschema (ERD) (~3 Min) ⏱ spätestens 0:14

**Zeigen:** dbdiagram.io öffnen

- Haupttabellen durchgehen: `users`, `user_credentials`, `sessions`, `verification_tokens`, `roles`, `user_roles`, `api_clients`
- Schlüsselentscheidungen erklären:
    - Credentials absichtlich in separater Tabelle (Passwort-Hash nie versehentlich in Queries/Responses)
    - `public_id` (nanoid) vs. `id` (UUID) — externe API gibt nie die echte DB-ID raus
    - Sessions DB-backed + Refresh Token Rotation
    - `api_clients` für externen Zugriff (Klassenkamerad nutzt die API)

---

## 6. Security Deep-Dive (~3 Min) ⏱ spätestens 0:17

**Zeigen:** NOTES.md "Security Strategy", dann relevante Code-Stellen in VS Code

- **Passwort-Hashing:** Bun's natives Argon2 (aktueller Goldstandard, kein bcrypt)
- **Token-Architektur:**
    - Access Token: kurzlebiger JWT (15 Min), RS256-signiert, stateless
    - Refresh Token: opaker Hash in DB, nur in HttpOnly/Secure/SameSite=Lax-Cookie
    - Verification Tokens: einmalig, gehasht gespeichert
- **Refresh Token Rotation:** Bei jedem Refresh wird ein neuer Token ausgestellt, alter invalidiert → Token-Diebstahl sofort erkennbar
- **„Der Teufel steckt im Detail":**
    - `crypto.ts` → `verifyToken()` öffnen: `timingSafeEqual` statt `===` — verhindert Timing-Angriffe (Zeichenweises Erraten des Hashes)
    - `auth.service.ts` → Login-Flow: Dummy `Bun.password.verify()` bei unbekannter E-Mail, damit die Antwortzeit identisch ist (Enumeration Prevention)
- **Weitere Maßnahmen:** Open-Redirect-Schutz, Zod-Validierung an jeder Grenze, Cache-Safety für authentifizierte Routen

---

## 7. API-Design + externe Clients (~2 Min) ⏱ spätestens 0:19

**Zeigen:** `docs/api_DRAFT.md` — Routenübersicht-Tabelle (§7)

- Routenübersicht kurz zeigen: 22 Endpunkte, 9 implementiert, Rest geplant
- Einheitliches Response-Format: `{ success, message, data }` bzw. `{ success, error: { code, message } }`
- **Externer Client:** Klassenkamerad konsumiert die API von einer separaten App
    - Client authentifiziert sich per API-Key + Domain-Validierung
    - Bekommt JWTs zurück, die er per JWKS-Endpunkt (`/api/auth/jwks`) verifizieren kann
    - Client-spezifische E-Mail-Links (eigene Domain + Pfad-Templates für Verify/Reset)

---

## 8. CI/CD + Deployment (~3 Min) ⏱ spätestens 0:22

**Zeigen:** GitHub → Actions → letzter erfolgreicher Run (Pipeline-Visualisierung)

- **3-Stufen-Pipeline:**
    - **Verify** (alle Branches): Lint, Typecheck, Format, Security Audit, Build
    - **Package** (nur `main`): Docker-Images bauen, zu GHCR pushen
    - **Deploy** (nur `main`): Artefakte per rsync auf VPS, Secrets generieren, Services starten, Migrationen + Bootstrap
- **Infrastruktur:** Caddy (Auto-TLS) + App (2 Replicas) + Postgres auf VPS
- **Migrator:** Ephemerer Container nach Deployment für Schema-Änderungen
- Kurz README "VPS Layout" zeigen für die Dateistruktur auf dem Server

---

## 9. Live-Demo (~4 Min) ⏱ spätestens 0:26

**Zeigen:** Live-App im Browser öffnen

1. **Landing Page** zeigen — kurz das Design und die Struktur
2. **Registrierung:** Neuen Account anlegen → Validierungsfeedback zeigen
3. **E-Mail-Verifizierung:** Bestätigungs-E-Mail zeigen (Mailtrap / echte Inbox)
4. **Login:** Mit neuem Account einloggen → Session wird erstellt
5. **Admin-Dashboard:** Als Admin einloggen → Benutzertabelle mit Paginierung, Suspend/Delete-Aktionen zeigen

> **Tipp:** Vorher einen frischen Test-Account vorbereiten. Admin-Account mit Testdaten in der DB haben. Tabs im Browser schon offen haben.

---

## 10. Reflexion + Fragen (~5 Min) ⏱ spätestens 0:30

**Frei sprechen:**

- **Was lief gut:**
    - Sicherheitsarchitektur von Anfang an durchdacht.
    - Strukturierte Planung (NOTES.md, TODO.md) hat sich ausgezahlt.
    - Dual-Channel-Ansatz (Server Actions + API) ermöglicht flexible Nutzung.
    - CI/CD Pipeline früh aufgesetzt → sauberer Workflow.
    - Programmieren macht Spaß.

- **Was war schwieriger als erwartet:**
    - Alles dauert immer länger als gedacht — Zeitschätzungen sind schwierig, besonders wenn man Technologien zum ersten Mal einsetzt.
    - Sicherheit ist ein unfassbar komplexes Thema. Alles selbst machen hat einen super Lerneffekt, aber dauert auch sehr lange. In der Praxis nutzt man meist fertige Libraries — das ist aber ein bewusster Trade-off, weil man dann die Interna nicht wirklich versteht.
    - CI/CD war sehr komplex aufzusetzen, ermöglicht aber super schnelles Deployment ohne darüber nachzudenken. Die Sicherheitschecks (Lint, Audit) haben sich schon während der Entwicklung ausgezahlt.
    - Ein gutes Verhältnis aus eigener Arbeit und KI-Nutzung zu finden — sicherzustellen, dass ich das Heft in der Hand behalte. Vibe Coding ist verführerisch, aber super tückisch.

- **Was würde ich anders machen / Erkenntnisse:**
    - Strukturierte Planung (NOTES.md, TODO.md) hat sich nicht nur ausgezahlt — sie hat das Projekt so überhaupt erst möglich gemacht.

- **Ausblick:** Backlog zeigen (Rate Limiting, MFA, Audit Logging, Mobile-Support, komplette Umstellung auf Vertical Slices — aus Zeitgründen nicht mehr geschafft)

---

> **Fragen?**
