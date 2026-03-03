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
- `GET /api/users` (Bearer token, optional `query` and `limit`)
- `GET /api/users/:userId` (Bearer token)
- `PATCH /api/users/me` (Bearer token)
- `GET /api/users/:userId/posts` (Bearer token)
- `GET /api/users/:userId/followers` (Bearer token)
- `GET /api/users/:userId/following` (Bearer token)
- `GET /api/users/:userId/follow-status` (Bearer token)
- `POST /api/users/:userId/follow` (Bearer token)
- `DELETE /api/users/:userId/follow` (Bearer token)
- `POST /api/uploads/image` (Bearer token, uploads to Cloudflare Images)

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Create database tables:

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

Cloudflare Images upload support requires:

- `CF_IMAGES_ACCOUNT_ID`
- `CF_IMAGES_API_TOKEN`

3. Install and run:

```bash
yarn install
yarn dev
```

Default API URL is `http://localhost:4000`.

## Create users database on Cloudflare Postgres

1. Create a Cloudflare Postgres database and copy its connection string.
2. Set `DATABASE_URL` to that Cloudflare Postgres URL in `backend/.env`.
3. Apply schema (includes the `users` table):

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

4. Start backend against Cloudflare Postgres:

```bash
yarn dev
```

5. Point web app TanStack API calls to backend URL:

```bash
REACT_APP_CLOUDFLARE_API_URL=https://<your-backend-domain>
```

6. Ensure `CF_IMAGES_ACCOUNT_ID` and `CF_IMAGES_API_TOKEN` are set in your backend environment so `/api/uploads/image` can upload avatars/covers.

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
