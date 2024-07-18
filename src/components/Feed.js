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
          profiles ( username )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tweets:', error);
      } else {
        setTweets(data);
      }
    };

    fetchTweets();
  }, []);

  return (
    <div>
      {tweets.map((tweet) => (
        <div key={tweet.id} className="feed-container">
          <p className="tweet-user">{tweet.profiles.username}</p>
          <p className="tweet-content">{tweet.content}</p>
          <p className="tweet-date">{new Date(tweet.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default Feed;