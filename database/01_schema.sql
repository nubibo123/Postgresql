-- 01_schema.sql
-- Drop tables if they exist to allow clean recreation
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS transaction_types CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS Table
DROP TABLE IF EXISTS scheduled_payments CASCADE;
DROP TABLE IF EXISTS bill_payments CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- 1. USERS Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'locked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrator with full access'),
('customer', 'Regular bank customer');

-- 3. USER_ROLES Table (N-N relationship)
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 4. ACCOUNTS Table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'locked', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. LOANS Table
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    principal NUMERIC(15, 2) NOT NULL CHECK (principal > 0),
    interest_rate NUMERIC(5, 2) NOT NULL CHECK (interest_rate >= 0),
    term_months INTEGER NOT NULL CHECK (term_months > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TRANSACTION_TYPES Table
CREATE TABLE transaction_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default types
INSERT INTO transaction_types (name) VALUES 
('deposit'), 
('withdrawal'), 
('transfer');

-- 6. TRANSACTIONS Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT, -- Nullable for deposits
    to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,   -- Nullable for withdrawals
    type_id INTEGER REFERENCES transaction_types(id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDIT_LOGS Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Who made the change
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. LOGIN_HISTORY Table
CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATIONS Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'transaction', 'loan', 'security')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SESSIONS Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 11. CARDS Table
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    card_number_hash VARCHAR(255) NOT NULL,
    last_four VARCHAR(4) NOT NULL,
    card_type VARCHAR(20) DEFAULT 'debit' CHECK (card_type IN ('debit', 'virtual')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired', 'cancelled')),
    expiry_month INTEGER NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year INTEGER NOT NULL,
    daily_limit NUMERIC(15, 2) DEFAULT 50000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. BILL_PAYMENTS Table
CREATE TABLE bill_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    bill_type VARCHAR(30) CHECK (bill_type IN ('electricity', 'water', 'internet', 'phone', 'tv', 'insurance')),
    biller_code VARCHAR(50),
    biller_name VARCHAR(100),
    customer_ref VARCHAR(100),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. SCHEDULED_PAYMENTS Table
CREATE TABLE scheduled_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_number VARCHAR(20),
    to_account_name VARCHAR(100),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255),
    frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    next_execution_date DATE NOT NULL,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for optimization
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_account_id ON cards(account_id);
CREATE INDEX idx_cards_last_four ON cards(last_four);
CREATE INDEX idx_bill_payments_user_id ON bill_payments(user_id);
CREATE INDEX idx_bill_payments_bill_type ON bill_payments(bill_type);
CREATE INDEX idx_bill_payments_customer_ref ON bill_payments(customer_ref);
CREATE INDEX idx_scheduled_payments_user_id ON scheduled_payments(user_id);
CREATE INDEX idx_scheduled_payments_next_exec ON scheduled_payments(next_execution_date);
CREATE INDEX idx_scheduled_payments_status ON scheduled_payments(status);
