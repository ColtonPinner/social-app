import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import the Link component
import { supabase } from '../supabaseClient';
import './Feed.css'; // Import the Feed.css file

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchTweets = async () => {
      const { data, error } = await supabase
        .from('tweets')
        .select('id, content, created_at, profiles (id, username)')
        .order('created_at', { ascending: false })
        .range((page - 1) * 10, page * 10 - 1);

      if (error) {
        console.error(error);
      } else {
        setTweets((prevTweets) => [...prevTweets, ...data]);
        setHasMore(data.length === 10);
      }
      setLoading(false);
    };

    fetchTweets();
  }, [page]);

  const loadMoreTweets = () => {
    setPage((prevPage) => prevPage + 1);
  };

  return (
    <div className="feed-container">
      <div className="tweets">
        {tweets.map((tweet) => (
          <React.Fragment key={tweet.id}>
            <div className="tweet">
              <Link to={`../profile/${tweet.profiles?.id || 'unknown'}`} className="link">
                <h1>{tweet.profiles?.username || 'Unknown User'}</h1>
              </Link>
              <p>{new Date(tweet.created_at).toLocaleString()}</p>
              <h3>{tweet.content}</h3>
            </div>
          </React.Fragment>
        ))}
      </div>
      {loading && <div><h2>Loading...</h2></div>}
      {hasMore && !loading && (
        <button className="load-more-button" onClick={loadMoreTweets}>
          Load More
        </button>
      )}
    </div>
  );
};

export default Feed;