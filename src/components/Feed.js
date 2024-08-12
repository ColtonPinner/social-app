import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Feed.css';

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState('');
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
      setTweets(prevTweets => (page === 1 ? data : [...prevTweets, ...data]));
      if (data.length < TWEETS_PER_PAGE) {
        setHasMore(false);
      }
    }
    setLoading(false);
  };

  const handlePostTweet = async () => {
    if (newTweet.trim() === '') return;

    const { data, error } = await supabase
      .from('tweets')
      .insert([
        {
          content: newTweet,
          user_id: supabase.auth.user().id // Assuming you have user authentication set up
        }
      ])
      .single();

    if (error) {
      console.error('Error posting tweet:', error);
    } else {
      setNewTweet(''); // Clear the input after posting
    }
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
      {tweets.map((tweet) => (
        <React.Fragment key={tweet.id}>
          <div className="tweet">
            <h1>{tweet.profiles?.username || 'Unknown User'}</h1>
            <p>{new Date(tweet.created_at).toLocaleString()}</p>
            <h3>{tweet.content}</h3>
          </div>
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