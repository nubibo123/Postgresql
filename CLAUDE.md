# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend (Node.js/Express)
- `npm install` – Install server dependencies (inside `server/`).
- `npm run dev` – Start the server in watch mode with nodemon (**port 5000**).
- `npm start` – Start the server in production mode.

### Frontend (React 19 + Vite + TailwindCSS)
- `npm install` – Install client dependencies (inside `client/`).
- `npm run dev` – Start the Vite dev server (**port 5173**).
- `npm run build` – Production bundle → `client/dist`.
- `npm run lint` – Lint with eslint.
- `npm run preview` – Preview the production build.

### Database
```bash
psql -U postgres -c "CREATE DATABASE securebank;"
psql -U postgres -d securebank -f database/01_schema.sql
psql -U postgres -d securebank -f database/02_security.sql
psql -U postgres -d securebank -f database/03_functions_triggers.sql
```
See `database/04_backup_pitr_guide.md` for pg_dump/pg_restore and PITR procedures.

### End-to-End Setup
1. Initialize the DB (above).
2. `cd server && npm install && npm run dev` (one terminal).
3. `cd client && npm install && npm run dev` (another terminal).
4. Open `http://localhost:5173`.

## High-Level Architecture

```
CLIENT (React 19 + Vite + TailwindCSS)  → :5173
SERVER (Node.js + Express)              → :5000
DATABASE (PostgreSQL)                   → :5432, DB: securebank
```

### Client
- Entry: `client/src/main.jsx`. Routing in `App.jsx`. Pages in `client/src/pages/` (Login, Register, Dashboard, Deposit, Withdraw, Transfer, History, Loan, AdminDashboard). Components in `client/src/components/` (Navbar, CashFlowChart with recharts, QRCodeModal).

### Server
- Entry: `server/src/index.js`. Layers:
  - `config/db.js` – `pg.Pool` using credentials from `server/.env`.
  - `middlewares/authMiddleware.js` – `protect` (JWT verification, injects `req.user`) and `admin` (role guard).
  - `controllers/authController.js` – register (creates user + account in one transaction) and login.
  - `controllers/accountController.js` – account listing, deposit/withdraw/transfer (delegates to stored procedures).
  - `controllers/loanController.js` – loans: list, apply, update status, delete.
  - `controllers/adminController.js` – admin-only endpoints (users, audit logs, loans).
  - Routes in `server/src/routes/`: authRoutes, accountRoutes, adminRoutes, loanRoutes.
- Auth endpoints: `POST /api/auth/register`, `POST /api/auth/login` → returns `{ id, username, full_name, role, token }`.
- Account endpoints require `Authorization: Bearer <token>` and enforce ownership via `WHERE user_id = $1` before calling stored procedures.
- Error middleware in `server/src/middlewares/errorMiddleware.js` produces `{ message }` responses.

### Database
**Tables:** `users`, `accounts`, `transactions`, `transaction_types`, `roles`, `user_roles`, `audit_logs`, `login_history`, `loans`.

**Stored procedures** (`database/03_functions_triggers.sql`):
- `sp_transfer_money` – ACID transfer with `FOR UPDATE` row lock. **Deadlock prevention:** locks accounts in UUID sort order (always lock the smaller UUID first, regardless of debit/credit direction).
- `sp_deposit_money` – credit an account.
- `sp_withdraw_money` – debit an account after balance check.
- `fn_audit_log_trigger()` – fires on INSERT/UPDATE/DELETE of `accounts`, `users`, `transactions`. Reads `app.current_user_id` from session config (set by the backend via `PERFORM set_config(...)`).

**RBAC:** default roles are `admin` (full) and `customer` (transactional).

**View:** `vw_user_transaction_summary` – denormalised per-account totals (transactions count, total received/sent).

### Security Stack (depth-first)
1. JWT (30-day expiry) for API auth.
2. bcrypt password hashing (salt rounds 10).
3. Application-layer ownership checks (`WHERE user_id = $1`) on all account data.
4. Row-level security policies defined in `02_security.sql` (enforced when `app.current_user_id` is set via `SET LOCAL`).
5. `bank_app_user` PostgreSQL role with only CRUD on tables and `EXECUTE` on procedures — direct table writes are blocked.
6. `FOR UPDATE` row locks in stored procedures block concurrent double-spend.

## Entry Points
- `server/src/index.js`
- `client/src/main.jsx`
- `client/src/App.jsx` (frontend routing)
- `database/01_schema.sql`
- `database/03_functions_triggers.sql`
- `docs/architecture.md` (Vietnamese; full ERD, API table, data-flow diagram, startup commands)