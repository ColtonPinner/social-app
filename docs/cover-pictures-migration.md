# Cover Pictures Migration Instructions

This project includes a Supabase SQL migration at `supabase/migrations/20251119_cover_pictures.sql` that creates the `cover_pictures` table, sets up RLS/trigger logic, provisions a `covers` storage bucket with policies, and ensures `profiles.cover_image_url` exists.

## Applying with Supabase CLI
1. Ensure the [Supabase CLI](https://supabase.com/docs/guides/cli) is installed and authenticated.
2. From the repo root, run:
   ```bash
   supabase db push
   ```
   This executes the migration against your linked Supabase project.

## Applying via Supabase Dashboard
If you prefer the dashboard:
1. Open the SQL editor in the Supabase project.
2. Paste the contents of `supabase/migrations/20251119_cover_pictures.sql` and execute it.
3. Verify the `covers` storage bucket now exists under **Storage → Buckets**.

## Post-Deployment Checklist
- Confirm the `cover_pictures` table appears under **Database → Tables** and RLS is enabled.
- Upload a cover image (per-user folder) to check the storage policies.
- Ensure your application fetches `profiles.cover_image_url` and can fall back to previous defaults when not set.
