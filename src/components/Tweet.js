import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, ChatBubbleLeftIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { supabase } from '../supabaseClient';

const Tweet = ({ tweet, className = '', onDelete, currentUser }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(tweet.likes_count || 0);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // Check if user has liked the tweet
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!currentUser) return;
      
      const { data } = await supabase
        .from('likes')
        .select()
        .eq('tweet_id', tweet.id)
        .eq('user_id', currentUser.id)
        .single();
        
      setIsLiked(!!data);
    };
    
    checkLikeStatus();
  }, [tweet.id, currentUser]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(username, avatar_url)
        `)
        .eq('tweet_id', tweet.id)
        .order('created_at', { ascending: false });
        
      setComments(data || []);
    };
    
    fetchComments();
  }, [tweet.id]);

  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('tweet_id', tweet.id)
          .eq('user_id', currentUser.id);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from('likes')
          .insert({
            tweet_id: tweet.id,
            user_id: currentUser.id
          });
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async () => {
    if (!comment.trim() || !currentUser) return;
    
    setIsCommenting(true);
    setCommentError(null);
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          tweet_id: tweet.id,
          user_id: currentUser.id,
          content: comment.trim()
        })
        .select(`
          *,
          user:profiles(username, avatar_url)
        `)
        .single();
          
      if (error) throw error;
      
      // Optimistically add new comment to state
      setComments(prevComments => [data, ...prevComments]);
      setComment('');
      // Close the modal after successful comment
      setShowCommentModal(false);
      
    } catch (error) {
      console.error('Error posting comment:', error);
      setCommentError('Failed to post comment. Please try again.');
    } finally {
      setIsCommenting(false);
    }
  };

  const formattedDate = new Date(tweet.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className={`w-full py-3 text-light-text dark:text-dark-text ${className}`}>
      {/* Header with avatar and user info */}
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <Link to={`/profile/${tweet.user_id}`} className="flex-shrink-0">
          <img 
            src={tweet.user?.avatar_url || 'https://via.placeholder.com/40'} 
            alt={tweet.user?.username}
            className="w-10 h-10 rounded-full object-cover border border-light-border dark:border-dark-border"
          />
        </Link>
        
        {/* Content container */}
        <div className="flex-1 min-w-0">
          {/* Username and date */}
          <div className="flex items-center mb-1">
            <Link 
              to={`/profile/${tweet.user_id}`}
              className="font-semibold text-sm hover:underline truncate text-light-text dark:text-dark-text"
            >
              {tweet.user?.username || "Anonymous"}
            </Link>
            <span className="inline-block mx-1 text-light-muted dark:text-dark-textSecondary">•</span>
            <span className="text-xs text-light-muted dark:text-dark-textSecondary">{formattedDate}</span>
          </div>
          
          {/* Tweet text */}
          <p className="text-[15px] text-light-text dark:text-dark-text mb-2 whitespace-pre-wrap break-words">
            {tweet.text || tweet.content || tweet.message || ""}
          </p>
          
          {/* Media content */}
          {tweet.image_url && (
            <div className="mt-2 mb-2 rounded-md overflow-hidden border border-light-border dark:border-dark-border">
              {tweet.image_url.match(/\.(mp4|webm)$/) ? (
                <video
                  controls
                  className="w-full h-auto rounded-md max-h-[450px] object-cover bg-light-secondary dark:bg-dark-secondary"
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
            <button 
              onClick={handleLike}
              className={`flex items-center transition-colors group ${
                isLiked ? 'text-dark-error' : 'text-light-muted dark:text-dark-textSecondary hover:text-dark-error'
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              ) : (
                <HeartIcon className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              )}
              <span className="ml-1 text-xs">{likesCount}</span>
            </button>
            
            <button 
              onClick={() => setShowCommentModal(true)}
              className="flex items-center text-light-muted dark:text-dark-textSecondary hover:text-dark-accent transition-colors group"
            >
              <ChatBubbleLeftIcon className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              <span className="ml-1 text-xs">{comments.length}</span>
            </button>
            
            {onDelete && (
              <button
                onClick={() => onDelete(tweet.id)}
                className="text-red-500 hover:text-red-700"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Comment Modal */}
          {showCommentModal && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-light-primary dark:bg-dark-secondary rounded-xl max-w-lg w-full p-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">Comments</h3>
                  <button 
                    onClick={() => setShowCommentModal(false)}
                    className="text-light-muted dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Comment input */}
                <div className="flex flex-col gap-2 mb-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 rounded-lg resize-none 
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none 
                      placeholder-light-muted dark:placeholder-dark-textSecondary
                      transition"
                    rows="3"
                    maxLength={500}
                    disabled={isCommenting}
                  />
                  {commentError && (
                    <p className="text-sm text-dark-error">{commentError}</p>
                  )}
                  <button
                    onClick={handleComment}
                    disabled={!comment.trim() || isCommenting}
                    className={`px-4 py-2 rounded-lg transition flex items-center justify-center
                      ${comment.trim() && !isCommenting
                        ? 'bg-dark-accent hover:bg-dark-accentHover text-white' 
                        : 'bg-light-secondary dark:bg-dark-tertiary text-light-muted dark:text-dark-textSecondary cursor-not-allowed'
                      }`}
                  >
                    {isCommenting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Posting...
                      </>
                    ) : (
                      'Post Comment'
                    )}
                  </button>
                </div>
                
                {/* Comments list */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img
                        src={comment.user?.avatar_url || 'https://via.placeholder.com/32'}
                        alt=""
                        className="w-8 h-8 rounded-full border border-light-border dark:border-dark-border"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-light-text dark:text-dark-text">
                            {comment.user?.username}
                          </span>
                          <span className="text-xs text-light-muted dark:text-dark-textSecondary">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-light-text dark:text-dark-text">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tweet;