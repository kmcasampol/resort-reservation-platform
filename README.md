# Solara Azure — Resort Reservation Platform

A full-stack resort reservation system built with **Next.js 16 (App Router)**, **React 19**,
**Tailwind CSS v4**, **Prisma 6 + SQLite**, and **TypeScript**.

Guests can browse accommodations, filter by type / party size / nightly rate, submit a
reservation with add-on amenities, and retrieve a printable receipt by booking code.
Administrators manage reservations, occupancy, units, and amenities from a protected console.

The full functional specification lives in [`agent.md`](./agent.md).

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file (see "Environment variables" below)
#    .env  ->  DATABASE_URL="file:./dev.db"
#              SESSION_SECRET="<random string, 16+ chars>"

# 3. Create the database schema
npm run db:migrate        # or: npm run db:push

# 4. Load sample data
npm run seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable         | Required | Notes |
| ---------------- | -------- | ----- |
| `DATABASE_URL`   | Yes      | `file:./dev.db`. Prisma resolves this **relative to `prisma/`**, so it points at `prisma/dev.db`. |
| `SESSION_SECRET` | Prod     | HMAC key for the `resort_admin_token` session cookie. Must be ≥ 16 chars; the app **throws at startup** in production if it is missing. Local dev falls back to a fixed dev value. |

`.env*` files are git-ignored — never commit them.

### Demo credentials

| Role  | Email             | Password   |
| ----- | ----------------- | ---------- |
| Admin | `admin@resort.com` | `admin123` |

Admin console: [/admin](http://localhost:3000/admin)

---

## Useful scripts

| Command               | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `npm run dev`         | Start the dev server (Turbopack)              |
| `npm run build`       | Production build                              |
| `npm run start`       | Serve the production build                    |
| `npm run lint`        | ESLint                                        |
| `npm run typecheck`   | `tsc --noEmit`                                |
| `npm run seed`        | Reset and seed sample data                    |
| `npm run db:migrate`  | Create/apply a dev migration                  |
| `npm run db:deploy`   | Apply committed migrations (CI / production)  |
| `npm run db:push`     | Sync schema without a migration file          |
| `npm run db:studio`   | Prisma Studio                                 |

---

## Project structure

```
prisma/
  schema.prisma        # User, Accommodation, Amenity, Reservation, ReservationItem, Payment, Review
  migrations/          # Committed baseline (0_init)
  seed.ts
src/
  actions/             # Server Actions (booking, admin, auth) — every one re-checks auth
  app/                 # App Router routes (/, /receipt/[code], /admin/*)
  components/          # Shared UI
  lib/                 # prisma client, session signing, admin guards
  proxy.ts             # Next 16 proxy — HTTP redirect for unauthenticated /admin traffic
  types/               # Shared TS types
```

### Route map

| Route                  | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `/`                    | Landing page, catalog, booking + lookup modals |
| `/receipt/[code]`      | Printable reservation receipt (public)         |
| `/admin/login`         | Admin sign-in                                  |
| `/admin`               | Dashboard, KPIs, occupancy band                |
| `/admin/reservations`  | Search / filter / status transitions           |
| `/admin/calendar`      | Monthly occupancy calendar                     |
| `/admin/accommodations`| Unit CRUD + availability toggle                |
| `/admin/amenities`     | Add-on CRUD                                    |

---

## Deployment (GitHub + Railway)

See **§5 "Database & Deployment"** in [`agent.md`](./agent.md) for the full walkthrough.
Highlights:

1. Create a persistent volume mounted at `/app/prisma` so SQLite survives redeploys.
2. Set `DATABASE_URL=file:./dev.db`, `SESSION_SECRET`, `PORT=3000`, `NODE_ENV=production`.
3. `railway.json` already runs
   `(npx prisma migrate deploy || npx prisma db push --skip-generate) && npx prisma generate && npm run build`.

---

## Known limitations

- **No guest accounts / "My Reservations" portal.** Guests are created implicitly at booking
  time with a random, unusable password; there is no guest login flow.
- **`Review` is modelled but unused** — reviews require authenticated guest accounts.
- **RBAC is single-role (`ADMIN`)** — the `STAFF` role from the ERD is not implemented.
- **No email/SMS notifications** — booking codes are shown on screen and printed, not sent.
- **No rate limiting** on the public `/receipt/[code]` lookup; mitigation is the 8-character
  unguessable booking code (plus JWT-signed admin cookies).
