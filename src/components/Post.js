import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/solid';

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      addTweet(data);
      setContent('');
      setMedia(null);
    } catch (err) {
      console.error('Post error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl mt-32">
      <div className="overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/50">
        <div className="p-8">
          <div className="space-y-6">
            <textarea
              rows={4}
              className="block w-full rounded-2xl border-0 py-4 px-4 text-gray-900 bg-gray-50/50 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:outline-none transition-all duration-200 text-base leading-relaxed resize-none"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            />
            // ...existing code...
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;