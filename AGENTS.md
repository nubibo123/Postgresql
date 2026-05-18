# AGENTS.md — SecureBank

## Repo layout

Two co-located packages, **not** a monorepo:

```
Postgres/
├── server/    # Node.js + Express API (port 5000)
├── client/    # React 19 + Vite (port 5173)
└── database/  # PostgreSQL init scripts
```

`CLAUDE.md` and `docs/architecture.md` exist and are more detailed than this file. Trust them first.

---

## Commands

### Database (run every fresh setup, in order)

```bash
psql -U postgres -c "CREATE DATABASE securebank;"
psql -U postgres -d securebank -f database/01_schema.sql
psql -U postgres -d securebank -f database/02_security.sql
psql -U postgres -d securebank -f database/03_functions_triggers.sql
```

Seed demo data (optional): `psql -U postgres -d securebank -f database/05_seed_transactions.sql`

### Start both services (two terminals)

```bash
# Terminal 1 — Backend
cd server && npm install && npm run dev     # port 5000

# Terminal 2 — Frontend
cd client && npm install && npm run dev     # port 5173
```

### No tests or build step in this repo

`npm test` is not defined anywhere. Frontend build: `cd client && npm run build`.

---

## Entry points

| Layer | File |
|---|---|
| Backend | `server/src/index.js` |
| DB pool | `server/src/config/db.js` |
| Frontend | `client/src/main.jsx` → `App.jsx` |

---

## Environment

- **Backend**: `server/.env` only. Contains `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_SECRET`, `PORT`. Client ignores `.env` by default (Vite doesn't read `server/.env`).
- Changing any `server/.env` value requires restarting the backend.

---

## Auth & Routing

- JWT expires in **30 days** (`jsonwebtoken` expiry set in `authController.js`).
- Password hash: **bcrypt salt rounds = 10**.
- Frontend guards: `PrivateRoute` (token check via `localStorage`) and `AdminRoute` (role check).
- All API requests from client use `axios` with `Authorization: Bearer <token>`.

---

## PostgreSQL quirks (critical)

### Stored procedures — no COMMIT/ROLLBACK

`sp_transfer_money`, `sp_deposit_money`, `sp_withdraw_money` have **no COMMIT/ROLLBACK** inside. PostgreSQL auto-commits when `CALL` completes. Adding any explicit COMMIT inside the procedure body will fail. Validation errors use `RETURN` only; exceptions re-raise via `RAISE`.

### RLS + audit context — must set per request

`02_security.sql` enables RLS on `accounts` and `transactions`, scoped to `current_setting('app.current_user_id')::UUID`. Every controller must run a query like:

```sql
SET LOCAL app.current_user_id = '<authenticated-user-uuid>';
```

before touching data, otherwise RLS blocks the query.

### Concurrency — deadlock prevention

`sp_transfer_money` locks both rows with `FOR UPDATE`, always in **UUID ascending order** (smaller UUID first), to prevent deadlocks from concurrent transfers.

---

## Key API routes

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register` | none |
| POST | `/api/auth/login` | none |
| GET | `/api/accounts` | JWT |
| POST | `/api/accounts/deposit` | JWT |
| POST | `/api/accounts/withdraw` | JWT |
| POST | `/api/accounts/transfer` | JWT |
| GET | `/api/admin/users` | JWT + admin role |
| GET | `/api/admin/logs` | JWT + admin role |

Load-bearing file: `server/src/controllers/accountController.js` — deposit/withdraw/transfer controllers delegate to the stored procedures above.

---

## Admin account

Username: `admin` / `admin123` (hardcoded in CLIENT.md and docs).

---

## Lint / typecheck

Frontend only: `cd client && npm run lint` (ESLint). No backend lint. No typecheck step — this is a JS project, no TypeScript.

---

## Directories NOT in this repo worth knowing

`.kilo/` — Kilo tooling. Local OpenCode config not found (`opencode.json` absent). No `.cursor/rules/` or `.github/copilot-instructions.md`.
