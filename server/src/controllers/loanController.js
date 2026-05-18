const pool = require('../config/db');

// @desc    Get all loans for current user
// @route   GET /api/loans
// @access  Private
const getLoans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, a.account_number
       FROM loans l
       JOIN accounts a ON l.account_id = a.id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Apply for a loan
// @route   POST /api/loans
// @access  Private
const applyLoan = async (req, res) => {
  const { accountId, principal, interestRate, termMonths, startDate } = req.body;

  if (!accountId || !principal || !interestRate || !termMonths || !startDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (principal <= 0 || interestRate < 0 || termMonths <= 0) {
    return res.status(400).json({ message: 'Invalid loan parameters' });
  }

  try {
    // Verify account belongs to the user
    const accountCheck = await pool.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, req.user.id]
    );
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found or not authorized' });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + parseInt(termMonths));

    const result = await pool.query(
      `INSERT INTO loans (user_id, account_id, principal, interest_rate, term_months, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, accountId, principal, interestRate, termMonths, start, end]
    );

    res.status(201).json({ message: 'Loan application submitted', loan: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update loan status
// @route   PATCH /api/loans/:id
// @access  Private
const updateLoanStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'closed', 'defaulted'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const check = await pool.query(
      'SELECT id FROM loans WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const result = await pool.query(
      'UPDATE loans SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({ message: 'Loan status updated', loan: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a loan
// @route   DELETE /api/loans/:id
// @access  Private
const deleteLoan = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query(
      'SELECT id FROM loans WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    await pool.query('DELETE FROM loans WHERE id = $1', [id]);
    res.json({ message: 'Loan deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getLoans, applyLoan, updateLoanStatus, deleteLoan };