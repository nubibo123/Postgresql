-- 02_security.sql

-- Note: Run these commands as a superuser (e.g., postgres)

-- Create Application Role (used by the Node.js backend)
-- In a real scenario, change the password to something secure
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bank_app_user') THEN
    CREATE ROLE bank_app_user WITH LOGIN PASSWORD 'bank_app_pass';
  END IF;
END
$$;

-- Grant permissions to the application role
GRANT CONNECT ON DATABASE postgres TO bank_app_user; -- Replace 'postgres' with actual DB name if different
GRANT USAGE ON SCHEMA public TO bank_app_user;

-- Grant CRUD permissions on necessary tables
GRANT SELECT, INSERT, UPDATE ON users TO bank_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO bank_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO bank_app_user;
GRANT SELECT, INSERT, UPDATE ON accounts TO bank_app_user;
GRANT SELECT ON transaction_types TO bank_app_user;
GRANT SELECT, INSERT ON transactions TO bank_app_user;
GRANT SELECT, INSERT ON audit_logs TO bank_app_user;
GRANT SELECT, INSERT ON login_history TO bank_app_user;

-- Grant usage on sequences (if any SERIAL fields are used)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bank_app_user;

-- Row Level Security (RLS) setup
-- Enable RLS on accounts and transactions
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;



-- Example Policy: Users can only see their own accounts
CREATE POLICY account_owner_policy ON accounts
    FOR ALL
    TO bank_app_user
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Example Policy: Users can only see transactions related to their accounts
CREATE POLICY transaction_owner_policy ON transactions
    FOR ALL
    TO bank_app_user
    USING (
        from_account_id IN (SELECT id FROM accounts WHERE user_id = current_setting('app.current_user_id')::UUID)
        OR 
        to_account_id IN (SELECT id FROM accounts WHERE user_id = current_setting('app.current_user_id')::UUID)
    );

-- Important: When the backend connects, it must run:
-- SET LOCAL app.current_user_id = 'user-uuid-here'; 
-- before executing queries for a specific user to make RLS work properly.
-- Alternatively, RLS can be bypassed for admin routes by using a different role or setting a bypass flag.
