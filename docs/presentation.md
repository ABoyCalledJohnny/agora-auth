# Präsentationsnotizen

> [!NOTE]
> **Dauer:** ~20 Min (15 Min Vortrag + 5 Min Fragen)
> **Format:** Kein PowerPoint. Live-Walkthrough durch Doku, Code, ERD, Pipeline und App.
> **Vorbereitung:**
>
> - [x] Dev-Server starten
> - [x] Datenbank zurücksetzen, GitHub-Bild integrieren
> - [x] Tabs und Fenster vorbereiten
> - [x] Zoom anpassen
> - [x] Tab und Code Ralf

## Ablauf

| #   | Thema                          | ~Min        | Quelle                                                                                                                                                                       |
| --- | ------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Projektvorstellung + MVP       | 1           | README "Über das Projekt"                                                                                                                                                    |
| 2   | Prioritäten / Herangehensweise | 1           | README "Über das Projekt -> Prioritäten"                                                                                                                                     |
| 3   | Tech-Stack                     | 1           | README "Tech-Stack"                                                                                                                                                          |
| 4   | Struktur Präsentation          | 1           | -                                                                                                                                                                            |
| 5   | Datenbankschema (ERD)          | 3           | `dbdiagram.io`, `users.ts`<br>                                                                                                                                               |
| 6   | Projektarchitektur, API-Design | 5           | README "Projektstruktur" + "Registrierungsablauf", `docs/api_de.md`<br>Code: `contracts.ts`, `validation.ts`, `route.ts`, `auth.service.ts`, `user.repository.ts`<br>Postman |
| 7   | Frontend                       | 2           | Live-App (VPS + `localhost`), `.env.development`, Spracheinstellungen                                                                                                        |
| 8   | CI/CD                          | 2           | README "Deployment", GitHub Action Tab                                                                                                                                       |
| 9   | Reflexion + Fragen             | 5           | README "Reflexion" + Roadmap                                                                                                                                                 |
|     |                                | **~16 + 5** |                                                                                                                                                                              |

---

> [!IMPORTANT]
> **Zeit stoppen!**

- _Freut mich, dass so viele gekommen sind._
- _Bin tatsächlich etwas nervös. Seht es mir nach..._
- _Will gar keine weitere Zeit verlieren, Zeit ist knapp._
- _Wenn Fragen sind, ihr nicht mehr hinterherkommt, gerne bescheid geben..._

## 1. Projektvorstellung + MVP

> [!IMPORTANT] Zeigen
> GitHub: `README.md` "Über das Projekt"

**Anmerkungen:**

- _Wir haben in der Fortbildung immer wieder mit Authentifizierung und Nutzereingaben gearbeitet, aber..._
- _Da rein, wo es wehtut..._

- _MVP nicht vergessen_
- _Backend-Projekt: Augenmerk auf Backend-Funktionalität, CI/CD Pipeline und App-Infrastruktur_
- _Hoffe, es wird trotzdem nicht zu langweilig_
- _Alleine gearbeitet, aber: Bezug auf Ralf_
- _Zweigleisig_

> [!IMPORTANT] Zeitrahmen
>
> - Dauer: **~1 Min**
> - Fertig: **spätestens 0:01**

---

## 2. Prioritäten / Herangehensweise

> [!IMPORTANT] Zeigen
> GitHub: `README.md` "Über das Projekt" -> "Prioritäten"

> [!IMPORTANT] Zeitrahmen
>
> - Dauer: **~1 Min**
> - Fertig: **spätestens 0:02**

---

## 3. Tech Stack

> [!IMPORTANT] Zeigen
> GitHub: `README.md` "Tech Stack"

**Anmerkungen:**

- Kurz halten, Deployment-Sachen erst später erwähnen

> [!IMPORTANT] Zeitrahmen
>
> - Dauer: **~1 Min**
> - Fertig: **spätestens 0:03**

---

## 4. Struktur Präsentation

- _Datenbankschemas_
- _Projektarchitektur und API-Design_
- _Frontend_
- _CI/CD_
- _Reflexion/Fragen_

> [!IMPORTANT] Zeitrahmen
>
> - Dauer: **~1 Min**
> - Fertig: **spätestens 0:04**

---

## 5. Datenbankschema (ERD)

> [!IMPORTANT] Zeigen
>
> - Browser: `dbdiagram.io`
> - VS Code: `users.ts`

**Anmerkungen:**

- _Hab überall Zoom an, sagt bescheid, wenn es trotzdem zu klein ist._

ERD:

- _Credentials absichtlich in separater Tabelle (Passwort-Hash nie versehentlich in Queries/Responses)_
- _`public_id` (`nanoid`) vs. `id` (UUID) - externe API gibt nie die echte DB-ID raus_
- _Sessions DB-backed + Refresh Token Rotation_
- _`api_clients` für externen Zugriff (Klassenkamerad nutzt die API)_

Schema:

- _Lasst euch von der Wand aus Code nicht erschlagen..._
- _TS-Typen werden aus Drizzle-Schemas abgeleitet._

> [!IMPORTANT] Zeitrahmen
>
> - Dauer: **~3 Min**
> - Fertig: **spätestens 0:07**

---

## 6. Projektarchitektur, API-Design

> [!IMPORTANT] Zeigen
>
> - GitHub: `README.md` "Projektstruktur" + "Registrierungsablauf"
> - GitHub: `docs/api_de.md`
> - Code: `contracts.ts`, `validation.ts`, `route.ts`, `auth.service.ts`, `user.repository.ts`
> - Postman

**Anmerkungen:**

- _Allgemeine und feature-driven Architektur erklären: `src/features/auth/`, `src/features/user/`, `src/features/admin/` (`README.md`)_
- _Routen zeigen (`docs/api_de.md`)_
- _Schichtenmodell zeigen: Route/Action → Service → Repository → DB_ (`README.md`)\_
    - _Dieselbe Logik als Server Action (für eigenes Frontend) UND als REST API (für externe Clients)_
    - _Andere Features und Routen funktionieren ähnlich._
    - _Route im Code nachzeichnen:_
        - _Auch hier Ordnung nach Features_
        - _Validierung zeigen_
        - _Route zeigen_
        - _Service zeigen_
        - _Repository zeigen_
- _Mini Postman-Demo_
    - _Falsche Daten (Nutzer existiert schon, keine E-Mail, Passwortregeln)_
    - _Neuen Nutzer anlegen, zeige ich gleich im Frontend._
- _Nicht zu viel Backend zeigen, aber das ist vielleicht noch interessant: _`messages/en.json` + `i18n.ts` → Internationalisierung via `next-intl`, alle UI-Texte in JSON, Deutsch + Englisch\_
    - _Mit KI super einfach möglich, neue Sprachen anzulegen._

> [!IMPORTANT] Zeitrahmen
>
> - Dauer: **~5 Min**
> - Fertig: **spätestens 0:12**

---

## 7. Frontend

> [!IMPORTANT] Zeigen
>
> - Browser: Live-App VPS
> - Browser: Live-App on `localhost`
> - VS Code: `.env.development`
> - Browser: Spracheinstellungen

**Zeigen:**

1. Landing Page
2. Login
3. Wechsel auf `localhost`, `.env.development` zeigen: _Will jetzt nicht die Testaccounts bearbeiten_
4. Admin-Dashboard
    - Neuen Nutzer zeigen
    - Nutzer verwalten
    - Mich selbst löschen
5. Sprache umstellen

**Anmerkungen:**

- _Alles auch per API machbar, das ist hier quasi nur eine Möglichkeit_

> [!IMPORTANT] Zeitrahmen
>
> - Dauer: **~2 Min**
> - Fertig: **spätestens 0:14**

---

## 8. CI/CD

> [!IMPORTANT] Zeigen
> GitHub: `README.md` "Deployment"
> GitHub: Repo Action

**Zeigen:**

1. "Deployment" (`README.md`)
2. GitHub Action Tab -> In die drei Schichten kurz reinklicken.

**Anmerkungen:**

- _Kann durchaus auch mal länger dauern._

> [!IMPORTANT] Zeitrahmen
>
> - Dauer: **~2 Min**
> - Fertig: **spätestens 0:16**

---

## 9. Reflexion + Fragen

> [!IMPORTANT] Zeigen
> GitHub: `README.md` "Reflexion"
> GitHub: `README.md` "Roadmap"

**Anmerkungen:**

- _Habt ihr noch Fragen?_
- _Bei Ralf, DCI (Duygu, Luisa) und Teilnehmer:innen bedanken._

> [!IMPORTANT] Zeitrahmen
>
> - Dauer: **~5 Min**
> - Fertig: **spätestens 0:21**
