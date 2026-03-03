# TanStack + Backend Migration (Phase 1)

This project now includes:

- TanStack Query setup in the web app
- New backend service in `backend/` (Node + Express + PostgreSQL)
- MVP auth/feed endpoints replacing Supabase for migration work

## What was added

- Client Query provider in `src/index.js`
- API client and auth/feed hooks:
  - `src/hooks/useBackendUsers.js`
  - `src/lib/apiClient.js`
  - `src/hooks/useBackendAuth.js`
  - `src/hooks/useBackendFeed.js`
- Backend API in `backend/src/*`
- SQL schema in `backend/sql/schema.sql`

## Run

From repo root:

```bash
yarn install
yarn --cwd backend install
yarn backend
```

In another terminal:

```bash
yarn web
```

## Next migration steps

1. Replace login/signup components to call `useLoginMutation` / `useRegisterMutation`.
2. Replace feed queries with `useBackendFeedQuery`.
3. Remove Supabase auth/session handling in `src/App.js`.
4. Add endpoints for post creation, likes, comments, and profiles.
5. Remove `@supabase/supabase-js` when all features are migrated.
