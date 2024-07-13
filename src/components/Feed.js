import React from 'react';
import Tweet from './Tweet';

const Feed = ({ tweets }) => {
  return (
    <div>
      {tweets.map((tweet, index) => (
        <Tweet key={index} tweet={tweet} />
      ))}
    </div>
  );
};

export default Feed;