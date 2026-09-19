# System Architecture — Student & Staff Management System

This document explains the diagram in `system_architecture.png` (source: `architecture.html`, a hand-laid-out HTML/CSS reference-architecture diagram in this same folder — edit the HTML directly, then re-render). Everything below is derived from the actual codebase, not a generic template — file/folder names match what's really in `server/` and `client/`.

Read this once, and you should be able to explain the project end-to-end in an interview without notes.

---

## 1. One-paragraph summary

A role-based institutional ERP (Admin / Staff / Student) built as a **React 19 SPA** talking to a **Node.js + Express REST API**, backed by **MongoDB** via Mongoose. Authentication is stateless JWT (short-lived access token + rotating httpOnly refresh token). There is no server-rendering, no microservices, no message queue — it's a classic 3-tier monolith (client / API / database), plus a couple of well-scoped side-processes (a daily cron backup job, and outbound email for password resets). That simplicity is a deliberate, defensible choice for this project's scale, not an oversight.

---

## 2. Client Tier — React 19 + Vite (the Browser)

Everything here runs in the user's browser as a single-page app; there is **no server-side rendering**.

- **Routing (`react-router-dom` v7):** entry point is `RoleSelect` (pick Admin/Staff/Student) → `/login/:role` → on success, the user lands inside a role-specific nested route tree (`/admin/*`, `/staff/*`, `/student/*`). `ProtectedRoute` is the gatekeeper component: it checks `AuthContext` for a logged-in user, checks the role matches the route, and — importantly — forces a redirect to the first-login password screen if `mustChangePassword` is still true, no matter what page was requested.
- **Global state is just two React Contexts**, not Redux/Zustand: `AuthContext` (current user, access token — kept in memory only, never localStorage) and `ThemeContext` (light/dark, persisted to `localStorage`).
- **Layouts** (`AdminLayout`, `StaffLayout`, `StudentLayout`) wrap every page in that role's section: a grouped sidebar (e.g. Admin's is split into People / Academics / Communication / Insights / System), a topbar with a live clock, theme toggle, and the notification bell.
- **Feature pages** are organized by domain under `pages/admin`, `pages/staff`, `pages/student` — Students, Staff, Academic Structure, Attendance, Timetable, Exams, Leave, OD Requests, Announcements, Reports, etc.
- **Shared component library** (`components/common`): a generic `DataTable` (search/sort/paginate), `Modal`/`ConfirmDialog`, and hand-built SVG chart components (`DonutChart`, `BarChart`) — there's no charting library dependency; colors follow a small fixed palette system (`utils/chartColors.js`) so a category (e.g. "Absent") always renders the same color regardless of API response order.
- **In-app Documentation** (`pages/docs`): static, per-role help content with real screenshots, captured by a Playwright script (`client/scripts/captureDocs.mjs`) — a dev tool, not a runtime dependency.
- **API client (`services/api.js`):** a single Axios instance. A request interceptor attaches `Authorization: Bearer <accessToken>`. A response interceptor catches `401`s, calls `/auth/refresh` once (using the httpOnly cookie, invisible to JS), and transparently retries the original request — so a page reload or an expired access token never logs the user out unless the refresh token itself is also invalid.

## 3. Application Tier — Node.js + Express (`server/`)

A request that leaves the Axios client arrives at `server/app.js` and flows through a fixed pipeline:

1. **Middleware pipeline** — `helmet()` (security headers), `cors()` locked to `CLIENT_URL` with `credentials: true` (required for the httpOnly cookie to work cross-origin in dev), `morgan` request logging, `express.json()`, `cookie-parser`, and a global `express-rate-limit` (300 req/15min/IP) applied to all of `/api`.
2. **Auth & access middleware**, composed per-route:
   - `authenticate` — verifies the JWT signature *and* re-fetches the user from MongoDB on every single request to check they're still `ENABLED` (not disabled/locked since the token was issued). This is the answer to "how do you handle a revoked user with a still-valid token" — you don't trust the token's claims for authorization state, only for identity.
   - `restrictTo(role)` — role-based authorization (ADMIN / STAFF / STUDENT).
   - `requirePasswordChanged` — blocks every route except the password-change endpoints themselves until a first-login user sets a real password.
   - `validate(zodSchema)` — request body validation via [Zod](https://zod.dev/), same validation library used on the frontend forms.
3. **Routes → Controllers → Services.** Routing is intentionally thin: 22 Express route files just wire `path + middleware + controller`. Controllers are thin HTTP adapters (parse `req`, call a service function, shape the `{ success, message, data }` / `{ success:false, message, errors }` response). **All business logic lives in the service layer** — this is the layer you'd point to in an interview when asked "where would you write a new feature."
4. **Cross-cutting utilities**, used by services rather than sitting in the request pipeline: JWT sign/verify (`utils/jwt.js`), `bcryptjs` password hashing, an **Activity Logger** that every mutating service call writes to (`ActivityLog` collection — the audit trail), `Multer` for the one file-upload flow (OD proof documents), and a Nodemailer wrapper for OTP emails.
5. **Centralized error handling** — every controller is wrapped in `asyncHandler`, so a thrown `ApiError`, a Zod validation error, or a raw Mongoose error (duplicate key, cast error) all funnel into one error middleware that normalizes them into the same JSON error shape. No route hand-rolls its own try/catch.

### The 22 routes, grouped into 6 domains

| Domain | Routes | Represents |
|---|---|---|
| Identity & Access | `/auth`, `/students`, `/staff` | login/OTP-reset, Admin-only account creation |
| Academic Structure | `/academic-years`, `/classes`, `/sections`, `/subjects`, `/enrollments`, `/teacher-assignments` | the institutional hierarchy |
| Attendance, Timetable & OD | `/attendance`, `/timetable`, `/od-requests` | daily operations |
| Examinations | `/exams`, `/exam-schedules`, `/results` | grading workflow |
| Communication | `/leaves`, `/announcements`, `/notifications` | cross-role messaging |
| Reports & Administration | `/reports`, `/promotions`, `/activity-logs`, `/backups` | analytics & ops |

## 4. Data Tier

- **MongoDB via Mongoose**, 23 collections. A few patterns worth knowing cold for an interview:
  - **`Counter`** — a tiny collection used to atomically generate sequential human-readable IDs (`STU0001`, `STF0001`, …) instead of exposing Mongo's `ObjectId`.
  - **`Enrollment` is append-only.** Promoting a student to the next year never edits the old enrollment row — it inserts a new one and marks the old one `PROMOTED`/`RETAINED`/etc. This is how the system preserves full academic history rather than overwriting a "current class" field.
  - **`RefreshSession`** stores a hash of every issued refresh token, so logout / password-change / admin-disable can *revoke* sessions server-side — a stateless JWT alone can't be revoked, this table is what makes revocation possible.
  - **`PasswordResetOTP`** stores only a salted hash of the OTP, with an expiry and attempt counter — the raw code only ever exists in the email.
- **Local disk** — two directories, not cloud storage: `server/uploads/od-proofs` (student-submitted OD proof documents, served back out via a static Express route) and `server/backups` (see below).

## 5. Scheduled Jobs

A single `node-cron` job (`server/jobs/backupJob.js`) runs daily at 02:00: it dumps every MongoDB collection to a timestamped JSON file in `server/backups` and records the run in the `BackupRecord` collection. Admins can also trigger the same job on demand from the Backup page. This is a pragmatic, dependency-free backup strategy — not `mongodump`, just a Mongoose-level JSON export — which is a reasonable tradeoff to be upfront about if asked.

## 6. External Integration — Email (the only external service)

Password-reset OTPs are sent via **Nodemailer**. If `SMTP_HOST` is configured in `.env`, it sends real email through whatever provider you configure (Gmail, etc.). If it's *not* configured, the OTP is logged to the server console instead of failing — a deliberate dev-mode fallback so the whole reset flow is testable with zero external setup. This is the **only** third-party integration in the system: no payment gateway, no SMS, no cloud storage, no analytics SDK.

---

## 7. End-to-end request flow (a concrete example)

Walking through **"a staff member marks a student present"** exercises almost every layer:

1. Staff logs in at `/login/staff` → `POST /api/auth/login` → server checks account status/lockout, compares the bcrypt hash, issues an access token (returned in the JSON body) and a refresh token (set as an httpOnly cookie), logs `LOGIN_SUCCESS` to `ActivityLog`.
2. `AuthContext` stores the access token in memory; the client navigates to the Staff dashboard.
3. Staff opens **Attendance**, picks a subject/section/date. The page calls `attendanceService.getRoster(...)` → Axios attaches the Bearer token → request hits `GATEWAY → AUTHZ (authenticate, restrictTo('STAFF'))`.
4. The route's controller calls the `attendance.service`, which queries `Enrollment` + `TeacherAssignment` (confirming this staff member is actually assigned to this subject/section — never trust the client) and returns the student roster.
5. Staff marks statuses and submits → `POST /api/attendance` → same middleware chain → the service upserts `Attendance` documents, writes an `ActivityLog` entry, and — if this was actually an OD-approval path — also fires an in-app `Notification` to the student.
6. Response bubbles back as `{ success: true, data: {...} }` → Axios resolves normally (or, if the access token had expired mid-session, the response interceptor would have caught a `401`, silently called `/auth/refresh`, and retried step 5 automatically).
7. The Attendance page updates its state and re-renders — no full page reload anywhere in this flow.

## 8. Authentication & Authorization — the likely interview deep-dive

- **No public registration.** The only way any account is created is by an Admin (or the one-time `seed:admin` script for the very first Admin). Every created account gets an auto-generated ID and a system-generated temporary password, shown to the Admin exactly once.
- **Two tokens, two lifetimes.** Access token: short-lived (minutes), sent in the `Authorization` header, never persisted client-side (memory only — immune to XSS-driven localStorage theft). Refresh token: longer-lived (days), httpOnly + `SameSite` cookie (invisible to JS — immune to XSS token theft), rotated on every use, and its hash is stored server-side in `RefreshSession` so it can be revoked.
- **Revocation, not just expiry.** Disabling a user, forcing a password reset, or the user changing their own password all revoke every outstanding `RefreshSession` for that user immediately — they don't have to wait for the token to expire.
- **Every request re-validates live status**, not just the token signature — see `authenticate` in section 3. This is the difference between "the token is valid" and "the user is still allowed to be logged in," and it's a common gap in naive JWT implementations that this project deliberately closes.
- **Self-service password reset (OTP)** is a separate, unauthenticated flow from the above: request OTP → verify OTP (issues a short-lived, single-purpose signed token, distinguished by a `type: 'password_reset'` JWT claim so it can't be reused as a session token) → reset password with that token. Rate-limited at every step.
- **Admins can never view an existing password** — only bcrypt hashes are stored, which are one-way by design. Admin "reset" always means *issuing a brand new temporary password*, never revealing the old one.

---

## 9. Regenerating the diagram

```bash
cd client
node scripts/renderArchitectureHtml.mjs
```

This opens `docs/architecture/architecture.html` in headless Chromium (via the Playwright browser already installed for the docs-screenshot tool) and screenshots it at 2x resolution, overwriting `system_architecture.png`. The diagram is a hand-laid-out HTML/CSS page (not an auto-layout graph tool), styled after standard layered reference-architecture diagrams — edit the HTML/CSS directly and re-run any time the architecture changes.
