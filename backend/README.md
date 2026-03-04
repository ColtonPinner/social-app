# Backend (Node + PostgreSQL)

This is the Phase 1 backend replacing Supabase for MVP auth + feed.

## D1 mode (Cloudflare Worker)

If you are using Cloudflare D1, use the Worker API at `backend/src/worker.js`.

Implemented in D1 mode now:
- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/users/:userId`
- `PATCH /api/users/me`
- `GET /api/feed`
- `POST /api/posts`
- `DELETE /api/posts/:postId`
- `GET /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments`
- `GET /api/posts/:postId/likes`
- `POST /api/posts/:postId/likes`
- `DELETE /api/posts/:postId/likes`
- `GET /api/users/:userId/posts`
- `GET /api/users/:userId/followers`
- `GET /api/users/:userId/following`
- `GET /api/users/:userId/follow-status`
- `POST /api/users/:userId/follow`
- `DELETE /api/users/:userId/follow`
- `POST /api/uploads/image`

Setup:

1. Put your D1 database ID in `wrangler.jsonc` (`d1_databases[0].database_id`).
2. Set `JWT_SECRET` in `wrangler.jsonc` `vars` or via Wrangler secrets.
3. Set `CF_IMAGES_ACCOUNT_ID` in `wrangler.jsonc` `vars`.
4. Set `CF_IMAGES_API_TOKEN` as a Wrangler secret:

```bash
wrangler secret put CF_IMAGES_API_TOKEN
```

5. Apply D1 schema:

```bash
yarn api:d1:schema:local
```

6. Run worker API locally:

```bash
yarn api:d1:dev
```

7. Point frontend API to Worker URL:

```bash
REACT_APP_API_URL=http://127.0.0.1:8787
```

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
