const pool = require('../config/db');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.status, u.created_at, r.name as role 
       FROM users u 
       JOIN user_roles ur ON u.id = ur.user_id 
       JOIN roles r ON ur.role_id = r.id 
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get audit logs (Admin only)
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.table_name, a.action, a.changed_at, u.username as changed_by
       FROM audit_logs a
       LEFT JOIN users u ON a.changed_by = u.id
       ORDER BY a.changed_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Lock or Unlock user (Admin only)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'locked'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, status',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all loans (Admin only)
// @route   GET /api/admin/loans
// @access  Private/Admin
const getLoans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.username, u.full_name, a.account_number
       FROM loans l
       JOIN users u ON l.user_id = u.id
       JOIN accounts a ON l.account_id = a.id
       ORDER BY l.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getUsers, getAuditLogs, updateUserStatus, getLoans };
