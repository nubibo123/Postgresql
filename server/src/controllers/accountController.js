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

module.exports = { getAccounts, getTransactions, transferMoney, depositMoney, withdrawMoney };
