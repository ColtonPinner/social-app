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
  ArrowLeftOnRectangleIcon
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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [followError, setFollowError] = useState(null);

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
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.id === id) return;
    
    setFollowLoading(true);
    setFollowError(null);
  
    try {
      if (isFollowing) {
        // Optimistic UI update
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
  
        const { error } = await supabase
          .from('followers')
          .delete()
          .match({
            follower_id: currentUser.id,
            following_id: id
          });
  
        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Optimistic UI update
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
  
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
  
        if (error) {
          // Check for unique constraint violation
          if (error.code === '23505') {
            throw new Error('Already following this user');
          }
          throw new Error(error.message);
        }
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      setFollowError(error.message);
      
      // Revert optimistic updates
      setIsFollowing(prev => !prev);
      setFollowerCount(prev => isFollowing ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    if (followError) {
      const timer = setTimeout(() => {
        setFollowError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [followError]);

  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Error deleting post');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-light-muted dark:text-dark-textSecondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 md:pt-24">
        <div className="bg-light-secondary dark:bg-dark-tertiary p-4 rounded-md">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-dark-error flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-light-text dark:text-dark-text">Error</h3>
              <div className="mt-2 text-sm text-dark-error">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 md:pt-24 text-center">
        <p className="text-light-muted dark:text-dark-textSecondary">User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-6 md:pb-8">
      {/* Add spacing from navbar */}
      <div className="h-20"></div>
      
      {/* Profile Header */}
      <div className="bg-light-primary dark:bg-dark-secondary rounded-lg p-4 md:p-6 mb-4 md:mb-6 
        shadow-sm border border-light-border dark:border-dark-border transform transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Profile Image - Made larger */}
          <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden 
            bg-light-secondary dark:bg-dark-tertiary flex items-center justify-center 
            border-4 border-light-border dark:border-dark-border flex-shrink-0
            shadow-lg">
            {avatarUrl ? (
              <img 
                src={avatarUrl}
                alt={profile.username || "User"} 
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <UserCircleIcon className="h-24 w-24 md:h-32 md:w-32 text-light-muted dark:text-dark-textSecondary" />
            )}
          </div>
          
          {/* User Info - Enhanced spacing and sizing */}
          <div className="flex flex-col items-center sm:items-start w-full">
            <h2 className="text-xl md:text-2xl font-bold text-light-text dark:text-dark-text break-words max-w-full">
              {profile.username || "User"}
            </h2>
            
            {profile.full_name && (
              <p className="text-base md:text-lg text-light-muted dark:text-dark-textSecondary break-words max-w-full mt-1">
                {profile.full_name}
              </p>
            )}

            {/* Bio Section - Improved spacing */}
            <div className="mt-3 w-full">
              <p className="text-sm md:text-base text-light-muted dark:text-dark-textSecondary break-words max-w-full">
                {profile.bio || "No bio available"}
              </p>
            </div>

            {/* Stats Row - Enhanced visual separation */}
            <div className="flex space-x-6 mt-4 text-sm md:text-base">
              <div className="flex items-center text-light-muted dark:text-dark-textSecondary">
                <UsersIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                <span className="font-medium">{followerCount}</span>
                <span className="ml-1">Followers</span>
              </div>
              <div className="flex items-center text-light-muted dark:text-dark-textSecondary">
                <UsersIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                <span className="font-medium">{followingCount}</span>
                <span className="ml-1">Following</span>
              </div>
            </div>
            
            {/* Follow Button - Enhanced styling */}
            {currentUser && (currentUser.id !== id) && (
              <div className="w-full sm:w-auto mt-4">
                <button
                  onClick={handleFollowClick}
                  disabled={followLoading}
                  className={`w-full sm:w-auto px-6 py-2 rounded-full text-sm font-medium 
                    flex items-center justify-center transition-all duration-200 
                    ${isFollowing 
                      ? 'bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text hover:bg-dark-error/10 hover:text-dark-error border-2 border-light-border dark:border-dark-border' 
                      : 'bg-dark-accent hover:bg-dark-accentHover text-white'
                    } ${followLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                  aria-label={isFollowing ? "Unfollow user" : "Follow user"}
                >
                  {followLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      <span>{isFollowing ? 'Unfollowing...' : 'Following...'}</span>
                    </>
                  ) : (
                    <>
                      {isFollowing ? (
                        <>
                          <UserMinusIcon className="h-4 w-4 mr-2" />
                          <span>Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="h-4 w-4 mr-2" />
                          <span>Follow</span>
                        </>
                      )}
                    </>
                  )}
                </button>
                {followError && (
                  <p className="text-dark-error text-sm mt-2 text-center">
                    {followError}
                  </p>
                )}
              </div>
            )}

            {currentUser && currentUser.id === id && (
              <div className="w-full sm:w-auto mt-4">
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-6 py-2 rounded-full text-sm font-medium 
                    flex items-center justify-center transition-all duration-200
                    bg-light-secondary dark:bg-dark-tertiary 
                    text-dark-error hover:bg-dark-error/10
                    border-2 border-light-border dark:border-dark-border
                    hover:scale-[1.02] active:scale-[0.98]"
                  aria-label="Log out"
                >
                  <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Posts Section */}
      <h3 className="text-base md:text-lg font-medium text-light-text dark:text-dark-text mb-2 md:mb-4 px-1">
        Posts
      </h3>
      <div className="space-y-3 md:space-y-4">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <Tweet tweet={post} onDelete={() => handleDeletePost(post.id)} />
              {index < posts.length - 1 && (
                <hr className="border-t border-light-border dark:border-dark-border my-4" />
              )}
            </React.Fragment>
          ))
        ) : (
          <div className="bg-light-primary dark:bg-dark-secondary rounded-lg p-6 md:p-8 text-center 
            text-light-muted dark:text-dark-textSecondary shadow-sm border border-light-border dark:border-dark-border">
            <p>No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;