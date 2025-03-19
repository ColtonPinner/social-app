import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  ArrowPathIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  UserCircleIcon,
  UsersIcon,
  UserPlusIcon,
  UserMinusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Tweet from './Tweet';

const ProfileSettings = ({ user, setUser }) => {
  const { id } = useParams(); // Get the user ID from the URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone: '',
    dob: null,
    bio: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]); // State to store the user's posts
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!user?.id) return;
        
        // Fetch profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setFormData({
            username: data.username || '',
            full_name: data.full_name || '',
            phone: data.phone ? parsePhoneNumberFromString(data.phone, 'US')?.formatNational() || data.phone : '',
            dob: data.dob ? new Date(data.dob) : null,
            bio: data.bio || '',
          });
          
          // Set image preview if avatar_url exists
          if (data.avatar_url) {
            setImagePreview(data.avatar_url);
          }

          // Fetch follow counts
          const { count: followers } = await supabase
            .from('followers')
            .select('id', { count: 'exact' })
            .eq('following_id', user.id);

          const { count: following } = await supabase
            .from('followers')
            .select('id', { count: 'exact' })
            .eq('follower_id', user.id);

          setFollowerCount(followers || 0);
          setFollowingCount(following || 0);
        }
      } catch (error) {
        console.error('Error fetching profile:', error.message);
        setError('Failed to load profile data');
      }
    };
    
    fetchUserProfile();
  }, [user]);

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
        if (user?.id && user.id !== id) {
          console.log("Checking if following, current user:", user.id, "profile:", id);
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
  }, [id, user]);

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
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
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
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Don't allow following yourself
    if (user.id === id) return;
    
    setFollowLoading(true);
    setError(null);
  
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', id);
  
        if (error) throw error;
        
        setIsFollowing(false);
        setFollowerCount(prevCount => Math.max(0, prevCount - 1));
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dob: date
    }));
  };

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return true; // Phone can be optional
    const phoneNumberObj = parsePhoneNumberFromString(phoneNumber, 'US');
    return phoneNumberObj && phoneNumberObj.isValid();
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

  const handleImageUpload = async () => {
    if (!profileImage || !user?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Create a unique file path for the image
      const fileExt = profileImage.name.split('.').pop();
      const filePath = `avatars/${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('user-content')
        .upload(filePath, profileImage, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase
        .storage
        .from('user-content')
        .getPublicUrl(filePath);
        
      const avatarUrl = data.publicUrl;
      
      // Update the user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setSuccess('Profile image updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error.message);
      setError(`Error uploading image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (loading) return;
    
    setError('');
    setSuccess('');
    
    // Validate phone number
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    
    try {
      const updatedData = {
        username: formData.username,
        full_name: formData.full_name,
        phone: formData.phone,
        dob: formData.dob ? formData.dob.toISOString() : null,
        bio: formData.bio,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // If there's a profile image waiting to be uploaded, do it now
      if (profileImage) {
        await handleImageUpload();
      }
    } catch (error) {
      console.error('Error updating profile:', error.message);
      setError(`Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate('/login');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      name="dob"
      value={value || ''}
      onClick={onClick}
      onChange={() => {}} // DatePicker handles changes
      ref={ref}
      placeholder="Date of Birth"
      className="block w-full rounded-lg border-0 px-4 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-black sm:leading-6"
      readOnly
    />
  ));

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="flex-1">
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-8">
          <div className="bg-white rounded-lg p-6">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{followerCount}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{followingCount}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
              </div>
            </div>
            
            {/* Profile Image Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2"></label>
              <div className="flex items-center space-x-6">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile preview" 
                      className="h-24 w-24 object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="block">
                    <span className="sr-only">Choose profile photo</span>
                    <input 
                      type="file"
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-black file:text-white
                        hover:file:bg-gray-800
                        cursor-pointer"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </label>
                  <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 5MB.</p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 px-4 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-black sm:leading-6"
                />
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 px-4 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-black sm:leading-6"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 px-4 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-black sm:leading-6"
                  placeholder="(555) 555-5555"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
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

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 px-4 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-black sm:leading-6"
                  rows="4"
                  placeholder="Tell us a little about yourself"
                />
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 rounded-md flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="ml-auto"
                >
                  <XMarkIcon className="h-5 w-5 text-red-500" />
                </button>
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 bg-green-50 rounded-md flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-sm text-green-700">{success}</span>
                <button 
                  onClick={() => setSuccess('')}
                  className="ml-auto"
                >
                  <XMarkIcon className="h-5 w-5 text-green-500" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col space-y-3">
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex justify-center items-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              
              <button
                onClick={handleSignOut}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-white/80 backdrop-blur-xl border-t border-gray-200/50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-xs md:text-sm text-gray-500 text-center md:text-left mb-2 md:mb-0">
            © {new Date().getFullYear()} basic. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-6">
            <Link to="/privacy" className="text-xs md:text-sm text-gray-500 hover:text-gray-700">
              Privacy
            </Link>
            <Link to="/terms" className="text-xs md:text-sm text-gray-500 hover:text-gray-700">
              Terms
            </Link>
            <a 
              href="mailto:support@socialapp.com" 
              className="text-xs md:text-sm text-gray-500 hover:text-gray-700"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfileSettings;