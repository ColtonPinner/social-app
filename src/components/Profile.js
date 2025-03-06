import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Tweet from './Tweet';
import { 
  ArrowPathIcon, 
  ExclamationCircleIcon,
  UserCircleIcon,
  UsersIcon,
  UserPlusIcon,
  UserMinusIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { id } = useParams(); // Get the user ID from the URL
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]); // State to store the user's posts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Get the current logged in user
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        console.log("Current user found:", data.user.id);
        setCurrentUser(data.user);
      } else {
        console.log("No user logged in");
      }
    };

    getCurrentUser();
  }, []);

  // Fetch profile data and posts when ID changes
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        console.log("Fetching profile for ID:", id);
        
        // Fetch the profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        
        console.log("Profile data:", profileData);
        setProfile(profileData);
        setBio(profileData.bio || '');
        setAvatarUrl(profileData.avatar_url || '');
        
        // Check follow status
        if (currentUser?.id && currentUser.id !== id) {
          console.log("Checking if following, current user:", currentUser.id, "profile:", id);
          checkIfFollowing(id);
        }
        
        // Fetch follow counts
        fetchFollowCounts(id);
        
        // Fetch the user's posts
        fetchUserPosts(id);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Error fetching profile data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfileData();
    }
  }, [id, currentUser]);

  const fetchUserPosts = async (profileId) => {
    try {
      // First get the posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      // Get all users for these posts
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name');
        
      if (profilesError) throw profilesError;
      
      // Create a lookup table for profiles by ID
      const profilesById = profilesData.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
      
      // Enrich the posts with user data
      const enrichedPosts = postsData.map(post => ({
        ...post,
        user: profilesById[post.user_id] || null
      }));
      
      setPosts(enrichedPosts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setError('Error fetching user posts');
    }
  };

  const checkIfFollowing = async (profileId) => {
    try {
      if (!currentUser?.id) return false;
      
      const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profileId)
        .maybeSingle();
  
      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
      setIsFollowing(false);
    }
  };

  const fetchFollowCounts = async (profileId) => {
    try {
      // Get followers count
      const { count: followers, error: followerError } = await supabase
        .from('followers')
        .select('id', { count: 'exact' })
        .eq('following_id', profileId);
  
      if (followerError) {
        console.error('Error fetching follower count:', followerError);
        // Don't update state if there's an error
      } else {
        setFollowerCount(followers || 0);
      }
  
      // Get following count
      const { count: following, error: followingError } = await supabase
        .from('followers')
        .select('id', { count: 'exact' })
        .eq('follower_id', profileId);
  
      if (followingError) {
        console.error('Error fetching following count:', followingError);
        // Don't update state if there's an error
      } else {
        setFollowingCount(following || 0);
      }
    } catch (error) {
      console.error('Error in fetchFollowCounts:', error);
      // Continue execution, don't throw
    }
  };

  const handleFollowClick = async () => {
    // If not logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Don't allow following yourself
    if (currentUser.id === id) return;
    
    setFollowLoading(true);
    setError(null);
  
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id);
  
        if (error) throw error;
        
        setIsFollowing(false);
        setFollowerCount(prevCount => Math.max(0, prevCount - 1));
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: id
          });
  
        if (error) throw error;
        
        setIsFollowing(true);
        setFollowerCount(prevCount => prevCount + 1);
      }
      
      // Add a short timeout to allow the user to see the button change state
      setTimeout(() => {
        setFollowLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error updating follow status:', error);
      setError(`Error ${isFollowing ? 'unfollowing' : 'following'} user`);
      setFollowLoading(false);
    }
  };

  const handleBioSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio })
        .eq('id', currentUser.id);

      if (error) throw error;

      setProfile(prevProfile => ({ ...prevProfile, bio }));
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
      setError('Error updating bio');
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setIsUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData, error: publicUrlError } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrlError) throw publicUrlError;

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setAvatarUrl(avatarUrl);
      setProfile(prevProfile => ({ ...prevProfile, avatar_url: avatarUrl }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Error uploading avatar');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 md:pt-24">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 md:pt-24 text-center">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="display:flex max-w-2xl mx-auto px-4 pt-16 md:pt-24 pb-6 md:pb-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg p-4 md:p-6 mb-4 md:mb-6 shadow-sm border border-gray-300">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Profile Image */}
          <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border flex-shrink-0">
            {avatarUrl ? (
              <img 
                src={avatarUrl}
                alt={profile.username || "User"} 
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <UserCircleIcon className="h-20 w-20 md:h-16 md:w-16 text-gray-400" />
            )}
          </div>
          {currentUser && currentUser.id === id && (
            <div className="flex flex-col items-center sm:items-start mt-4">
              <label className="w-32 px-4 py-2 bg-black rounded-full cursor-pointer transition text-sm font-medium text-white flex items-center justify-center">
                Edit Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          )}
          
          {/* User Info */}
          <div className="flex flex-col items-center sm:items-start w-full">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 break-words max-w-full">
              {profile.username || "User"}
            </h2>
            
            {profile.full_name && (
              <p className="text-gray-600 text-sm md:text-base break-words max-w-full">
                {profile.full_name}
              </p>
            )}

            {/* Bio Section */}
            <div className="mt-2 w-full">
              {isEditingBio ? (
                <div className="flex items-center space-x-2">
                  <textarea
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-sm md:text-base text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all duration-200 resize-none"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  <button
                    onClick={handleBioSave}
                    className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="text-gray-600 text-sm md:text-base break-words max-w-full">
                    {profile.bio || "No bio available"}
                  </p>
                  {currentUser && currentUser.id === id && (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="p-2 rounded-full bg-black text-white"
                    >
                      Edit Bio
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-4 mt-2 text-xs md:text-sm">
              <div className="flex items-center">
                <UsersIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 text-gray-500" />
                <span>{followerCount} Followers</span>
              </div>
              <div className="flex items-center">
                <UsersIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 text-gray-500" />
                <span>{followingCount} Following</span>
              </div>
            </div>
            
            {/* Follow Button */}
            {currentUser && (currentUser.id !== id) && (
              <button
                onClick={handleFollowClick}
                disabled={followLoading}
                className={`mt-3 md:mt-4 px-4 md:px-5 py-1.5 md:py-2 rounded-full text-sm font-medium flex items-center justify-center w-full sm:w-auto
                  transition-all duration-200 ${
                  isFollowing 
                    ? 'bg-gray-100 text-gray-800 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-300' 
                    : 'bg-black text-white hover:bg-gray-800 active:bg-gray-900'
                } ${followLoading ? 'opacity-75' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                aria-label={isFollowing ? "Unfollow user" : "Follow user"}
              >
                {followLoading ? (
                  <>
                    <ArrowPathIcon className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
                    <span className="truncate">{isFollowing ? 'Unfollowing...' : 'Following...'}</span>
                  </>
                ) : (
                  <>
                    {isFollowing ? (
                      <>
                        <UserMinusIcon className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                        <span className="truncate">Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                        <span className="truncate">Follow</span>
                      </>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Posts Section */}
      <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2 md:mb-4 px-1">Posts</h3>
      <div className="space-y-3 md:space-y-4">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <Tweet tweet={post} />
              {index < posts.length - 1 && <hr className="border-t border-gray-300 my-4" />}
            </React.Fragment>
          ))
        ) : (
          <div className="bg-white rounded-lg p-6 md:p-8 text-center text-gray-500 shadow-sm border border-gray-300">
            <p>No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;