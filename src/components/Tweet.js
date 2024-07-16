import React from 'react';
import { supabase } from '../supabaseClient';

const Tweet = ({ tweet, userEmail, mediaUrl }) => {
  const mediaPublicUrl = mediaUrl ? supabase.storage.from('media').getPublicUrl(mediaUrl).publicURL : null;

  return (
    <div className="tweet-block">
      <p className="tweet">{tweet}</p>
      {mediaPublicUrl && (
        <div className="tweet-media">
          {mediaPublicUrl.endsWith('.mp4') || mediaPublicUrl.endsWith('.webm') ? (
            <video controls>
              <source src={mediaPublicUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img src={mediaPublicUrl} alt="Tweet media" />
          )}
        </div>
      )}
      <p className="tweet-user">Posted by: {userEmail}</p>
    </div>
  );
};

export default Tweet;