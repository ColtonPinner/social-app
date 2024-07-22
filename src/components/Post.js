import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Post.css';

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (content.trim() === '') {
      setError('Tweet content cannot be empty');
      return;
    }

    const { data, error } = await supabase
      .from('tweets')
      .insert([{ content, user_id: user.id }]);

    if (error) {
      console.error('Error posting tweet:', error);
      setError(error.message);
    } else if (data && data.length > 0) {
      addTweet(data[0]);
      setContent('');
      setError(null);
    } else {
      setError('Unexpected error occurred');
    }
  };

  return (
    <div className="post-container">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
        />
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="post-button">Tweet</button>
      </form>
    </div>
  );
};

export default Post;