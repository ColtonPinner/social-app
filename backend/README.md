# Backend (Node + PostgreSQL)

This is the Phase 1 backend replacing Supabase for MVP auth + feed.

## Endpoints

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/feed` (Bearer token)
- `POST /api/posts` (Bearer token)
- `DELETE /api/posts/:postId` (Bearer token, owner only)
- `GET /api/posts/:postId/comments` (Bearer token)
- `POST /api/posts/:postId/comments` (Bearer token)
- `GET /api/posts/:postId/likes` (Bearer token)
- `POST /api/posts/:postId/likes` (Bearer token)
- `DELETE /api/posts/:postId/likes` (Bearer token)

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Create database tables:

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

3. Install and run:

```bash
yarn install
yarn dev
```

Default API URL is `http://localhost:4000`.

## Migrate data from Supabase to Cloudflare Postgres

This backend expects PostgreSQL. If your Cloudflare deployment uses a PostgreSQL connection string, you can migrate core data with:

```bash
# from repo root
cp backend/.env.example backend/.env

# set SUPABASE_DATABASE_URL and CLOUDFLARE_DATABASE_URL in backend/.env

# make sure target schema exists first
psql "$CLOUDFLARE_DATABASE_URL" -f backend/sql/schema.sql

# run migration
yarn --cwd backend migrate:supabase-to-cloudflare
```

What the script migrates:
- `profiles` (+ `auth.users.email`) -> `users`
- `follows` -> `follows`
- `posts` -> `posts` (maps `image_url`/`images`)
- `comments` -> `comments` (`post_id` or legacy `tweet_id`)
- `post_likes` -> `post_likes` (`post_id` or legacy `content_id`)

Important:
- Migrated users get a temporary password (`MIGRATION_TEMP_PASSWORD`) because Supabase Auth password flow is different.
- For Cloudflare D1 (SQLite), this script will not work as-is; it is PostgreSQL-only.
