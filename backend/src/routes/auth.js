const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { signToken, requireAuth } = require('../auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, username, fullName } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'email, password, and username are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, full_name, avatar_url, created_at`,
      [email.toLowerCase(), passwordHash, username, fullName || null]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    return res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, username, full_name, avatar_url, created_at, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.id, email: user.email });
    const { password_hash: _, ...safeUser } = user;

    return res.json({ user: safeUser, token });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, full_name, avatar_url, created_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
