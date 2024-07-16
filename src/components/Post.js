import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Post = ({ user, addTweet }) => {
  const [tweet, setTweet] = useState('');
  const [media, setMedia] = useState(null);
  const [error, setError] = useState('');

  const handlePost = async () => {
    try {
      let mediaUrl = null;

      if (media) {
        const { data, error } = await supabase.storage
          .from('media')
          .upload(`${user.id}/${Date.now()}_${media.name}`, media);

        if (error) {
          throw error;
        }

        mediaUrl = data.Key;
      }

      const { data, error } = await supabase.from('tweets').insert([
        { content: tweet, user_id: user.id, media_url: mediaUrl },
      ]);

      if (error) {
        console.error('Error posting tweet:', error.message);
        setError('Error posting tweet');
      } else {
        if (data && data.length > 0) {
          addTweet(data[0]);
          setTweet('');
          setMedia(null);
        } else {
          setError('Failed to post tweet. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error posting tweet:', error);
      setError('An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <div className="post-container">
      <textarea
        placeholder="What's happening?"
        value={tweet}
        onChange={(e) => setTweet(e.target.value)}
      ></textarea>
      <input type="file" accept="image/*,video/*" onChange={(e) => setMedia(e.target.files[0])} />
      <button onClick={handlePost}>Tweet</button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default Post;