import React, { useState } from 'react';

const Post = ({ addTweet }) => {
  const [tweet, setTweet] = useState('');

  const handlePost = () => {
    addTweet(tweet);
    setTweet('');
  };

  return (
    <div>
      <textarea
        placeholder="What's happening?"
        value={tweet}
        onChange={(e) => setTweet(e.target.value)}
      ></textarea>
      <button onClick={handlePost}>Tweet</button>
    </div>
  );
};

export default Post;