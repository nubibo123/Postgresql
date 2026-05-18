const pool = require('../config/db');

const getBillPayments = async (req, res) => {
  try {
    const { bill_type: billType, status } = req.query;
    let query = `
      SELECT bp.*, a.account_number
      FROM bill_payments bp
      JOIN accounts a ON bp.account_id = a.id
      WHERE bp.user_id = $1
    `;
    const params = [req.user.id];
    const conditions = [];

    if (billType) {
      params.push(billType);
      conditions.push(`bp.bill_type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`bp.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    query += ' ORDER BY bp.created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT bp.*, a.account_number
       FROM bill_payments bp
       JOIN accounts a ON bp.account_id = a.id
       WHERE bp.id = $1 AND bp.user_id = $2`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bill payment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const payBill = async (req, res) => {
  try {
    const { accountId, billType, billerCode, billerName, customerRef, amount, fee } = req.body;

    if (!accountId || !billType || !amount) {
      return res.status(400).json({ message: 'accountId, billType, and amount are required' });
    }

    const validBillTypes = ['electricity', 'water', 'internet', 'phone', 'tv', 'insurance'];
    if (!validBillTypes.includes(billType)) {
      return res.status(400).json({ message: `billType must be one of: ${validBillTypes.join(', ')}` });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Check account ownership
    const accCheck = await pool.query(
      'SELECT id, balance FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, req.user.id]
    );
    if (accCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const totalAmount = amount + (fee || 0);
    if (accCheck.rows[0].balance < totalAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct from account
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [totalAmount, accountId]
      );

      const result = await client.query(
        `INSERT INTO bill_payments
           (user_id, account_id, bill_type, biller_code, biller_name, customer_ref, amount, fee, status, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', CURRENT_TIMESTAMP)
         RETURNING *`,
        [req.user.id, accountId, billType, billerCode, billerName, customerRef, amount, fee || 0]
      );

      await client.query('COMMIT');
      res.status(201).json({
        message: 'Bill payment successful',
        bill: result.rows[0],
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getBillPayments,
  getBillById,
  payBill,
};