-- 03_functions_triggers.sql

-- NOTE: Stored procedures do NOT use explicit COMMIT/ROLLBACK inside. PostgreSQL
-- auto-commits when CALL completes successfully. Explicit ROLLBACK inside gates
-- would cause "cannot commit while a subtransaction is active" errors.
-- Exception handler uses RAISE to re-throw so PostgreSQL handles rollback implicitly.

-- 1. Stored Procedure for Transferring Money
-- Implements ACID transactions, deadlock prevention (UUID sort order), row locking (FOR UPDATE)
CREATE OR REPLACE PROCEDURE sp_transfer_money(
    p_from_account_id UUID,
    p_to_account_id UUID,
    p_amount NUMERIC,
    p_reference VARCHAR,
    p_user_id UUID DEFAULT NULL,
    INOUT p_transaction_id UUID DEFAULT NULL,
    INOUT p_status VARCHAR DEFAULT NULL,
    INOUT p_error_message VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_from_balance NUMERIC;
    v_to_balance NUMERIC;
    v_from_status VARCHAR;
    v_to_status VARCHAR;
    v_transfer_type_id INTEGER;
BEGIN
    PERFORM set_config('app.current_user_id', COALESCE(p_user_id::TEXT, ''), true);
    p_status := 'failed';

    -- Validate amount
    IF p_amount <= 0 THEN
        p_error_message := 'Transfer amount must be greater than zero.';
        RETURN;
    END IF;

    -- Ensure we don't transfer to the same account
    IF p_from_account_id = p_to_account_id THEN
        p_error_message := 'Cannot transfer to the same account.';
        RETURN;
    END IF;

    -- Get transfer type id
    SELECT id INTO v_transfer_type_id FROM transaction_types WHERE name = 'transfer';
    IF NOT FOUND THEN
        p_error_message := 'Transaction type transfer not found.';
        RETURN;
    END IF;

    -- Lock both accounts (deadlock prevention: always lock by UUID sort order)
    IF p_from_account_id < p_to_account_id THEN
        SELECT balance, status INTO v_from_balance, v_from_status FROM accounts WHERE id = p_from_account_id FOR UPDATE;
        SELECT balance, status INTO v_to_balance,   v_to_status   FROM accounts WHERE id = p_to_account_id   FOR UPDATE;
    ELSE
        SELECT balance, status INTO v_to_balance,   v_to_status   FROM accounts WHERE id = p_to_account_id   FOR UPDATE;
        SELECT balance, status INTO v_from_balance, v_from_status FROM accounts WHERE id = p_from_account_id FOR UPDATE;
    END IF;

    -- Verify accounts exist
    IF v_from_status IS NULL OR v_to_status IS NULL THEN
        p_error_message := 'One or both accounts do not exist.';
        RETURN;
    END IF;

    -- Verify accounts are active
    IF v_from_status != 'active' OR v_to_status != 'active' THEN
        p_error_message := 'One or both accounts are not active.';
        RETURN;
    END IF;

    -- Check sufficient funds
    IF v_from_balance < p_amount THEN
        p_error_message := 'Insufficient funds in the source account.';
        RETURN;
    END IF;

    -- Perform the transfer
    UPDATE accounts SET balance = balance - p_amount, updated_at = CURRENT_TIMESTAMP WHERE id = p_from_account_id;
    UPDATE accounts SET balance = balance + p_amount, updated_at = CURRENT_TIMESTAMP WHERE id = p_to_account_id;

    -- Record the transaction
    INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference)
    VALUES (p_from_account_id, p_to_account_id, v_transfer_type_id, p_amount, 'completed', p_reference)
    RETURNING id INTO p_transaction_id;

    -- Success — return without COMMIT; PostgreSQL auto-commits on CALL completion
    p_status := 'completed';
    p_error_message := NULL;

EXCEPTION WHEN OTHERS THEN
    p_status := 'failed';
    p_error_message := SQLERRM;
    RAISE; -- re-throw so PostgreSQL handles rollback implicitly
END;
$$;


-- 1.5 Stored Procedure for Depositing Money
CREATE OR REPLACE PROCEDURE sp_deposit_money(
    p_account_id UUID,
    p_amount NUMERIC,
    p_reference VARCHAR,
    p_user_id UUID DEFAULT NULL,
    INOUT p_transaction_id UUID DEFAULT NULL,
    INOUT p_status VARCHAR DEFAULT NULL,
    INOUT p_error_message VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_balance NUMERIC;
    v_status VARCHAR;
    v_deposit_type_id INTEGER;
BEGIN
    -- Set audit context
    PERFORM set_config('app.current_user_id', COALESCE(p_user_id::TEXT, ''), true);
    p_status := 'failed';

    IF p_amount <= 0 THEN
        p_error_message := 'Deposit amount must be greater than zero.';
        RETURN;
    END IF;

    SELECT id INTO v_deposit_type_id FROM transaction_types WHERE name = 'deposit';
    IF NOT FOUND THEN
        p_error_message := 'Transaction type deposit not found.';
        RETURN;
    END IF;

    SELECT balance, status INTO v_balance, v_status FROM accounts WHERE id = p_account_id FOR UPDATE;

    IF v_status IS NULL THEN
        p_error_message := 'Account does not exist.';
        RETURN;
    END IF;

    IF v_status != 'active' THEN
        p_error_message := 'Account is not active.';
        RETURN;
    END IF;

    UPDATE accounts SET balance = balance + p_amount, updated_at = CURRENT_TIMESTAMP WHERE id = p_account_id;

    INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference)
    VALUES (NULL, p_account_id, v_deposit_type_id, p_amount, 'completed', p_reference)
    RETURNING id INTO p_transaction_id;

    p_status := 'completed';
    p_error_message := NULL;

EXCEPTION WHEN OTHERS THEN
    p_status := 'failed';
    p_error_message := SQLERRM;
    RAISE;
END;
$$;

-- 1.6 Stored Procedure for Withdrawing Money
CREATE OR REPLACE PROCEDURE sp_withdraw_money(
    p_account_id UUID,
    p_amount NUMERIC,
    p_reference VARCHAR,
    p_user_id UUID DEFAULT NULL,
    INOUT p_transaction_id UUID DEFAULT NULL,
    INOUT p_status VARCHAR DEFAULT NULL,
    INOUT p_error_message VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_balance NUMERIC;
    v_status VARCHAR;
    v_withdrawal_type_id INTEGER;
BEGIN
    PERFORM set_config('app.current_user_id', COALESCE(p_user_id::TEXT, ''), true);
    p_status := 'failed';

    IF p_amount <= 0 THEN
        p_error_message := 'Withdrawal amount must be greater than zero.';
        RETURN;
    END IF;

    SELECT id INTO v_withdrawal_type_id FROM transaction_types WHERE name = 'withdrawal';
    IF NOT FOUND THEN
        p_error_message := 'Transaction type withdrawal not found.';
        RETURN;
    END IF;

    SELECT balance, status INTO v_balance, v_status FROM accounts WHERE id = p_account_id FOR UPDATE;

    IF v_status IS NULL THEN
        p_error_message := 'Account does not exist.';
        RETURN;
    END IF;

    IF v_status != 'active' THEN
        p_error_message := 'Account is not active.';
        RETURN;
    END IF;

    IF v_balance < p_amount THEN
        p_error_message := 'Insufficient funds.';
        RETURN;
    END IF;

    UPDATE accounts SET balance = balance - p_amount, updated_at = CURRENT_TIMESTAMP WHERE id = p_account_id;

    INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference)
    VALUES (p_account_id, NULL, v_withdrawal_type_id, p_amount, 'completed', p_reference)
    RETURNING id INTO p_transaction_id;

    p_status := 'completed';
    p_error_message := NULL;

EXCEPTION WHEN OTHERS THEN
    p_status := 'failed';
    p_error_message := SQLERRM;
    RAISE;
END;
$$;


-- 2. Audit Logging Function and Triggers
CREATE OR REPLACE FUNCTION fn_audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_action VARCHAR;
    v_user_id UUID;
BEGIN
    v_action := TG_OP;
    
    -- Try to get current user id from application context if set by the backend
    BEGIN
        v_user_id := current_setting('app.current_user_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL; -- Fallback if not set
    END;

    IF v_action = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, v_action, v_new_data, v_user_id);
        RETURN NEW;
    ELSIF v_action = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, v_action, v_old_data, v_new_data, v_user_id);
        RETURN NEW;
    ELSIF v_action = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, v_action, v_old_data, v_user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Attach Audit Triggers to Sensitive Tables
CREATE TRIGGER trg_audit_accounts
AFTER INSERT OR UPDATE OR DELETE ON accounts
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

CREATE TRIGGER trg_audit_transactions
AFTER UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

CREATE TRIGGER trg_audit_loans
AFTER INSERT OR UPDATE OR DELETE ON loans
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();


-- 3. Views for Reporting
CREATE OR REPLACE VIEW vw_user_transaction_summary AS
SELECT 
    u.id AS user_id,
    u.username,
    u.full_name,
    a.account_number,
    a.balance,
    COUNT(t.id) AS total_transactions,
    SUM(CASE WHEN t.to_account_id = a.id THEN t.amount ELSE 0 END) AS total_received,
    SUM(CASE WHEN t.from_account_id = a.id THEN t.amount ELSE 0 END) AS total_sent
FROM users u
JOIN accounts a ON u.id = a.user_id
LEFT JOIN transactions t ON (a.id = t.from_account_id OR a.id = t.to_account_id) AND t.status = 'completed'
GROUP BY u.id, u.username, u.full_name, a.account_number, a.balance;
