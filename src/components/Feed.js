import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Tweet from './Tweet';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Component to display all posts from all users
const Feed = ({ user }) => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Create a memoized fetchAllTweets function
  const fetchAllTweets = useCallback(async () => {
    try {
      setRefreshing(true);
      // First, get all posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      // Then get all user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name');
        
      if (profilesError) throw profilesError;
      
      // Map profiles by ID for easy lookup
      const profilesById = profilesData.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
      
      // Join the data manually
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
    // Fetch tweets initially
    fetchAllTweets();
    
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchAllTweets();
    }, 30000); // 30 seconds
    
    // Subscribe to real-time updates for all tweets
    const channel = supabase
      .channel('public-tweets')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'posts'
        },
        payload => {
          // Fetch the complete post data including user info
          fetchPostWithUserData(payload.new.id).then(post => {
            if (post) {
              setTweets(prev => [post, ...prev]);
            }
          });
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchAllTweets]);

  // Helper function to fetch a single post with user info
  const fetchPostWithUserData = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      // Now get the user info separately
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

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchAllTweets();
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
    <div className="max-w-5xl mx-auto space-y-2 md:space-y-4 px-2 md:px-4 pt-4 md:pt-6 pb-16 md:pb-8">
      {/* Refresh button and header */}
      <div className="flex justify-between items-center px-1 md:px-2">
        <h2 className="text-base md:text-lg font-semibold">Feed</h2>
        <button 
          onClick={handleManualRefresh} 
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          disabled={refreshing}
          aria-label="Refresh feed"
        >
          <ArrowPathIcon 
            className={`w-4 h-4 md:w-5 md:h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>
      
      {/* Tweet list */}
      <div className="space-y-2 md:space-y-4">
        {tweets.length > 0 ? (
          tweets.map(tweet => (
            <Tweet key={tweet.id} tweet={tweet} />
          ))
        ) : (
          <div className="bg-white rounded-lg p-4 md:p-8 text-center text-gray-500 shadow-sm">
            <p className="text-sm md:text-base">No posts yet. Be the first to create a post!</p>
          </div>
        )}
      </div>
      
      {/* Loading indicator for refresh */}
      {refreshing && !loading && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white py-1 px-3 rounded-full text-xs flex items-center space-x-1 shadow-lg">
          <ArrowPathIcon className="w-3 h-3 animate-spin" />
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
};

export default Feed;