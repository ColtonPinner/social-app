const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res) => {
  const { text, images } = req.body;

  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];

  try {
    const result = await pool.query(
      `INSERT INTO posts (user_id, text, images)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, user_id, text, images, created_at`,
      [req.user.userId, String(text).trim(), JSON.stringify(safeImages)]
    );

    const userResult = await pool.query(
      `SELECT id, username, full_name, avatar_url FROM users WHERE id = $1 LIMIT 1`,
      [req.user.userId]
    );

    const post = result.rows[0];
    const user = userResult.rows[0] || null;

    return res.status(201).json({
      item: {
        ...post,
        images: post.images || [],
        user,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

router.delete('/:postId', async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id`,
      [postId, req.user.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

router.get('/:postId/comments', async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  try {
    const result = await pool.query(
      `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
              u.id AS commenter_id, u.username, u.full_name, u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC`,
      [postId]
    );

    const items = result.rows.map((row) => ({
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      user: {
        id: row.commenter_id,
        username: row.username,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
      },
    }));

    return res.json({ items, count: items.length });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:postId/comments', async (req, res) => {
  const postId = Number(req.params.postId);
  const { content } = req.body;

  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  try {
    const postResult = await pool.query('SELECT id FROM posts WHERE id = $1 LIMIT 1', [postId]);
    if (!postResult.rows.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, post_id, user_id, content, created_at`,
      [postId, req.user.userId, String(content).trim()]
    );

    const userResult = await pool.query(
      `SELECT id, username, full_name, avatar_url FROM users WHERE id = $1 LIMIT 1`,
      [req.user.userId]
    );

    const comment = result.rows[0];

    return res.status(201).json({
      item: {
        ...comment,
        user: userResult.rows[0] || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create comment' });
  }
});

router.get('/:postId/likes', async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id = $1`,
      [postId]
    );

    const likedResult = await pool.query(
      `SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1`,
      [postId, req.user.userId]
    );

    return res.json({
      count: countResult.rows[0]?.count || 0,
      liked: Boolean(likedResult.rows.length),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

router.post('/:postId/likes', async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  try {
    await pool.query(
      `INSERT INTO post_likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING`,
      [postId, req.user.userId]
    );

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to like post' });
  }
});

router.delete('/:postId/likes', async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  try {
    await pool.query(
      `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, req.user.userId]
    );

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unlike post' });
  }
});

module.exports = router;
