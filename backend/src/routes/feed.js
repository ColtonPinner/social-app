const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const result = await pool.query(
      `SELECT p.id, p.user_id, p.text, p.images, p.created_at,
              u.username, u.full_name, u.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1
          OR p.user_id IN (
            SELECT following_id FROM follows WHERE follower_id = $1
          )
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [currentUserId]
    );

    const items = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      text: row.text,
      images: row.images || [],
      created_at: row.created_at,
      user: {
        id: row.user_id,
        username: row.username,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
      },
    }));

    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

module.exports = router;
