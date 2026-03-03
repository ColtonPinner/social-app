const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const query = String(req.query.query || '').trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  try {
    const values = [req.user.userId];
    let whereClause = 'WHERE id <> $1';

    if (query) {
      values.push(`%${query}%`);
      whereClause += ` AND (username ILIKE $${values.length} OR COALESCE(full_name, '') ILIKE $${values.length})`;
    }

    values.push(limit);

    const result = await pool.query(
      `SELECT id, email, username, full_name, avatar_url, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${values.length}`,
      values
    );

    return res.json({ items: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:userId/posts', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.id, p.user_id, p.text, p.images, p.created_at,
              u.id AS author_id, u.username, u.full_name, u.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    const items = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      text: row.text,
      images: row.images || [],
      created_at: row.created_at,
      user: {
        id: row.author_id,
        username: row.username,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
      },
    }));

    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

router.get('/:userId/followers', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.created_at
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.json({ items: result.rows, count: result.rows.length });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

router.get('/:userId/following', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.created_at
       FROM follows f
       JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.json({ items: result.rows, count: result.rows.length });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch following' });
  }
});

router.get('/:userId/follow-status', async (req, res) => {
  const { userId } = req.params;

  if (req.user.userId === userId) {
    return res.json({ following: false });
  }

  try {
    const result = await pool.query(
      `SELECT id
       FROM follows
       WHERE follower_id = $1 AND following_id = $2
       LIMIT 1`,
      [req.user.userId, userId]
    );

    return res.json({ following: Boolean(result.rows.length) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch follow status' });
  }
});

router.post('/:userId/follow', async (req, res) => {
  const { userId } = req.params;

  if (req.user.userId === userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [req.user.userId, userId]
    );

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to follow user' });
  }
});

router.delete('/:userId/follow', async (req, res) => {
  const { userId } = req.params;

  try {
    await pool.query(
      `DELETE FROM follows
       WHERE follower_id = $1 AND following_id = $2`,
      [req.user.userId, userId]
    );

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, u.created_at,
              cp.picture_url AS cover_image_url
       FROM users u
       LEFT JOIN cover_pictures cp ON cp.user_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/me', async (req, res) => {
  const { username, fullName, avatarUrl, coverImageUrl } = req.body;

  if (username !== undefined && !String(username).trim()) {
    return res.status(400).json({ error: 'username cannot be empty' });
  }

  try {
    const hasUsername = username !== undefined;
    const hasFullName = fullName !== undefined;
    const hasAvatarUrl = avatarUrl !== undefined;
    const hasCoverImageUrl = coverImageUrl !== undefined;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE users
         SET username = CASE WHEN $2::boolean THEN $3 ELSE username END,
             full_name = CASE WHEN $4::boolean THEN $5 ELSE full_name END,
             avatar_url = CASE WHEN $6::boolean THEN $7 ELSE avatar_url END
         WHERE id = $1
         RETURNING id, email, username, full_name, avatar_url, created_at`,
        [
          req.user.userId,
          hasUsername,
          hasUsername ? String(username).trim() : null,
          hasFullName,
          hasFullName ? (fullName ? String(fullName).trim() : null) : null,
          hasAvatarUrl,
          hasAvatarUrl ? (avatarUrl ? String(avatarUrl).trim() : null) : null,
        ]
      );

      if (!result.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      if (hasCoverImageUrl) {
        const normalizedCoverUrl = coverImageUrl ? String(coverImageUrl).trim() : null;

        if (normalizedCoverUrl) {
          await client.query(
            `INSERT INTO cover_pictures (user_id, picture_url)
             VALUES ($1, $2)
             ON CONFLICT (user_id)
             DO UPDATE SET
               picture_url = EXCLUDED.picture_url,
               updated_at = NOW()`,
            [req.user.userId, normalizedCoverUrl]
          );
        } else {
          await client.query('DELETE FROM cover_pictures WHERE user_id = $1', [req.user.userId]);
        }
      }

      const finalUserResult = await client.query(
        `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, u.created_at,
                cp.picture_url AS cover_image_url
         FROM users u
         LEFT JOIN cover_pictures cp ON cp.user_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [req.user.userId]
      );

      await client.query('COMMIT');

      return res.json({ user: finalUserResult.rows[0] });
    } catch (innerError) {
      await client.query('ROLLBACK').catch(() => {});
      throw innerError;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;