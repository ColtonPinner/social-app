import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Feed.css';

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTweets = async () => {
      const { data, error } = await supabase
        .from('tweets')
        .select(`
          id,
          content,
          created_at,
          user_id,
          user:auth.users(email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tweets:', error);
        setError(error.message);
      } else {
        setTweets(data || []);
      }
    };

    fetchTweets();
  }, []);

  return (
    <div>
      {error && <p className="error-message">{error}</p>}
      {tweets.map((tweet) => (
        <div key={tweet.id} className="feed-container">
          <p className="tweet-user">{tweet.user ? tweet.user.email : 'Unknown User'}</p>
          <p className="tweet-content">{tweet.content}</p>
          <p className="tweet-date">{new Date(tweet.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default Feed;