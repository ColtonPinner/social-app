import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Post.css';

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (!content) {
      setError('Tweet content is required');
      return;
    }

    const { data, error } = await supabase
      .from('tweets')
      .insert([{ content, user_id: user.id }]);

    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      addTweet(data[0]);
      setContent('');
      setError('');
    } else {
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
      <button className="post-button" onClick={handlePost}>Tweet</button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Post;