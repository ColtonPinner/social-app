import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Tweet from './Tweet';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const Feed = () => {
  const [tweetsState, setTweets] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Load the current user and following list on component mount
  useEffect(() => {
    const fetchUserAndFollowing = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get additional profile data if needed
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setCurrentUser({
          ...user,
          ...profile
        });

        // Fetch following user IDs
        const { data: followingData, error: followingError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (!followingError && followingData) {
          setFollowingIds(followingData.map(f => f.following_id));
        } else {
          setFollowingIds([]);
        }
      }
    };
    fetchUserAndFollowing();
  }, []);

  const fetchAllTweets = useCallback(async () => {
    try {
      setRefreshing(true);

      // Only fetch posts from users you follow (and yourself)
      let userIds = followingIds;
      if (currentUser && currentUser.id) {
        userIds = [...followingIds, currentUser.id];
      }
      if (userIds.length === 0) {
        setTweets([]);
        setRefreshing(false);
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('user_id', userIds)
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
      setRefreshing(false);
    }
  }, [followingIds, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchAllTweets();
    }
  }, [fetchAllTweets, currentUser, followingIds]);

  useEffect(() => {
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
        
        const { data: images } = await supabase
          .from('post_images')
          .select('url')
          .eq('post_id', postId);
        // images is an array of { url }
        
        return {
          ...data,
          user: userData || null,
          images: images.map(img => img.url) || []
        };
      }
    } catch (err) {
      console.error('Error fetching single post:', err);
      return null;
    }
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

  const handleUploadImages = async (files, postId) => {
    const imageUrls = [];
    for (const file of files) {
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(`posts/${postId}/${file.name}`, file);
      if (!error) {
        const { publicUrl } = supabase.storage.from('post-images').getPublicUrl(`posts/${postId}/${file.name}`).data;
        imageUrls.push(publicUrl);
      }
    }
    return imageUrls;
  };

  const handleCreatePost = async (postText, files) => {
    try {
      setRefreshing(true);
      setError(null);

      // Insert the post into the database
      const { data: postData, error: postError } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        text: postText,
        images: imageUrls
      });

      if (postError) throw postError;

      // If there are images, upload them and update the post
      let imageUrls = [];
      if (files && files.length > 0) {
        imageUrls = await handleUploadImages(files, postData[0].id);

        // Update the post with the image URLs
        const { error: updateError } = await supabase
          .from('posts')
          .update({ images: imageUrls })
          .eq('id', postData[0].id);

        if (updateError) throw updateError;
      }

      // Fetch the newly created post with user data
      const newPost = await fetchPostWithUserData(postData[0].id);
      if (newPost) {
        setTweets(prev => [newPost, ...prev]);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Error creating post');
    } finally {
      setRefreshing(false);
    }
  };

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
      {/* Tweets Container */}
      <div className="md:backdrop-blur-lg md:bg-light-primary/80 md:dark:bg-dark-primary/80 
        md:border md:border-light-border md:dark:border-dark-border
        md:rounded-2xl"
      >
        <div className="px-4">
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {tweetsState.length > 0 ? (
              tweetsState.map(tweet => (
                <Tweet 
                  key={tweet.id} 
                  tweet={tweet} 
                  currentUser={currentUser} 
                  onDelete={handleDeletePost}
                  setLightboxImg={setLightboxImg}
                  setLightboxOpen={setLightboxOpen}
                />
              ))
            ) : (
              <div className="py-6 text-center">
                <p className="text-light-muted dark:text-dark-textSecondary">
                  No posts yet. Start the conversation!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for images */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <img
            src={lightboxImg}
            alt="Enlarged post"
            className="max-w-full max-h-full"
            onClick={() => setLightboxOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Feed;