import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/solid';

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions] = useState([
    "What's happening in your world? 🌍",
    "Share something interesting! ✨",
    "Got any exciting news? 📢",
    "What's inspiring you today? 💫",
    "Share your thoughts with others! 💭",
    "What's making you smile today? 😊",
    "What's your latest adventure? 🚀",
    "Any creative ideas to share? 💡",
  ]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getRandomSuggestion = () => {
    const randomIndex = Math.floor(Math.random() * suggestions.length);
    return suggestions[randomIndex];
  };

  const handleSuggestion = () => {
    setContent(getRandomSuggestion().replace(/\s*[🌍✨📢💫💭😊🚀💡]\s*$/, ''));
  };

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
    <div className="mt-24 md:mt-28 w-full flex flex-col items-center py-2 md:py-4">
      <div className="w-full max-w-3xl lg:max-w-3xl xl:max-w-2xl px-3 md:px-6">
        {/* Post Box - Updated with navbar matching style */}
        <div className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
          border border-light-border dark:border-dark-border
          rounded-2xl overflow-hidden">
          <div className="p-4 md:p-6 space-y-4">
            {/* Text Input with AI Suggestion Button */}
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
                placeholder={getRandomSuggestion()}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
              />
              <button
                onClick={handleSuggestion}
                className="absolute top-3 right-3 p-1.5 rounded-full
                  text-light-muted dark:text-dark-textSecondary
                  hover:text-light-text dark:hover:text-dark-text
                  hover:bg-light-secondary dark:hover:bg-dark-tertiary
                  transition-all duration-200"
                title="Get AI suggestion"
                type="button"
              >
                <SparklesIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-dark-error/10 text-dark-error 
                border border-dark-error/20 p-3 text-sm 
                flex items-center justify-between">
                <span>{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="p-1 hover:bg-dark-error/10 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Image Preview */}
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

            {/* Upload & Post Buttons */}
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