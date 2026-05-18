const pool = require('../config/db');

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
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read', notification: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createNotification = async (userId, type, title, message) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)`,
      [userId, type, title, message]
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};