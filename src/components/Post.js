import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/solid';

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 8000); // 8000ms = 8 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileUpload = async (file) => {
    if (!user?.id) throw new Error('User not found');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, or WEBP images are allowed');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media') // Ensure this matches your bucket name
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePost = async () => {
    if (!content.trim() && !media) {
      setError('Content or image is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = null;

      if (media) {
        imageUrl = await handleFileUpload(media);
        if (!imageUrl) {
          throw new Error('Image upload failed.');
        }
      }

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        throw new Error('Not authenticated');
      }

      const postData = {
        text: content || null, // Allow empty text if there's an image
        user_id: authUser.id,
        image_url: imageUrl,
      };

      const { data: newPost, error: insertPostError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (insertPostError) {
        throw insertPostError;
      }

      addTweet(newPost);
      setContent('');
      setMedia(null);
      setPreview(null);
      console.log('Post successful');
    } catch (err) {
      console.error('Error in handlePost:', err);
      setError(err.message || 'Something went wrong posting.');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMedia(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setMedia(null);
    setPreview(null);
  };

  return (
    <div className="mt-24 md:mt-28 w-full flex flex-col items-center py-2 md:py-4">
      <div className="w-full max-w-3xl lg:max-w-3xl xl:max-w-2xl px-3 md:px-6">
        <div className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
          border border-light-border dark:border-dark-border
          rounded-2xl overflow-hidden">
          <div className="p-4 md:p-6 space-y-4">
            <div className="relative">
              <textarea
                rows={3}
                className="w-full p-3 rounded-lg resize-none
                  bg-light-secondary dark:bg-dark-tertiary 
                  text-light-text dark:text-dark-text
                  border border-light-border dark:border-dark-border
                  focus:ring-2 focus:ring-dark-accent focus:outline-none 
                  placeholder-light-muted dark:placeholder-dark-textSecondary
                  transition-all duration-200"
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-100 text-red-800 border border-red-200 p-3 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError('')}
                  className="p-1 hover:bg-red-200 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {preview && (
              <div className="relative mt-2">
                <img
                  src={preview}
                  alt="Upload preview"
                  className="rounded-lg w-full object-cover max-h-[300px] md:max-h-[400px]"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 
                    text-white p-1.5 rounded-full transition-colors"
                  onClick={clearMedia}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <label className="cursor-pointer flex items-center justify-center h-10 w-10 
                rounded-full hover:bg-light-secondary dark:hover:bg-dark-tertiary transition-colors">
                <PhotoIcon className="h-6 w-6 text-light-text dark:text-dark-text" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMediaChange}
                />
              </label>

              <button
                type="button"
                onClick={handlePost}
                disabled={loading}
                className="px-6 py-2 rounded-full text-sm font-medium
                  bg-light-text dark:bg-dark-text
                  hover:bg-light-textSecondary dark:hover:bg-dark-textSecondary
                  text-light-primary dark:text-dark-primary
                  transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center min-h-[40px]"
              >
                {loading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;