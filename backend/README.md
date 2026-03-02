# Backend (Node + PostgreSQL)

This is the Phase 1 backend replacing Supabase for MVP auth + feed.

## Endpoints

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/feed` (Bearer token)

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
