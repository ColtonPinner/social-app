import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon, HeartIcon, ChatBubbleLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Image } from "@heroui/react";
import { supabase } from '../supabaseClient';

const Tweet = ({ tweet, className = '', onDelete, currentUser = null }) => {
  // 1. ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL LOGIC
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [commentBoxPosition, setCommentBoxPosition] = useState({ top: 0, left: 0 });
  const commentButtonRef = useRef(null);

  const [commentCount, setCommentCount] = useState(0);

  // Add state for user profile data
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile data for the tweet author
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!tweet?.user_id) return;

      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, full_name')
          .eq('id', tweet.user_id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        setUserProfile(profileData);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [tweet?.user_id]);

  // Fetch comments - modify this function to load comments even when not logged in
  const fetchComments = useCallback(async () => {
    if (!showCommentModal || !tweet) return;
    setIsLoadingComments(true);

    try {
      // Remove parseInt since tweet.id is already a UUID
      const tweetId = tweet.id;

      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('tweet_id', tweetId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];

        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const usersMap = {};
        if (usersData) {
          usersData.forEach(user => {
            usersMap[user.id] = user;
          });
        }

        const commentsWithUsers = commentsData.map(comment => ({
          ...comment,
          user: usersMap[comment.user_id] || null
        }));

        setComments(commentsWithUsers);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  }, [showCommentModal, tweet?.id]);

  // Add a new function to fetch just the comment count
  const fetchCommentCount = useCallback(async () => {
    if (!tweet) return;
    try {
      // Remove parseInt since tweet.id is already a UUID
      const tweetId = tweet.id;
      
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('tweet_id', tweetId);
      
      if (!error) {
        setCommentCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching comment count:', err);
    }
  }, [tweet?.id]);

  // Add a new useEffect to fetch the comment count when component mounts
  useEffect(() => {
    fetchCommentCount();
  }, [fetchCommentCount]);

  // Load comments when modal opens - remove currentUser requirement
  useEffect(() => {
    if (showCommentModal) {
      fetchComments();
    }
  }, [fetchComments, showCommentModal]);

  // Check if user has liked the tweet
  useEffect(() => {
    if (!currentUser || !tweet) return;

    const fetchLikeStatus = async () => {
      try {
        const contentId = tweet.id;

        // Changed from 'likes' to 'post_likes'
        const { data, error } = await supabase
          .from('post_likes')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('content_id', contentId)
          .maybeSingle();

        setIsLiked(!!data && !error);

        // Changed from 'likes' to 'post_likes'
        const { count, error: countError } = await supabase
          .from('post_likes')
          .select('id', { count: 'exact', head: true })
          .eq('content_id', tweet.id);

        if (!countError) setLikesCount(count || 0);
      } catch (err) {
        console.error('Error checking like status:', err);
      }
    };

    fetchLikeStatus();
  }, [currentUser, tweet?.id]);

  // 2. NOW WE CAN DO EARLY RETURNS AFTER ALL HOOKS
  // Display a skeleton loader if the main tweet data isn't available yet
  if (!tweet) {
    return (
      <div className={`w-full py-3 text-light-text dark:text-dark-text ${className}`}>
        <div className="animate-pulse flex items-start space-x-3 p-3">
          <div className="w-10 h-10 rounded-full bg-light-secondary dark:bg-dark-secondary flex-shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-light-secondary dark:bg-dark-secondary rounded w-3/4"></div>
            <div className="h-4 bg-light-secondary dark:bg-dark-secondary rounded w-full"></div>
            <div className="h-4 bg-light-secondary dark:bg-dark-secondary rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Local variables and helper functions
  const formattedDate = new Date(tweet.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const isValidUser = () => {
    if (!currentUser) return false;
    return Boolean(
      typeof currentUser === 'object' && (
        Boolean(currentUser.id) || 
        Boolean(currentUser.uid) || 
        Boolean(currentUser.user_id)
      )
    );
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please sign in to like posts');
      return;
    }

    const userId = currentUser.id || currentUser.uid || currentUser.user_id;
    if (!userId) {
      alert('User profile incomplete. Please try signing out and in again.');
      console.error('Missing user ID', { currentUser });
      return;
    }

    if (likeLoading) return;
    setLikeLoading(true);

    try {
      const contentId = tweet.id;
      
      if (isLiked) {
        // DELETE operation - using post_likes
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', userId)
          .eq('content_id', contentId);

        if (error) {
          console.error('Unlike error:', error);
          throw error;
        }

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // INSERT operation - also using post_likes (was using 'likes' before)
        const { error } = await supabase
          .from('post_likes')
          .insert({
            user_id: userId,
            content_id: contentId,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Like error:', error);
          throw error;
        }

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Like operation failed:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();

    if (!isValidUser()) {
      alert('Please sign in to comment');
      return;
    }

    const userId = currentUser.id || currentUser.uid || currentUser.user_id;

    if (!comment.trim() || submittingComment) return;
    setSubmittingComment(true);

    try {
      // Remove parseInt since tweet.id is already a UUID
      const tweetId = tweet.id;

      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          tweet_id: tweetId,
          content: comment.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Comment submission error:', error);
        throw error;
      }

      const newComment = {
        ...data,
        user: {
          id: userId,
          username: currentUser.username,
          avatar_url: currentUser.avatar_url
        }
      };

      setComments(prev => [newComment, ...prev]);
      setComment('');
      setCommentCount(prev => prev + 1);
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const openFloatingCommentBox = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (commentButtonRef.current) {
      const buttonRect = commentButtonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      const boxWidth = Math.min(viewportWidth - 40, 350);
      const estimatedBoxHeight = 400;

      let left = buttonRect.right + scrollLeft + 16;
      let top = buttonRect.top + scrollTop - 16;

      if (left + boxWidth > viewportWidth - 10) {
        left = buttonRect.left + scrollLeft - boxWidth - 16;
      }
      if (left < 10) left = 10;

      if (top + estimatedBoxHeight > viewportHeight + scrollTop - 10) {
        top = viewportHeight + scrollTop - estimatedBoxHeight - 10;
      }
      if (top < 10) top = 10;

      setCommentBoxPosition({
        top,
        left,
        boxWidth
      });
    }

    setShowCommentModal(true);
  };

  // Get the display data for the user
  const getUserDisplayData = () => {
    // Priority: tweet.user > userProfile > fallback
    return {
      username: tweet.user?.username || userProfile?.username || 'Anonymous',
      avatar_url: tweet.user?.avatar_url || userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${tweet.user?.username || userProfile?.username || 'Anonymous'}&background=3b82f6&color=fff&size=40`,
      full_name: tweet.user?.full_name || userProfile?.full_name || null
    };
  };

  const displayUser = getUserDisplayData();

  // 4. The main render
  return (
    <div className={`w-full py-3 text-light-text dark:text-dark-text ${className} relative`}>
      <div className="flex items-start space-x-3">
        {/* User Avatar with fallback */}
        <Link to={`/profile/${tweet.user_id}`} className="flex-shrink-0">
          {displayUser.avatar_url ? (
            <img
              src={displayUser.avatar_url}
              alt={`${displayUser.username}'s avatar`}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-light-border dark:border-dark-border"
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = `https://ui-avatars.com/api/?name=${displayUser.username}&background=3b82f6&color=fff&size=40`;
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {displayUser.username.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <Link 
              to={`/profile/${tweet.user_id}`}
              className="font-semibold text-sm hover:underline truncate text-light-text dark:text-dark-text"
            >
              {displayUser.full_name || displayUser.username}
            </Link>
            {displayUser.full_name && (
              <>
                <span className="mx-1 text-light-muted dark:text-dark-textSecondary">@{displayUser.username}</span>
              </>
            )}
            <span className="inline-block mx-1 text-light-muted dark:text-dark-textSecondary">•</span>
            <span className="text-xs text-light-muted dark:text-dark-textSecondary">{formattedDate}</span>
          </div>
          
          <p className="text-[16px] text-light-text dark:text-dark-text mb-2 whitespace-pre-wrap break-words">
            {tweet.text || tweet.content || tweet.message || ""}
          </p>
          
          {tweet.image_url && (
            <div className="mt-3 mb-3">
              {tweet.image_url.match(/\.(mp4|webm)$/) ? (
                <video
                  controls
                  className="w-full h-auto max-h-[500px] object-cover rounded-lg"
                >
                  <source src={tweet.image_url} type="video/mp4" />
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="relative rounded-lg overflow-hidden">
                  {/* Regular img tag instead of Image component for better fallback handling */}
                  <img
                    src={tweet.image_url}
                    alt="Tweet media"
                    className="w-full h-auto max-h-[500px] object-cover rounded-lg border border-light-border dark:border-dark-border shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(tweet.image_url, '_blank');
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', tweet.image_url);
                      e.target.src = 'https://via.placeholder.com/500?text=Image+not+available';
                    }}
                  />
                  
                  {/* Debug info - remove in production */}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center mt-3 space-x-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isValidUser()) {
                  handleLike();
                } else {
                  alert('Please sign in to like posts');
                }
              }}
              className="flex items-center space-x-1.5 group py-1 px-2 rounded-md hover:bg-light-secondary dark:hover:bg-dark-secondary relative z-10"
            >
              {isLiked ? (
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary group-hover:text-red-500" />
              )}
              <span className={`text-xs ${isLiked ? 'text-red-500' : 'text-light-muted dark:text-dark-textSecondary group-hover:text-red-500'}`}>
                {likesCount}
              </span>
            </button>
            
            <button
              ref={commentButtonRef}
              type="button"
              onClick={openFloatingCommentBox}
              className="flex items-center space-x-1.5 group py-1 px-2 rounded-md hover:bg-light-secondary dark:hover:bg-dark-secondary relative z-10"
            >
              <ChatBubbleLeftIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary group-hover:text-blue-500" />
              <span className="text-xs text-light-muted dark:text-dark-textSecondary group-hover:text-blue-500">
                {commentCount}
              </span>
            </button>
            
            {currentUser && tweet.user_id === currentUser.id && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this tweet?')) {
                    onDelete(tweet.id);
                  }
                }}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                title="Delete post"
              >
                <TrashIcon className="h-5 w-5" />
                <span className="sr-only">Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Comment Modal */}
      {showCommentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40"
          onClick={() => setShowCommentModal(false)}
        >
          <div
            className="bg-light-primary dark:bg-dark-primary shadow-xl rounded-lg border border-light-border dark:border-dark-border overflow-hidden"
            style={{
              minWidth: 380,
              maxWidth: 500,
              width: '100%',
              maxHeight: '80vh',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 border-b border-light-border dark:border-dark-border">
              <h3 className="font-semibold text-light-text dark:text-dark-text">
                {comments.length > 0 ? `Comments (${comments.length})` : 
                  commentCount > 0 ? `Comments (${commentCount})` : 'Add Comment'}
              </h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="p-1 rounded-full text-light-muted dark:text-dark-textSecondary hover:bg-light-secondary dark:hover:bg-dark-secondary"
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            {currentUser && (
              <div className="p-3 border-b border-light-border dark:border-dark-border">
                <form onSubmit={handleComment}>
                  <div className="flex items-start space-x-2">
                    <Image
                      src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.username || 'User'}&background=3b82f6&color=fff&size=32`}
                      alt={`${currentUser.username}'s avatar`}
                      width={32}
                      height={32}
                      className="rounded-full flex-shrink-0 object-cover border border-light-border dark:border-dark-border"
                      isBlurred={false}
                      loading="lazy"
                      radius="full"
                      showSkeleton={true}
                      fallback={
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                          {(currentUser.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      }
                    />
                    <div className="flex-1">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full p-2 bg-light-secondary dark:bg-dark-secondary rounded-lg text-light-text dark:text-dark-text text-sm focus:outline-none resize-none"
                        rows={2}
                        maxLength={280}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={!comment.trim() || submittingComment}
                          className="px-3 py-1 bg-dark-accent text-white rounded-full text-xs font-medium disabled:opacity-50"
                        >
                          {submittingComment ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
            
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
              {isLoadingComments ? (
                <div className="py-6 text-center text-light-muted dark:text-dark-textSecondary">
                  <div className="animate-spin h-6 w-6 border-2 border-light-border dark:border-dark-border border-t-dark-accent rounded-full mx-auto mb-2"></div>
                  <p>Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                <ul className="divide-y divide-light-border dark:divide-dark-border">
                  {comments.map(comment => {
                    const commentUser = comment.user || {};
                    const commentAvatarUrl = commentUser.avatar_url || `https://ui-avatars.com/api/?name=${commentUser.username || 'User'}&background=6b7280&color=fff&size=32`;
                    
                    return (
                      <li key={comment.id} className="p-3 hover:bg-light-secondary/30 dark:hover:bg-dark-secondary/30">
                        <div className="flex space-x-2">
                          <Link 
                            to={`/profile/${comment.user_id}`} 
                            className="flex-shrink-0"
                          >
                            <Image
                              src={commentAvatarUrl}
                              alt={`${commentUser.username || 'User'}'s avatar`}
                              width={28}
                              height={28}
                              className="rounded-full object-cover border border-light-border dark:border-dark-border hover:opacity-90 transition-opacity"
                              isBlurred={false}
                              loading="lazy"
                              radius="full"
                              showSkeleton={true}
                              fallback={
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-semibold text-xs">
                                  {(commentUser.username || 'U').charAt(0).toUpperCase()}
                                </div>
                              }
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <Link 
                                to={`/profile/${comment.user_id}`}
                                className="font-medium text-xs hover:underline text-light-text dark:text-dark-text"
                              >
                                {commentUser.username || 'Anonymous User'}
                              </Link>
                              <span className="mx-1 text-xs text-light-muted dark:text-dark-textSecondary">•</span>
                              <span className="text-xs text-light-muted dark:text-dark-textSecondary">
                                {new Date(comment.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-light-text dark:text-dark-text mt-1 break-words whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-8 px-3 text-center text-light-muted dark:text-dark-textSecondary">
                  <p className="text-sm mb-2">No comments yet</p>
                  {currentUser ? (
                    <p className="text-xs">Be the first to share your thoughts!</p>
                  ) : (
                    <p className="text-xs">Sign in to comment on this post</p>
                  )}
                </div>
              )}
            </div>
            
            {comments.length > 5 && (
              <div className="p-2 border-t border-light-border dark:border-dark-border text-center">
                <button 
                  className="text-xs text-dark-accent hover:underline"
                  onClick={() => setShowCommentModal(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tweet;
