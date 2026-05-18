const crypto = require('crypto');
const pool = require('../config/db');

const getCards = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.account_id, c.last_four, c.card_type, c.status,
              c.expiry_month, c.expiry_year, c.daily_limit, c.created_at,
              a.account_number, a.balance
       FROM cards c
       JOIN accounts a ON c.account_id = a.id
       WHERE c.user_id = $1 AND c.status != 'cancelled'
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getCardById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.id, c.account_id, c.last_four, c.card_type, c.status,
              c.expiry_month, c.expiry_year, c.daily_limit, c.created_at,
              a.account_number
       FROM cards c
       JOIN accounts a ON c.account_id = a.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createCard = async (req, res) => {
  try {
    const { accountId, cardType } = req.body;

    if (!accountId || !cardType) {
      return res.status(400).json({ message: 'accountId and cardType are required' });
    }

    if (!['debit', 'virtual'].includes(cardType)) {
      return res.status(400).json({ message: 'cardType must be debit or virtual' });
    }

    // Check account ownership
    const accCheck = await pool.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, req.user.id]
    );
    if (accCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Generate card hash (8 random hex chars)
    const cardHash = crypto.randomBytes(4).toString('hex').toUpperCase();
    // 4 last digits
    const lastFour = cardHash.slice(0, 4);
    // Expiry: current year + 3
    const now = new Date();
    const expiryMonth = now.getMonth() + 1;
    const expiryYear = now.getFullYear() + 3;
    const dailyLimit = 50000000;

    const result = await pool.query(
      `INSERT INTO cards (user_id, account_id, card_number_hash, last_four,
                          card_type, expiry_month, expiry_year, daily_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, account_id, last_four, card_type, status, expiry_month, expiry_year, daily_limit, created_at`,
      [req.user.id, accountId, cardHash, lastFour, cardType, expiryMonth, expiryYear, dailyLimit]
    );

    res.status(201).json({
      message: 'Card created successfully',
      card: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateCardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or blocked' });
    }

    const result = await pool.query(
      `UPDATE cards SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 AND status != 'cancelled'
       RETURNING id, account_id, last_four, card_type, status, expiry_month, expiry_year`,
      [status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.json({ message: 'Card status updated', card: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE cards SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status != 'cancelled'
       RETURNING id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.json({ message: 'Card cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getCards,
  getCardById,
  createCard,
  updateCardStatus,
  deleteCard,
};