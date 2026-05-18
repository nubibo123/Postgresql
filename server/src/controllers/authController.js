const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const registerUser = async (req, res) => {
  const { username, password, full_name } = req.body;

  try {
    // 1. Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Start a database transaction to insert user, role, and initial account
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert user
      const userResult = await client.query(
        'INSERT INTO users (username, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, username, full_name',
        [username, password_hash, full_name]
      );
      const user = userResult.rows[0];

      // Assign 'customer' role
      const roleResult = await client.query("SELECT id FROM roles WHERE name = 'customer'");
      const roleId = roleResult.rows[0].id;
      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user.id, roleId]);

      // Create an initial account
      const accountNumber = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      await client.query(
        'INSERT INTO accounts (user_id, account_number, balance) VALUES ($1, $2, $3)',
        [user.id, accountNumber, 0] // Start with 0 balance
      );

      await client.query('COMMIT');

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: 'customer',
        token,
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN user_roles ur ON u.id = ur.user_id 
       JOIN roles r ON ur.role_id = r.id 
       WHERE u.username = $1`,
      [username]
    );

    const user = userResult.rows[0];
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Account is locked' });
      }

      // Record successful login
      await pool.query(
        'INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES ($1, $2, $3, $4)',
        [user.id, ipAddress, userAgent, true]
      );

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role_name },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name,
        token,
      });
    } else {
      // Record failed login attempt if user exists
      if (user) {
         await pool.query(
          'INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES ($1, $2, $3, $4)',
          [user.id, ipAddress, userAgent, false]
        );
      }
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { registerUser, loginUser };
