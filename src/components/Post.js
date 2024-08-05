import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Post.css';

const Post = ({ user, addTweet }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (content.trim() === '') {
      setError('Content cannot be empty.');
      return;
    }

    console.log('Posting tweet with content:', content);
    console.log('User ID:', user.id);

    const { data, error } = await supabase
      .from('tweets')
      .insert([{ content, user_id: user.id }])
      .select();

    if (error) {
      console.error('Error posting tweet:', error);
      setError('Failed to post tweet.');
    } else {
      console.log('Supabase response:', data);
      if (data) {
        addTweet(data[0]);
        setContent('');
        setError('');
      } else {
        console.error('Unexpected null response from Supabase');
      }
    }
  };

  return (
    <div className="post-container">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="👋 What's happening?"
      />
      <button className="post-button" onClick={handlePost}>
        Post
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Post;