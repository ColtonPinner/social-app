import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon, HeartIcon, ChatBubbleLeftIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
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

  // New state for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Add this new state near your other state variables (around line 20)
  const [showEnlargedImage, setShowEnlargedImage] = useState(false);
  const commentTextareaRef = useRef(null);
  const [commentCharRemaining, setCommentCharRemaining] = useState(280);
  const [isZoomed, setIsZoomed] = useState(false);

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
      // Use same ID conversion logic as in handleComment
      let tweetId;
      
      if (typeof tweet.id === 'string' && isNaN(parseInt(tweet.id))) {
        const numericPart = tweet.id.replace(/-/g, '').slice(-12);
        tweetId = parseInt(numericPart, 16) % Number.MAX_SAFE_INTEGER;
      } else {
        tweetId = parseInt(tweet.id);
      }

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
      // Convert the tweet ID using the same logic
      let tweetId;
      
      if (typeof tweet.id === 'string' && isNaN(parseInt(tweet.id))) {
        const numericPart = tweet.id.replace(/-/g, '').slice(-12);
        tweetId = parseInt(numericPart, 16) % Number.MAX_SAFE_INTEGER;
      } else {
        tweetId = parseInt(tweet.id);
      }

      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('tweet_id', tweetId);

      if (!error) setCommentCount(count || 0);
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

  // Add this before your return statement to test connection
  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('comments').select('*').limit(1);
      console.log('Supabase connection test:', { data, error });
    };
    testConnection();
  }, []);

  // Add this right before your return statement (for testing only)
  const testImageUrls = [
    "https://picsum.photos/800/600",
    "https://picsum.photos/800/601",
    "https://picsum.photos/800/602"
  ];
  console.log("Test image URLs:", testImageUrls);

  // Add the debug useEffect hook HERE, along with all other hooks
  useEffect(() => {
    if (tweet?.content) {
      console.log('Tweet Content Type:', typeof tweet.content);
      console.log('Raw Tweet Content:', tweet.content);
      
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(tweet.content);
        console.log('Parsed Tweet Content:', parsed);
        
        if (parsed.additionalImages) {
          console.log('Additional Images:', parsed.additionalImages);
        }
        if (parsed.images) {
          console.log('Images Array:', parsed.images);
        }
      } catch (e) {
        console.log('Content is not valid JSON');
      }
    }
    
    // Log all image URLs found - This will need to reference getImageUrls which is defined later
    // So we'll need to define getImageUrls before the hooks or move this code to after all hooks
  }, [tweet]); // Note that the dependency on getImageUrls is missing because it's defined later

  // 2. THEN define helper functions like getImageUrls
  const getImageUrls = (tweet) => {
    // Initialize array to hold all images
    let images = [];
    
    // Add main image_url if it exists
    if (tweet.image_url) {
      images.push(tweet.image_url);
    }
    
    // Try parsing additional images from content field
    if (tweet.content) {
      try {
        // First, determine if content is JSON or contains JSON
        let contentData;
        try {
          contentData = JSON.parse(tweet.content);
          
          // Handle different JSON structures
          if (contentData) {
            // Case 1: Array of additionalImages
            if (contentData.additionalImages && Array.isArray(contentData.additionalImages)) {
              images = [...images, ...contentData.additionalImages.filter(Boolean)];
            }
            // Case 2: Array of images
            else if (contentData.images && Array.isArray(contentData.images)) {
              images = [...images, ...contentData.images.filter(Boolean)];
            }
            // Case 3: Direct array of URLs
            else if (Array.isArray(contentData)) {
              images = [...images, ...contentData.filter(Boolean)];
            }
            // Case 4: Single image property
            else if (contentData.image) {
              images.push(contentData.image);
            }
          }
        } catch (e) {
          // Not valid JSON, check if it might be a string containing image URLs
          const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
          const matches = tweet.content.match(urlRegex);
          if (matches) {
            images = [...images, ...matches];
          }
          // Don't return here, continue processing
        }
      } catch (e) {
        console.error('Error parsing image URLs:', e);
      }
    }
    
    // Add debugging to see what images are found
    console.log('Found images:', images);
    
    // Remove duplicates and empty values
    return [...new Set(images)].filter(Boolean);
  };

  // Add the part that calls getImageUrls after it's defined
  useEffect(() => {
    if (tweet) {
      const allImages = getImageUrls(tweet);
      console.log('All Images Found:', allImages);
    }
  }, [tweet]);

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

  const notifyPostAuthor = useCallback(async (type, metadata = {}, customMessage) => {
    try {
      if (!currentUser || !tweet?.user_id) return;

      const actorId = currentUser.id || currentUser.uid || currentUser.user_id;
      if (!actorId || actorId === tweet.user_id) return;

      const emailPrefix = currentUser.email ? currentUser.email.split('@')[0] : null;
      const actorName = currentUser.username || currentUser.full_name || emailPrefix || 'Someone';

      const metadataPayload = Object.entries({ post_id: tweet.id, ...metadata }).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      let message = customMessage;
      if (!message) {
        switch (type) {
          case 'like':
            message = `${actorName} liked your post`;
            break;
          case 'comment':
            message = `${actorName} commented on your post`;
            break;
          default:
            message = `${actorName} interacted with your post`;
        }
      }

      await supabase.from('notifications').insert({
        user_id: tweet.user_id,
        sender_id: actorId,
        type,
        message,
        metadata: metadataPayload
      });
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  }, [currentUser, tweet?.user_id, tweet?.id]);

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
        notifyPostAuthor('like');
      }
    } catch (error) {
      console.error('Like operation failed:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const adjustCommentTextareaHeight = useCallback(() => {
    const textarea = commentTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  const submitComment = useCallback(async () => {
    if (!currentUser) {
      alert('Please sign in to comment');
      return;
    }

    const userId = currentUser.id || currentUser.uid || currentUser.user_id;

    if (!userId) {
      alert('User profile incomplete. Please try signing out and signing back in.');
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment || submittingComment) return;
    setSubmittingComment(true);

    try {
      let tweetId;
      
      if (typeof tweet.id === 'string' && isNaN(parseInt(tweet.id))) {
        const numericPart = tweet.id.replace(/-/g, '').slice(-12);
        tweetId = parseInt(numericPart, 16) % Number.MAX_SAFE_INTEGER;
      } else {
        tweetId = parseInt(tweet.id);
      }

      if (Number.isNaN(tweetId)) {
        throw new Error('Could not generate a valid numeric ID from tweet identifier');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          tweet_id: tweetId,
          content: trimmedComment,
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

      notifyPostAuthor('comment', {
        comment_id: data?.id,
        comment_preview: trimmedComment.slice(0, 140)
      });

      setComments(prev => [newComment, ...prev]);
      setComment('');
      setCommentCharRemaining(280);
      setCommentCount(prev => prev + 1);
      adjustCommentTextareaHeight();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Unable to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  }, [currentUser, comment, submittingComment, tweet?.id, adjustCommentTextareaHeight, notifyPostAuthor]);

  const handleComment = async (e) => {
    e.preventDefault();
    await submitComment();
  };

  const handleCommentKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      submitComment();
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
    <div className={`w-full mx-auto py-3 text-light-text dark:text-dark-text ${className} relative px-0`}>
      <div className="flex items-start space-x-3">
        {/* User Avatar with fallback */}
        <Link to={`/profile/${tweet.user_id}`} className="flex-shrink-0 block">
          <div className="relative w-10 h-10">
            <img
              src={displayUser.avatar_url}
              alt={`${displayUser.username}'s avatar`}
              className="w-10 h-10 rounded-full object-cover border border-light-border dark:border-dark-border transition-transform hover:scale-105"
              onError={(e) => {
                // Fallback to initials if image fails to load
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            
            {/* Fallback element that's hidden by default */}
            <div 
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm absolute inset-0"
              style={{ display: 'none' }}
            >
              {displayUser.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </Link>
        
        <div className="flex-1 min-w-0">
          {/* User info area with date on right */}
          <div className="flex justify-between items-start mb-2">
            {/* Left side: User info */}
            <div className="flex flex-col">
              {/* Line 1: Full name */}
              <Link 
                to={`/profile/${tweet.user_id}`}
                className="font-semibold text-sm hover:underline text-light-text dark:text-dark-text"
              >
                {displayUser.full_name || displayUser.username}
              </Link>
              
              {/* Line 2: Username */}
              <span className="text-xs text-light-muted dark:text-dark-textSecondary">
                @{displayUser.username}
              </span>
            </div>
            
            {/* Right side: Date */}
            <span className="text-xs text-light-muted dark:text-dark-textSecondary shrink-0 ml-2">
              {formattedDate}
            </span>
          </div>
          
          <p className="text-[16px] text-light-text dark:text-dark-text mb-2 whitespace-pre-wrap break-words">
            {tweet.text || tweet.content || tweet.message || ""}
          </p>
          
          {(() => {
  const imageUrls = getImageUrls(tweet);
  
  // Enhanced debug output
  console.log('Tweet image URLs:', imageUrls);
  console.log('Image URLs count:', imageUrls.length);
  console.log('Current image index:', currentImageIndex);
  console.log('Current image URL:', imageUrls[currentImageIndex]);
  
  if (imageUrls.length === 0) return null;
  
  const currentUrl = imageUrls[currentImageIndex];
  
  return (
    <div className="mt-3 mb-3">
      {currentUrl.match(/\.(mp4|webm)$/) ? (
        // Video handling stays the same
        <video
          controls
          className="w-full h-auto max-h-[500px] object-cover rounded-lg postion-center"
        >
          <source src={currentUrl} type="video/mp4" />
          Your browser does not support video playback.
        </video>
      ) : (
        imageUrls.length === 1 ? (
          // Single image - simple display without carousel elements
          <div className="rounded-lg overflow-hidden w-full">
            <img
              src={currentUrl}
              alt="Tweet media"
              className="max-h-[auto] w-full object-contain rounded-lg dark:border-dark-border shadow-md cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowEnlargedImage(true);
              }}
              onError={(e) => {
                console.error('Image failed to load:', currentUrl);
                e.target.src = 'https://via.placeholder.com/500?text=Image+not+available';
              }}
            />
          </div>
        ) : (
          // Multiple images - full carousel with controls
          <div className="relative rounded-lg overflow-hidden w-full">
            <div className="relative aspect-video bg-light-secondary dark:bg-dark-tertiary flex justify-center w-full">
              <img
                src={currentUrl || 'https://via.placeholder.com/500?text=No+image'}
                alt={`Tweet media ${currentImageIndex + 1} of ${imageUrls.length}`}
                className="max-h-[500px] w-full sm:w-auto max-w-full object-contain sm:object-contain rounded-lg border border-light-border dark:border-dark-border shadow-md cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEnlargedImage(true);
                }}
                onError={(e) => {
                  console.error('Image failed to load:', currentUrl);
                  e.target.src = 'https://via.placeholder.com/500?text=Image+not+available';
                }}
              />
            </div>
            
            {/* Navigation controls */}
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full 
                bg-black/40 text-white hover:bg-black/60 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => 
                  prev === 0 ? imageUrls.length - 1 : prev - 1
                );
              }}
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full 
                bg-black/40 text-white hover:bg-black/60 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => 
                  prev === imageUrls.length - 1 ? 0 : prev + 1
                );
              }}
              aria-label="Next image"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            
            {/* Image counter/indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {imageUrls.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentImageIndex 
                      ? 'w-6 bg-white' 
                      : 'w-2 bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
            
            {/* Image counter text */}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {currentImageIndex + 1} / {imageUrls.length}
            </div>
          </div>
        )
      )}
    </div>
  );
})()}
          
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
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <img
                        src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.username || 'User'}&background=3b82f6&color=fff&size=32`}
                        alt={`${currentUser.username}'s avatar`}
                        className="w-8 h-8 rounded-full object-cover border border-light-border dark:border-dark-border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div 
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs absolute inset-0"
                        style={{ display: 'none' }}
                      >
                        {(currentUser.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
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
                            <div className="relative w-7 h-7">
                              <img
                                src={commentAvatarUrl}
                                alt={`${commentUser.username || 'User'}'s avatar`}
                                className="w-7 h-7 rounded-full object-cover border border-light-border dark:border-dark-border"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                              <div 
                                className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-semibold text-xs absolute inset-0"
                                style={{ display: 'none' }}
                              >
                                {(commentUser.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            </div>
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
      
      {/* Enlarged Image Modal */}
      {showEnlargedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setShowEnlargedImage(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowEnlargedImage(false);
              }}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {/* Navigation buttons */}
            {getImageUrls(tweet).length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full 
                    bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => 
                      prev === 0 ? getImageUrls(tweet).length - 1 : prev - 1
                    );
                  }}
                >
                  <ChevronLeftIcon className="h-8 w-8" />
                </button>
                
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full 
                    bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => 
                      prev === getImageUrls(tweet).length - 1 ? 0 : prev + 1
                    );
                  }}
                >
                  <ChevronRightIcon className="h-8 w-8" />
                </button>
              </>
            )}
            
            {/* Enlarged image */}
            <img
              src={getImageUrls(tweet)[currentImageIndex]}
              alt="Enlarged view"
              className="max-w-full max-h-[95vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Image counter */}
            {getImageUrls(tweet).length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {getImageUrls(tweet).length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// For uploading multiple images, use this format:
// const tweetContent = JSON.stringify({
//   additionalImages: [
//     "https://example.com/image1.jpg", 
//     "https://example.com/image2.jpg"
//   ]
// });

export default Tweet;
