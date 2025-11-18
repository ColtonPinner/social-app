import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Link as LinkIcon,
  Spinner,
  Camera,
  DotsThreeVertical,
  Heart as HeartIcon,
  HeartSolid as HeartSolidIcon
} from '@phosphor-icons/react';
import { supabase } from '../supabaseClient';
import Tweet from './Tweet';

const Profile = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Profile and UI state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    bio: '',
    website: ''
  });
  
  // Content state
  const [tweets, setTweets] = useState([]);
  
  // Follow state
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);
      try {
        await fetchProfile();
        await Promise.all([
          fetchTweets(),
          fetchFollowData(),
          checkIfFollowing()
        ]);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('[data-menu]')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Data fetching functions
  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
    setFormData({
      username: data.username || '',
      full_name: data.full_name || '',
      website: data.website || '',
      avatar_url: data.avatar_url || '',
      bio: data.bio || ''
    });
  };

  const fetchTweets = async () => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('*, user:user_id(*), likes:tweet_likes(profile_id)')
        .eq('deleted', false)
        .eq('is_reply', false)
        .or(`user_id.eq.${id},user_id.eq.${currentUser?.id}`)
        .is('reply_to', null)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTweets(data || []);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      setTweets([]);
    }
  };

  const fetchFollowData = async () => {
    if (!id) return;

    try {
      const [{ data: followersRaw }, { data: followingRaw }] = await Promise.all([
        supabase
          .from('follows')
          .select(`follower_id, profile: follower_id (id, username, avatar_url)`)
          .eq('following_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('follows')
          .select(`following_id, profile: following_id (id, username, avatar_url)`)
          .eq('follower_id', id)
          .order('created_at', { ascending: false })
      ]);

      const followers = (followersRaw || []).map(r => r.profile).filter(Boolean);
      const following = (followingRaw || []).map(r => r.profile).filter(Boolean);

      setFollowers(followers);
      setFollowing(following);

      // counts derived from raw results
      setFollowersCount((followersRaw || []).length);
      setFollowingCount((followingRaw || []).length);
    } catch (error) {
      console.error('Error fetching follow data:', error);
      setFollowers([]);
      setFollowing([]);
      setFollowersCount(0);
      setFollowingCount(0);
    }
  };

  const checkIfFollowing = async () => {
    if (!currentUser || !id) return;
    
    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', id)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (err) {
      console.error('Error in checkIfFollowing:', err);
      setIsFollowing(false);
    }
  };

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      let avatar_url = formData.avatar_url;
      if (preview) {
        const file = await fetch(preview).then(r => r.blob());
        const fileExt = file.type.split('/')[1];
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicURL } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);

        avatar_url = publicURL;
      }

      await supabase
        .from('profiles')
        .update({
          ...formData,
          avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      await fetchProfile();
      setIsEditing(false);
      setPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !id) {
      console.log('Missing user info', { currentUser, profileId: id });
      return;
    }

    setIsFollowLoading(true);
    console.log('Follow button clicked', { isFollowing, currentUserId: currentUser.id, profileId: id });
    
    try {
      if (isFollowing) {
        // Unfollow logic
        console.log('Attempting to unfollow');
        const { data, error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id);

        if (error) {
          console.error('Supabase error during unfollow:', error);
          throw error;
        }
        
        console.log('Successfully unfollowed', data);
      } else {
        // Follow logic
        console.log('Attempting to follow');
        const { data, error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: id,
          });

        if (error) {
          console.error('Supabase error during follow:', error);
          throw error;
        }
        
        console.log('Successfully followed', data);
        
        // Create notification (optional)
        if (id !== currentUser.id) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: id,
              sender_id: currentUser.id,
              type: 'follow',
              content: `${currentUser.username} started following you`
            });
            
          if (notifError) {
            console.error('Notification error:', notifError);
            // We don't throw here since notification failure shouldn't prevent following
          }
        }
      }

      // Toggle the follow state
      setIsFollowing(!isFollowing);
      await fetchFollowData(); // Refresh follow data
    } catch (error) {
      console.error('Error updating follow status:', error);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // The handleTweetUpdate function is already correctly implemented
  const handleTweetUpdate = async (tweetId) => {
    // Refresh only the affected tweet
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('*, user:user_id(*), likes:tweet_likes(profile_id)')
        .eq('id', tweetId)
        .single();

      if (error) throw error;

      // Update the specific tweet in state
      setTweets(prevTweets => 
        prevTweets.map(tweet => 
          tweet.id === tweetId ? data : tweet
        )
      );
    } catch (error) {
      console.error('Error updating tweet:', error);
    }
  };

  // Loading state check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen pt-24 md:pt-28">
      <div className="max-w-3xl mx-auto px-4">
        {/* Profile Card */}
        <div className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
          border border-light-border dark:border-dark-border
          rounded-2xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500" />
            
            {/* Profile Image and Actions */}
            <div className="px-4 md:px-6">
              <div className="relative -mt-20 mb-4 flex justify-between items-end">
                <img
                  src={preview || profile.avatar_url || 'https://via.placeholder.com/150'}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full border-4 border-light-primary dark:border-dark-primary object-cover"
                />
                <div className="flex items-center space-x-3">
                  {currentUser?.id === profile.id && !isEditing ? (
                    <div className="relative" data-menu>
                      <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-full hover:bg-light-secondary dark:hover:bg-dark-tertiary transition-colors"
                      >
                        <DotsThreeVertical className="h-5 w-5 text-light-text dark:text-dark-text" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg 
                          bg-light-primary dark:bg-dark-primary 
                          border border-light-border dark:border-dark-border
                          divide-y divide-light-border dark:divide-dark-border z-10"
                        >
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsEditing(true);
                            }}
                            className="w-full px-4 py-2 text-left text-sm
                              text-light-text dark:text-dark-text
                              hover:bg-light-secondary dark:hover:bg-dark-tertiary
                              transition-colors rounded-t-lg"
                          >
                            Edit Profile
                          </button>
                          <Link
                            to="/settings"
                            onClick={() => setIsMenuOpen(false)}
                            className="block w-full px-4 py-2 text-left text-sm
                              text-light-text dark:text-dark-text
                              hover:bg-light-secondary dark:hover:bg-dark-tertiary
                              transition-colors"
                          >
                            Settings
                          </Link>
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full px-4 py-2 text-left text-sm
                              text-dark-error
                              hover:bg-light-secondary dark:hover:bg-dark-tertiary
                              transition-colors rounded-b-lg"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className={`group relative px-4 py-2 rounded-full
                        text-sm font-medium
                        flex items-center justify-center
                        space-x-2
                        transition-all duration-200 
                        hover:scale-[1.02] active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${isFollowing 
                          ? 'bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:bg-dark-error hover:text-light-primary hover:border-transparent' 
                          : 'bg-dark-accent text-light-primary hover:bg-dark-accent/90'
                        }`}
                    >
                      {isFollowLoading ? (
                        <Spinner className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <span className={`${isFollowing ? 'group-hover:hidden' : ''}`}>
                            {isFollowing ? 'Following' : 'Follow'}
                          </span>
                          {isFollowing && (
                            <span className="hidden group-hover:inline text-dark-error">
                              Unfollow
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="px-4 md:px-6 py-4">
            <div className="space-y-4">
              {/* Name and Username */}
              <div>
                <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-light-muted dark:text-dark-textSecondary">
                  @{profile.username}
                </p>
              </div>

              {/* Follow Stats */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-light-text dark:text-dark-text">
                    {followingCount}
                  </span>
                  <span className="text-light-muted dark:text-dark-textSecondary">
                    Following
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-light-text dark:text-dark-text">
                    {followersCount}
                  </span>
                  <span className="text-light-muted dark:text-dark-textSecondary">
                    Followers
                  </span>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-light-text dark:text-dark-text">
                  {profile.bio}
                </p>
              )}

              {/* Website */}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-dark-accent hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span>{new URL(profile.website).hostname}</span>
                </a>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="p-4 md:p-6 border-t border-light-border dark:border-dark-border">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer flex items-center justify-center h-10 w-10 
                    rounded-full bg-light-secondary dark:bg-dark-tertiary hover:opacity-80 transition-opacity">
                    <Camera className="h-6 w-6 text-light-text dark:text-dark-text" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleMediaChange}
                    />
                  </label>
                  {preview && (
                    <button 
                      onClick={() => setPreview(null)}
                      className="text-light-muted dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text"
                    >
                      Remove new avatar
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-lg
                          bg-light-secondary dark:bg-dark-tertiary 
                          text-light-text dark:text-dark-text
                          border border-light-border dark:border-dark-border
                          focus:ring-2 focus:ring-dark-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-lg
                          bg-light-secondary dark:bg-dark-tertiary 
                          text-light-text dark:text-dark-text
                          border border-light-border dark:border-dark-border
                          focus:ring-2 focus:ring-dark-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
                      Website
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-lg
                          bg-light-secondary dark:bg-dark-tertiary 
                          text-light-text dark:text-dark-text
                          border border-light-border dark:border-dark-border
                          focus:ring-2 focus:ring-dark-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg
                        bg-light-secondary dark:bg-dark-tertiary 
                        text-light-text dark:text-dark-text
                        border border-light-border dark:border-dark-border
                        focus:ring-2 focus:ring-dark-accent focus:outline-none
                        resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-dark-error/10 p-4 text-sm text-dark-error">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setPreview(null);
                      setError('');
                    }}
                    className="px-4 py-2 rounded-lg
                      border border-light-border dark:border-dark-border
                      text-light-text dark:text-dark-text
                      hover:bg-light-secondary dark:hover:bg-dark-tertiary
                      transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg
                      bg-dark-accent text-light-primary
                      hover:bg-dark-accent/90
                      transition-all duration-200 
                      hover:scale-[1.02] active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <Spinner className="h-5 w-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tweets Section */}
        <div className="mt-6">
          <div className="p-4 border-b border-light-border dark:border-dark-border">
            <h2 className="text-xl font-bold text-light-text dark:text-dark-text">
              Posts
            </h2>
          </div>

          <div>
            {tweets?.length > 0 ? (
              <div className="divide-y divide-light-border dark:divide-dark-border">
                {tweets.map(tweet => (
                  <Tweet 
                    key={tweet.id} 
                    tweet={tweet}
                    currentUser={currentUser}
                    onLike={() => handleTweetUpdate(tweet.id)}
                    onComment={() => handleTweetUpdate(tweet.id)}
                    onDelete={() => {
                      setTweets(prevTweets => prevTweets.filter(t => t.id !== tweet.id));
                    }}
                    className="p-4 hover:bg-light-secondary/50 dark:hover:bg-dark-tertiary/50 transition-colors"
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-light-muted dark:text-dark-textSecondary">
                  {currentUser?.id === profile?.id 
                    ? "You haven't posted anything yet"
                    : `${profile.username} hasn't posted anything yet`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

// Inside your Tweet.js component
// Add or update these functions

// 1. Add state for like management
const [isLiked, setIsLiked] = useState(false);
const [likesCount, setLikesCount] = useState(0);
const [likeLoading, setLikeLoading] = useState(false);

// 2. Check if post is liked on component mount
useEffect(() => {
  if (!currentUser || !tweet) return;
  
  const checkLikeStatus = async () => {
    try {
      // Check if this post is liked by the current user
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('post_id', tweet.id)
        .maybeSingle();
        
      if (!error) {
        setIsLiked(!!data);
      }
      
      // Get total likes count
      const { count, error: countError } = await supabase
        .from('post_likes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', tweet.id);
        
      if (!countError) {
        setLikesCount(count || 0);
      }
    } catch (err) {
      console.error('Error checking like status:', err);
    }
  };
  
  checkLikeStatus();
}, [tweet?.id, currentUser?.id]);

// 3. Handle like/unlike action
const handleLike = async () => {
  if (!currentUser) {
    alert('Please sign in to like posts');
    return;
  }
  
  if (likeLoading) return;
  setLikeLoading(true);
  
  try {
    if (isLiked) {
      // Unlike the post
      await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('post_id', tweet.id);
        
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      // Like the post
      await supabase
        .from('post_likes')
        .insert({
          user_id: currentUser.id,
          post_id: tweet.id,
          created_at: new Date().toISOString()
        });
        
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      
      // Optional: Send notification to post owner if it's not the current user
      if (tweet.user_id !== currentUser.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: tweet.user_id,
            sender_id: currentUser.id,
            type: 'like',
            content: `${currentUser.username} liked your post`,
            post_id: tweet.id
          });
      }
    }
    
    // Call the callback function to update parent component
    if (onLike) onLike();
  } catch (err) {
    console.error('Error updating like:', err);
  } finally {
    setLikeLoading(false);
  }
};

// Inside your Tweet.js component
// Add or update these functions

// 1. Add state for comment management
const [showCommentModal, setShowCommentModal] = useState(false);
const [comment, setComment] = useState('');
const [comments, setComments] = useState([]);
const [isLoadingComments, setIsLoadingComments] = useState(false);
const [submittingComment, setSubmittingComment] = useState(false);
const [commentCount, setCommentCount] = useState(0);

// 2. Fetch comment count when component mounts
useEffect(() => {
  if (!tweet) return;
  
  const fetchCommentCount = async () => {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', tweet.id);
        
      if (!error) {
        setCommentCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching comment count:', err);
    }
  };
  
  fetchCommentCount();
}, [tweet?.id]);

// 3. Fetch comments when modal is opened
useEffect(() => {
  if (!showCommentModal || !tweet) return;
  
  const fetchComments = async () => {
    setIsLoadingComments(true);
    
    try {
      // Get comments with user info
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user:user_id (id, username, avatar_url, full_name)
        `)
        .eq('post_id', tweet.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  fetchComments();
}, [showCommentModal, tweet?.id]);

// 4. Handle comment submission
const handleCommentSubmit = async () => {
  if (!currentUser || !comment.trim()) return;
  
  setSubmittingComment(true);
  
  try {
    // Insert the new comment
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: tweet.id,
        user_id: currentUser.id,
        content: comment.trim(),
        created_at: new Date().toISOString()
      })
      .single();
      
    if (error) throw error;
    
    setComment('');
    
    // Optimistically update the comments state
    setComments(prev => [
      {
        id: data.id,
        content: comment.trim(),
        created_at: new Date().toISOString(),
        user: {
          id: currentUser.id,
          username: currentUser.username,
          avatar_url: currentUser.avatar_url
        }
      },
      ...prev
    ]);
    
    // Optionally, you can refresh the comment count on the parent component
    if (onComment) onComment();
  } catch (err) {
    console.error('Error submitting comment:', err);
  } finally {
    setSubmittingComment(false);
  }
};

// 5. Handle comment delete
const handleCommentDelete = async (commentId) => {
  if (!currentUser) return;
  
  try {
    // Delete the comment
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', currentUser.id);
      
    if (error) throw error;
    
    // Optimistically update the comments state
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    // Optionally, you can refresh the comment count on the parent component
    if (onComment) onComment();
  } catch (err) {
    console.error('Error deleting comment:', err);
  }
};

// In your Tweet component's return statement
{/* Like button */}
<button
  type="button"
  onClick={handleLike}
  disabled={likeLoading}
  className="flex items-center space-x-1.5 group py-1 px-2 rounded-md hover:bg-light-secondary dark:hover:bg-dark-secondary"
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