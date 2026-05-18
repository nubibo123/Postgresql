const pool = require('../config/db');

// @desc    Get user accounts and balance
// @route   GET /api/accounts
// @access  Private
const getAccounts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, account_number, balance, currency, status, created_at FROM accounts WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get transaction history for an account
// @route   GET /api/accounts/:accountId/transactions
// @access  Private
const getTransactions = async (req, res) => {
  const { accountId } = req.params;

  try {
    const accountCheck = await pool.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, req.user.id]
    );

    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found or not authorized' });
    }

    const result = await pool.query(
      `SELECT t.id, t.amount, t.status, t.reference, t.created_at, tt.name as type,
        (SELECT account_number FROM accounts WHERE id = t.from_account_id) as from_account,
        (SELECT account_number FROM accounts WHERE id = t.to_account_id) as to_account
       FROM transactions t
       JOIN transaction_types tt ON t.type_id = tt.id
       WHERE t.from_account_id = $1 OR t.to_account_id = $1
       ORDER BY t.created_at DESC LIMIT 50`,
      [accountId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Transfer money
// @route   POST /api/accounts/transfer
// @access  Private
const transferMoney = async (req, res) => {
  const { fromAccountId, toAccountNumber, amount, reference } = req.body;

  try {
    // Verify fromAccount belongs to the user
    const accountCheck = await pool.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [fromAccountId, req.user.id]
    );
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Source account not found or not authorized' });
    }

    // Find toAccountId by account number
    const cleanToAccountNumber = toAccountNumber.replace(/\s+/g, '');
    const targetAccountResult = await pool.query(
      'SELECT id FROM accounts WHERE account_number = $1',
      [cleanToAccountNumber]
    );
    if (targetAccountResult.rows.length === 0) {
      return res.status(404).json({ message: 'Destination account not found' });
    }

    const toAccountId = targetAccountResult.rows[0].id;

    // Call procedure — transaction (BEGIN/COMMIT/ROLLBACK) is managed inside the SQL procedure
    const result = await pool.query(
      'CALL sp_transfer_money($1, $2, $3, $4, $5, NULL, NULL, NULL)',
      [fromAccountId, toAccountId, amount, reference || 'Transfer', req.user.id]
    );

    const { p_transaction_id, p_status, p_error_message } = result.rows[0];

    if (p_status === 'completed') {
      res.status(200).json({ message: 'Transfer successful', transactionId: p_transaction_id });
    } else {
      res.status(400).json({ message: p_error_message || 'Transfer failed' });
    }

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Deposit money
// @route   POST /api/accounts/deposit
// @access  Private
const depositMoney = async (req, res) => {
  const { accountId, amount, reference } = req.body;

  try {
    const accountCheck = await pool.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, req.user.id]
    );
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found or not authorized' });
    }

    // Call procedure — transaction is managed inside the SQL procedure
    const result = await pool.query(
      'CALL sp_deposit_money($1, $2, $3, $4, NULL, NULL, NULL)',
      [accountId, amount, reference || 'Deposit', req.user.id]
    );

    const { p_transaction_id, p_status, p_error_message } = result.rows[0];

    if (p_status === 'completed') {
      res.status(200).json({ message: 'Deposit successful', transactionId: p_transaction_id });
    } else {
      res.status(400).json({ message: p_error_message || 'Deposit failed' });
    }

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Withdraw money
// @route   POST /api/accounts/withdraw
// @access  Private
const withdrawMoney = async (req, res) => {
  const { accountId, amount, reference } = req.body;

  try {
    const accountCheck = await pool.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, req.user.id]
    );
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found or not authorized' });
    }

    // Call procedure — transaction is managed inside the SQL procedure
    const result = await pool.query(
      'CALL sp_withdraw_money($1, $2, $3, $4, NULL, NULL, NULL)',
      [accountId, amount, reference || 'Withdrawal', req.user.id]
    );

    const { p_transaction_id, p_status, p_error_message } = result.rows[0];

    if (p_status === 'completed') {
      res.status(200).json({ message: 'Withdrawal successful', transactionId: p_transaction_id });
    } else {
      res.status(400).json({ message: p_error_message || 'Withdrawal failed' });
    }

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get recent transactions across all user accounts (dashboard widget)
// @route   GET /api/accounts/recent-transactions
// @access  Private
const getRecentTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.amount, t.status, t.reference, t.created_at,
              tt.name AS type,
              fa.account_number AS from_account,
              ta.account_number AS to_account,
              CASE
                WHEN t.from_account_id = ANY(SELECT id FROM accounts WHERE user_id = $1) THEN 'debit'
                ELSE 'credit'
              END AS direction
       FROM transactions t
       JOIN transaction_types tt ON t.type_id = tt.id
       LEFT JOIN accounts fa ON fa.id = t.from_account_id
       LEFT JOIN accounts ta ON ta.id = t.to_account_id
       WHERE t.from_account_id IN (SELECT id FROM accounts WHERE user_id = $1)
          OR t.to_account_id   IN (SELECT id FROM accounts WHERE user_id = $1)
       ORDER BY t.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('getRecentTransactions error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get monthly income/expense summary + 6-month cashflow data
// @route   GET /api/accounts/summary
// @access  Private
const getSummary = async (req, res) => {
  // Vietnamese abbreviated month names
  const VI_MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

  try {
    // Current month income (credit to user accounts)
    const incomeRes = await pool.query(
      `SELECT COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       WHERE t.to_account_id IN (SELECT id FROM accounts WHERE user_id = $1)
         AND t.status = 'completed'
         AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', NOW())`,
      [req.user.id]
    );

    // Current month expense (debit from user accounts)
    const expenseRes = await pool.query(
      `SELECT COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       WHERE t.from_account_id IN (SELECT id FROM accounts WHERE user_id = $1)
         AND t.status = 'completed'
         AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', NOW())`,
      [req.user.id]
    );

    // 6-month cashflow — use EXTRACT to get month number reliably
    const cashflowRes = await pool.query(
      `SELECT
         EXTRACT(MONTH FROM DATE_TRUNC('month', t.created_at))::int AS month_num,
         EXTRACT(YEAR  FROM DATE_TRUNC('month', t.created_at))::int AS year_num,
         DATE_TRUNC('month', t.created_at) AS month_date,
         COALESCE(SUM(CASE WHEN t.to_account_id   IN (SELECT id FROM accounts WHERE user_id = $1) THEN t.amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN t.from_account_id IN (SELECT id FROM accounts WHERE user_id = $1) THEN t.amount ELSE 0 END), 0) AS expense
       FROM transactions t
       WHERE t.status = 'completed'
         AND t.created_at >= NOW() - INTERVAL '6 months'
         AND (
           t.to_account_id   IN (SELECT id FROM accounts WHERE user_id = $1) OR
           t.from_account_id IN (SELECT id FROM accounts WHERE user_id = $1)
         )
       GROUP BY DATE_TRUNC('month', t.created_at)
       ORDER BY month_date ASC`,
      [req.user.id]
    );

    // Build a full 6-month series (fill months with no data as 0)
    const now = new Date();
    const fullSeries = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mNum = d.getMonth() + 1; // 1-12
      const yNum = d.getFullYear();
      const found = cashflowRes.rows.find(
        r => r.month_num === mNum && r.year_num === yNum
      );
      fullSeries.push({
        month:  VI_MONTHS[mNum - 1],
        income:  found ? parseFloat(found.income)  : 0,
        actual:  found ? parseFloat(found.expense) : 0,
      });
    }

    res.json({
      monthlyIncome:  parseFloat(incomeRes.rows[0].total),
      monthlyExpense: parseFloat(expenseRes.rows[0].total),
      cashflow: fullSeries,
    });
  } catch (error) {
    console.error('getSummary error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAccounts, getTransactions, transferMoney, depositMoney, withdrawMoney, getRecentTransactions, getSummary };
