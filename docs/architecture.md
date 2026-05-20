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
│       │   ├── AccountController.js ← Tài khoản & Giao dịch
│       │   ├── LoanController.js    ← Vay vốn
│       │   ├── adminController.js   ← Quản trị
│       │   ├── notificationController.js ← Thông báo (v2)
│       │   ├── cardController.js    ← Thẻ ngân hàng (v2)
│       │   ├── billController.js    ← Hóa đơn (v2)
│       │   └── scheduledController.js ← Giao dịch định kỳ (v2)
│       └── routes/
│           ├── authRoutes.js        ← /api/auth/*
│           ├── accountRoutes.js     ← /api/accounts/*
│           ├── loanRoutes.js        ← /api/loans/*
│           ├── adminRoutes.js       ← /api/admin/*
│           ├── notificationRoutes.js ← /api/notifications/* (v2)
│           ├── cardRoutes.js        ← /api/cards/* (v2)
│           ├── billRoutes.js        ← /api/bills/* (v2)
│           └── scheduledRoutes.js   ← /api/scheduled/* (v2)
│
├── database/                         ← PostgreSQL scripts
│   ├── 01_schema.sql                 ← Tạo 14 bảng (9 cũ + 5 mới)
│   ├── 02_security.sql             ← Roles, RLS, Permissions
│   ├── 03_functions_triggers.sql  ← Stored Procedures & Triggers
│   ├── 04_backup_pitr_guide.md       ← Backup & PITR
│   └── 05_seed_all.sql             ← Seed data mẫu
│
├── docs/
    └── architecture.md               ← File này
    └── TRIGGERS_FUNCTIONS.md        ← Chi tiết stored procedures & triggers
```

---

## 🗃️ Database Schema

### 9 bảng ban đầu

```
users ──── user_roles ──── roles
  │                           (admin/customer)
  │ N                            1
  │                          accounts ──── transactions ──── transaction_types
  │ N                           (1-N)        (N-N)           (lookup)
  │                               │
login_history ── audit_logs      loans (N-N qua account_id)
```

### 5 bảng mới (v2)

```
┌───────────┐     ┌──────────┐     ┌─────────────────┐
│notifications│   │ sessions │     │  cards          │
├─────────────┤   ├──────────┤     ├─────────────────┤
│ id          │   │ id       │     │ id              │
│ user_id(FK) │   │ user_id  │     │ user_id (FK)    │
│ type        │   │ token    │     │ account_id (FK) │
│ title       │   │ ip       │     │ card_type       │
│ message     │   │ device   │     │ status          │
│ is_read     │   │ expires  │     │ expiry_month    │
└─────────────┘   └──────────┘     │ expiry_year     │
                                    └─────────────────┘
┌──────────────┐     ┌───────────────────┐
│ bill_payments │     │ scheduled_payments │
├───────────────┤     ├───────────────────┤
│ id            │     │ id                 │
│ user_id (FK)  │     │ user_id (FK)       │
│ account_id(FK)│     │ from_account_id(FK)│
│ bill_type     │     │ to_account_id (FK) │     N
│ biller_code   │     │ amount             │─────────── accounts
│ amount+fee    │     │ frequency          │
│ status        │     │ next_execution     │
└───────────────┘     │ status             │
                      └───────────────────┘
```

---

## 🔌 API Endpoints

### Auth — `/api/auth`

| Method | Endpoint                   | Mô tả            | Auth required |
|--------|----------------------------|------------------|---------------|
| POST   | `/api/auth/register`       | Đăng ký          | ❌            |
| POST   | `/api/auth/login`          | Đăng nhập → JWT  | ❌            |

### Accounts — `/api/accounts`

| Method | Endpoint                              | Mô tả              | Auth required |
|--------|---------------------------------------|--------------------|---------------|
| GET    | `/api/accounts`                       | Danh sách tài khoản | ✅ JWT        |
| POST   | `/api/accounts/deposit`                | Nạp tiền           | ✅ JWT        |
| POST   | `/api/accounts/withdraw`              | Rút tiền           | ✅ JWT        |
| POST   | `/api/accounts/transfer`              | Chuyển tiền        | ✅ JWT        |
| GET    | `/api/accounts/:accountId/transactions` | Lịch sử giao dịch | ✅ JWT      |

### Admin — `/api/admin`

| Method | Endpoint                  | Mô tả            | Auth required |
|--------|---------------------------|------------------|---------------|
| GET    | `/api/admin/users`         | Danh sách users  | ✅ JWT + Admin |
| GET    | `/api/admin/audit-logs`   | Audit logs       | ✅ JWT + Admin |
| GET    | `/api/admin/loans`         | Tất cả loans     | ✅ JWT + Admin |
| PUT    | `/api/admin/users/:id/status` | Khóa/mở user  | ✅ JWT + Admin |

### Notifications — `/api/notifications` *(mới v2)*

| Method | Endpoint              | Mô tả                    | Auth required |
|--------|-----------------------|--------------------------|---------------|
| GET    | `/api/notifications`  | Danh sách thông báo       | ✅ JWT        |
| PUT    | `/api/notifications/read-all` | Đánh dấu đã đọc hết | ✅ JWT    |
| PUT    | `/api/notifications/:id/read` | Đánh dấu đã đọc  | ✅ JWT        |
| DELETE | `/api/notifications/:id` | Xóa thông báo           | ✅ JWT        |

### Cards — `/api/cards` *(mới v2)*

| Method | Endpoint            | Mô tả                  | Auth required |
|--------|---------------------|------------------------|---------------|
| GET    | `/api/cards`        | Danh sách thẻ          | ✅ JWT        |
| POST   | `/api/cards`        | Tạo thẻ mới            | ✅ JWT        |
| GET    | `/api/cards/:id`    | Chi tiết thẻ           | ✅ JWT        |
| PUT    | `/api/cards/:id/status` | Khóa/mở thẻ        | ✅ JWT        |
| DELETE | `/api/cards/:id`    | Hủy thẻ               | ✅ JWT        |

### Bill Payments — `/api/bills` *(mới v2)*

| Method | Endpoint      | Mô tả                | Auth required |
|--------|---------------|----------------------|---------------|
| GET    | `/api/bills`  | Danh sách hóa đơn    | ✅ JWT        |
| POST   | `/api/bills`  | Thanh toán hóa đơn   | ✅ JWT        |
| GET    | `/api/bills/:id` | Chi tiết hóa đơn   | ✅ JWT        |

### Scheduled Payments — `/api/scheduled` *(mới v2)*

| Method | Endpoint              | Mô tả                | Auth required |
|--------|-----------------------|----------------------|---------------|
| GET    | `/api/scheduled`      | Danh sách giao dịch  | ✅ JWT        |
| POST   | `/api/scheduled`      | Tạo giao dịch định kỳ| ✅ JWT       |
| PUT    | `/api/scheduled/:id`  | Cập nhật            | ✅ JWT        |
| DELETE | `/api/scheduled/:id`  | Hủy giao dịch        | ✅ JWT        |

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

| URL           | Component           | Protected  | Mô tả                       |
|---------------|---------------------|------------|------------------------------|
| `/login`      | Login.jsx           | ❌         | Đăng nhập                   |
| `/register`   | Register.jsx        | ❌         | Đăng ký                     |
| `/`           | Dashboard.jsx      | ✅         | Xem số dư tài khoản         |
| `/deposit`    | Deposit.jsx         | ✅         | Nạp tiền                    |
| `/withdraw`   | Withdraw.jsx        | ✅         | Rút tiền                    |
| `/transfer`   | Transfer.jsx        | ✅         | Chuyển khoản                |
| `/history`    | History.jsx         | ✅         | Lịch sử + Cash Flow Chart   |
| `/loans`      | Loan.jsx            | ✅         | Vay vốn                     |
| `/admin`      | AdminDashboard.jsx  | ✅ + Admin | Trang quản trị               |

---

## 🚀 Khởi động hệ thống

```bash
# 1. Khởi tạo database
psql -U postgres -c "CREATE DATABASE securebank;"
psql -U postgres -d securebank -f database/01_schema.sql
psql -U postgres -d securebank -f database/02_security.sql
psql -U postgres -d securebank -f database/03_functions_triggers.sql
psql -U postgres -d securebank -f database/05_seed_all.sql

# 2. Chạy Backend
cd server
npm install
npm run dev     # Port 5000

# 3. Chạy Frontend
cd client
npm install
npm run dev     # Port 5173
```

**Test accounts:** user1→user10 / password123 | admin / password123

---

## 🛠️ Tech Stack

| Layer     | Công nghệ                              |
|-----------|----------------------------------------|
| Frontend  | React 19, Vite, TailwindCSS, recharts  |
| Backend   | Node.js, Express.js, JWT, bcrypt       |
| Database  | PostgreSQL (Stored Procs, Triggers, RLS)|
| Dev Tools | ESLint, Nodemon                        |
