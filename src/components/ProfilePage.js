import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Link as LinkIcon,
  Spinner,
  Camera
} from '@phosphor-icons/react';
import { supabase } from '../supabaseClient';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import Tweet from './Tweet';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAutoRefresh, useGlobalAutoRefreshSettings } from '../hooks/useAutoRefresh';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_AVATAR = 'https://via.placeholder.com/150';

const ProfilePage = ({ currentUser, setUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab] = useState('view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers'); // or 'following'

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

  // Enlarged image modal state
  const [enlargedImage, setEnlargedImage] = useState(null);


  // Auto-refresh settings
  const { settings } = useGlobalAutoRefreshSettings();

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    setProfile(data);
    setFormData({
      username: data.username || '',
      full_name: data.full_name || '',
      phone: data.phone
        ? parsePhoneNumberFromString(data.phone, 'US')?.formatNational() || data.phone
        : '',
      dob: data.dob ? new Date(data.dob) : null,
      bio: data.bio || '',
      website: data.website || '',
      avatar_url: data.avatar_url || '',
      newPostText: ''
    });
    setImagePreview(data.avatar_url || null);
    setCoverImagePreview(data.cover_image_url || null);
  }, [id]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTweets(data || []);
    } catch (error) {
      setTweets([]);
      throw error;
    }
  }, [id]);

  // Fetch follow data
  const fetchFollowData = useCallback(async () => {
    if (!id) return;
    console.log('Fetching follow data for user ID:', id); // Debug log
    
    try {
      const [{ data: followersData, error: followersError }, { data: followingData, error: followingError }] = await Promise.all([
        supabase
          .from('follows')
          .select(`
            follower_id,
            profiles:follower_id(
              id,
              username,
              full_name,
              avatar_url,
              bio
            )
          `)
          .eq('following_id', id),
        supabase
          .from('follows')
          .select(`
            following_id,
            profiles:following_id(
              id,
              username,
              full_name,
              avatar_url,
              bio
            )
          `)
          .eq('follower_id', id)
      ]);

      // Debug logs
      console.log('Followers data:', followersData);
      console.log('Followers error:', followersError);
      console.log('Following data:', followingData);
      console.log('Following error:', followingError);

      if (followersError) throw followersError;
      if (followingError) throw followingError;

      // Extract the profile data from the nested structure
      const followersProfiles = followersData?.map(f => f.profiles).filter(Boolean) || [];
      const followingProfiles = followingData?.map(f => f.profiles).filter(Boolean) || [];
      
      console.log('Processed followers:', followersProfiles);
      console.log('Processed following:', followingProfiles);

      setFollowers(followersProfiles);
      setFollowing(followingProfiles);
      setFollowerCount(followersData?.length || 0);
      setFollowingCount(followingData?.length || 0);
      
    } catch (error) {
      console.error('Error fetching follow data:', error);
      setFollowers([]);
      setFollowing([]);
      setFollowerCount(0);
      setFollowingCount(0);
      throw error;
    }
  }, [id]);

  // Combined refresh function for auto-refresh
  const refreshProfileData = useCallback(async () => {
    if (!id) return;
    try {
      setError('');
      await Promise.all([
        fetchProfile(),
        fetchPosts(),
        fetchFollowData()
      ]);
    } catch (err) {
      console.error('Error refreshing profile data:', err);
      setError('Error refreshing profile data');
      throw err;
    }
  }, [id, fetchProfile, fetchPosts, fetchFollowData]);

  // Set up auto-refresh with global settings
  const autoRefreshConfig = {
    interval: settings.interval,
    enabled: settings.enabled && settings.profileEnabled && activeTab === 'view',
    pauseOnVisibilityChange: settings.pauseOnVisibilityChange,
    pauseOnOffline: settings.pauseOnOffline
  };

  const {
    isRefreshing: autoRefreshing,
    lastRefresh,
    error: autoRefreshError,
    retryCount
  } = useAutoRefresh(refreshProfileData, autoRefreshConfig);

  // Check if following
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
    } catch {
      setIsFollowing(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);
      try {
        await fetchProfile();
        await fetchPosts();
        await Promise.all([fetchFollowData(), checkIfFollowing()]);
      } catch (err) {
        console.error('Error loading profile data:', err);
        setError('Error loading profile data');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dob: date }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;
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
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
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
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const filePath = `avatars/${id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profileImage, { cacheControl: '3600', upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatar_url = data.publicUrl;
      }
      if (coverImage) {
        try {
          const fileExt = coverImage.name.split('.').pop();
          const filePath = `${currentUser.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('covers')
            .upload(filePath, coverImage, { cacheControl: '3600', upsert: true });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filePath);
          cover_image_url = urlData.publicUrl;
        } catch (err) {
          setError(`Cover image upload failed: ${err.message}`);
          setSaving(false);
          return;
        }
      }
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
      const { error } = await supabase.from('profiles').update(basicProfileData).eq('id', id);
      if (error) throw error;
      if (cover_image_url) {
        try {
          const { error: coverError } = await supabase
            .from('profiles')
            .update({ cover_image_url })
            .eq('id', id);
          if (coverError) {
            await supabase.from('cover_pictures').insert({
              user_id: id,
              picture_url: cover_image_url
            });
          }
        } catch {}
      }
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchProfile();
      setActiveTab('view');
      setProfileImage(null);
      setCoverImage(null);
    } catch (error) {
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !id) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id);
        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: id });
        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
        if (id !== currentUser.id) {
          const followerName = currentUser.username || currentUser.full_name || 'Someone';
          await supabase.from('notifications').insert({
            user_id: id,
            sender_id: currentUser.id,
            type: 'follow',
            message: `${followerName} started following you`,
            content: `${followerName} started following you`,
            metadata: {
              follower_id: currentUser.id
            }
          });
        }
      }
    } catch {
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
        .from('posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
      setTweets((prev) => prev.filter((tweet) => tweet.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  };

  // Custom date input for DatePicker
  const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      name="dob"
      value={value || ''}
      onClick={onClick}
      onChange={() => {}}
      ref={ref}
      placeholder="Date of Birth"
      className="w-full pl-10 pr-4 py-2 rounded-lg bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-dark-accent focus:outline-none"
      readOnly
    />
  ));

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
    <div className="min-h-screen">
      {/* Enlarged image modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setEnlargedImage(null)}
          style={{ cursor: 'zoom-out' }}
        >
          <img
            src={enlargedImage}
            alt="Enlarged"
            className="max-w-full max-h-full rounded-xl shadow-2xl border-4 border-white"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className="relative">
        {/* Full-width cover */}
        <div className="relative h-52 md:h-64 lg:h-72 w-screen left-1/2 -translate-x-1/2 overflow-hidden">
          <img
            src={
              coverImagePreview ||
              profile.cover_image_url ||
              DEFAULT_COVER
            }
            alt="Cover"
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() =>
              setEnlargedImage(
                coverImagePreview ||
                  profile.cover_image_url ||
                  DEFAULT_COVER
              )
            }
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10 pointer-events-none" />
        </div>

        <div className="relative w-full px-2 md:px-4 -mt-16 md:-mt-20">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Profile Header */}
            <div className="px-2 md:px-4">
              <div className="relative -mt-20 mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <img
                  src={imagePreview || profile.avatar_url || DEFAULT_AVATAR}
                  alt={profile.username}
                  className="w-36 h-36 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full border-4 border-light-primary dark:border-dark-primary object-cover cursor-zoom-in self-start"
                  onClick={() =>
                    setEnlargedImage(
                      imagePreview || profile.avatar_url || DEFAULT_AVATAR
                    )
                  }
                />
                <div className="flex items-center space-x-3 w-full md:w-auto justify-start md:justify-end">
                  {isOwnProfile ? null : (
                    <button
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className={`group relative w-full md:w-auto px-4 py-2 rounded-full text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                        isFollowing
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

            {/* Tab Navigation */}
            <div className="px-2 md:px-4 border-b border-light-border dark:border-dark-border">
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

            {/* Edit Profile Tab */}
            {activeTab === 'edit' && isOwnProfile && (
              <div className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 rounded-2xl shadow-xl p-4 md:p-6">
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
                    <label className="absolute bottom-4 right-4 cursor-pointer flex items-center justify-center h-10 w-10 rounded-full bg-light-secondary/80 dark:bg-dark-tertiary/80 hover:opacity-80 transition-opacity backdrop-blur-sm">
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
                        className="absolute bottom-4 left-4 px-3 py-1.5 text-sm bg-light-secondary/80 dark:bg-dark-tertiary/80 text-light-text dark:text-dark-text rounded-full hover:opacity-90 transition-opacity backdrop-blur-sm"
                      >
                        Remove cover
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Image Section */}
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer flex items-center justify-center h-10 w-10 rounded-full bg-light-secondary dark:bg-dark-tertiary hover:opacity-80 transition-opacity">
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
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-dark-accent focus:outline-none"
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
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-dark-accent focus:outline-none"
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
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-dark-accent focus:outline-none"
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
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-dark-accent focus:outline-none"
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
                      className="w-full px-4 py-2 rounded-lg bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-dark-accent focus:outline-none resize-none"
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
                      setCoverImage(null);
                      setCoverImagePreview(profile.cover_image_url || null);
                      setError('');
                      setSuccess('');
                    }}
                    className="px-4 py-2 rounded-lg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-secondary dark:hover:bg-dark-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-dark-accent text-light-primary hover:bg-dark-accent/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                    className="px-4 py-2 rounded-lg border border-dark-error text-dark-error hover:bg-dark-error hover:text-white transition-colors w-full"
                  >
                    Sign Out
                  </button>
                </div>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'view' && (
            <div className="space-y-6">
              {/* Auto-refresh status indicator */}
              <div className="mt-4 px-4 md:px-6 py-3 rounded-2xl border border-light-border dark:border-dark-border bg-light-primary/70 dark:bg-dark-primary/70 backdrop-blur">
                <div className="flex items-center space-x-2">
                  <ArrowPathIcon
                    className={`h-3 w-3 text-light-muted dark:text-dark-textSecondary ${autoRefreshing ? 'animate-spin' : ''}`}
                  />
                  <span className="text-xs text-light-muted dark:text-dark-textSecondary">
                    {autoRefreshing
                      ? 'Refreshing profile...'
                      : lastRefresh
                        ? `Updated: ${new Date(lastRefresh).toLocaleTimeString()}`
                        : 'Auto-refresh enabled'}
                  </span>
                </div>
              </div>

              {/* Profile Info Section */}
              <section className="px-2 md:px-4">
                <div className="space-y-4 py-4">
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
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setFollowModalType('following');
                        setShowFollowModal(true);
                      }}
                      className="flex items-center space-x-1 hover:text-dark-accent transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-light-text dark:text-dark-text">
                        {followingCount}
                      </span>
                      <span className="text-light-muted dark:text-dark-textSecondary">
                        Following
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFollowModalType('followers');
                        setShowFollowModal(true);
                      }}
                      className="flex items-center space-x-1 hover:text-dark-accent transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-light-text dark:text-dark-text">
                        {followerCount}
                      </span>
                      <span className="text-light-muted dark:text-dark-textSecondary">
                        Followers
                      </span>
                    </button>
                  </div>
                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-light-text dark:text-dark-text">{profile.bio}</p>
                  )}
                  {/* Website */}
                  {profile.website && (
                    <a
                      href={
                        profile.website.startsWith('http')
                          ? profile.website
                          : `https://${profile.website}`
                      }
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
              </section>

              {/* Posts Section */}
              <section className="px-2 md:px-4">
                <div className="flex items-center justify-between py-3">
                  <h2 className="text-xl font-bold text-light-text dark:text-dark-text">
                    Posts{' '}
                    <span className="text-sm font-normal text-light-muted dark:text-dark-textSecondary">
                      ({tweets.length})
                    </span>
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
                <div className="px-0 sm:px-2 md:px-0">
                  <div>
                    {tweets?.length > 0 ? (
                      tweets.map((post) => (
                        <Tweet
                          key={post.id}
                          tweet={{
                            ...post,
                            user: post.user || {
                              id: profile.id,
                              username: profile.username,
                              full_name: profile.full_name,
                              avatar_url: profile.avatar_url || DEFAULT_AVATAR
                            }
                          }}
                          currentUser={currentUser}
                          onDelete={handleDeletePost}
                        />
                      ))
                    ) : (
                      <div className="py-6 text-center">
                        <p className="text-light-muted dark:text-dark-textSecondary">
                          {isOwnProfile
                            ? "You haven't posted anything yet"
                            : `${profile.username} hasn't posted anything yet`}
                        </p>
                        {isOwnProfile && (
                          <Link
                            to="/compose"
                            className="mt-4 inline-flex px-4 py-2 rounded-lg bg-dark-accent text-white hover:bg-dark-accent/90 transition-colors text-sm font-medium"
                          >
                            Create Your First Post
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      {/* New Post Modal */}
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
              <h3 className="text-lg font-bold mb-4 text-light-text dark:text-dark-text">
                New Post
              </h3>
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
                        created_at: new Date().toISOString()
                      })
                      .select()
                      .single();
                    if (error) throw error;
                    setTweets((prev) => [data, ...prev]);
                    setFormData((prev) => ({ ...prev, newPostText: '' }));
                    setShowPostModal(false);
                  } catch {
                    setError('Failed to create post');
                  }
                }}
                className="flex flex-col gap-2"
              >
                <textarea
                  name="newPostText"
                  value={formData.newPostText || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newPostText: e.target.value
                    }))
                  }
                  rows={3}
                  maxLength={280}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-2 rounded-lg bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-dark-accent focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-light-muted dark:text-dark-textSecondary">
                    {(formData.newPostText?.length || 0)}/280
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-dark-accent text-white hover:bg-dark-accent/90 transition-colors text-sm font-medium disabled:opacity-50"
                    disabled={!formData.newPostText?.trim()}
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Follow Modal */}
        {showFollowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-light-primary dark:bg-dark-primary rounded-xl shadow-xl w-full max-w-lg mx-2 p-6 relative">
              <button
                onClick={() => setShowFollowModal(false)}
                className="absolute top-3 right-3 text-light-muted dark:text-dark-textSecondary hover:text-dark-accent"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <h3 className="text-lg font-bold mb-4 text-light-text dark:text-dark-text">
                {followModalType === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <div className="max-h-96 overflow-y-auto">
                {(followModalType === 'followers' ? followers : following).length > 0 ? (
                  <div className="space-y-3">
                    {(followModalType === 'followers' ? followers : following).map(user => (
                      <div 
                        key={user.id} 
                        className="bg-light-secondary dark:bg-dark-tertiary rounded-lg p-4 hover:bg-light-border dark:hover:bg-dark-border transition-colors border border-light-border dark:border-dark-border"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={user.avatar_url || DEFAULT_AVATAR} 
                              alt={user.username} 
                              className="w-12 h-12 rounded-full object-cover border-2 border-light-border dark:border-dark-border" 
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-light-text dark:text-dark-text truncate">
                                {user.full_name || user.username}
                              </h4>
                              <p className="text-sm text-light-muted dark:text-dark-textSecondary truncate">
                                @{user.username}
                              </p>
                              {user.bio && (
                                <p className="text-xs text-light-muted dark:text-dark-textSecondary mt-1 line-clamp-2">
                                  {user.bio}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-3">
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => navigate(`/profile/${user.id}`)}
                                className="px-3 py-1.5 rounded-full bg-dark-accent text-white hover:bg-dark-accent/90 transition-colors text-sm font-medium"
                              >
                                View Profile
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-border dark:bg-dark-border flex items-center justify-center">
                      <User className="h-8 w-8 text-light-muted dark:text-dark-textSecondary" />
                    </div>
                    <p className="text-light-muted dark:text-dark-textSecondary">
                      {followModalType === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;