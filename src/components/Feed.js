import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Tweet from './Tweet';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const Feed = ({ user }) => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newTweet, setNewTweet] = useState('');
  const [image, setImage] = useState(null);

  const fetchAllTweets = useCallback(async () => {
    try {
      setRefreshing(true);
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name');
        
      if (profilesError) throw profilesError;
      
      const profilesById = profilesData.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
      
      const enrichedPosts = postsData.map(post => ({
        ...post,
        user: profilesById[post.user_id] || null
      }));
      
      setTweets(enrichedPosts);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tweets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTweets();
    const refreshInterval = setInterval(() => {
      fetchAllTweets();
    }, 30000); // Refresh every 30 seconds
    
    const channel = supabase
      .channel('public-tweets')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' },
        payload => {
          fetchPostWithUserData(payload.new.id).then(post => {
            if (post) {
              setTweets(prev => [post, ...prev]);
            }
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchAllTweets]);

  const fetchPostWithUserData = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('username, avatar_url, full_name')
          .eq('id', data.user_id)
          .single();
          
        if (userError) console.error("User fetch error:", userError);
        
        return {
          ...data,
          user: userData || null
        };
      }
    } catch (err) {
      console.error('Error fetching single post:', err);
      return null;
    }
  };

  const handleManualRefresh = () => {
    fetchAllTweets();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handlePostTweet = async () => {
    if (!newTweet && !image) return;

    let imageUrl = null;
    if (image) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `tweets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tweets')
        .upload(filePath, image);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        setError('Error uploading image');
        return;
      }

      const { data: publicUrlData, error: publicUrlError } = await supabase.storage
        .from('tweets')
        .getPublicUrl(filePath);

      if (publicUrlError) {
        console.error('Error getting public URL:', publicUrlError);
        setError('Error getting public URL');
        return;
      }

      imageUrl = publicUrlData.publicUrl;
    }

    const { error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: newTweet,
        image_url: imageUrl,
      });

    if (postError) {
      console.error('Error posting tweet:', postError);
      setError('Error posting tweet');
      return;
    }

    setNewTweet('');
    setImage(null);
    fetchAllTweets();
  };

  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setTweets(prevTweets => prevTweets.filter(tweet => tweet.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Error deleting post');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[200px] pt-4 md:pt-8">
      <ArrowPathIcon className="w-6 h-6 md:w-8 md:h-8 animate-spin text-gray-500" />
    </div>
  );

  if (error) return (
    <div className="rounded-md bg-red-50 p-3 md:p-4 mx-2 md:mx-4 my-3 md:mt-4">
      <div className="flex">
        <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
        <div className="ml-3">
          <h3 className="text-xs md:text-sm font-medium text-red-800">Error loading posts</h3>
          <div className="mt-1 md:mt-2 text-xs md:text-sm text-red-700">{error}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pt-4 pb-24 px-2 md:px-8">
      {user && (
        <div className="mb-6 px-2 md:px-0">
          <textarea
            className="w-full p-3 border rounded-lg"
            rows="3"
            placeholder="What's happening?"
            value={newTweet}
            onChange={(e) => setNewTweet(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mt-2"
          />
          <button
            onClick={handlePostTweet}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Tweet
          </button>
        </div>
      )}
      
      {/* Tweets Container */}
      <div className="md:bg-white md:dark:bg-gray-800 md:rounded-2xl md:shadow-sm md:overflow-hidden md:border md:border-gray-200 md:dark:border-gray-700">
        <div className="md:max-h-[calc(100vh-240px)] md:overflow-y-auto px-2 md:px-4">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tweets.length > 0 ? (
              tweets.map(tweet => (
                <div key={tweet.id} className="py-4 w-full">
                  <Tweet 
                    tweet={tweet} 
                    onDelete={tweet.user.id === user?.id ? handleDeletePost : null} 
                  />
                </div>
              ))
            ) : (
              <div className="py-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No posts yet. Start the conversation!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;