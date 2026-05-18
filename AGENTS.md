# SecureBank - Banking Transaction System

## Giới thiệu

SecureBank là hệ thống giao dịch ngân hàng đơn giản được xây dựng bằng PostgreSQL nhằm mô phỏng các chức năng cơ bản của Internet Banking.

Dự án phục vụ cho báo cáo cuối kỳ môn PostgreSQL với các kỹ thuật:
- Database Design
- ERD
- Transaction Management
- Security Management
- Backup & Restore
- PITR (Point In Time Recovery)

---

# Công nghệ sử dụng

## Backend
- Node.js
- Express.js

## Frontend
- ReactJS / HTML CSS JavaScript

## Database
- PostgreSQL

---

# Chức năng chính

## Người dùng
- Đăng ký tài khoản
- Đăng nhập
- Xem số dư
- Chuyển tiền
- Xem lịch sử giao dịch

## Quản trị viên
- Quản lý tài khoản
- Khóa tài khoản
- Xem audit logs
- Backup hệ thống

---

# PostgreSQL Features

## Transaction Management
- ACID transaction
- COMMIT / ROLLBACK
- Concurrent transaction handling
- Row locking với FOR UPDATE

## Security
- Roles & Permissions
- Password hashing
- Audit logging
- Row-level security

## Backup & Recovery
- pg_dump
- pg_restore
- WAL Archiving
- PITR (Point In Time Recovery)

---

# Database Schema

## Tables

### users
Lưu thông tin người dùng.

### accounts
Lưu tài khoản ngân hàng và số dư.

### transactions
Lưu lịch sử giao dịch.

### transaction_types
Danh sách loại giao dịch.

### roles
Phân quyền người dùng.

### user_roles
Liên kết user và role.

### audit_logs
Lưu lịch sử thao tác hệ thống.

### login_history
Lưu lịch sử đăng nhập.

---

# ERD

```text
USERS
  |
  | 1-N
  |
ACCOUNTS
  |
  | 1-N
  |
TRANSACTIONS
  |
  | N-1
  |
TRANSACTION_TYPES

USERS
  |
  | N-N
  |
ROLES

USERS
  |
  | 1-N
  |
AUDIT_LOGS