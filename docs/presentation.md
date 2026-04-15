# Präsentationsnotizen

> [!NOTE]
> **Dauer:** ~20 Min (15 Min Vortrag + 5 Min Fragen)
> **Format:** Kein PowerPoint. Live-Walkthrough durch Doku, Code, ERD, Pipeline und App.
> **Vorbereitung:** - Datenbank zurücksetzen, GitHub-Bild integrieren - Tabs und Fenster - `README.md` (GitHub/Preview) - `dbdiagram.io` - VS Code (schemas, `.env.local`) - GitHub Actions - Live-App

## Ablauf

| #   | Topic                                                                | ~Min        | Source                                            |
| --- | -------------------------------------------------------------------- | ----------- | ------------------------------------------------- |
| 1   | Project intro + MVP                                                  | 1           | README "Über das Projekt / "                      |
| 2   | Priorities / approach                                                | 1           | README "Über das Projekt -> Prioritäten"          |
| 3   | Tech stack                                                           | 1           | README "Tech Stack"                               |
| 4   | Database schema (ERD)                                                | 3           | `dbdiagram.io` live                               |
| 5   | Architecture + project layout<br> + error handling, config, and i18n | 5           | README "Project Structure", NOTES §1.2 (services) |
| 6   | CI/CD + deployment                                                   | 3           | README "Deployment", pipeline diagram             |
| 9   | Live demo (login → admin)                                            | 2           | Live app                                          |
| 10  | Reflection + Q&A                                                     | 5           | -                                                 |
|     |                                                                      | **~16 + 5** |                                                   |

---

> [!IMPORTANT]
> **Zeit stoppen!**

- _Freut mich, dass so viele gekommen sind._
- _Bin tatsächlich etwas angespannt. Seht es mir nach..._

## 1. Projektvorstellung + Ziele (~1 Min) ⏱ spätestens 0:01

> [!IMPORTANT] Zeigen
> `README.md` "Über das Projekt"

**Anmerkungen:**

- Backend-Projekt
- Alleine gearbeitet, aber: Bezug auf Ralf
- Zweigleisig

---

## 2. Prioritäten / Herangehensweise (~1 Min) ⏱ spätestens 0:02

> [!IMPORTANT] Zeigen
> `README.md` "Über das Projekt" -> "Prioritäten"

**App-Prioritäten:**

- Backend
- CI/CD Pipeline
- App-Infrastruktur

---

## 3. Tech Stack (~1 Min) ⏱ spätestens 0:03

> [!IMPORTANT] Zeigen
> `README.md` "Tech Stack"

---

## 4. Datenbankschema (ERD) (~3 Min) ⏱ spätestens 0:06

> [!IMPORTANT] Zeigen
> `dbdiagram.io` öffnen

**Anmerkungen:**

- Credentials absichtlich in separater Tabelle (Passwort-Hash nie versehentlich in Queries/Responses)
- `public_id` (nanoid) vs. `id` (UUID) - externe API gibt nie die echte DB-ID raus
- Sessions DB-backed + Refresh Token Rotation
- `api_clients` für externen Zugriff (Klassenkamerad nutzt die API)

> [!IMPORTANT] Zeigen
> Drizzle-Schemas und TS-Typen in VS Code

---

## 4. Architektur, Projektstruktur, API-Design (~5 Min) ⏱ spätestens 0:11

> [!IMPORTANT] Zeigen
> `dbdiagram.io` öffnen

**Zeigen:** README "Project Structure", dann in VS Code die Ordnerstruktur öffnen

- Feature-driven Architektur erklären: `src/features/auth/`, `src/features/user/`, `src/features/admin/`
- Jedes Feature hat: `contracts.ts` (Zod-Schemas), `services/`, `actions/`, `components/`, `hooks/`
- Schichtenmodell zeigen: Route/Action → Service → Repository → DB
- **Dual-Channel-Ansatz:** Dieselbe Logik als Server Action (für eigenes Frontend) UND als REST API (für externe Clients)

**Dann kurz zeigen (jeweils ~30 Sek):**

- **`config/index.ts`** öffnen → Zentralisierte Konfiguration, Validierung der Env-Vars beim Start, typsicher
- **`lib/errors.ts`** öffnen → `AgoraError`-Klasse mit festen `ErrorCode`-Typen, HTTP-Mapping, einheitlich über alle Grenzen
- **`messages/en.json`** + `i18n.ts` → Internationalisierung via `next-intl`, alle UI-Texte in JSON, Deutsch + Englisch

Diagram Flow (registrieren)
Validierung -> Controller -> NutzerService -> Repo/ Datenbank
Wo Validierung, error handling etc.

Auch Flow für Login-Route?

Auch Error-Handling?

- Postman-Demo, API-Routen früher

Umstellung Sprache

- Routenübersicht kurz zeigen: 22 Endpunkte, 9 implementiert, Rest geplant
- Einheitliches Response-Format: `{ success, message, data }` bzw. `{ success, error: { code, message } }`
- **Externer Client:** Klassenkamerad konsumiert die API von einer separaten App
    - Client authentifiziert sich per API-Key + Domain-Validierung
    - Bekommt JWTs zurück, die er per JWKS-Endpunkt (`/api/auth/jwks`) verifizieren kann
    - Client-spezifische E-Mail-Links (eigene Domain + Pfad-Templates für Verify/Reset)

---

## 5. CI/CD + Deployment (~3 Min) ⏱ spätestens 0:22

**Zeigen:** GitHub → Actions → letzter erfolgreicher Run (Pipeline-Visualisierung)

- **3-Stufen-Pipeline:**
    - **Verify** (alle Branches): Lint, Typecheck, Format, Security Audit, Build
    - **Package** (nur `main`): Docker-Images bauen, zu GHCR pushen
    - **Deploy** (nur `main`): Artefakte per rsync auf VPS, Secrets generieren, Services starten, Migrationen + Bootstrap
- **Infrastruktur:** Caddy (Auto-TLS) + App (2 Replicas) + Postgres auf VPS
- **Migrator:** Ephemerer Container nach Deployment für Schema-Änderungen
- Kurz README "VPS Layout" zeigen für die Dateistruktur auf dem Server

---

## 6. Live-Demo (~4 Min) ⏱ spätestens 0:26

**Zeigen:** Live-App im Browser öffnen

1. **Landing Page** zeigen - kurz das Design und die Struktur
2. **Registrierung:** Neuen Account anlegen → Validierungsfeedback zeigen
3. **E-Mail-Verifizierung:** Bestätigungs-E-Mail zeigen (Mailtrap / echte Inbox)
4. **Login:** Mit neuem Account einloggen → Session wird erstellt
5. **Admin-Dashboard:** Als Admin einloggen → Benutzertabelle mit Paginierung, Suspend/Delete-Aktionen zeigen

Alles auch per API machbar, das ist hier quasi nur eine Mögl

> **Tipp:** Vorher einen frischen Test-Account vorbereiten. Admin-Account mit Testdaten in der DB haben. Tabs im Browser schon offen haben.

---

## 7. Reflexion + Fragen (~5 Min) ⏱ spätestens 0:30

- **Was lief gut:**
    - Sicherheitsarchitektur von Anfang an durchdacht.
    - Strukturierte Planung (`NOTES.md`, `TODO.md`) hat sich ausgezahlt.
    - CI/CD Pipeline früh aufgesetzt → sauberer Workflow.
- **Was war schwieriger als erwartet:**
    - Alles dauert immer länger als gedacht - Zeitschätzungen sind schwierig, besonders wenn man Technologien zum ersten Mal einsetzt.
    - Sicherheit ist ein unfassbar komplexes Thema. Alles selbst machen hat einen super Lerneffekt, aber dauert auch sehr lange. In der Praxis nutzt man meist fertige Libraries - das ist aber ein bewusster Trade-off, weil man dann die Interna nicht wirklich versteht.
    - CI/CD war sehr komplex aufzusetzen, ermöglicht aber super schnelles Deployment ohne darüber nachzudenken. Die Sicherheitschecks (Lint, Audit) haben sich schon während der Entwicklung ausgezahlt.
    - Ein gutes Verhältnis aus eigener Arbeit und KI-Nutzung zu finden - sicherzustellen, dass ich das Heft in der Hand behalte. Vibe Coding ist verführerisch, aber super tückisch.
- **Was würde ich anders machen / Erkenntnisse:**
    - Strukturierte Planung (`NOTES.md`, TODO.md) hat sich nicht nur ausgezahlt - sie hat das Projekt so überhaupt erst möglich gemacht.
- **Ausblick:** Backlog zeigen (Rate Limiting, MFA, Audit Logging, Mobile-Support, komplette Umstellung auf Vertical Slices - aus Zeitgründen nicht mehr geschafft)

Zu wenig Zeit, keine klaren Regeln
Nervig an Next:
Doppelrequests
Cookies, wo kann man sie setzen
Caching

learnings, pipeline nervt zwar, aber ist auch super wichtig

---

> [!IMPORTANT]
> **Fragen?**

## Klären

- Was noch aus Notizen?
- Mehrmaid on GitHub?
- Welche Tabs in VSCode offen haben?
    - `.env.local`
- Ablauf auf Deutsch übersetzen
- Libraries in Backticks
- Zeitangaben besser lösen
