import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Tweet from './Tweet';

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const { data, error } = await supabase
          .from('tweets')
          .select(`
            content,
            created_at,
            user_id,
            media_url,
            user:auth.users (
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tweets:', error.message);
          setError('Error fetching tweets');
        } else {
          setTweets(data);
        }
      } catch (error) {
        console.error('Error fetching tweets:', error);
        setError('An unexpected error occurred. Please try again later.');
      }
    };

    fetchTweets();
  }, []);

  return (
    <div>
      {tweets.map((tweet, index) => (
        <Tweet key={index} tweet={tweet.content} userEmail={tweet.user.email} mediaUrl={tweet.media_url} />
      ))}
      {error && <p>{error}</p>}
    </div>
  );
};

export default Feed;