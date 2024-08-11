import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Feed.css';

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const TWEETS_PER_PAGE = 8;

  useEffect(() => {
    fetchTweets(page);
  }, [page]);

  useEffect(() => {
    // Set up real-time subscription for INSERT events
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

  const fetchTweets = async (page) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tweets')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles(username)
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * TWEETS_PER_PAGE, page * TWEETS_PER_PAGE - 1);

    if (error) {
      console.error('Error fetching tweets:', error);
    } else {
      setTweets(prevTweets => [...prevTweets, ...data]);
      if (data.length < TWEETS_PER_PAGE) {
        setHasMore(false);
      }
    }
    setLoading(false);
  };

  const handleLike = (tweetId) => {
    console.log(`Liked tweet with ID: ${tweetId}`);
  };

  const loadMoreTweets = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
    <div className="feed-container">
      <div className="tweets">
        {tweets.map((tweet, index) => (
          <React.Fragment key={tweet.id}>
            <div className="tweet">
              <h4>{tweet.profiles?.username || 'Unknown User'}</h4>
              <h5>{new Date(tweet.created_at).toLocaleString()}</h5>
              <h3>{tweet.content}</h3>
              <button className="like-button" onClick={() => handleLike(tweet.id)}>
                <i className="fas fa-heart"></i>
              </button>
            </div>
            {index < tweets.length - 1 && <hr />}
          </React.Fragment>
        ))}
      </div>
      {loading && <div>Loading...</div>}
      {hasMore && !loading && (
        <button className="load-more-button" onClick={loadMoreTweets}>
          Load More
        </button>
      )}
    </div>
  );
};

export default Feed;