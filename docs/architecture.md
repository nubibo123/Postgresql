# 🏦 SecureBank — Kiến trúc hệ thống

## 📋 Tổng quan

SecureBank là hệ thống ngân hàng full-stack mô phỏng Internet Banking với ba lớp kiến trúc chính:

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                     │
│                           Port: 5173                             │
├──────────────────────────────────────────────────────────────────┤
│                      SERVER (Node.js + Express)                  │
│                           Port: 5000                             │
├──────────────────────────────────────────────────────────────────┤
│                      DATABASE (PostgreSQL)                       │
│                    DB: securebank | Port: 5432                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
Postgres/
├── AGENTS.md                         ← Mô tả dự án
├── client/                           ← Frontend (React + Vite + TailwindCSS)
│   └── src/
│       ├── main.jsx                  ← Entry point React
│       ├── App.jsx                   ← Routing chính
│       ├── App.css / index.css       ← Global styles
│       ├── components/
│       │   ├── Navbar.jsx            ← Thanh điều hướng
│       │   └── CashFlowChart.jsx     ← Biểu đồ dòng tiền (recharts)
│       └── pages/
│           ├── Login.jsx             ← Đăng nhập
│           ├── Register.jsx          ← Đăng ký
│           ├── Dashboard.jsx         ← Trang chủ / Số dư tài khoản
│           ├── Deposit.jsx           ← Nạp tiền
│           ├── Withdraw.jsx          ← Rút tiền
│           ├── Transfer.jsx          ← Chuyển tiền
│           └── History.jsx           ← Lịch sử giao dịch + Line Chart
│
├── server/                           ← Backend (Node.js + Express)
│   └── src/
│       ├── index.js                  ← Entry point Express server
│       ├── config/
│       │   └── db.js                 ← Kết nối PostgreSQL (pg Pool)
│       ├── middlewares/
│       │   └── authMiddleware.js     ← JWT authentication guard
│       ├── controllers/
│       │   ├── authController.js     ← Đăng ký / Đăng nhập
│       │   ├── accountController.js  ← Tài khoản & Giao dịch
│       │   └── adminController.js    ← Quản trị viên
│       └── routes/
│           ├── authRoutes.js         ← POST /api/auth/*
│           ├── accountRoutes.js      ← GET/POST /api/accounts/*
│           └── adminRoutes.js        ← GET /api/admin/*
│
├── database/                         ← PostgreSQL scripts
│   ├── 01_schema.sql                 ← Tạo bảng & quan hệ
│   ├── 02_security.sql               ← Roles, RLS, Permissions
│   ├── 03_functions_triggers.sql     ← Stored Procedures & Triggers
│   └── 04_backup_pitr_guide.md       ← Hướng dẫn Backup & PITR
│
└── docs/
    └── ARCHITECTURE.md               ← File này
```

---

## 🗃️ Database Schema

### Các bảng chính

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│    users    │     │  accounts   │     │   transactions   │
├─────────────┤     ├─────────────┤     ├──────────────────┤
│ id (PK)     │1──N │ id (PK)     │1──N │ id (PK)          │
│ username    │     │ user_id(FK) │     │ from_account(FK) │
│ email       │     │ account_no  │     │ to_account(FK)   │
│ password    │     │ balance     │     │ amount           │
│ full_name   │     │ currency    │     │ type_id (FK)     │
│ created_at  │     │ status      │     │ reference        │
└─────────────┘     │ created_at  │     │ status           │
       │            └─────────────┘     │ created_at       │
       │ N                              └──────────────────┘
       │                                        │ N
       │ N                                      │ 1
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│ user_roles  │     │    roles    │     │transaction_types │
├─────────────┤     ├─────────────┤     ├──────────────────┤
│ user_id(FK) │N──1 │ id (PK)     │     │ id (PK)          │
│ role_id(FK) │     │ role_name   │     │ type_name        │
└─────────────┘     └─────────────┘     └──────────────────┘

┌──────────────┐     ┌───────────────┐
│  audit_logs  │     │ login_history │
├──────────────┤     ├───────────────┤
│ id (PK)      │     │ id (PK)       │
│ user_id (FK) │     │ user_id (FK)  │
│ action       │     │ ip_address    │
│ table_name   │     │ status        │
│ record_id    │     │ created_at    │
│ created_at   │     └───────────────┘
└──────────────┘
```

---

## 🔌 API Endpoints

### Auth — `/api/auth`

| Method | Endpoint              | Mô tả           | Auth required |
|--------|-----------------------|-----------------|---------------|
| POST   | `/api/auth/register`  | Đăng ký         | ❌            |
| POST   | `/api/auth/login`     | Đăng nhập → JWT | ❌            |

### Accounts — `/api/accounts`

| Method | Endpoint                             | Mô tả                    | Auth required |
|--------|--------------------------------------|--------------------------|---------------|
| GET    | `/api/accounts`                      | Lấy danh sách tài khoản  | ✅ JWT        |
| POST   | `/api/accounts/deposit`              | Nạp tiền                 | ✅ JWT        |
| POST   | `/api/accounts/withdraw`             | Rút tiền                 | ✅ JWT        |
| POST   | `/api/accounts/transfer`             | Chuyển tiền              | ✅ JWT        |
| GET    | `/api/accounts/:accountId/transactions` | Lịch sử giao dịch    | ✅ JWT        |

### Admin — `/api/admin`

| Method | Endpoint              | Mô tả               | Auth required |
|--------|-----------------------|---------------------|---------------|
| GET    | `/api/admin/users`    | Danh sách users     | ✅ JWT + Admin|
| GET    | `/api/admin/logs`     | Audit logs          | ✅ JWT + Admin|

---

## ⚙️ Stored Procedures (PostgreSQL)

| Procedure             | Mô tả                                        |
|-----------------------|----------------------------------------------|
| `sp_transfer_money`   | Chuyển tiền giữa 2 tài khoản (ACID + FOR UPDATE) |
| `sp_deposit_money`    | Nạp tiền vào tài khoản                       |
| `sp_withdraw_money`   | Rút tiền (kiểm tra đủ số dư)                 |

### Triggers

| Trigger                     | Table         | Thời điểm      | Mô tả                  |
|-----------------------------|---------------|----------------|------------------------|
| `audit_trigger`             | Nhiều bảng    | AFTER INSERT/UPDATE/DELETE | Ghi audit log |

---

## 🔐 Bảo mật

```
┌─────────────────────────────────────────────┐
│              Security Layers                │
├─────────────────────────────────────────────┤
│ 1. JWT Authentication (authMiddleware.js)   │
│    → Mọi route /api/accounts đều cần token  │
├─────────────────────────────────────────────┤
│ 2. Password Hashing (bcrypt)                │
│    → Mật khẩu không lưu plain text          │
├─────────────────────────────────────────────┤
│ 3. Row-Level Security (PostgreSQL RLS)       │
│    → User chỉ đọc được data của chính mình  │
├─────────────────────────────────────────────┤
│ 4. DB Role: bank_app_user                   │
│    → Chỉ có quyền EXECUTE procedure,        │
│      không có quyền trực tiếp UPDATE bảng  │
├─────────────────────────────────────────────┤
│ 5. Row Locking (FOR UPDATE)                 │
│    → Chống Race Condition khi giao dịch     │
│       đồng thời                             │
├─────────────────────────────────────────────┤
│ 6. Audit Logging (trigger)                  │
│    → Mọi thao tác đều được ghi nhật ký      │
└─────────────────────────────────────────────┘
```

---

## 🔄 Luồng dữ liệu (Data Flow)

### Ví dụ: Nạp tiền (Deposit)

```
[Browser]
   │  Nhập form (accountId, amount, reference)
   ▼
[React - Deposit.jsx]
   │  POST /api/accounts/deposit  + JWT header
   ▼
[Express - accountRoutes.js]
   │  router.post('/deposit', depositMoney)
   ▼
[Express - accountController.js]
   │  1. Xác thực JWT (authMiddleware)
   │  2. SET LOCAL app.current_user_id = req.user.id
   │  3. CALL sp_deposit_money(accountId, amount, reference)
   ▼
[PostgreSQL - sp_deposit_money]
   │  BEGIN
   │  SELECT ... FOR UPDATE  ← Khóa hàng
   │  UPDATE accounts SET balance += amount
   │  INSERT INTO transactions ...
   │  COMMIT
   ▼
[Trigger - audit_trigger]
   │  INSERT INTO audit_logs (action, user_id, ...)
   ▼
[Response] → 200 OK → React cập nhật UI
```

---

## 🖥️ Frontend Routes

| URL         | Component       | Protected | Mô tả                    |
|-------------|-----------------|-----------|--------------------------|
| `/login`    | Login.jsx       | ❌        | Đăng nhập                |
| `/register` | Register.jsx    | ❌        | Đăng ký                  |
| `/`         | Dashboard.jsx   | ✅        | Xem số dư tài khoản      |
| `/deposit`  | Deposit.jsx     | ✅        | Nạp tiền                 |
| `/withdraw` | Withdraw.jsx    | ✅        | Rút tiền                 |
| `/transfer` | Transfer.jsx    | ✅        | Chuyển khoản             |
| `/history`  | History.jsx     | ✅        | Lịch sử + Cash Flow Chart|

---

## 🚀 Khởi động hệ thống

```bash
# 1. Khởi tạo database
psql -U postgres -c "CREATE DATABASE securebank;"
psql -U postgres -d securebank -f database/01_schema.sql
psql -U postgres -d securebank -f database/02_security.sql
psql -U postgres -d securebank -f database/03_functions_triggers.sql

# 2. Chạy Backend
cd server
npm install
npm run dev     # Port 5000

# 3. Chạy Frontend
cd client
npm install
npm run dev     # Port 5173
```

---

## 🛠️ Tech Stack

| Layer     | Công nghệ                              |
|-----------|----------------------------------------|
| Frontend  | React 19, Vite, TailwindCSS, recharts  |
| Backend   | Node.js, Express.js, JWT, bcrypt       |
| Database  | PostgreSQL (Stored Procs, Triggers, RLS)|
| Dev Tools | ESLint, Nodemon                        |
