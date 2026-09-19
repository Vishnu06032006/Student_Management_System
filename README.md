# Student & Staff Management System

Role-based institutional ERP: React (Vite) client + Express/MongoDB server. Roles: ADMIN, STAFF, STUDENT.

## Structure

- `client/` — Vite + React frontend
- `server/` — Express + MongoDB (Mongoose) backend

## Getting started

```bash
# Server
cd server
cp .env.example .env   # set MONGO_URI, JWT secrets, ADMIN_* seed credentials
npm install
npm run seed:admin     # bootstraps the first Admin account (one-time)
npm run dev

# Client (new terminal)
cd client
cp .env.example .env
npm install
npm run dev
```

Server health check: `GET /api/health`

## What's implemented

**Foundation & security**
- No public registration — the only way to get the first account is `npm run seed:admin`; every account after that is Admin-created with an auto-generated ID (STU0001, STF0001...) and an auto-generated temporary password shown once.
- JWT auth: short-lived access token kept in memory on the client, refresh token in an httpOnly cookie, rotated on every refresh. Every authenticated request re-checks the user's live status, so disabling/locking an account revokes access immediately, not just on next login.
- Forced first-login password change, 5-attempt lockout with 15-minute auto-unlock, bcrypt(js) hashing, Zod validation everywhere, centralized error handling.

**Student & Staff management** — full CRUD, search/filter/sort/paginate, enable/disable, admin-driven password reset, staff workload view.

**Academic structure** — Academic Years (with single-active enforcement), Classes, Sections, Subjects, Enrollment (append-only history — promotion never overwrites a past year's record), Teacher Assignment (with one-class-teacher-per-section rule).

**Attendance & Timetable** — subject-wise attendance marking (bulk, per class/section/subject/date), 75% eligibility threshold with GOOD/WARNING/CRITICAL levels, shortage reports; weekly timetable with teacher/class/room conflict detection.

**Exams & Results** — exam lifecycle (DRAFT → PUBLISHED → ONGOING → COMPLETED → LOCKED), exam schedules per class/subject, marks entry restricted to the assigned teacher (Admin can always correct, even on a locked exam), automatic grading (A+ through F) and pass/fail, results only visible to students once an exam is COMPLETED/LOCKED.

**Communication** — leave requests (apply/approve/reject/cancel) with notifications on decision, announcements with audience targeting (all / all students / all staff / class / section) and automatic notification fan-out, an in-app notification bell with unread counts.

**Reports & Analytics** — class performance (average/highest/lowest/pass-fail) and subject performance per exam, and a transparent (non-ML) "needs attention" flag: attendance < 75%, or average marks < 40%, or 2+ failed subjects.

**Administration** — bulk student promotion/retention/transfer/graduation (creates a new Enrollment, never mutates the old one), full activity/audit log viewer, manual + scheduled (daily, via `node-cron`) database backup as portable JSON dumps with history.

## Known gaps (deliberately deferred, not oversights)

- **Teacher substitution** (spec section 52) is not built — the Timetable/TeacherAssignment data model supports it, but the "find a free substitute" workflow and UI were not implemented.
- **No automated test suite.** Every feature above was verified manually via curl (documented in the assistant's session) and frontend build/lint checks, but there's no `npm test` yet. Add Jest + Supertest for the backend and React Testing Library for the frontend before treating this as production-ready.
- **No real email/SMTP integration.** Nodemailer isn't wired in; notifications are in-app only. Temporary passwords and leave/announcement notifications are shown in-app, not emailed.
- **No file/photo upload.** Student/staff profile `photoUrl` and document fields exist but nothing populates them (Multer isn't wired in).
- **No production deployment config** (Vercel/Render/env-specific build steps) — this has only been run locally.
- Reports use plain HTML/CSS bars instead of a charting library (Chart.js/Recharts) to avoid an extra dependency for a single view; swap in a real chart library if richer visualizations are needed.

## Notes for future work

- Password hashing uses `bcryptjs` (pure JS) instead of `bcrypt`, to avoid native-module build issues on Windows dev machines — same algorithm, same guarantees.
- The attendance eligibility threshold (75%) is centralized in `server/utils/constants.js` so it can be wired to a future System Settings module instead of being hardcoded everywhere.
- Mongoose aggregation pipelines require explicit `new mongoose.Types.ObjectId(...)` casts on `$match` — a real bug was caught and fixed here during development (plain `find()` casts automatically; `aggregate()` does not).
