import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/solid';

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);  // Change to array for multiple files
  const [previews, setPreviews] = useState([]);  // Change to array for multiple previews
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileUpload = async (files) => {
    if (!user?.id) throw new Error('User not found');
    
    // Array to store public URLs of uploaded images
    const uploadedUrls = [];
    
    // Process each file
    for (const file of files) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File ${file.name} is not a supported image type (JPEG, PNG, or WEBP)`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);
    }
    
    return uploadedUrls;
  };

  const handlePost = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      setError('Content or at least one image is required.');
      return;
    }

    // Limit the number of images (optional)
    if (mediaFiles.length > 5) {
      setError('Maximum 5 images allowed per post.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrls = [];

      if (mediaFiles.length > 0) {
        imageUrls = await handleFileUpload(mediaFiles);
        if (!imageUrls || imageUrls.length === 0) {
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
        text: content || null,
        user_id: authUser.id,
        image_url: imageUrls.length > 0 ? imageUrls[0] : null, // Only use the first image URL
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
      setMediaFiles([]);
      setPreviews([]);
      console.log('Post successful');
    } catch (err) {
      console.error('Error in handlePost:', err);
      setError(err.message || 'Something went wrong posting.');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaChange = (event) => {
    const files = Array.from(event.target.files);
    
    // Limit number of files (optional)
    if (mediaFiles.length + files.length > 5) {
      setError('Maximum 5 images allowed per post.');
      return;
    }
    
    if (files && files.length > 0) {
      // Add new files to existing files
      setMediaFiles(prevFiles => [...prevFiles, ...files]);
      
      // Generate previews for new files
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  const removeMedia = (index) => {
    // Create new arrays without the item at the specified index
    const updatedFiles = [...mediaFiles];
    const updatedPreviews = [...previews];
    
    // Remove the file and its preview
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    
    // Update state
    setMediaFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const clearAllMedia = () => {
    // Release all object URLs to avoid memory leaks
    previews.forEach(preview => URL.revokeObjectURL(preview));
    setMediaFiles([]);
    setPreviews([]);
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

            {previews.length > 0 && (
              <div className="mt-2 space-y-2">
                {/* Image count indicator */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-light-muted dark:text-dark-textSecondary">
                    {previews.length} {previews.length === 1 ? 'image' : 'images'} attached
                  </span>
                  
                  <button
                    type="button"
                    className="text-sm text-dark-accent hover:underline"
                    onClick={clearAllMedia}
                  >
                    Clear all
                  </button>
                </div>
                
                {/* Image grid */}
                <div className={`grid gap-2 ${
                  previews.length === 1 ? 'grid-cols-1' : 
                  previews.length === 2 ? 'grid-cols-2' : 
                  'grid-cols-3'
                }`}>
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={preview}
                        alt={`Upload preview ${index + 1}`}
                        className="rounded-lg w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 
                          text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => removeMedia(index)}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer flex items-center justify-center h-10 w-10 
                  rounded-full hover:bg-light-secondary dark:hover:bg-dark-tertiary transition-colors">
                  <PhotoIcon className="h-6 w-6 text-light-text dark:text-dark-text" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMediaChange}
                    multiple
                  />
                </label>
                <span className="text-xs text-light-muted dark:text-dark-textSecondary">
                  {mediaFiles.length}/5
                </span>
              </div>

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