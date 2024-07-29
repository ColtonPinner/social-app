import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Post.css';

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [postedTweet, setPostedTweet] = useState(null);

  const handlePost = async () => {
	setError(''); // Clear any previous errors

	if (!content.trim()) {
	  setError('Tweet content is required');
	  return;
	}

	console.log('Posting tweet with content:', content);
	console.log('User ID:', user.id);

	const { data, error } = await supabase
	  .from('tweets')
	  .insert([{ content, user_id: user.id }]);

	console.log('Supabase response:', { data, error });

	if (error) {
	  console.error('Error posting tweet:', error);
	  setError('Failed to post tweet: ' + error.message);
	} else if (data && data.length > 0) {
	  console.log('Tweet posted successfully:', data[0]);
	  addTweet(data[0]);
	  setPostedTweet(data[0]);
	  setContent('');
	} else if (data === null && error === null) {
	  console.error('Unexpected null response from Supabase');
	  setError('Unexpected null response from Supabase');
	} else {
	  console.error('Unexpected response:', data);
	  setError('Failed to post tweet');
	}
  };

  return (
	<div className="post-container">
	  <textarea
		value={content}
		onChange={(e) => setContent(e.target.value)}
		placeholder="What's happening?"
	  />
	  <button className="post-button" onClick={handlePost}>Post</button>
	  {error && <div className="error-message">{error}</div>}
	  {postedTweet && (
		<div className="tweet">
		  <p>{postedTweet.content}</p>
		</div>
	  )}
	</div>
  );
};

export default Post;