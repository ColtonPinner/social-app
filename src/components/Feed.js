import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Feed.css';

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTweets();

    // Set up real-time subscription
    const tweetsSubscription = supabase
      .channel('public:tweets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tweets' }, payload => {
        setTweets(prevTweets => [payload.new, ...prevTweets]);
      })
      .subscribe();

    // Clean up the subscription on unmount
    return () => {
      supabase.removeChannel(tweetsSubscription);
    };
  }, []);

  const fetchTweets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tweets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tweets:', error);
    } else {
      setTweets(data);
    }
    setLoading(false);
  };

  return (
    <div className="feed-container">
      <div className="tweets">
        {tweets.map((tweet, index) => (
          <React.Fragment key={tweet.id}>
            <div className="tweet">
              <h3>{tweet.user_id}</h3>
              <p>{new Date(tweet.created_at).toLocaleString()}</p>
              <p>{tweet.content}</p>
              {tweet.image_url && <img src={tweet.image_url} alt="Tweet" />}
            </div>
            {index < tweets.length - 1 && <hr />}
          </React.Fragment>
        ))}
      </div>
      {loading && <div>Loading...</div>}
    </div>
  );
};

export default Feed;