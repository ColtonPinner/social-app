require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const sourceUrl = process.env.SUPABASE_DATABASE_URL;
const targetUrl = process.env.CLOUDFLARE_DATABASE_URL || process.env.DATABASE_URL;
const tempPassword = process.env.MIGRATION_TEMP_PASSWORD || 'ChangeMe123!';

if (!sourceUrl) {
  throw new Error('SUPABASE_DATABASE_URL is required');
}

if (!targetUrl) {
  throw new Error('CLOUDFLARE_DATABASE_URL (or DATABASE_URL) is required');
}

const sourcePool = new Pool({ connectionString: sourceUrl });
const targetPool = new Pool({ connectionString: targetUrl });

async function hasTable(pool, schema, table) {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = $2
     LIMIT 1`,
    [schema, table]
  );
  return Boolean(result.rows.length);
}

async function hasColumn(pool, schema, table, column) {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
     LIMIT 1`,
    [schema, table, column]
  );
  return Boolean(result.rows.length);
}

function isNumericId(value) {
  return typeof value === 'string' && /^\d+$/.test(value);
}

async function migrateUsers(targetClient) {
  const hasProfiles = await hasTable(sourcePool, 'public', 'profiles');
  if (!hasProfiles) {
    return { migrated: 0, skipped: 0 };
  }

  const sourceUsers = await sourcePool.query(
    `SELECT
       p.id::text AS id,
       p.username,
       p.full_name,
       p.avatar_url,
       p.created_at,
       au.email
     FROM public.profiles p
     LEFT JOIN auth.users au ON au.id = p.id`
  );

  const passwordHash = await bcrypt.hash(tempPassword, 10);
  let migrated = 0;
  let skipped = 0;

  for (const row of sourceUsers.rows) {
    if (!row.id || !row.username) {
      skipped += 1;
      continue;
    }

    const email = (row.email || `${row.id}@migrated.local`).toLowerCase();

    await targetClient.query(
      `INSERT INTO users (id, email, password_hash, username, full_name, avatar_url, created_at)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, NOW()))
       ON CONFLICT (id)
       DO UPDATE SET
         email = EXCLUDED.email,
         username = EXCLUDED.username,
         full_name = EXCLUDED.full_name,
         avatar_url = EXCLUDED.avatar_url`,
      [
        row.id,
        email,
        passwordHash,
        row.username,
        row.full_name || null,
        row.avatar_url || null,
        row.created_at || null,
      ]
    );

    migrated += 1;
  }

  return { migrated, skipped };
}

async function migrateFollows(targetClient) {
  const hasFollows = await hasTable(sourcePool, 'public', 'follows');
  if (!hasFollows) {
    return { migrated: 0 };
  }

  const sourceFollows = await sourcePool.query(
    `SELECT follower_id::text, following_id::text, created_at
     FROM public.follows`
  );

  let migrated = 0;

  for (const row of sourceFollows.rows) {
    await targetClient.query(
      `INSERT INTO follows (follower_id, following_id, created_at)
       VALUES ($1::uuid, $2::uuid, COALESCE($3::timestamptz, NOW()))
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [row.follower_id, row.following_id, row.created_at || null]
    );
    migrated += 1;
  }

  return { migrated };
}

async function migratePosts(targetClient) {
  const hasPosts = await hasTable(sourcePool, 'public', 'posts');
  if (!hasPosts) {
    return { migrated: 0, idMap: new Map() };
  }

  const sourcePosts = await sourcePool.query(
    `SELECT
       id::text AS source_id,
       user_id::text AS user_id,
       text,
       image_url,
       images,
       created_at
     FROM public.posts
     ORDER BY created_at ASC`
  );

  const idMap = new Map();
  let migrated = 0;

  for (const row of sourcePosts.rows) {
    const images = Array.isArray(row.images)
      ? row.images.filter(Boolean)
      : row.image_url
        ? [row.image_url]
        : [];

    if (isNumericId(row.source_id)) {
      const sourceIdNum = Number(row.source_id);
      await targetClient.query(
        `INSERT INTO posts (id, user_id, text, images, created_at)
         VALUES ($1, $2::uuid, $3, $4::jsonb, COALESCE($5::timestamptz, NOW()))
         ON CONFLICT (id)
         DO UPDATE SET
           text = EXCLUDED.text,
           images = EXCLUDED.images,
           created_at = EXCLUDED.created_at`,
        [sourceIdNum, row.user_id, row.text || '', JSON.stringify(images), row.created_at || null]
      );
      idMap.set(row.source_id, sourceIdNum);
    } else {
      const insertResult = await targetClient.query(
        `INSERT INTO posts (user_id, text, images, created_at)
         VALUES ($1::uuid, $2, $3::jsonb, COALESCE($4::timestamptz, NOW()))
         RETURNING id`,
        [row.user_id, row.text || '', JSON.stringify(images), row.created_at || null]
      );
      idMap.set(row.source_id, insertResult.rows[0].id);
    }

    migrated += 1;
  }

  return { migrated, idMap };
}

async function migrateComments(targetClient, postIdMap) {
  const hasComments = await hasTable(sourcePool, 'public', 'comments');
  if (!hasComments) {
    return { migrated: 0, skipped: 0 };
  }

  const postRefColumn =
    (await hasColumn(sourcePool, 'public', 'comments', 'post_id'))
      ? 'post_id'
      : (await hasColumn(sourcePool, 'public', 'comments', 'tweet_id'))
        ? 'tweet_id'
        : null;

  if (!postRefColumn) {
    return { migrated: 0, skipped: 0 };
  }

  const sourceComments = await sourcePool.query(
    `SELECT id::text AS source_id,
            ${postRefColumn}::text AS source_post_id,
            user_id::text AS user_id,
            content,
            created_at
     FROM public.comments
     ORDER BY created_at ASC`
  );

  let migrated = 0;
  let skipped = 0;

  for (const row of sourceComments.rows) {
    const mappedPostId = postIdMap.get(row.source_post_id);
    if (!mappedPostId) {
      skipped += 1;
      continue;
    }

    if (isNumericId(row.source_id)) {
      await targetClient.query(
        `INSERT INTO comments (id, post_id, user_id, content, created_at)
         VALUES ($1, $2, $3::uuid, $4, COALESCE($5::timestamptz, NOW()))
         ON CONFLICT (id)
         DO UPDATE SET
           content = EXCLUDED.content,
           created_at = EXCLUDED.created_at`,
        [Number(row.source_id), mappedPostId, row.user_id, row.content || '', row.created_at || null]
      );
    } else {
      await targetClient.query(
        `INSERT INTO comments (post_id, user_id, content, created_at)
         VALUES ($1, $2::uuid, $3, COALESCE($4::timestamptz, NOW()))`,
        [mappedPostId, row.user_id, row.content || '', row.created_at || null]
      );
    }

    migrated += 1;
  }

  return { migrated, skipped };
}

async function migrateLikes(targetClient, postIdMap) {
  const hasLikes = await hasTable(sourcePool, 'public', 'post_likes');
  if (!hasLikes) {
    return { migrated: 0, skipped: 0 };
  }

  const postRefColumn =
    (await hasColumn(sourcePool, 'public', 'post_likes', 'post_id'))
      ? 'post_id'
      : (await hasColumn(sourcePool, 'public', 'post_likes', 'content_id'))
        ? 'content_id'
        : null;

  if (!postRefColumn) {
    return { migrated: 0, skipped: 0 };
  }

  const sourceLikes = await sourcePool.query(
    `SELECT ${postRefColumn}::text AS source_post_id,
            user_id::text AS user_id,
            created_at
     FROM public.post_likes`
  );

  let migrated = 0;
  let skipped = 0;

  for (const row of sourceLikes.rows) {
    const mappedPostId = postIdMap.get(row.source_post_id);
    if (!mappedPostId) {
      skipped += 1;
      continue;
    }

    await targetClient.query(
      `INSERT INTO post_likes (post_id, user_id, created_at)
       VALUES ($1, $2::uuid, COALESCE($3::timestamptz, NOW()))
       ON CONFLICT (post_id, user_id) DO NOTHING`,
      [mappedPostId, row.user_id, row.created_at || null]
    );

    migrated += 1;
  }

  return { migrated, skipped };
}

async function resetSequences(targetClient) {
  await targetClient.query(`
    SELECT setval(pg_get_serial_sequence('posts', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM posts), 1), true);
  `);
  await targetClient.query(`
    SELECT setval(pg_get_serial_sequence('comments', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM comments), 1), true);
  `);
  await targetClient.query(`
    SELECT setval(pg_get_serial_sequence('post_likes', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM post_likes), 1), true);
  `);
  await targetClient.query(`
    SELECT setval(pg_get_serial_sequence('follows', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM follows), 1), true);
  `);
}

async function run() {
  const targetClient = await targetPool.connect();
  try {
    console.log('Starting migration: Supabase -> Cloudflare Postgres');
    await targetClient.query('BEGIN');

    const users = await migrateUsers(targetClient);
    console.log(`Users migrated: ${users.migrated}, skipped: ${users.skipped}`);

    const follows = await migrateFollows(targetClient);
    console.log(`Follows migrated: ${follows.migrated}`);

    const posts = await migratePosts(targetClient);
    console.log(`Posts migrated: ${posts.migrated}`);

    const comments = await migrateComments(targetClient, posts.idMap);
    console.log(`Comments migrated: ${comments.migrated}, skipped: ${comments.skipped}`);

    const likes = await migrateLikes(targetClient, posts.idMap);
    console.log(`Likes migrated: ${likes.migrated}, skipped: ${likes.skipped}`);

    await resetSequences(targetClient);
    await targetClient.query('COMMIT');

    console.log('Migration completed successfully');
    console.log('Important: migrated users get a temporary password from MIGRATION_TEMP_PASSWORD.');
  } catch (error) {
    await targetClient.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    targetClient.release();
    await sourcePool.end();
    await targetPool.end();
  }
}

run();
