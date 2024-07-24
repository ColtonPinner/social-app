import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Feed.css';

const Feed = () => {
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    const fetchTweets = async () => {
      const { data, error } = await supabase
        .from('tweets')
        .select(`
          id,
          content,
          created_at,
          user_id,
          user:auth.users(id, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tweets:', error);
      } else if (data) {
        setTweets(data);
      } else {
        console.error('No data returned from fetchTweets');
      }
    };

    fetchTweets();
  }, []);

  return (
    <div className="feed-container">
      {tweets.map(tweet => (
        <div key={tweet.id} className="tweet-block">
          <div className="tweet-user">{tweet.user.email}</div>
          <div className="tweet-content">{tweet.content}</div>
          <div className="tweet-date">{new Date(tweet.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
};

export default Feed;