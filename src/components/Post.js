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
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileUpload = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    return filePath;
  };

  const handlePost = async () => {
    if (content.trim() === '') {
      setError('Content cannot be empty.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = null;
      if (media) {
        const filePath = await handleFileUpload(media);
        const { data } = await supabase.storage
          .from('post-media')
          .getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          text: content,
          user_id: user.id,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      // Pass new post to parent
      addTweet(data);

      // Reset fields
      setContent('');
      setMedia(null);
      setPreview(null);
    } catch (err) {
      console.error('Post error:', err);
      setError(err.message);
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
    <div className="mt-16 md:mt-24 w-full flex flex-col items-center py-2 md:py-4">
      {/* Responsive post box container */}
      <div className="w-1/2 max-w-2xl lg:max-w-4xl xl:max-w-5xl px-3 md:px-6 space-y-3 md:space-y-4">
        {/* Post Box */}
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-3 md:p-6 space-y-3 md:space-y-4">
            {/* Text Input */}
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 py-2 md:py-3 px-3 md:px-4 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all duration-200 text-sm md:text-base resize-none"
              placeholder="👋 Hey, what's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            />

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 p-2 md:p-3 text-xs md:text-sm flex items-center justify-between">
                <span>{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="p-1" // Added padding for better touch target
                >
                  <XMarkIcon className="h-4 w-4 md:h-5 md:h-5 text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-500 transition" />
                </button>
              </div>
            )}

            {/* Image Preview */}
            {preview && (
              <div className="relative mt-2">
                <img
                  src={preview}
                  alt="Uploaded"
                  className="rounded-lg w-full object-cover max-h-[300px] md:max-h-[400px] lg:max-h-[500px]"
                />
                <button 
                  type="button" 
                  className="absolute top-2 right-2 bg-gray-700 dark:bg-gray-600 text-white p-1 md:p-1.5 rounded-full hover:bg-gray-900 dark:hover:bg-gray-800 transition"
                  onClick={clearMedia}
                >
                  <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            )}

            {/* Upload & Post Buttons */}
            <div className="flex items-center justify-between pt-1">
              {/* Upload Button - increased touch target */}
              <label className="cursor-pointer flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition">
                <PhotoIcon className="h-5 w-5 md:h-6 md:w-6 text-gray-700 dark:text-gray-300" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMediaChange}
                />
              </label>

              {/* Post Button - proper sizing for mobile */}
              <button
                type="button"
                onClick={handlePost}
                disabled={loading}
                className="px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm md:text-base font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 active:bg-gray-900 dark:active:bg-gray-300 transition disabled:opacity-50 flex items-center min-h-[36px]"
              >
                {loading ? (
                  <ArrowPathIcon className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
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