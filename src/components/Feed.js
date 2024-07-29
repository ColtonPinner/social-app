import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Feed.css';

const Feed = () => {
  const [tweets, setTweets] = useState([]);

  const fetchTweets = async () => {
	const { data, error } = await supabase
	  .from('tweets_with_users')
	  .select(`
		id,
		content,
		created_at,
		user_id,
		email
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

  useEffect(() => {
	fetchTweets(); // Initial fetch

	const intervalId = setInterval(fetchTweets, 30000); // Fetch tweets every 30 seconds

	return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  return (
	<div className="feed-container">
	  {tweets.map(tweet => (
		<div key={tweet.id} className="tweet-box">
      <small className="tweet-date">{tweet.created_at}</small>
      <small className="tweet-user">{tweet.email}</small>
		  <p className="tweet-content">{tweet.content}</p>
		</div>
	  ))}
	</div>
  );
};

export default Feed;