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
- Entry: `client/src/main.jsx`. Routing in `App.jsx` with `PrivateRoute` (auth guard) and `AdminRoute` (role guard).
- Pages: `client/src/pages/` — Login, Register, Dashboard, Deposit, Withdraw, Transfer, History, Loan, AdminDashboard
- Components: `client/src/components/` — Navbar, CashFlowChart (recharts), QRCodeModal
- Utils: `client/src/utils/formatters.js` — `formatVirtualAccount`, `formatAccountNumber`

### Server
- Entry: `server/src/index.js`. Layers:
  - `config/db.js` – `pg.Pool` using credentials from `server/.env`.
  - `middlewares/authMiddleware.js` – `protect` (JWT) and `admin` (role guard).
  - `controllers/authController.js` – register (user + account in one transaction) and login.
  - `controllers/accountController.js` – account listing, deposit/withdraw/transfer (delegates to stored procedures).
  - `controllers/loanController.js` – loans: list, apply, update status, delete.
  - `controllers/adminController.js` – admin endpoints (users with lock/unlock, audit logs, all loans).
  - Routes: `server/src/routes/` — authRoutes, accountRoutes, adminRoutes, loanRoutes
- Auth: `POST /api/auth/register`, `POST /api/auth/login` → `{ id, username, full_name, role, token }`
- Error middleware in `server/src/middlewares/errorMiddleware.js` produces `{ message }` responses.

### Database
**Tables:** `users`, `accounts`, `transactions`, `transaction_types`, `roles`, `user_roles`, `audit_logs`, `login_history`, `loans`

**Stored procedures** (`database/03_functions_triggers.sql`):
> **Note:** Procedures do NOT use `COMMIT`/`ROLLBACK` inside. PostgreSQL auto-commits when `CALL` completes. Validation gates use `RETURN` only. Exception handler uses `RAISE` (PostgreSQL auto-rollbacks).
- `sp_transfer_money` – ACID transfer, `FOR UPDATE` row lock. Deadlock prevention: locks smaller UUID first.
- `sp_deposit_money` – credit an account.
- `sp_withdraw_money` – debit an account after balance check.
- `fn_audit_log_trigger()` – fires on INSERT/UPDATE/DELETE of `accounts`, `users`, `transactions`, `loans`. Reads `app.current_user_id` via `set_config(...)`.

**RBAC:** roles `admin` (full) and `customer` (transactional).

**View:** `vw_user_transaction_summary` – per-account totals (transactions count, total received/sent).

### Security Stack
1. JWT (30-day expiry) for API auth.
2. bcrypt password hashing (salt rounds 10).
3. Application-layer ownership checks (`WHERE user_id = $1`) on all account data.
4. Row-level security policies in `02_security.sql`.
5. `bank_app_user` PostgreSQL role — only CRUD on tables, `EXECUTE` on procedures.
6. `FOR UPDATE` row locks block concurrent double-spend.
7. Audit trigger logs all changes to `audit_logs`.

### Features Implemented
| Feature | Location |
|---|---|
| Register / Login (JWT + bcrypt) | `authController`, authRoutes |
| Dashboard with account cards | `Dashboard.jsx` |
| Deposit / Withdraw / Transfer | `accountController`, stored procedures |
| QR Code generation (SB-XXXX-XXXX-XX) | `QRCodeModal.jsx` + `QRCodeCanvas` |
| Download QR as PNG | `QRCodeModal.jsx` |
| Scan QR to transfer | `Transfer.jsx` + `jsqr` library |
| Loan apply / list / delete | `Loan.jsx` + `loanController` |
| History: Transactions + Loans tabs | `History.jsx` |
| Admin: Users, Audit Logs, Loans | `AdminDashboard.jsx` + `adminController` |
| Lock/Unlock user account | `adminController.updateUserStatus` |

## Entry Points
- `server/src/index.js`
- `client/src/main.jsx`
- `client/src/App.jsx` (frontend routing)
- `database/01_schema.sql`
- `database/03_functions_triggers.sql`
- `docs/architecture.md` (Vietnamese; ERD, API table, data-flow)
- `docs/TRIGGERS_FUNCTIONS.md` (stored procedures & triggers deep-dive)