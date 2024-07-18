import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Feed = () => {
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    const fetchTweets = async () => {
      const { data, error } = await supabase
        .from('tweets')
        .select('content, created_at, user_id');

      if (error) {
        console.error('Error fetching tweets:', error);
      } else {
        setTweets(data);
      }
    };

    fetchTweets();
  }, []);

  return (
    <div className="feed-container">
      {tweets.map((tweet) => (
        <div key={tweet.id} className="tweet-block">
          <p>{tweet.content}</p>
          <p className="tweet-user">{tweet.user_id}</p>
          <p>{new Date(tweet.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default Feed;