    # Triggers & Functions — SecureBank

    Tài liệu giải thích chi tiết Stored Procedures, Trigger Function, và View trong `database/03_functions_triggers.sql`.

    ---

    ## Tổng quan thành phần

    | Tên | Loại | Mục đích |
    |-----|------|----------|
    | `sp_transfer_money` | Procedure | Chuyển tiền giữa 2 tài khoản |
    | `sp_deposit_money` | Procedure | Nạp tiền vào tài khoản |
    | `sp_withdraw_money` | Procedure | Rút tiền khỏi tài khoản |
    | `fn_audit_log_trigger` | Trigger Function | Ghi log mọi thay đổi trên bảng nhạy cảm |
    | `trg_audit_accounts` | Trigger | Gắn audit vào bảng `accounts` |
    | `trg_audit_users` | Trigger | Gắn audit vào bảng `users` |
    | `trg_audit_transactions` | Trigger | Gắn audit vào bảng `transactions` |
    | `trg_audit_loans` | Trigger | Gắn audit vào bảng `loans` |
    | `vw_user_transaction_summary` | View | Thống kê tổng hợp tiền vào/ra theo tài khoản |

    ---

    ## Stored Procedures

    ### Mô hình Transaction

    > **Quan trọng:** Các procedure KHÔNG dùng `COMMIT` hay `ROLLBACK` bên trong thân procedure.

    - PostgreSQL **tự động commit** khi `CALL` kết thúc thành công (không lỗi).
    - Các gate validation (số tiền <= 0, tài khoản không tồn tại...) chỉ cần `RETURN` — không cần rollback vì chưa có thay đổi gì.
    - Exception handler dùng `RAISE` để re-throw lỗi → PostgreSQL tự rollback.

    ```sql
    -- ✅ Đúng:
    IF p_amount <= 0 THEN
        p_error_message := 'Amount must be greater than zero.';
        RETURN;
    END IF;
    -- ... thành công ...
    p_status := 'completed'; p_error_message := NULL;
    -- Không có COMMIT — PostgreSQL tự commit khi CALL kết thúc

    EXCEPTION WHEN OTHERS THEN
        p_status := 'failed';
        p_error_message := SQLERRM;
        RAISE; -- re-throw → PostgreSQL tự rollback

    -- ❌ Sai — gây lỗi "cannot commit while a subtransaction is active":
    IF p_amount <= 0 THEN
        ROLLBACK; RETURN;
    END IF;
    -- ...
    COMMIT;
    ```

    ---

    ### `sp_transfer_money` — Chuyển tiền

    **Tham số đầu vào:**

    | Tham số | Kiểu | Mô tả |
    |---------|------|-------|
    | `p_from_account_id` | UUID | ID tài khoản gửi |
    | `p_to_account_id` | UUID | ID tài khoản nhận |
    | `p_amount` | NUMERIC | Số tiền |
    | `p_reference` | VARCHAR | Nội dung chuyển khoản |
    | `p_user_id` | UUID | ID người thực hiện (dùng cho audit) |

    **Tham số đầu ra (INOUT):**

    | Tham số | Mô tả |
    |---------|-------|
    | `p_transaction_id` | UUID của giao dịch vừa tạo |
    | `p_status` | `'completed'` hoặc `'failed'` |
    | `p_error_message` | Lỗi nếu thất bại |

    **Luồng xử lý:**

    ```
    1. set_config('app.current_user_id', p_user_id) → audit context
    2. Validate p_amount > 0   → sai thì RETURN
    3. Validate from ≠ to      → sai thì RETURN
    4. Tìm transaction_type_id cho 'transfer'
    5. Lock 2 tài khoản (FOR UPDATE) theo thứ tự UUID nhỏ trước → chống Deadlock
    6. Validate 2 tài khoản tồn tại và status = 'active'
    7. Validate số dư đủ
    8. UPDATE balance: trừ gửi, cộng nhận
    9. INSERT bản ghi vào transactions
    10. CALL kết thúc → PostgreSQL auto-COMMIT
    ```

    **Kỹ thuật chống Deadlock (UUID sort order):**

    ```sql
    -- Luôn khóa tài khoản có UUID nhỏ hơn trước
    IF p_from_account_id < p_to_account_id THEN
        SELECT ... FROM accounts WHERE id = p_from_account_id FOR UPDATE;
        SELECT ... FROM accounts WHERE id = p_to_account_id FOR UPDATE;
    ELSE
        SELECT ... FROM accounts WHERE id = p_to_account_id FOR UPDATE;
        SELECT ... FROM accounts WHERE id = p_from_account_id FOR UPDATE;
    END IF;
    ```

    Nếu 2 giao dịch A→B và B→A chạy cùng lúc mà không có thứ tự khóa nhất quán, chúng sẽ chờ nhau mãi (Deadlock). Luôn khóa UUID nhỏ trước → cả 2 giao dịch đều chờ một tài khoản duy nhất → không bao giờ kẹt nhau.

    ---

    ### `sp_deposit_money` — Nạp tiền

    **Luồng xử lý:**

    ```
    1. set_config('app.current_user_id', p_user_id) → audit context
    2. Validate p_amount > 0  → sai thì RETURN
    3. Tìm transaction_type_id cho 'deposit'
    4. Lock tài khoản (FOR UPDATE)
    5. Validate tài khoản tồn tại và active
    6. UPDATE balance = balance + p_amount
    7. INSERT transactions: from_account_id = NULL (tiền đến từ bên ngoài)
    8. CALL kết thúc → PostgreSQL auto-COMMIT
    ```

    ```sql
    -- from_account_id = NULL nghĩa là tiền đến từ bên ngoài hệ thống
    INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference)
    VALUES (NULL, p_account_id, v_deposit_type_id, p_amount, 'completed', p_reference);
    ```

    ---

    ### `sp_withdraw_money` — Rút tiền

    **Luồng xử lý:**

    ```
    1. set_config('app.current_user_id', p_user_id) → audit context
    2. Validate p_amount > 0  → sai thì RETURN
    3. Tìm transaction_type_id cho 'withdrawal'
    4. Lock tài khoản (FOR UPDATE)
    5. Validate tài khoản tồn tại và active
    6. Validate số dư >= p_amount   ← khác với Deposit
    7. UPDATE balance = balance - p_amount
    8. INSERT transactions: to_account_id = NULL (tiền ra khỏi hệ thống)
    9. CALL kết thúc → PostgreSQL auto-COMMIT
    ```

    ```sql
    -- Kiểm tra số dư — Deposit không có bước này
    IF v_balance < p_amount THEN
        p_error_message := 'Insufficient funds.';
        RETURN;
    END IF;

    -- to_account_id = NULL nghĩa là tiền ra khỏi hệ thống
    INSERT INTO transactions (from_account_id, to_account_id, ...)
    VALUES (p_account_id, NULL, ...);
    ```

    ---

    ### So sánh nhanh 3 procedure

    | Bước | Transfer | Deposit | Withdraw |
    |------|----------|---------|----------|
    | Số tài khoản khóa | 2 (theo UUID order) | 1 | 1 |
    | Check balance | from đủ không | Không | Có |
    | from_account_id | Có | NULL | Có |
    | to_account_id | Có | Có | NULL |

    ---

    ## Trigger Function — `fn_audit_log_trigger`

    ### Mục đích

    Tự động ghi log mọi thay đổi trên các bảng nhạy cảm. Chạy ngầm, không cần gọi thủ công.

    ### Biến đặc biệt của Trigger

    | Biến | Giá trị ví dụ | Ý nghĩa |
    |------|--------------|---------|
    | `TG_OP` | `'INSERT'` / `'UPDATE'` / `'DELETE'` | Loại thao tác |
    | `TG_TABLE_NAME` | `'accounts'` | Tên bảng đang bị tác động |
    | `NEW` | `{id: ..., balance: 1500, ...}` | Dữ liệu mới — INSERT/UPDATE |
    | `OLD` | `{id: ..., balance: 1000, ...}` | Dữ liệu cũ — UPDATE/DELETE |

    ### Cơ chế lấy User ID từ session

    ```sql
    BEGIN
        v_user_id := current_setting('app.current_user_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;  -- Chạy SQL trực tiếp không qua backend → NULL
    END;
    ```

    Stored Procedure tự thiết lập audit context ngay đầu bằng:
    ```sql
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    -- true = LOCAL, chỉ có hiệu lực trong transaction hiện tại
    ```

    ### Logic ghi log theo từng loại thao tác

    | Thao tác | old_data | new_data |
    |----------|----------|----------|
    | INSERT | — | Có |
    | UPDATE | Có | Có |
    | DELETE | Có | — |

    ```sql
    IF v_action = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, v_action, v_new_data, v_user_id);
        RETURN NEW;   -- BẮT BUỘC để thao tác gốc tiếp tục

    ELSIF v_action = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        INSERT INTO audit_logs (..., old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, v_action, v_old_data, v_new_data, v_user_id);
        RETURN NEW;

    ELSIF v_action = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, v_action, v_old_data, v_user_id);
        RETURN OLD;   -- BẮT BUỘC khi DELETE
    END IF;
    ```

    ---

    ## Các Trigger được gắn

    ```sql
    -- accounts: INSERT + UPDATE + DELETE
    CREATE TRIGGER trg_audit_accounts
    AFTER INSERT OR UPDATE OR DELETE ON accounts
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

    -- users: INSERT + UPDATE + DELETE
    CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

    -- transactions: chỉ UPDATE + DELETE (INSERT do procedure kiểm soát)
    CREATE TRIGGER trg_audit_transactions
    AFTER UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

    -- loans: INSERT + UPDATE + DELETE
    CREATE TRIGGER trg_audit_loans
    AFTER INSERT OR UPDATE OR DELETE ON loans
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();
    ```

    **Tại sao transactions không có `INSERT`?** INSERT vào transactions luôn đi qua procedure (deposit/withdraw/transfer) — đã được kiểm soát chặt. Nhưng UPDATE hoặc DELETE một giao dịch đã tồn tại là hành động đáng ngờ → cần log.

    ---

    ## View — `vw_user_transaction_summary`

    Trả về thống kê tổng hợp cho mỗi tài khoản: số giao dịch, tổng tiền nhận, tổng tiền gửi.

    ```sql
    CREATE OR REPLACE VIEW vw_user_transaction_summary AS
    SELECT
        u.id AS user_id, u.username, u.full_name,
        a.account_number, a.balance,
        COUNT(t.id) AS total_transactions,
        SUM(CASE WHEN t.to_account_id = a.id   THEN t.amount ELSE 0 END) AS total_received,
        SUM(CASE WHEN t.from_account_id = a.id THEN t.amount ELSE 0 END) AS total_sent
    FROM users u
    JOIN accounts a ON u.id = a.user_id
    LEFT JOIN transactions t
        ON (a.id = t.from_account_id OR a.id = t.to_account_id)
        AND t.status = 'completed'
    GROUP BY u.id, u.username, u.full_name, a.account_number, a.balance;
    ```

    ---

    ## Luồng đầy đủ — Deposit

    ```
    [Frontend] Nhấn Deposit
            ↓
    [Backend - accountController.js]
        pool.query('CALL sp_deposit_money($1, $2, $3, $4, NULL, NULL, NULL)', [accountId, amount, ref, req.user.id])
            ↓
    [PostgreSQL]
        PERFORM set_config('app.current_user_id', 'abc-123', true)  ← audit context
        SELECT ... FOR UPDATE  ← khóa hàng
        UPDATE accounts SET balance = balance + p_amount
            ↓ trigger tự động kích hoạt
        [trg_audit_accounts → fn_audit_log_trigger()]
            v_user_id ← current_setting('app.current_user_id')
            INSERT INTO audit_logs (changed_by='abc-123', ...)
            RETURN NEW
        INSERT INTO transactions (from_account_id=NULL, ...)
        CALL kết thúc → PostgreSQL auto-COMMIT
            ↓
    [Backend] Đọc p_status = 'completed' → HTTP 200
            ↓
    [Frontend] "Deposit completed!"

    --- Nếu lỗi ---
        EXCEPTION WHEN OTHERS → RAISE
        PostgreSQL tự ROLLBACK
        p_status = 'failed'
        Backend → HTTP 400
    ```

    ---

    ## Tóm tắt nhanh

    | Câu hỏi | Trả lời |
    |---------|---------|
    | Procedure có dùng COMMIT không? | **Không** — PostgreSQL auto-commit khi CALL kết thúc |
    | Lỗi validation dùng gì? | `RETURN` thay vì `ROLLBACK` |
    | Exception handler dùng gì? | `RAISE` thay vì `ROLLBACK` — PostgreSQL tự rollback |
    | Tại sao sắp xếp UUID khi lock? | Tránh Deadlock khi chuyển tiền 2 chiều đồng thời |
    | Tại sao dùng `FOR UPDATE`? | Khóa hàng ngăn 2 giao dịch đồng thời sửa cùng tài khoản |
    | Ai gọi trigger? | PostgreSQL tự gọi — không cần lệnh thủ công |
    | Audit context được set ở đâu? | Trong procedure qua `set_config('app.current_user_id', p_user_id)` |
    | Backend cần quản lý transaction không? | **Không** — chỉ cần `pool.query('CALL sp_...')` |

---

## V2 — 5 bảng mới (bổ sung)

### Tổng quan

| Bảng | Mục đích |
|------|----------|
| `notifications` | Thông báo cho user (transaction, loan, security) |
| `sessions` | Quản lý phiên đăng nhập |
| `cards` | Thẻ ngân hàng (debit/virtual) |
| `bill_payments` | Thanh toán hóa đơn |
| `scheduled_payments` | Giao dịch định kỳ |

### RLS Policies

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments ENABLE ROW LEVEL SECURITY;

-- Policy pattern chung: user_id = app.current_user_id
CREATE POLICY notification_owner_policy ON notifications
    FOR ALL TO bank_app_user
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY session_owner_policy ON sessions
    FOR ALL TO bank_app_user
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY card_owner_policy ON cards
    FOR ALL TO bank_app_user
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY bill_payment_owner_policy ON bill_payments
    FOR ALL TO bank_app_user
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY scheduled_payment_owner_policy ON scheduled_payments
    FOR ALL TO bank_app_user
    USING (user_id = current_setting('app.current_user_id')::UUID);
```

### Audit Triggers cho 5 bảng mới

```sql
-- notifications
CREATE TRIGGER trg_audit_notifications
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- sessions
CREATE TRIGGER trg_audit_sessions
AFTER INSERT OR UPDATE OR DELETE ON sessions
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- cards
CREATE TRIGGER trg_audit_cards
AFTER INSERT OR UPDATE OR DELETE ON cards
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- bill_payments
CREATE TRIGGER trg_audit_bill_payments
AFTER INSERT OR UPDATE OR DELETE ON bill_payments
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- scheduled_payments
CREATE TRIGGER trg_audit_scheduled_payments
AFTER INSERT OR UPDATE OR DELETE ON scheduled_payments
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();
```

### Pattern Controller — Notifications

```javascript
// notificationController.js
const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
```

### Pattern Controller — Cards

```javascript
// cardController.js
const createCard = async (req, res) => {
  try {
    const { accountId, cardType } = req.body;
    
    // Verify account ownership
    const accCheck = await pool.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, req.user.id]
    );
    if (accCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Generate card hash
    const cardHash = crypto.randomBytes(4).toString('hex').toUpperCase();
    const lastFour = cardHash.slice(0, 4);
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO cards (user_id, account_id, card_number_hash, last_four,
                          card_type, expiry_month, expiry_year, daily_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, account_id, last_four, card_type, status`,
      [req.user.id, accountId, cardHash, lastFour, cardType,
       now.getMonth() + 1, now.getFullYear() + 3, 50000000]
    );

    res.status(201).json({ message: 'Card created', card: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
```

### Tóm tắt V2

| Câu hỏi | Trả lời |
|---------|---------|
| 5 bảng mới có RLS không? | **Có** — tất cả đều enable RLS với policy `user_id = app.current_user_id` |
| Audit trigger cho 5 bảng? | **Có** — `trg_audit_notifications`, `sessions`, `cards`, `bill_payments`, `scheduled_payments` |
| Cards lưu số thế nào? | **Hash bcrypt** — không lưu plain text, chỉ hiển thị `last_four` |
| Scheduled payments xóa kiểu gì? | **Soft delete** — `UPDATE status = 'cancelled'`, không hard delete |
| Bill payments cần check gì? | **Số dư** trước khi thanh toán |