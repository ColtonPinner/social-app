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
    <div className="mt-24 w-full flex flex-col items-center py-4">
      {/* Center the post box and allow it to expand */}
      <div className="w-[500px] px-6 space-y-4"> {/* Changed to max-w-5xl */}
        {/* Post Box */}
        <div className="rounded-xl bg-white border border-gray-200">
          <div className="p-6 space-y-4">
            {/* Text Input */}
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-200 py-3 px-4 text-gray-900 bg-gray-50/50 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:outline-none transition-all duration-200 text-base resize-none"
              placeholder="👋 Hey, what's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            />

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-100 text-red-700 border border-red-300 p-3 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError('')}>
                  <XMarkIcon className="h-5 w-5 text-red-500 hover:text-red-700 transition" />
                </button>
              </div>
            )}

            {/* Image Preview */}
            {preview && (
              <div className="relative mt-2">
                <img
                  src={preview}
                  alt="Uploaded"
                  className="rounded-lg w-full object-cover"
                />
                <button 
                  type="button" 
                  className="absolute top-2 right-2 bg-gray-700 text-white p-1 rounded-full hover:bg-gray-900 transition"
                  onClick={clearMedia}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Upload & Post Buttons */}
            <div className="flex items-center justify-between">
              {/* Upload Button */}
              <label className="cursor-pointer flex items-center space-x-2 text-gray-700 hover:text-black transition">
                <PhotoIcon className="h-6 w-6" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMediaChange}
                />
              </label>

              {/* Post Button */}
              <button
                type="button"
                onClick={handlePost}
                disabled={loading}
                className="px-5 py-2 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center"
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