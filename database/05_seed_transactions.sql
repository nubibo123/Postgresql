-- 05_seed_transactions.sql
-- Tạo ~100 giao dịch mẫu (transfer, deposit, withdrawal) cho các tài khoản hiện có
-- Chạy sau khi đã có users và accounts trong database

DO $$
DECLARE
    -- Lấy danh sách account IDs hiện có
    v_accounts     UUID[];
    v_acc_count    INTEGER;
    v_from_id      UUID;
    v_to_id        UUID;
    v_amount       NUMERIC;
    v_ref          TEXT;
    v_type_id      INTEGER;
    v_transfer_tid INTEGER;
    v_deposit_tid  INTEGER;
    v_withdraw_tid INTEGER;
    i              INTEGER;
    v_rand_type    INTEGER;

    -- Danh sách nội dung chuyển khoản mẫu
    v_references   TEXT[] := ARRAY[
        'Thanh toán tiền điện tháng 5',
        'Chuyển tiền học phí',
        'Hoàn tiền bạn bè',
        'Mua sắm online',
        'Ăn uống cuối tuần',
        'Thanh toán tiền thuê nhà',
        'Chuyển tiền sinh hoạt',
        'Nộp bảo hiểm',
        'Trả nợ bạn',
        'Đặt cọc xe',
        'Phí dịch vụ',
        'Mua sách học',
        'Chuyển tiền du lịch',
        'Thanh toán gym',
        'Tiền thưởng cuối năm'
    ];
    v_deposit_refs  TEXT[] := ARRAY[
        'Nạp tiền từ ATM',
        'Nhận lương tháng 5',
        'Tiền thưởng dự án',
        'Thu nhập freelance',
        'Tiền bán hàng online',
        'Nhận tiền từ gia đình',
        'Hoàn tiền từ đối tác',
        'Thu nhập thêm'
    ];
    v_withdraw_refs TEXT[] := ARRAY[
        'Rút tiền mặt ATM',
        'Chi tiêu cá nhân',
        'Thanh toán tiền mặt',
        'Mua đồ ăn',
        'Chi phí đi lại',
        'Mua thuốc',
        'Chi phí khám bệnh'
    ];

BEGIN
    -- Lấy transaction type IDs
    SELECT id INTO v_transfer_tid  FROM transaction_types WHERE name = 'transfer';
    SELECT id INTO v_deposit_tid   FROM transaction_types WHERE name = 'deposit';
    SELECT id INTO v_withdraw_tid  FROM transaction_types WHERE name = 'withdrawal';

    -- Lấy tất cả account IDs đang active
    SELECT ARRAY(SELECT id FROM accounts WHERE status = 'active' ORDER BY created_at)
    INTO v_accounts;

    v_acc_count := array_length(v_accounts, 1);

    IF v_acc_count IS NULL OR v_acc_count = 0 THEN
        RAISE EXCEPTION 'Không tìm thấy account nào trong database. Hãy tạo user và account trước.';
    END IF;

    RAISE NOTICE 'Tìm thấy % accounts. Bắt đầu tạo dữ liệu mẫu...', v_acc_count;

    -- Tạo 30 giao dịch DEPOSIT đầu tiên (nạp tiền để các account có số dư)
    FOR i IN 1..30 LOOP
        v_to_id  := v_accounts[1 + (i % v_acc_count)];
        v_amount := (50 + floor(random() * 950))::NUMERIC;
        v_ref    := v_deposit_refs[1 + (i % array_length(v_deposit_refs, 1))];

        INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference, created_at)
        VALUES (
            NULL,
            v_to_id,
            v_deposit_tid,
            v_amount,
            'completed',
            v_ref,
            NOW() - (random() * INTERVAL '90 days')
        );

        UPDATE accounts
        SET balance    = balance + v_amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_to_id;
    END LOOP;

    RAISE NOTICE 'Đã tạo 30 giao dịch DEPOSIT';

    -- Tạo 60 giao dịch TRANSFER
    FOR i IN 1..60 LOOP
        -- Chọn ngẫu nhiên tài khoản gửi và nhận (đảm bảo khác nhau)
        v_from_id := v_accounts[1 + (floor(random() * v_acc_count))::INTEGER % v_acc_count];
        v_to_id   := v_accounts[1 + (floor(random() * v_acc_count))::INTEGER % v_acc_count];

        -- Đảm bảo không chuyển cho chính mình
        WHILE v_from_id = v_to_id LOOP
            v_to_id := v_accounts[1 + (floor(random() * v_acc_count))::INTEGER % v_acc_count];
        END LOOP;

        -- Kiểm tra tài khoản gửi có đủ tiền không (tối thiểu $10)
        IF (SELECT balance FROM accounts WHERE id = v_from_id) < 10 THEN
            CONTINUE;  -- Bỏ qua nếu không đủ tiền
        END IF;

        -- Số tiền: 10 - 500, không vượt quá 80% số dư
        v_amount := LEAST(
            (10 + floor(random() * 490))::NUMERIC,
            (SELECT balance * 0.8 FROM accounts WHERE id = v_from_id)
        );

        v_ref := v_references[1 + (i % array_length(v_references, 1))];

        INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference, created_at)
        VALUES (
            v_from_id,
            v_to_id,
            v_transfer_tid,
            v_amount,
            'completed',
            v_ref,
            NOW() - (random() * INTERVAL '60 days')
        );

        UPDATE accounts SET balance = balance - v_amount, updated_at = CURRENT_TIMESTAMP WHERE id = v_from_id;
        UPDATE accounts SET balance = balance + v_amount, updated_at = CURRENT_TIMESTAMP WHERE id = v_to_id;
    END LOOP;

    RAISE NOTICE '✓ Đã tạo các giao dịch TRANSFER';

    -- Tạo 10 giao dịch WITHDRAWAL
    FOR i IN 1..10 LOOP
        v_from_id := v_accounts[1 + (i % v_acc_count)];
        v_amount  := (20 + floor(random() * 180))::NUMERIC;  -- $20 - $200
        v_ref     := v_withdraw_refs[1 + (i % array_length(v_withdraw_refs, 1))];

        -- Chỉ rút nếu đủ tiền
        IF (SELECT balance FROM accounts WHERE id = v_from_id) >= v_amount THEN
            INSERT INTO transactions (from_account_id, to_account_id, type_id, amount, status, reference, created_at)
            VALUES (
                v_from_id,
                NULL,
                v_withdraw_tid,
                v_amount,
                'completed',
                v_ref,
                NOW() - (random() * INTERVAL '30 days')
            );

            UPDATE accounts
            SET balance    = balance - v_amount,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_from_id;
        END IF;
    END LOOP;

    RAISE NOTICE ' Đã tạo 10 giao dịch WITHDRAWAL';
    RAISE NOTICE ' Hoàn thành! Tổng cộng ~100 giao dịch mẫu đã được tạo.';

    -- Hiển thị tóm tắt
    RAISE NOTICE '--- Tóm tắt ---';
    RAISE NOTICE 'Tổng giao dịch: %', (SELECT COUNT(*) FROM transactions);
    RAISE NOTICE 'Tổng deposit:   %', (SELECT COUNT(*) FROM transactions WHERE type_id = v_deposit_tid);
    RAISE NOTICE 'Tổng transfer:  %', (SELECT COUNT(*) FROM transactions WHERE type_id = v_transfer_tid);
    RAISE NOTICE 'Tổng withdraw:  %', (SELECT COUNT(*) FROM transactions WHERE type_id = v_withdraw_tid);

END;
$$;
