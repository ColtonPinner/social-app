-- Core social schema for Supabase (PostgreSQL)
-- Note: Supabase uses PostgreSQL, not MySQL.

-- Follows
CREATE TABLE IF NOT EXISTS public.follows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

-- Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON public.comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Policies: follows
CREATE POLICY IF NOT EXISTS "Follows are viewable by everyone"
ON public.follows
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can follow from their own account"
ON public.follows
FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY IF NOT EXISTS "Users can unfollow from their own account"
ON public.follows
FOR DELETE USING (auth.uid() = follower_id);

-- Policies: posts
CREATE POLICY IF NOT EXISTS "Posts are viewable by everyone"
ON public.posts
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create their own posts"
ON public.posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own posts"
ON public.posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own posts"
ON public.posts
FOR DELETE USING (auth.uid() = user_id);

-- Policies: comments
CREATE POLICY IF NOT EXISTS "Comments are viewable by everyone"
ON public.comments
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create their own comments"
ON public.comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own comments"
ON public.comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own comments"
ON public.comments
FOR DELETE USING (auth.uid() = user_id);

-- Policies: post likes
CREATE POLICY IF NOT EXISTS "Post likes are viewable by everyone"
ON public.post_likes
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can like posts as themselves"
ON public.post_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can remove their own likes"
ON public.post_likes
FOR DELETE USING (auth.uid() = user_id);
