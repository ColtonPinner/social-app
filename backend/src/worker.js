const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function base64UrlEncode(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeToBytes(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function hmacSha256(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
}

async function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const signature = await hmacSha256(secret, data);
  const signatureB64 = base64UrlEncode(signature);
  return `${data}.${signatureB64}`;
}

async function verifyJwt(token, secret) {
  const [headerB64, payloadB64, signatureB64] = String(token || '').split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) return null;

  const data = `${headerB64}.${payloadB64}`;
  const expectedSignature = await hmacSha256(secret, data);
  const expectedB64 = base64UrlEncode(expectedSignature);

  if (expectedB64 !== signatureB64) return null;

  const payloadBytes = base64UrlDecodeToBytes(payloadB64);
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}

async function hashPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 120000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

async function createPasswordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  return `${base64UrlEncode(salt)}:${base64UrlEncode(hash)}`;
}

async function verifyPassword(password, stored) {
  const [saltEncoded, hashEncoded] = String(stored || '').split(':');
  if (!saltEncoded || !hashEncoded) return false;

  const salt = base64UrlDecodeToBytes(saltEncoded);
  const expectedHash = base64UrlDecodeToBytes(hashEncoded);
  const computedHash = await hashPassword(password, salt);

  if (expectedHash.length !== computedHash.length) return false;
  for (let index = 0; index < expectedHash.length; index += 1) {
    if (expectedHash[index] !== computedHash[index]) return false;
  }
  return true;
}

async function getAuthedUser(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);
  return verifyJwt(token, env.JWT_SECRET);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleRegister(request, env) {
  const body = await readJson(request);
  const email = String(body.email || '').toLowerCase().trim();
  const password = String(body.password || '');
  const username = String(body.username || '').trim();
  const fullName = body.fullName ? String(body.fullName).trim() : null;

  if (!email || !password || !username) {
    return json({ error: 'email, password, and username are required' }, 400);
  }

  try {
    const userId = crypto.randomUUID();
    const passwordHash = await createPasswordHash(password);

    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, username, full_name)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(userId, email, passwordHash, username, fullName)
      .run();

    const userResult = await env.DB.prepare(
      `SELECT id, email, username, full_name, avatar_url, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`
    )
      .bind(userId)
      .first();

    const token = await signJwt(
      {
        userId,
        email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      env.JWT_SECRET
    );

    return json({ user: userResult, token }, 201);
  } catch (error) {
    if (String(error.message || '').includes('UNIQUE')) {
      return json({ error: 'Email or username already exists' }, 409);
    }
    return json({ error: 'Failed to register user' }, 500);
  }
}

async function handleLogin(request, env) {
  const body = await readJson(request);
  const email = String(body.email || '').toLowerCase().trim();
  const password = String(body.password || '');

  if (!email || !password) {
    return json({ error: 'email and password are required' }, 400);
  }

  try {
    const user = await env.DB.prepare(
      `SELECT id, email, username, full_name, avatar_url, created_at, password_hash
       FROM users
       WHERE email = ?
       LIMIT 1`
    )
      .bind(email)
      .first();

    if (!user) {
      return json({ error: 'Invalid credentials' }, 401);
    }

    const matches = await verifyPassword(password, user.password_hash);
    if (!matches) {
      return json({ error: 'Invalid credentials' }, 401);
    }

    const token = await signJwt(
      {
        userId: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      env.JWT_SECRET
    );

    const { password_hash: _passwordHash, ...safeUser } = user;
    return json({ user: safeUser, token });
  } catch {
    return json({ error: 'Failed to login' }, 500);
  }
}

async function handleMe(request, env) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const user = await env.DB.prepare(
    `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, u.created_at,
            cp.picture_url AS cover_image_url
     FROM users u
     LEFT JOIN cover_pictures cp ON cp.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`
  )
    .bind(authed.userId)
    .first();

  if (!user) return json({ error: 'User not found' }, 404);
  return json({ user });
}

async function handleUsersList(request, env) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const url = new URL(request.url);
  const query = String(url.searchParams.get('query') || '').trim();
  const limitRaw = Number(url.searchParams.get('limit') || 20);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);

  let statement;
  if (query) {
    const pattern = `%${query}%`;
    statement = env.DB.prepare(
      `SELECT id, email, username, full_name, avatar_url, created_at
       FROM users
       WHERE id <> ?
         AND (username LIKE ? OR IFNULL(full_name, '') LIKE ?)
       ORDER BY created_at DESC
       LIMIT ?`
    ).bind(authed.userId, pattern, pattern, limit);
  } else {
    statement = env.DB.prepare(
      `SELECT id, email, username, full_name, avatar_url, created_at
       FROM users
       WHERE id <> ?
       ORDER BY created_at DESC
       LIMIT ?`
    ).bind(authed.userId, limit);
  }

  const result = await statement.all();
  return json({ items: result.results || [] });
}

async function handleUserById(request, env, userId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const user = await env.DB.prepare(
    `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, u.created_at,
            cp.picture_url AS cover_image_url
     FROM users u
     LEFT JOIN cover_pictures cp ON cp.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`
  )
    .bind(userId)
    .first();

  if (!user) return json({ error: 'User not found' }, 404);
  return json({ user });
}

function parseImages(imagesText) {
  try {
    const parsed = JSON.parse(imagesText || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function handleFeed(request, env) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const result = await env.DB.prepare(
    `SELECT p.id, p.user_id, p.text, p.images, p.created_at,
            u.id AS author_id, u.username, u.full_name, u.avatar_url
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ?
        OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
     ORDER BY p.created_at DESC
     LIMIT 100`
  )
    .bind(authed.userId, authed.userId)
    .all();

  const items = (result.results || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    text: row.text,
    images: parseImages(row.images),
    created_at: row.created_at,
    user: {
      id: row.author_id,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
    },
  }));

  return json({ items });
}

async function handleCreatePost(request, env) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const body = await readJson(request);
  const text = String(body.text || '').trim();
  const images = Array.isArray(body.images) ? body.images.filter(Boolean).map((item) => String(item)) : [];

  if (!text) {
    return json({ error: 'text is required' }, 400);
  }

  const insertResult = await env.DB.prepare(
    `INSERT INTO posts (user_id, text, images)
     VALUES (?, ?, ?)`
  )
    .bind(authed.userId, text, JSON.stringify(images))
    .run();

  const postId = insertResult.meta?.last_row_id;
  const post = await env.DB.prepare(
    `SELECT p.id, p.user_id, p.text, p.images, p.created_at,
            u.id AS author_id, u.username, u.full_name, u.avatar_url
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = ?
     LIMIT 1`
  )
    .bind(postId)
    .first();

  return json(
    {
      item: {
        id: post.id,
        user_id: post.user_id,
        text: post.text,
        images: parseImages(post.images),
        created_at: post.created_at,
        user: {
          id: post.author_id,
          username: post.username,
          full_name: post.full_name,
          avatar_url: post.avatar_url,
        },
      },
    },
    201
  );
}

async function handleDeletePost(request, env, postId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  if (!Number.isInteger(postId)) {
    return json({ error: 'Invalid post id' }, 400);
  }

  const result = await env.DB.prepare(
    `DELETE FROM posts
     WHERE id = ? AND user_id = ?`
  )
    .bind(postId, authed.userId)
    .run();

  if (!result.meta?.changes) {
    return json({ error: 'Post not found' }, 404);
  }

  return json({ ok: true });
}

async function handleGetComments(request, env, postId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  if (!Number.isInteger(postId)) {
    return json({ error: 'Invalid post id' }, 400);
  }

  const result = await env.DB.prepare(
    `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
            u.id AS commenter_id, u.username, u.full_name, u.avatar_url
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.post_id = ?
     ORDER BY c.created_at DESC`
  )
    .bind(postId)
    .all();

  const items = (result.results || []).map((row) => ({
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

  return json({ items, count: items.length });
}

async function handleCreateComment(request, env, postId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  if (!Number.isInteger(postId)) {
    return json({ error: 'Invalid post id' }, 400);
  }

  const body = await readJson(request);
  const content = String(body.content || '').trim();

  if (!content) {
    return json({ error: 'content is required' }, 400);
  }

  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ? LIMIT 1').bind(postId).first();
  if (!post) {
    return json({ error: 'Post not found' }, 404);
  }

  const insertResult = await env.DB.prepare(
    `INSERT INTO comments (post_id, user_id, content)
     VALUES (?, ?, ?)`
  )
    .bind(postId, authed.userId, content)
    .run();

  const commentId = insertResult.meta?.last_row_id;
  const comment = await env.DB.prepare(
    `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
            u.id AS commenter_id, u.username, u.full_name, u.avatar_url
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = ?
     LIMIT 1`
  )
    .bind(commentId)
    .first();

  return json(
    {
      item: {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          id: comment.commenter_id,
          username: comment.username,
          full_name: comment.full_name,
          avatar_url: comment.avatar_url,
        },
      },
    },
    201
  );
}

async function handleGetLikes(request, env, postId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  if (!Number.isInteger(postId)) {
    return json({ error: 'Invalid post id' }, 400);
  }

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM post_likes
     WHERE post_id = ?`
  )
    .bind(postId)
    .first();

  const likedResult = await env.DB.prepare(
    `SELECT id
     FROM post_likes
     WHERE post_id = ? AND user_id = ?
     LIMIT 1`
  )
    .bind(postId, authed.userId)
    .first();

  return json({
    count: Number(countResult?.count || 0),
    liked: Boolean(likedResult),
  });
}

async function handleLikePost(request, env, postId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  if (!Number.isInteger(postId)) {
    return json({ error: 'Invalid post id' }, 400);
  }

  await env.DB.prepare(
    `INSERT OR IGNORE INTO post_likes (post_id, user_id)
     VALUES (?, ?)`
  )
    .bind(postId, authed.userId)
    .run();

  return json({ ok: true });
}

async function handleUnlikePost(request, env, postId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  if (!Number.isInteger(postId)) {
    return json({ error: 'Invalid post id' }, 400);
  }

  await env.DB.prepare(
    `DELETE FROM post_likes
     WHERE post_id = ? AND user_id = ?`
  )
    .bind(postId, authed.userId)
    .run();

  return json({ ok: true });
}

async function handleUserPosts(request, env, userId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const result = await env.DB.prepare(
    `SELECT p.id, p.user_id, p.text, p.images, p.created_at,
            u.id AS author_id, u.username, u.full_name, u.avatar_url
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`
  )
    .bind(userId)
    .all();

  const items = (result.results || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    text: row.text,
    images: parseImages(row.images),
    created_at: row.created_at,
    user: {
      id: row.author_id,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
    },
  }));

  return json({ items });
}

async function handleUserFollowers(request, env, userId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const result = await env.DB.prepare(
    `SELECT u.id, u.username, u.full_name, u.avatar_url, u.created_at
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC`
  )
    .bind(userId)
    .all();

  const items = result.results || [];
  return json({ items, count: items.length });
}

async function handleUserFollowing(request, env, userId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const result = await env.DB.prepare(
    `SELECT u.id, u.username, u.full_name, u.avatar_url, u.created_at
     FROM follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC`
  )
    .bind(userId)
    .all();

  const items = result.results || [];
  return json({ items, count: items.length });
}

async function handleFollowStatus(request, env, userId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  if (authed.userId === userId) {
    return json({ following: false });
  }

  const result = await env.DB.prepare(
    `SELECT id
     FROM follows
     WHERE follower_id = ? AND following_id = ?
     LIMIT 1`
  )
    .bind(authed.userId, userId)
    .first();

  return json({ following: Boolean(result) });
}

async function handleFollow(request, env, userId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  if (authed.userId === userId) {
    return json({ error: 'Cannot follow yourself' }, 400);
  }

  await env.DB.prepare(
    `INSERT OR IGNORE INTO follows (follower_id, following_id)
     VALUES (?, ?)`
  )
    .bind(authed.userId, userId)
    .run();

  return json({ ok: true });
}

async function handleUnfollow(request, env, userId) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  await env.DB.prepare(
    `DELETE FROM follows
     WHERE follower_id = ? AND following_id = ?`
  )
    .bind(authed.userId, userId)
    .run();

  return json({ ok: true });
}

async function handleUploadImage(request, env) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const body = await readJson(request);
  const contentType = String(body.contentType || '').trim().toLowerCase();
  const dataBase64 = String(body.dataBase64 || '').trim();
  const fileName = String(body.fileName || '').trim();

  if (!contentType || !dataBase64) {
    return json({ error: 'contentType and dataBase64 are required' }, 400);
  }

  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    return json({ error: 'Unsupported image content type' }, 400);
  }

  if (!env.CF_IMAGES_ACCOUNT_ID || !env.CF_IMAGES_API_TOKEN) {
    return json({ error: 'Cloudflare Images is not configured' }, 503);
  }

  let bytes;
  try {
    const binary = atob(dataBase64);
    bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
  } catch {
    return json({ error: 'Invalid base64 image payload' }, 400);
  }

  if (!bytes.length || bytes.length > MAX_IMAGE_SIZE_BYTES) {
    return json({ error: 'Image must be between 1 byte and 5MB' }, 400);
  }

  const ext = contentType.split('/')[1] || 'jpg';
  const safeName = (fileName || `upload-${Date.now()}.${ext}`).replace(/[^a-zA-Z0-9._-]/g, '_');

  const formData = new FormData();
  formData.append('file', new Blob([bytes], { type: contentType }), safeName);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_IMAGES_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CF_IMAGES_API_TOKEN}`,
      },
      body: formData,
    }
  );

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok || !payload?.success) {
    return json(
      {
        error: payload?.errors?.[0]?.message || 'Failed to upload image to Cloudflare Images',
      },
      502
    );
  }

  const image = payload.result;
  const imageUrl = Array.isArray(image?.variants) ? image.variants[0] : null;

  if (!imageUrl) {
    return json({ error: 'Cloudflare Images did not return a usable URL' }, 502);
  }

  return json(
    {
      id: image.id,
      url: imageUrl,
      filename: image.filename,
    },
    201
  );
}

async function handlePatchMe(request, env) {
  const authed = await getAuthedUser(request, env);
  if (!authed?.userId) return json({ error: 'Missing or invalid bearer token' }, 401);

  const body = await readJson(request);
  const hasUsername = body.username !== undefined;
  const hasFullName = body.fullName !== undefined;
  const hasAvatarUrl = body.avatarUrl !== undefined;
  const hasCoverImageUrl = body.coverImageUrl !== undefined;

  const username = hasUsername ? String(body.username || '').trim() : null;
  const fullName = hasFullName ? (body.fullName ? String(body.fullName).trim() : null) : null;
  const avatarUrl = hasAvatarUrl ? (body.avatarUrl ? String(body.avatarUrl).trim() : null) : null;
  const coverImageUrl = hasCoverImageUrl ? (body.coverImageUrl ? String(body.coverImageUrl).trim() : null) : null;

  if (hasUsername && !username) {
    return json({ error: 'username cannot be empty' }, 400);
  }

  try {
    await env.DB.prepare(
      `UPDATE users
       SET username = CASE WHEN ? THEN ? ELSE username END,
           full_name = CASE WHEN ? THEN ? ELSE full_name END,
           avatar_url = CASE WHEN ? THEN ? ELSE avatar_url END
       WHERE id = ?`
    )
      .bind(hasUsername ? 1 : 0, username, hasFullName ? 1 : 0, fullName, hasAvatarUrl ? 1 : 0, avatarUrl, authed.userId)
      .run();

    if (hasCoverImageUrl) {
      if (coverImageUrl) {
        await env.DB.prepare(
          `INSERT INTO cover_pictures (user_id, picture_url, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id) DO UPDATE SET
             picture_url = excluded.picture_url,
             updated_at = CURRENT_TIMESTAMP`
        )
          .bind(authed.userId, coverImageUrl)
          .run();
      } else {
        await env.DB.prepare('DELETE FROM cover_pictures WHERE user_id = ?').bind(authed.userId).run();
      }
    }

    const user = await env.DB.prepare(
      `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, u.created_at,
              cp.picture_url AS cover_image_url
       FROM users u
       LEFT JOIN cover_pictures cp ON cp.user_id = u.id
       WHERE u.id = ?
       LIMIT 1`
    )
      .bind(authed.userId)
      .first();

    return json({ user });
  } catch (error) {
    if (String(error.message || '').includes('UNIQUE')) {
      return json({ error: 'Username already exists' }, 409);
    }
    return json({ error: 'Failed to update user' }, 500);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, runtime: 'cloudflare-worker-d1' });
    }

    if (pathname === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }

    if (pathname === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }

    if (pathname === '/api/auth/me' && request.method === 'GET') {
      return handleMe(request, env);
    }

    if (pathname === '/api/users' && request.method === 'GET') {
      return handleUsersList(request, env);
    }

    if (pathname === '/api/users/me' && request.method === 'PATCH') {
      return handlePatchMe(request, env);
    }

    if (pathname === '/api/feed' && request.method === 'GET') {
      return handleFeed(request, env);
    }

    if (pathname === '/api/posts' && request.method === 'POST') {
      return handleCreatePost(request, env);
    }

    if (pathname === '/api/uploads/image' && request.method === 'POST') {
      return handleUploadImage(request, env);
    }

    const postMatch = pathname.match(/^\/api\/posts\/(\d+)$/);
    if (postMatch && request.method === 'DELETE') {
      return handleDeletePost(request, env, Number(postMatch[1]));
    }

    const commentsMatch = pathname.match(/^\/api\/posts\/(\d+)\/comments$/);
    if (commentsMatch && request.method === 'GET') {
      return handleGetComments(request, env, Number(commentsMatch[1]));
    }
    if (commentsMatch && request.method === 'POST') {
      return handleCreateComment(request, env, Number(commentsMatch[1]));
    }

    const likesMatch = pathname.match(/^\/api\/posts\/(\d+)\/likes$/);
    if (likesMatch && request.method === 'GET') {
      return handleGetLikes(request, env, Number(likesMatch[1]));
    }
    if (likesMatch && request.method === 'POST') {
      return handleLikePost(request, env, Number(likesMatch[1]));
    }
    if (likesMatch && request.method === 'DELETE') {
      return handleUnlikePost(request, env, Number(likesMatch[1]));
    }

    const userPostsMatch = pathname.match(/^\/api\/users\/([^/]+)\/posts$/);
    if (userPostsMatch && request.method === 'GET') {
      return handleUserPosts(request, env, userPostsMatch[1]);
    }

    const userFollowersMatch = pathname.match(/^\/api\/users\/([^/]+)\/followers$/);
    if (userFollowersMatch && request.method === 'GET') {
      return handleUserFollowers(request, env, userFollowersMatch[1]);
    }

    const userFollowingMatch = pathname.match(/^\/api\/users\/([^/]+)\/following$/);
    if (userFollowingMatch && request.method === 'GET') {
      return handleUserFollowing(request, env, userFollowingMatch[1]);
    }

    const followStatusMatch = pathname.match(/^\/api\/users\/([^/]+)\/follow-status$/);
    if (followStatusMatch && request.method === 'GET') {
      return handleFollowStatus(request, env, followStatusMatch[1]);
    }

    const followMatch = pathname.match(/^\/api\/users\/([^/]+)\/follow$/);
    if (followMatch && request.method === 'POST') {
      return handleFollow(request, env, followMatch[1]);
    }
    if (followMatch && request.method === 'DELETE') {
      return handleUnfollow(request, env, followMatch[1]);
    }

    const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && request.method === 'GET') {
      return handleUserById(request, env, userMatch[1]);
    }

    return json({ error: 'Not found' }, 404);
  },
};