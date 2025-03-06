import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const Tweet = ({ tweet }) => {
  const formattedDate = new Date(tweet.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className="w-full py-3">
      {/* Header with avatar and user info */}
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <Link to={`/profile/${tweet.user_id}`} className="flex-shrink-0">
          <img 
            src={tweet.user?.avatar_url || 'https://via.placeholder.com/40'} 
            alt={tweet.user?.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        </Link>
        
        {/* Content container */}
        <div className="flex-1 min-w-0">
          {/* Username and date */}
          <div className="flex items-center mb-1">
            <Link 
              to={`/profile/${tweet.user_id}`}
              className="font-semibold text-sm hover:underline truncate"
            >
              {tweet.user?.username || "Anonymous"}
            </Link>
            <span className="inline-block mx-1 text-gray-400">•</span>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
          
          {/* Tweet text */}
          <p className="text-[15px] text-gray-900 mb-2 whitespace-pre-wrap break-words">
            {tweet.text || tweet.content || tweet.message || ""}
          </p>
          
          {/* Media content (image or video) */}
          {tweet.image_url && (
            <div className="mt-2 mb-2 rounded-md overflow-hidden">
              {tweet.image_url.match(/\.(mp4|webm)$/) ? (
                <video
                  controls
                  className="w-full h-auto rounded-md max-h-[450px] object-cover bg-black"
                >
                  <source src={tweet.image_url} type="video/mp4" />
                  Your browser does not support video playback.
                </video>
              ) : (
                <img
                  src={tweet.image_url}
                  alt="Tweet media"
                  className="w-full h-auto rounded-md max-h-[450px] object-cover"
                />
              )}
            </div>
          )}
          
          {/* Engagement buttons */}
          <div className="flex items-center mt-2 space-x-5">
            <button className="flex items-center text-gray-500 hover:text-red-500 transition-colors group">
              <HeartIcon className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              <span className="ml-1 text-xs">{tweet.likes_count || 0}</span>
            </button>
            <button className="flex items-center text-gray-500 hover:text-blue-500 transition-colors group">
              <ChatBubbleLeftIcon className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              <span className="ml-1 text-xs">{tweet.comments_count || 0}</span>
            </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Tweet;