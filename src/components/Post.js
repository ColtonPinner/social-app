import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Post.css'; // Import the Post.css file

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (content.trim().length === 0) {
      setError('Tweet content cannot be empty');
      return;
    }

    const { data, error } = await supabase
      .from('tweets')
      .insert([{ content, user_id: user.id }]);

    if (error) {
      setError(error.message);
    } else {
      if (data && data.length > 0) {
        addTweet(data[0]);
        setContent('');
        setError('');
      } else {
        setError('An error occurred while posting the tweet.');
      }
    }
  };

  return (
    <div className="post-container">
      <textarea
        placeholder="What's happening?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={handlePost}>Tweet</button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Post;