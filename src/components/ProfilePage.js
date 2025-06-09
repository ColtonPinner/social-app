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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { 
  ArrowPathIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import Tweet from './Tweet';

const ProfilePage = ({ currentUser, setUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // UI state
  const [activeTab, setActiveTab] = useState('view');
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  
  // Profile data
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone: '',
    dob: null,
    bio: '',
    website: '',
    avatar_url: '',
    newPostText: ''
  });
  
  // Media state
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  
  // Follow state
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  // Content state
  const [tweets, setTweets] = useState([]);
  
  // Feedback state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load initial data
  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);
      try {
        await fetchProfile();
        await fetchPosts(); // <-- use fetchPosts here
        await Promise.all([
          fetchFollowData(),
          checkIfFollowing()
        ]);
      } catch (error) {
        setError('Error loading profile data');
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
      phone: data.phone ? parsePhoneNumberFromString(data.phone, 'US')?.formatNational() || data.phone : '',
      dob: data.dob ? new Date(data.dob) : null,
      bio: data.bio || '',
      website: data.website || '',
      avatar_url: data.avatar_url || '',
      newPostText: ''
    });
    
    if (data.avatar_url) {
      setImagePreview(data.avatar_url);
    }
    
    if (data.cover_image_url) {
      setCoverImagePreview(data.cover_image_url);
    }
  };

  const fetchTweets = async () => {
    try {
      console.log('Fetching tweets for user ID:', id);
      
      const { data, error } = await supabase
        .from('tweets')
        .select('*, user:user_id(*), likes:tweet_likes(profile_id)')
        .eq('deleted', false)
        .eq('is_reply', false)
        .is('reply_to', null)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      console.log('Tweets response:', { data, error });

      if (error) throw error;

      setTweets(data || []);
      console.log('Tweets state updated:', data?.length || 0, 'tweets found');
    } catch (error) {
      console.error('Error fetching tweets:', error);
      setTweets([]);
    }
  };

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts for user ID:', id);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      console.log('Posts response:', { data, error });

      if (error) throw error;

      setTweets(data || []); // You can rename setTweets to setPosts for clarity
      console.log('Posts state updated:', data?.length || 0, 'posts found');
    } catch (error) {
      console.error('Error fetching posts:', error);
      setTweets([]); // Or setPosts([])
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
      setFollowerCount(followersData?.length || 0);
      setFollowingCount(followingData?.length || 0);
    } catch (error) {
      console.error('Error fetching follow data:', error);
      setFollowers([]);
      setFollowing([]);
    }
  };

  const checkIfFollowing = async () => {
    if (!currentUser || !id || currentUser.id === id) return;
    
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

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dob: date
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG or GIF image');
      return;
    }
    
    if (file.size > maxSize) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG or GIF image');
      return;
    }
    
    if (file.size > maxSize) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setError('');
  };

  // Modify the handleSave function to handle the missing column
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate phone number if it exists
      if (formData.phone) {
        const phoneNumberObj = parsePhoneNumberFromString(formData.phone, 'US');
        if (!phoneNumberObj || !phoneNumberObj.isValid()) {
          setError('Please enter a valid phone number');
          setSaving(false);
          return;
        }
      }

      let avatar_url = formData.avatar_url;
      let cover_image_url = profile.cover_image_url || null;
      
      // Handle avatar image upload if there's a new image
      if (profileImage) {
        // Create a unique file path
        const fileExt = profileImage.name.split('.').pop();
        const filePath = `avatars/${id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, profileImage, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatar_url = data.publicUrl;
      }
      
      // Handle cover image upload if there's a new one
      if (coverImage) {
        try {
          const fileExt = coverImage.name.split('.').pop();
          // Make sure the folder structure starts with the user's ID for RLS to work
          const filePath = `${currentUser.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          console.log('Uploading cover image with path:', filePath);
          
          const { error: uploadError, data: uploadData } = await supabase
            .storage
            .from('covers')
            .upload(filePath, coverImage, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            console.error('Cover image upload error:', uploadError);
            throw new Error(`Failed to upload cover image: ${uploadError.message}`);
          }
          
          const { data: urlData } = supabase
            .storage
            .from('covers')
            .getPublicUrl(filePath);
            
          cover_image_url = urlData.publicUrl;
          console.log('Cover image uploaded successfully:', cover_image_url);
        } catch (err) {
          setError(`Cover image upload failed: ${err.message}`);
          setSaving(false);
          return;
        }
      }

      // First update the basic profile data without the cover_image_url
      const basicProfileData = {
        username: formData.username,
        full_name: formData.full_name,
        phone: formData.phone,
        dob: formData.dob ? formData.dob.toISOString() : null,
        bio: formData.bio,
        website: formData.website,
        avatar_url,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(basicProfileData)
        .eq('id', id);

      if (error) throw error;

      // If we have a cover image URL, try updating it separately
      if (cover_image_url) {
        try {
          const { error: coverError } = await supabase
            .from('profiles')
            .update({ cover_image_url })
            .eq('id', id);
            
          if (coverError) {
            console.log('Cover image URL update failed:', coverError);
            // Store in cover_pictures table as fallback
            const { error: picError } = await supabase
              .from('cover_pictures')
              .insert({
                user_id: id,
                picture_url: cover_image_url
              });
              
            if (!picError) {
              console.log('Saved to cover_pictures table instead');
            }
          }
        } catch (coverErr) {
          console.error('Failed to update cover image:', coverErr);
          // Don't fail the whole operation because of the cover image
        }
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh profile data
      await fetchProfile();
      setActiveTab('view');
      setProfileImage(null);
      setCoverImage(null); // Reset cover image state
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !id) {
      return;
    }

    setIsFollowLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow logic
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id);

        if (error) throw error;
        
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        // Follow logic
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: id,
          });

        if (error) throw error;
        
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        
        // Create notification
        if (id !== currentUser.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: id,
              sender_id: currentUser.id,
              type: 'follow',
              content: `${currentUser.username} started following you`
            });
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      setError('Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate('/login');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('tweets')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setTweets(prevTweets => prevTweets.filter(tweet => tweet.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Error deleting post');
    }
  };
  
  // Custom date input for DatePicker
  const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      name="dob"
      value={value || ''}
      onClick={onClick}
      onChange={() => {}} // DatePicker handles changes
      ref={ref}
      placeholder="Date of Birth"
      className="w-full pl-10 pr-4 py-2 rounded-lg
        bg-light-secondary dark:bg-dark-tertiary 
        text-light-text dark:text-dark-text
        border border-light-border dark:border-dark-border
        focus:ring-2 focus:ring-dark-accent focus:outline-none"
      readOnly
    />
  ));

  // Loading state check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen pt-24 md:pt-28">
      <div className="max-w-3xl mx-auto px-4">
        {/* Profile Card */}
        <div className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
          border border-light-border dark:border-dark-border
          rounded-2xl overflow-hidden"
        >
          {/* Profile Header with Tabs */}
          <div className="relative">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500 relative overflow-hidden">
              {(coverImagePreview || profile.cover_image_url) && (
                <img
                  src={coverImagePreview || profile.cover_image_url}
                  alt="Cover"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
            
            <div className="px-4 md:px-6">
              <div className="relative -mt-20 mb-4 flex justify-between items-end">
                <img
                  src={imagePreview || profile.avatar_url || 'https://via.placeholder.com/150'}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full border-4 border-light-primary dark:border-dark-primary object-cover"
                />
                <div className="flex items-center space-x-3">
                  {isOwnProfile ? (
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
                              setActiveTab('edit');
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
                              handleSignOut();
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

          {/* Tab Navigation */}
          <div className="px-4 md:px-6 border-b border-light-border dark:border-dark-border">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('view')}
                className={`py-4 px-2 font-medium text-sm transition-colors ${
                  activeTab === 'view' 
                    ? 'text-dark-accent border-b-2 border-dark-accent' 
                    : 'text-light-text dark:text-dark-text hover:text-dark-accent'
                }`}
              >
                Profile
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`py-4 px-2 font-medium text-sm transition-colors ${
                    activeTab === 'edit' 
                      ? 'text-dark-accent border-b-2 border-dark-accent' 
                      : 'text-light-text dark:text-dark-text hover:text-dark-accent'
                  }`}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile View Tab */}
          {activeTab === 'view' && (
            <>
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
                        {followerCount}
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

                  {/* Website - With proper URL parsing */}
                  {profile.website && (
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-dark-accent hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>
                        {(() => {
                          try {
                            const url = profile.website.startsWith('http')
                              ? profile.website
                              : `https://${profile.website}`;
                            return new URL(url).hostname;
                          } catch {
                            return profile.website;
                          }
                        })()}
                      </span>
                    </a>
                  )}
                </div>
              </div>
        
              {/* Enhanced Posts Section */}
              <div>
                <div className="px-4 md:px-6 border-b border-light-border dark:border-dark-border">
                  <div className="flex items-center justify-between py-3">
                    <h2 className="text-xl font-bold text-light-text dark:text-dark-text">
                      Posts <span className="text-sm font-normal text-light-muted dark:text-dark-textSecondary">({tweets.length})</span>
                    </h2>
                    
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowPostModal(true)}
                        className="px-4 py-2 rounded-lg bg-dark-accent text-white hover:bg-dark-accent/90 transition-colors text-sm font-medium"
                        type="button"
                      >
                        New Post
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  {tweets?.length > 0 ? (
                    <ul className="divide-y divide-light-border dark:divide-dark-border">
                      {tweets.map(post => (
                        <li
                          key={post.id}
                          className="flex flex-col gap-2 py-4 px-2 sm:px-4 md:px-6 hover:bg-light-secondary/70 dark:hover:bg-dark-tertiary/70 transition-colors group"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex-shrink-0">
                              <img
                                src={profile.avatar_url || 'https://via.placeholder.com/48'}
                                alt={profile.username}
                                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-light-border dark:border-dark-border"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1 w-full">
                              <span className="font-semibold text-sm sm:text-base text-light-text dark:text-dark-text truncate">
                                {profile.full_name || profile.username}
                              </span>
                              <span className="text-xs text-light-muted dark:text-dark-textSecondary sm:ml-2 truncate">
                                @{profile.username}
                              </span>
                              <span className="sm:ml-auto text-xs text-light-muted dark:text-dark-textSecondary whitespace-nowrap">
                                {new Date(post.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="pl-11 sm:pl-12">
                            <p className="text-light-text dark:text-dark-text text-sm sm:text-base mb-2 break-words whitespace-pre-line leading-relaxed">
                              {post.text || "No content"}
                            </p>
                            {post.image_url && (
                              <img
                                src={post.image_url}
                                alt="Post"
                                className="rounded-xl max-w-full max-h-60 sm:max-h-80 mt-2 border border-light-border dark:border-dark-border shadow"
                              />
                            )}
                          </div>
                        </li>
                      ))} 
                    </ul>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center">
                      <div className="w-16 h-16 mb-4 rounded-full bg-light-secondary dark:bg-dark-tertiary flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-light-muted dark:text-dark-textSecondary">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <p className="text-light-muted dark:text-dark-textSecondary">
                        {isOwnProfile 
                          ? "You haven't posted anything yet"
                          : `${profile.username} hasn't posted anything yet`
                        }
                      </p>
                      {isOwnProfile && (
                        <Link 
                          to="/compose" 
                          className="mt-4 px-4 py-2 rounded-lg bg-dark-accent text-white hover:bg-dark-accent/90 transition-colors text-sm font-medium"
                        >
                          Create Your First Post
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Edit Profile Tab */}
          {activeTab === 'edit' && isOwnProfile && (
            <div className="p-4 md:p-6">
              <div className="space-y-6">
                {/* Cover Image Section */}
                <div className="relative mb-8">
                  <div className="h-48 w-full rounded-t-lg overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500">
                    {coverImagePreview && (
                      <img
                        src={coverImagePreview}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <label className="absolute bottom-4 right-4 cursor-pointer flex items-center justify-center h-10 w-10 
                      rounded-full bg-light-secondary/80 dark:bg-dark-tertiary/80 hover:opacity-80 transition-opacity backdrop-blur-sm">
                      <Camera className="h-6 w-6 text-light-text dark:text-dark-text" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageChange}
                      />
                    </label>
                    {coverImage && (
                      <button 
                        onClick={() => {
                          setCoverImage(null);
                          setCoverImagePreview(profile.cover_image_url || null);
                        }}
                        className="absolute bottom-4 left-4 px-3 py-1.5 text-sm bg-light-secondary/80 dark:bg-dark-tertiary/80 
                          text-light-text dark:text-dark-text rounded-full hover:opacity-90 transition-opacity backdrop-blur-sm"
                      >
                        Remove cover
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Image Section */}
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer flex items-center justify-center h-10 w-10 
                    rounded-full bg-light-secondary dark:bg-dark-tertiary hover:opacity-80 transition-opacity">
                    <Camera className="h-6 w-6 text-light-text dark:text-dark-text" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {profileImage && (
                    <button 
                      onClick={() => {
                        setProfileImage(null);
                        setImagePreview(profile.avatar_url || null);
                      }}
                      className="text-light-muted dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text"
                    >
                      Remove new avatar
                    </button>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Username */}
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

                  {/* Full Name */}
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

                  {/* Website */}
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

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-lg
                          bg-light-secondary dark:bg-dark-tertiary 
                          text-light-text dark:text-dark-text
                          border border-light-border dark:border-dark-border
                          focus:ring-2 focus:ring-dark-accent focus:outline-none"
                        placeholder="(555) 555-5555"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                      <DatePicker
                        selected={formData.dob}
                        onChange={handleDateChange}
                        customInput={<CustomDateInput />}
                        dateFormat="MM/dd/yyyy"
                        showYearDropdown
                        dropdownMode="select"
                        maxDate={new Date()}
                        minDate={new Date('1900-01-01')}
                      />
                    </div>
                  </div>

                  {/* Bio */}
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
                      placeholder="Tell us a little about yourself"
                    />
                  </div>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className="rounded-lg bg-dark-error/10 p-4 text-sm text-dark-error">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="rounded-lg bg-green-600/10 p-4 text-sm text-green-600">
                    {success}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setActiveTab('view');
                      setProfileImage(null);
                      setImagePreview(profile.avatar_url || null);
                      setCoverImage(null); // Add this line
                      setCoverImagePreview(profile.cover_image_url || null); // Add this line
                      setError('');
                      setSuccess('');
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
                
                {/* Sign Out Button */}
                <div className="pt-4 border-t border-light-border dark:border-dark-border">
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 rounded-lg
                      border border-dark-error text-dark-error
                      hover:bg-dark-error hover:text-white
                      transition-colors w-full"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-light-primary dark:bg-dark-primary rounded-xl shadow-xl w-full max-w-md mx-2 p-6 relative">
              <button
                onClick={() => setShowPostModal(false)}
                className="absolute top-3 right-3 text-light-muted dark:text-dark-textSecondary hover:text-dark-accent"
                aria-label="Close"
                type="button"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <h3 className="text-lg font-bold mb-4 text-light-text dark:text-dark-text">Create a Post</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!formData.newPostText?.trim()) return;
                  try {
                    const { error, data } = await supabase
                      .from('posts')
                      .insert({
                        user_id: currentUser.id,
                        text: formData.newPostText,
                        created_at: new Date().toISOString(),
                      })
                      .select()
                      .single();

                    if (error) throw error;

                    setTweets(prev => [data, ...prev]);
                    setFormData(prev => ({ ...prev, newPostText: '' }));
                    setShowPostModal(false);
                  } catch (err) {
                    setError('Failed to create post');
                  }
                }}
                className="flex flex-col gap-2"
              >
                <textarea
                  name="newPostText"
                  value={formData.newPostText || ''}
                  onChange={e => setFormData(prev => ({ ...prev, newPostText: e.target.value }))}
                  rows={3}
                  maxLength={280}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-2 rounded-lg bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-dark-accent focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-light-muted dark:text-dark-textSecondary">{(formData.newPostText?.length || 0)}/280</span>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-dark-accent text-white hover:bg-dark-accent/90 transition-colors text-sm font-medium disabled:opacity-50"
                    disabled={!formData.newPostText?.trim()}
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;