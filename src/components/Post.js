import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Post.css';

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [postedTweet, setPostedTweet] = useState(null);

  const handlePost = async () => {
	setError(''); // Clear any previous errors

	if (!content.trim() && !image) {
	  setError('Tweet content or image is required');
	  return;
	}

	console.log('Posting tweet with content:', content);
	console.log('User ID:', user.id);

	let imageUrl = null;
	if (image) {
	  const { data: imageData, error: imageError } = await supabase
		.storage
		.from('images')
		.upload(`public/${Date.now()}_${image.name}`, image);

	  if (imageError) {
		console.error('Error uploading image:', imageError);
		setError('Failed to upload image: ' + imageError.message);
		return;
	  }

	  imageUrl = supabase.storage.from('images').getPublicUrl(imageData.Key).publicURL;
	}

	const { data, error } = await supabase
	  .from('tweets')
	  .insert([{ content, user_id: user.id, image_url: imageUrl }]);

	console.log('Supabase response:', { data, error });

	if (error) {
	  console.error('Error posting tweet:', error);
	  setError('Failed to post tweet: ' + error.message);
	} else if (data && data.length > 0) {
	  console.log('Tweet posted successfully:', data[0]);
	  addTweet(data[0]);
	  setPostedTweet(data[0]);
	  setContent('');
	  setImage(null);
	} else if (data === null && error === null) {
	  console.error('Unexpected null response from Supabase');
	  setError('Unexpected null response from Supabase');
	} else {
	  console.error('Unexpected response:', data);
	  setError('Failed to post tweet');
	}
  };

  const handleImageChange = (e) => {
	if (e.target.files && e.target.files[0]) {
	  setImage(e.target.files[0]);
	}
  };

  return (
	<div className="post-container">
	  <textarea
		value={content}
		onChange={(e) => setContent(e.target.value)}
		placeholder="What's happening?"
	  />
	  <input
		type="file"
		id="imageInput"
		accept="image/*"
		style={{ display: 'none' }}
		onChange={handleImageChange}
	  />
	  <button className="post-button" onClick={handlePost}>Tweet</button>
	  {error && <div className="error-message">{error}</div>}
	  {postedTweet && (
		<div className="tweet">
		  <p>{postedTweet.content}</p>
		  {postedTweet.image_url && <img src={postedTweet.image_url} alt="Tweet" />}
		</div>
	  )}
	</div>
  );
};

export default Post;