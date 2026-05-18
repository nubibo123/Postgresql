const pool = require('../config/db');

const getScheduledPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.*, fa.account_number as from_account_number, ta.account_number as to_account_number
       FROM scheduled_payments sp
       LEFT JOIN accounts fa ON sp.from_account_id = fa.id
       LEFT JOIN accounts ta ON sp.to_account_id = ta.id
       WHERE sp.user_id = $1 AND sp.status != 'cancelled'
       ORDER BY sp.next_execution_date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createScheduledPayment = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, toAccountNumber, toAccountName, amount, description, frequency } = req.body;

    if (!fromAccountId || !amount || !frequency) {
      return res.status(400).json({ message: 'fromAccountId, amount, and frequency are required' });
    }

    const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({ message: `frequency must be one of: ${validFrequencies.join(', ')}` });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Verify ownership of from account
    const accCheck = await pool.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [fromAccountId, req.user.id]
    );
    if (accCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Calculate next execution date
    const today = new Date();
    let nextDate = new Date(today);
    switch (frequency) {
      case 'daily':
        nextDate.setDate(today.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(today.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(today.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(today.getMonth() + 1);
        break;
    }

    // If toAccountId provided, verify ownership
    if (toAccountId) {
      const toAccCheck = await pool.query('SELECT id FROM accounts WHERE id = $1', [toAccountId]);
      if (toAccCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Destination account not found' });
      }
    }

    const result = await pool.query(
      `INSERT INTO scheduled_payments
         (user_id, from_account_id, to_account_id, to_account_number, to_account_name,
          amount, description, frequency, next_execution_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
       RETURNING *`,
      [
        req.user.id, fromAccountId, toAccountId || null,
        toAccountNumber || null, toAccountName || null,
        amount, description || null, frequency,
        nextDate.toISOString().split('T')[0],
      ]
    );

    res.status(201).json({
      message: 'Scheduled payment created',
      scheduled: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateScheduledPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, frequency, nextExecutionDate, status } = req.body;

    const check = await pool.query(
      'SELECT id FROM scheduled_payments WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Scheduled payment not found' });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (amount !== undefined) {
      values.push(amount);
      fields.push(`amount = $${idx++}`);
    }
    if (frequency !== undefined) {
      const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
      if (!validFrequencies.includes(frequency)) {
        return res.status(400).json({ message: `frequency must be one of: ${validFrequencies.join(', ')}` });
      }
      values.push(frequency);
      fields.push(`frequency = $${idx++}`);
    }
    if (nextExecutionDate !== undefined) {
      values.push(nextExecutionDate);
      fields.push(`next_execution_date = $${idx++}`);
    }
    if (status !== undefined) {
      if (!['active', 'paused', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Status must be active, paused, or cancelled' });
      }
      values.push(status);
      fields.push(`status = $${idx++}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE scheduled_payments SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json({ message: 'Scheduled payment updated', scheduled: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteScheduledPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE scheduled_payments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status != 'cancelled'
       RETURNING id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Scheduled payment not found' });
    }

    res.json({ message: 'Scheduled payment cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getScheduledPayments,
  createScheduledPayment,
  updateScheduledPayment,
  deleteScheduledPayment,
};