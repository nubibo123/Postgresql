# SecureBank — Full-Stack Banking System

A full-stack banking application built with React 19, Node.js, Express, and PostgreSQL. Simulates core Internet Banking features with enterprise-grade security.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TailwindCSS + recharts |
| Backend | Node.js + Express.js + JWT + bcrypt |
| Database | PostgreSQL (Stored Procedures, Triggers, RLS, Row Locking) |

---

## Features

### Customer
- **Register / Login** — JWT authentication, bcrypt password hashing
- **Dashboard** — View all accounts, balances, QR code
- **Deposit / Withdraw / Transfer** — Atomic transactions with `FOR UPDATE` row locking, deadlock prevention (UUID sort order)
- **Transaction History** — Cash flow chart, full transaction log
- **Loans** — Apply for loans with principal, interest rate, term
- **QR Code** — Generate QR code per account (virtual account: `SB-XXXX-XXXX-XX`), download as PNG, scan to transfer

### Admin
- **User Management** — View all users, lock/unlock accounts
- **Audit Logs** — Real-time log of all INSERT/UPDATE/DELETE operations
- **Loan Overview** — View all loans across all users

### Security
- JWT authentication (30-day expiry)
- bcrypt password hashing (salt rounds 10)
- Application-layer ownership checks
- Row-Level Security (RLS) policies
- `bank_app_user` PostgreSQL role (only CRU on tables, EXECUTE on procedures)
- `FOR UPDATE` row locks (concurrent double-spend prevention)
- Audit trigger on every sensitive table

---

## Getting Started

### 1. Database Setup

```bash
psql -U postgres -c "CREATE DATABASE securebank;"
psql -U postgres -d securebank -f database/01_schema.sql
psql -U postgres -d securebank -f database/02_security.sql
psql -U postgres -d securebank -f database/03_functions_triggers.sql
```

### 2. Backend

```bash
cd server
npm install
npm run dev     # port 5000
```

Create `server/.env`:
```
PORT=5000
DB_USER=postgres
DB_PASSWORD=123456
DB_HOST=localhost
DB_PORT=5432
DB_NAME=securebank
JWT_SECRET=your_secret_key
```

### 3. Frontend

```bash
cd client
npm install
npm run dev     # port 5173
```

### 4. Open Browser

Navigate to **http://localhost:5173**

### Default Login
- Regular user: register directly on the UI
- Admin account: `admin` / `admin123`

To create admin via SQL:
```bash
cd server && node -e "const bcrypt=require('bcrypt');const {Pool}=require('pg');const pool=new Pool({user:'postgres',password:'123456',host:'localhost',port:5432,database:'securebank'});(async()=>{const h=await bcrypt.hash('admin123',10);const r=await pool.query('INSERT INTO users(username,password_hash,full_name) VALUES($1,$2,$3) ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id',['admin',h,'Administrator']);await pool.query('DELETE FROM user_roles WHERE user_id=$1',[r.rows[0].id]);await pool.query('INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE name=$2',[r.rows[0].id,'admin']);pool.end();console.log('Done');})();"
```

---

## Database Architecture

### Tables
`users`, `accounts`, `transactions`, `transaction_types`, `roles`, `user_roles`, `audit_logs`, `login_history`, `loans`

### Stored Procedures
- `sp_transfer_money` — ACID transfer, deadlock prevention, row lock
- `sp_deposit_money` — Credit account
- `sp_withdraw_money` — Debit account with balance check

### Trigger
`fn_audit_log_trigger()` — Fires on INSERT/UPDATE/DELETE of accounts, users, transactions, loans

---

## Project Structure

```
Postgres/
├── client/              # React frontend
│   └── src/
│       ├── pages/       # Login, Register, Dashboard, Deposit, Withdraw,
│       │               #   Transfer, History, Loan, AdminDashboard
│       └── components/ # Navbar, CashFlowChart, QRCodeModal
├── server/              # Node.js backend
│   └── src/
│       ├── config/      # db.js (pg Pool)
│       ├── controllers/ # auth, account, loan, admin
│       ├── middlewares/ # authMiddleware, errorMiddleware
│       └── routes/      # auth, account, loan, admin
├── database/            # PostgreSQL scripts
├── docs/                # Architecture, Triggers & Functions docs
├── CLAUDE.md            # Codebase guidance for Claude Code
└── AGENTS.md            # Project overview
```

---

## License

MIT