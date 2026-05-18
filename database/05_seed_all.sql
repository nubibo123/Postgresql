-- 05_seed_all.sql
-- Seed toàn bộ dữ liệu mẫu cho SecureBank (users, accounts + tất cả bảng)
-- Chạy được ngay sau khi schema đã được tạo (01_schema.sql, 02_security.sql, 03_functions_triggers.sql)
-- Bcrypt hash cho password: 'password123' → $2b$10$i0qk9dN6drBtJ3a/tG4QzeLc5TuTR83Vbg/TXdtWAHalmTfvxRun2

DO $$
DECLARE
        v_new_user_id UUID;
        v_new_acc_id  UUID;
        v_year         INTEGER;
        v_month        INTEGER;
        v_idx          INTEGER;
        v_i            INTEGER;
        v_acc          UUID;
        v_user_id      UUID;
        v_from_id      UUID;
        v_to_id        UUID;
        v_amount       NUMERIC;
        v_acc_count    INTEGER;
        v_user_count   INTEGER;

    -- Config arrays
    v_devices       TEXT[] := ARRAY['Chrome on Windows','Safari on iPhone','Firefox on macOS','Chrome on Android','Safari on iPad'];
    v_notif_types   TEXT[] := ARRAY['info','transaction','loan','security'];
    v_notif_titles  TEXT[] := ARRAY[
        'Giao dịch thành công','Thanh toán hóa đơn tháng này',
        'Cảnh báo đăng nhập lạ','Nhắc nhở thanh toán khoản vay',
        'Khuyến mãi: Giảm phí chuyển tiền','Tài khoản của bạn đã được nạp tiền',
        'Xác nhận đổi mật khẩu thành công','Thông báo bảo trì hệ thống'
    ];
    v_billers       TEXT[] := ARRAY['ELEC001','WATER001','INT001','PHONE001','TV001','INS001'];
    v_biller_names  TEXT[] := ARRAY['EVN','SAVA','VNPT','VIETTEL','FPT','Bảo Việt'];
    v_frequencies   TEXT[] := ARRAY['daily','weekly','biweekly','monthly'];
    v_transfer_refs TEXT[] := ARRAY[
        'Thanh toán tiền điện','Chuyển tiền học phí','Hoàn tiền bạn bè',
        'Mua sắm online','Ăn uống cuối tuần','Thanh toán tiền thuê nhà',
        'Chuyển tiền sinh hoạt','Nộp bảo hiểm','Trả nợ bạn','Đặt cọc xe'
    ];
    v_deposit_refs  TEXT[] := ARRAY[
        'Nạp tiền từ ATM','Nhận lương tháng','Tiền thưởng dự án',
        'Thu nhập freelance','Tiền bán hàng online','Nhận tiền từ gia đình'
    ];
    v_withdraw_refs TEXT[] := ARRAY[
        'Rút tiền mặt ATM','Chi tiêu cá nhân','Mua đồ ăn','Chi phí đi lại'
    ];

    -- Transaction type IDs
    v_transfer_tid  INTEGER;
    v_deposit_tid   INTEGER;
    v_withdraw_tid  INTEGER;

    -- Bcrypt hash cho 'password123'
    v_pass_hash     TEXT := '$2b$10$i0qk9dN6drBtJ3a/tG4QzeLc5TuTR83Vbg/TXdtWAHalmTfvxRun2';
BEGIN
    RAISE NOTICE '=== Bat dau seed SecureBank ===';

    -- Clean existing data (preserve roles/transaction_types)
    DELETE FROM scheduled_payments;
    DELETE FROM bill_payments;
    DELETE FROM cards;
    DELETE FROM notifications;
    DELETE FROM sessions;
    DELETE FROM transactions;
    DELETE FROM loans;
    DELETE FROM accounts;
    DELETE FROM user_roles;
    DELETE FROM users WHERE username NOT IN ('postgres','admin');

    -- Get transaction type IDs
    SELECT id INTO v_transfer_tid FROM transaction_types WHERE name = 'transfer';
    SELECT id INTO v_deposit_tid  FROM transaction_types WHERE name = 'deposit';
    SELECT id INTO v_withdraw_tid FROM transaction_types WHERE name = 'withdrawal';

    -- ========================================
    -- PHASE 1: Tạo 10 users + accounts
    -- ========================================
    RAISE NOTICE '[1] Tao 10 users...';

    FOR v_i IN 1..10 LOOP
        INSERT INTO users (username, password_hash, full_name, status)
        VALUES (
            'user' || v_i,
            v_pass_hash,
            CASE v_i
                WHEN 1 THEN 'Nguyen Van An'
                WHEN 2 THEN 'Tran Thi Bich'
                WHEN 3 THEN 'Le Van Chi'
                WHEN 4 THEN 'Pham Van Duc'
                WHEN 5 THEN 'Hoang Thi Em'
                WHEN 6 THEN 'Vo Van Fe'
                WHEN 7 THEN 'Dang Van Giang'
                WHEN 8 THEN 'Bui Thi Hong'
                WHEN 9 THEN 'Do Van It'
                WHEN 10 THEN 'Cao Thi Lan'
            END,
            'active'
        ) RETURNING id INTO v_new_user_id;
        RAISE NOTICE '  - Da tao user%', v_i;
    END LOOP;

    -- Assign customer role to all users
    INSERT INTO user_roles (user_id, role_id)
    SELECT id, (SELECT id FROM roles WHERE name = 'customer') FROM users WHERE username LIKE 'user%'
    ON CONFLICT DO NOTHING;

    -- Tạo account cho mỗi user (10 accounts)
    RAISE NOTICE '[2] Tao accounts...';
    INSERT INTO accounts (user_id, account_number, balance, currency, status)
    SELECT id,
           'SB' || LPAD(ROW_NUMBER() OVER(ORDER BY created_at)::TEXT, 4, '0') || '-' ||
           LPAD((random()*99999999)::INTEGER::TEXT, 8, '0') || '-' ||
           LPAD((random()*99)::INTEGER::TEXT, 2, '0'),
           0, 'VND', 'active'
    FROM users WHERE username LIKE 'user%' ORDER BY created_at;

    v_acc_count  := (SELECT COUNT(*) FROM accounts);
    v_user_count := (SELECT COUNT(*) FROM users WHERE username LIKE 'user%');
    RAISE NOTICE '  - % users + % accounts da tao', v_user_count, v_acc_count;

    -- ========================================
    -- PHASE 2: Seed transactions (deposit trước để account có số dư)
    -- ========================================
    RAISE NOTICE '[3] Seed transactions...';

    -- 30 DEPOSITS
    FOR v_acc, v_user_id IN
        SELECT a.id, a.user_id FROM accounts a ORDER BY a.created_at
    LOOP
        v_amount := (50 + (random() * 450)::NUMERIC);
        INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference, created_at)
        VALUES (NULL, v_acc, v_deposit_tid, v_amount, 'completed',
                v_deposit_refs[1 + (floor(random() * array_length(v_deposit_refs, 1)))::INTEGER],
                NOW() - (random() * INTERVAL '90 days'));
        UPDATE accounts SET balance = balance + v_amount WHERE id = v_acc;
    END LOOP;
    RAISE NOTICE '  - 30 deposits';

    -- 60 TRANSFERS (random pair of accounts)
    FOR v_i IN 1..60 LOOP
        SELECT id INTO v_from_id FROM accounts WHERE status = 'active' ORDER BY random() LIMIT 1;
        SELECT id INTO v_to_id FROM accounts WHERE id != v_from_id AND status = 'active' ORDER BY random() LIMIT 1;
        IF (SELECT balance FROM accounts WHERE id = v_from_id) < 10 THEN CONTINUE; END IF;
        v_amount := LEAST((10 + (random() * 490)::NUMERIC), (SELECT balance * 0.8 FROM accounts WHERE id = v_from_id));
        INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference, created_at)
        VALUES (v_from_id, v_to_id, v_transfer_tid, v_amount, 'completed',
                v_transfer_refs[1 + (floor(random() * array_length(v_transfer_refs, 1)))::INTEGER],
                NOW() - (random() * INTERVAL '60 days'));
        UPDATE accounts SET balance = balance - v_amount WHERE id = v_from_id;
        UPDATE accounts SET balance = balance + v_amount WHERE id = v_to_id;
    END LOOP;
    RAISE NOTICE '  - 60 transfers';

    -- 10 WITHDRAWALS
    FOR v_acc IN SELECT id FROM accounts WHERE status = 'active' ORDER BY created_at LIMIT 10
    LOOP
        v_amount := (20 + (random() * 180)::NUMERIC);
        IF (SELECT balance FROM accounts WHERE id = v_acc) >= v_amount THEN
            INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference, created_at)
            VALUES (v_acc, NULL, v_withdraw_tid, v_amount, 'completed',
                    v_withdraw_refs[1 + (floor(random() * array_length(v_withdraw_refs, 1)))::INTEGER],
                    NOW() - (random() * INTERVAL '30 days'));
            UPDATE accounts SET balance = balance - v_amount WHERE id = v_acc;
        END IF;
    END LOOP;
    RAISE NOTICE '  - 10 withdrawals';

    -- ========================================
    -- PHASE 3: Seed loans (5 loans cho random users)
    -- ========================================
    RAISE NOTICE '[4] Seed loans...';
    FOR v_i IN 1..5 LOOP
        SELECT a.id, a.user_id INTO v_acc, v_user_id
        FROM accounts a ORDER BY random() LIMIT 1;
        INSERT INTO loans (user_id, account_id, principal, interest_rate, term_months, start_date, end_date, status)
        VALUES (
            v_user_id, v_acc,
            ((50 + (random() * 950))::NUMERIC) * 1000,
            (8 + (random() * 8))::NUMERIC(5,2),
            6 + (floor(random() * 24))::INTEGER,
            NOW()::DATE - INTERVAL '6 months',
            NOW()::DATE + INTERVAL '6 months',
            CASE WHEN random() > 0.3 THEN 'active' ELSE 'closed' END
        );
    END LOOP;
    RAISE NOTICE '  - 5 loans';

    -- ========================================
    -- PHASE 4: Seed notifications (3-5/user)
    -- ========================================
    RAISE NOTICE '[5] Seed notifications...';
    FOR v_user_id IN SELECT id FROM users WHERE username LIKE 'user%' ORDER BY created_at LOOP
        FOR v_i IN 1..(3 + (floor(random() * 3))::INTEGER) LOOP
            INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
            VALUES (
                v_user_id,
                v_notif_types[1 + (floor(random() * 4))::INTEGER],
                v_notif_titles[1 + (floor(random() * 8))::INTEGER],
                'Thong bao tu he thong SecureBank.',
                random() > 0.4,
                NOW() - (random() * INTERVAL '30 days')
            );
        END LOOP;
    END LOOP;

    -- ========================================
    -- PHASE 5: Seed sessions (1-2 per user)
    -- ========================================
    RAISE NOTICE '[6] Seed sessions...';
    FOR v_user_id IN SELECT id FROM users WHERE username LIKE 'user%' ORDER BY created_at LOOP
        FOR v_i IN 1..(1 + (floor(random() * 2))::INTEGER) LOOP
            INSERT INTO sessions (user_id, token_hash, ip_address, device_name, is_active, expires_at)
            VALUES (
                v_user_id,
                md5(random()::TEXT || clock_timestamp()::TEXT),
                '192.168.' || (floor(random() * 255))::INTEGER::TEXT || '.' || (floor(random() * 255))::INTEGER::TEXT,
                v_devices[1 + (floor(random() * 5))::INTEGER],
                TRUE,
                NOW() + INTERVAL '30 days'
            );
        END LOOP;
    END LOOP;

    -- ========================================
    -- PHASE 6: Seed cards (1-2 per account)
    -- ========================================
    RAISE NOTICE '[7] Seed cards...';
    FOR v_acc, v_user_id IN
        SELECT a.id, a.user_id FROM accounts a WHERE a.status = 'active' ORDER BY a.created_at
    LOOP
        FOR v_i IN 1..(1 + (floor(random() * 2))::INTEGER) LOOP
            v_year  := (EXTRACT(YEAR FROM NOW()) + 1 + (floor(random() * 3)))::INTEGER;
            v_month := (1 + (floor(random() * 12)))::INTEGER;
            INSERT INTO cards (user_id, account_id, card_number_hash, last_four, card_type, status, expiry_month, expiry_year, daily_limit)
            VALUES (
                v_user_id, v_acc,
                upper(md5(random()::TEXT || clock_timestamp()::TEXT)),
                LPAD((floor(random() * 10000))::INTEGER::TEXT, 4, '0'),
                CASE WHEN random() > 0.3 THEN 'debit' ELSE 'virtual' END,
                CASE WHEN random() > 0.2 THEN 'active' ELSE 'blocked' END,
                v_month, v_year, 50000000
            );
        END LOOP;
    END LOOP;

    -- ========================================
    -- PHASE 7: Seed bill_payments (50 bản ghi)
    -- ========================================
    RAISE NOTICE '[8] Seed bill_payments...';
    FOR v_i IN 1..50 LOOP
        SELECT a.id, a.user_id INTO v_acc, v_user_id
        FROM accounts a ORDER BY random() LIMIT 1;
        v_idx    := (1 + (floor(random() * 6))::INTEGER);
        v_amount := ((50 + (random() * 900))::NUMERIC) * 1000;
        INSERT INTO bill_payments (user_id, account_id, bill_type, biller_code, biller_name, customer_ref, amount, fee, status, paid_at, created_at)
        VALUES (
            v_user_id, v_acc,
            CASE v_billers[v_idx]
                WHEN 'ELEC001' THEN 'electricity'
                WHEN 'WATER001' THEN 'water'
                WHEN 'INT001'   THEN 'internet'
                WHEN 'PHONE001' THEN 'phone'
                WHEN 'TV001'    THEN 'tv'
                ELSE 'insurance'
            END,
            v_billers[v_idx], v_biller_names[v_idx],
            LPAD((floor(random() * 100000000))::INTEGER::TEXT, 10, '0'),
            v_amount, 5000,
            CASE WHEN random() > 0.2 THEN 'completed' ELSE 'pending' END,
            CASE WHEN random() > 0.2 THEN NOW() - (random() * INTERVAL '30 days') ELSE NULL END,
            NOW() - (random() * INTERVAL '30 days')
        );
    END LOOP;

    -- ========================================
    -- PHASE 8: Seed scheduled_payments (20 bản ghi)
    -- ========================================
    RAISE NOTICE '[9] Seed scheduled_payments...';
    FOR v_i IN 1..20 LOOP
        SELECT a.id, a.user_id INTO v_acc, v_user_id
        FROM accounts a ORDER BY random() LIMIT 1;
        SELECT id INTO v_to_id FROM accounts WHERE id != v_acc ORDER BY random() LIMIT 1;
        v_idx    := (1 + (floor(random() * 4))::INTEGER);
        v_amount := ((20 + (random() * 180))::NUMERIC) * 1000;
        INSERT INTO scheduled_payments (user_id, from_account_id, to_account_id, to_account_number, to_account_name, amount, description, frequency, next_execution_date, status)
        VALUES (
            v_user_id, v_acc, v_to_id,
            LPAD((floor(random() * 100000000))::INTEGER::TEXT, 10, '0'),
            'Nguoi nhan #' || (floor(random() * 100))::INTEGER::TEXT,
            v_amount, 'Chuyen tien dinh ky tu SecureBank',
            v_frequencies[v_idx],
            NOW()::DATE + CASE v_frequencies[v_idx] WHEN 'daily' THEN 1 WHEN 'weekly' THEN 7 WHEN 'biweekly' THEN 14 ELSE 30 END,
            CASE
                WHEN random() > 0.4 THEN 'active'
                WHEN random() > 0.5 THEN 'paused'
                ELSE 'cancelled'
            END
        );
    END LOOP;

    -- ========================================
    -- SUMMARY
    -- ========================================
    RAISE NOTICE '';
    RAISE NOTICE '=== Hoan thanh seed ===';
    RAISE NOTICE 'users:               %', (SELECT COUNT(*) FROM users WHERE username LIKE 'user%');
    RAISE NOTICE 'accounts:            %', (SELECT COUNT(*) FROM accounts);
    RAISE NOTICE 'transactions:         %', (SELECT COUNT(*) FROM transactions);
    RAISE NOTICE 'loans:                %', (SELECT COUNT(*) FROM loans);
    RAISE NOTICE 'notifications:        %', (SELECT COUNT(*) FROM notifications);
    RAISE NOTICE 'sessions:             %', (SELECT COUNT(*) FROM sessions);
    RAISE NOTICE 'cards:                %', (SELECT COUNT(*) FROM cards);
    RAISE NOTICE 'bill_payments:        %', (SELECT COUNT(*) FROM bill_payments);
    RAISE NOTICE 'scheduled_payments:   %', (SELECT COUNT(*) FROM scheduled_payments);
    RAISE NOTICE '';
    RAISE NOTICE 'So du tai khoan (top 5):';
    RAISE NOTICE '%', (SELECT string_agg(username || ': ' || balance::TEXT, ' | ')
                       FROM (SELECT u.username, a.balance FROM accounts a JOIN users u ON a.user_id = u.id ORDER BY a.balance DESC LIMIT 5) t);
END;
$$;