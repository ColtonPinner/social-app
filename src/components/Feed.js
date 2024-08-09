import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Feed.css';

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const TWEETS_PER_PAGE = 10;

  useEffect(() => {
    fetchTweets(page);
  }, [page]);

  useEffect(() => {
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

  const fetchTweets = async (page) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tweets')
      .select('*')
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
    // Handle the like functionality here
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
              <div className="tweet-header">
                <img src={tweet.profile_picture_url} alt="Profile" className="profile-picture" />
                <h3 className="tweet-user">{tweet.user_id}</h3>
              </div>
              <p className="tweet-date">{new Date(tweet.created_at).toLocaleString()}</p>
              <p className="tweet-content">{tweet.content}</p>
              {tweet.image_url && <img src={tweet.image_url} alt="Tweet" />}
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