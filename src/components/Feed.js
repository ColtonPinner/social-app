import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Tweet from './Tweet';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTweets();
    
    const channel = supabase
      .channel('tweets')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tweets' },
        payload => {
          setTweets(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTweets = async () => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('*, user:user_id(username, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTweets(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tweets:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center mt-8">
      <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-500" />
    </div>
  );

  if (error) return (
    <div className="rounded-md bg-red-50 p-4 mt-4">
      <div className="flex">
        <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error loading tweets</h3>
          <div className="mt-2 text-sm text-red-700">{error}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 mt-4">
      {tweets.map(tweet => (
        <Tweet key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
};

export default Feed;