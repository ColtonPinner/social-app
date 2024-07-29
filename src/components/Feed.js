import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Feed.css';

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const TWEETS_PER_PAGE = 10;

  useEffect(() => {
	fetchTweets();
  }, [page]);

  const fetchTweets = async () => {
	setLoading(true);
	const { data, error } = await supabase
	  .from('tweets')
	  .select('*')
	  .order('created_at', { ascending: false })
	  .range((page - 1) * TWEETS_PER_PAGE, page * TWEETS_PER_PAGE - 1);

	if (error) {
	  console.error('Error fetching tweets:', error);
	} else {
	  setTweets((prevTweets) => [...prevTweets, ...data]);
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
	  <button onClick={() => setPage(page + 1)} disabled={loading}>
		Load More
	  </button>
	</div>
  );
};

export default Feed;