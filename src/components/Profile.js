import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Link as LinkIcon,
  Spinner,
  Camera,
  DotsThreeVertical
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
      const [{ data: followersData }, { data: followingData }] = await Promise.all([
        supabase.from('follows').select('follower_id').eq('following_id', id),
        supabase.from('follows').select('following_id').eq('follower_id', id)
      ]);
      
      setFollowers(followersData || []);
      setFollowing(followingData || []);
    } catch (error) {
      console.error('Error fetching follow data:', error);
      setFollowers([]);
      setFollowing([]);
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
                    {following.length}
                  </span>
                  <span className="text-light-muted dark:text-dark-textSecondary">
                    Following
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-light-text dark:text-dark-text">
                    {followers.length}
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
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
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