ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.posts
SET images = CASE
  WHEN jsonb_typeof(images) = 'array' THEN images
  WHEN image_url IS NOT NULL AND image_url <> '' THEN jsonb_build_array(image_url)
  ELSE '[]'::jsonb
END
WHERE images IS NULL OR jsonb_typeof(images) IS DISTINCT FROM 'array';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tweets'
  ) THEN
    INSERT INTO public.posts (user_id, text, image_url, images, created_at)
    SELECT
      (to_jsonb(t)->>'user_id')::uuid,
      COALESCE(NULLIF(to_jsonb(t)->>'text', ''), NULLIF(to_jsonb(t)->>'content', ''), ''),
      NULLIF(to_jsonb(t)->>'image_url', ''),
      CASE
        WHEN jsonb_typeof(to_jsonb(t)->'images') = 'array' THEN to_jsonb(t)->'images'
        WHEN NULLIF(to_jsonb(t)->>'image_url', '') IS NOT NULL THEN jsonb_build_array(to_jsonb(t)->>'image_url')
        ELSE '[]'::jsonb
      END,
      COALESCE((to_jsonb(t)->>'created_at')::timestamptz, now())
    FROM public.tweets t
    WHERE (to_jsonb(t)->>'user_id') ~ '^[0-9a-fA-F-]{36}$'
      AND NOT EXISTS (
        SELECT 1
        FROM public.posts p
        WHERE p.user_id = (to_jsonb(t)->>'user_id')::uuid
          AND p.text = COALESCE(NULLIF(to_jsonb(t)->>'text', ''), NULLIF(to_jsonb(t)->>'content', ''), '')
          AND p.created_at = COALESCE((to_jsonb(t)->>'created_at')::timestamptz, now())
      );
  END IF;
END $$;

ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS post_id BIGINT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'tweet_id'
  ) THEN
    EXECUTE '
      UPDATE public.comments
      SET post_id = (tweet_id::text)::bigint
      WHERE post_id IS NULL
        AND tweet_id IS NOT NULL
        AND (tweet_id::text) ~ ''^[0-9]+$''
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'post_id'
  ) THEN
    DELETE FROM public.comments
    WHERE post_id IS NULL;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'comments_post_id_fkey'
    ) THEN
      ALTER TABLE public.comments
      ADD CONSTRAINT comments_post_id_fkey
      FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;

    ALTER TABLE public.comments
    ALTER COLUMN post_id SET NOT NULL;
  END IF;
END $$;

ALTER TABLE public.post_likes
ADD COLUMN IF NOT EXISTS post_id BIGINT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_likes' AND column_name = 'content_id'
  ) THEN
    EXECUTE '
      UPDATE public.post_likes
      SET post_id = (content_id::text)::bigint
      WHERE post_id IS NULL
        AND content_id IS NOT NULL
        AND (content_id::text) ~ ''^[0-9]+$''
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'likes'
  ) THEN
    INSERT INTO public.post_likes (post_id, user_id, created_at)
    SELECT
      (to_jsonb(l)->>'post_id')::bigint,
      (to_jsonb(l)->>'user_id')::uuid,
      COALESCE((to_jsonb(l)->>'created_at')::timestamptz, now())
    FROM public.likes l
    WHERE (to_jsonb(l)->>'post_id') ~ '^[0-9]+$'
      AND (to_jsonb(l)->>'user_id') ~ '^[0-9a-fA-F-]{36}$'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

DELETE FROM public.post_likes
WHERE post_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'post_likes_post_id_fkey'
  ) THEN
    ALTER TABLE public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
  END IF;

  ALTER TABLE public.post_likes
  ALTER COLUMN post_id SET NOT NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_likes_post_user_unique
ON public.post_likes (post_id, user_id);
