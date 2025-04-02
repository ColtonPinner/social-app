import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  LinkIcon,
  ArrowPathIcon,
  PhotoIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/solid';
import { supabase } from '../supabaseClient';
import Tweet from './Tweet';

const Profile = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    website: '',
    avatar_url: '',
    bio: ''
  });
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchTweets(),
        fetchFollowData(),
        checkIfFollowing()
      ]);
      setLoading(false);
    };

    loadProfile();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('[data-menu]')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Handlers
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (event) => {
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

      // Basic validation
      if (!formData.username.trim()) {
        setError('Username is required');
        return;
      }

      // If there's a new avatar image
      let avatar_url = formData.avatar_url;
      if (preview) {
        const file = await fetch(preview).then(r => r.blob());
        const fileExt = file.type.split('/')[1];
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload the new avatar
        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicURL } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);

        avatar_url = publicURL;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...formData,
          avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Refresh profile data
      await fetchProfile();
      
      setIsEditing(false);
      setPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const checkIfFollowing = async () => {
    if (!currentUser) return;
    
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUser.id)
      .eq('following_id', id)
      .single();

    if (error && error.code !== 'PGNF') {
      console.error('Error checking follow status:', error);
    }

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!currentUser) return;
    
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id);

        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: id,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      setIsFollowing(!isFollowing);
      await fetchFollowData(); // Refresh follow counts
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Data fetching
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
        .select(`
          id,
          content,
          created_at,
          media_url,
          user_id,
          profiles!tweets_user_id_fkey (
            id,
            username,
            avatar_url,
            full_name
          ),
          likes:tweet_likes (
            user_id
          ),
          comments:tweet_comments (
            id,
            content,
            created_at,
            user_id,
            profiles!tweet_comments_user_id_fkey (
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTweets = data.map(tweet => ({
        ...tweet,
        user: tweet.profiles,
        likes: tweet.likes || [],
        comments: tweet.comments || []
      }));

      setTweets(formattedTweets);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      setTweets([]);
    }
  };

  const fetchFollowData = async () => {
    try {
      const followersQuery = supabase
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(*)')
        .eq('following_id', id);

      const followingQuery = supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(*)')
        .eq('follower_id', id);

      const [{ data: followersData, error: followersError }, { data: followingData, error: followingError }] = 
        await Promise.all([followersQuery, followingQuery]);

      if (followersError) throw followersError;
      if (followingError) throw followingError;

      setFollowers(followersData.map(f => f.profiles));
      setFollowing(followingData.map(f => f.profiles));
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
                        <EllipsisVerticalIcon className="h-5 w-5 text-light-text dark:text-dark-text" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg 
                          bg-light-primary dark:bg-dark-primary 
                          border border-light-border dark:border-dark-border
                          divide-y divide-light-border dark:divide-dark-border"
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
                        text-sm font-medium text-light-text dark:text-dark-text
                        bg-light-secondary dark:bg-dark-tertiary
                        border border-light-border dark:border-dark-border
                        flex items-center justify-center
                        space-x-2
                        hover:bg-light-secondary/80 dark:hover:bg-dark-tertiary/80
                        active:bg-light-secondary/90 dark:active:bg-dark-tertiary/90
                        focus:outline-none focus:ring-2 focus:ring-dark-accent
                        focus:ring-offset-2 focus:ring-offset-light-primary dark:focus:ring-offset-dark-primary
                        focus:ring-opacity-50
                        focus:ring-inset rounded-full
                        inline-flex items-center justify-center
                        transition-all duration-200 
                        hover:scale-[1.02] active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${isFollowing 
                          ? 'bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:bg-dark-error hover:text-light-primary hover:border-transparent' 
                          : 'bg-dark-accent text-light-primary hover:bg-dark-accent/90'
                        }`}
                    >
                      {isFollowLoading ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <span className={`${isFollowing ? 'group-hover:hidden' : ''}`}>
                            {isFollowing ? 'Following' : 'Follow'}
                          </span>
                          {isFollowing && (
                            <span className="hidden group-hover:inline">
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
            <div className="p-4 md:p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer flex items-center justify-center h-10 w-10 
                    rounded-full bg-light-secondary dark:bg-dark-tertiary hover:opacity-80 transition-opacity">
                    <PhotoIcon className="h-6 w-6 text-light-text dark:text-dark-text" />
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
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
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
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
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
                      bg-light-text dark:bg-dark-text
                      text-light-primary dark:text-dark-primary
                      hover:bg-light-textSecondary dark:hover:bg-dark-textSecondary
                      transition-all duration-200 
                      hover:scale-[1.02] active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
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
            {tweets && tweets.length > 0 ? (
              <div className="divide-y divide-light-border dark:divide-dark-border">
                {tweets.map(tweet => (
                  <Tweet 
                    key={tweet.id} 
                    tweet={tweet}
                    currentUser={currentUser}
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