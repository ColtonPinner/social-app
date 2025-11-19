-- Migration: cover pictures table, RLS policies, storage policies, and profile column update
-- Date: 2025-11-19

-- 1. Create cover_pictures table
CREATE TABLE IF NOT EXISTS public.cover_pictures (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    picture_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.cover_pictures ENABLE ROW LEVEL SECURITY;

-- 3. Trigger to maintain updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cover_pictures_updated_at ON public.cover_pictures;
CREATE TRIGGER update_cover_pictures_updated_at
BEFORE UPDATE ON public.cover_pictures
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- 4. RLS policies
CREATE POLICY IF NOT EXISTS "Cover pictures are viewable by everyone"
ON public.cover_pictures
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own cover pictures"
ON public.cover_pictures
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own cover pictures"
ON public.cover_pictures
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own cover pictures"
ON public.cover_pictures
FOR DELETE USING (auth.uid() = user_id);

-- 5. Ensure storage bucket exists (no-op if already present)
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies for covers bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Cover Images Public Read',
  '{"statement":"SELECT","effect":"ALLOW","actions":["SELECT"],"role":"anon"}',
  'covers'
)
ON CONFLICT (bucket_id, name) DO NOTHING;

INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Users can upload own covers',
  '{"statement":"INSERT","effect":"ALLOW","actions":["INSERT"],"role":"authenticated","condition":"((storage.foldername(name))[1] = auth.uid()::text)"}',
  'covers'
)
ON CONFLICT (bucket_id, name) DO NOTHING;

INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Users can update own covers',
  '{"statement":"UPDATE","effect":"ALLOW","actions":["UPDATE"],"role":"authenticated","condition":"((storage.foldername(name))[1] = auth.uid()::text)"}',
  'covers'
)
ON CONFLICT (bucket_id, name) DO NOTHING;

INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Users can delete own covers',
  '{"statement":"DELETE","effect":"ALLOW","actions":["DELETE"],"role":"authenticated","condition":"((storage.foldername(name))[1] = auth.uid()::text)"}',
  'covers'
)
ON CONFLICT (bucket_id, name) DO NOTHING;

-- 7. Add cover_image_url column to profiles (idempotent)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Optional verification query (commented out)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'cover_image_url';
