import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Profile.css';

const Profile = () => {
  const { id } = useParams(); // Get the user ID from the URL
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false); // State to manage follow status
  const [followerCount, setFollowerCount] = useState(0); // State to store the number of followers
  const [followingCount, setFollowingCount] = useState(0); // State to store the number of users this profile is following

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError('Error fetching profile');
      } else {
        setProfile(data);
        checkIfFollowing(data.id); // Check if the current user is following this profile
        fetchFollowCounts(data.id); // Fetch follower and following counts
      }
      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  const checkIfFollowing = async (profileId) => {
    const { data: { user } } = await supabase.auth.getUser(); // Updated line
    if (user) {
      const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .single();

      if (!error && data) {
        setIsFollowing(true);
      }
    }
  };

  const fetchFollowCounts = async (profileId) => {
    // Fetch the number of followers
    const { count: followersCount, error: followerError } = await supabase
      .from('followers')
      .select('id', { count: 'exact' })
      .eq('following_id', profileId);

    if (!followerError) {
      setFollowerCount(followersCount);
    }

    // Fetch the number of users this profile is following
    const { count: followingCount, error: followingError } = await supabase
      .from('followers')
      .select('id', { count: 'exact' })
      .eq('follower_id', profileId);

    if (!followingError) {
      setFollowingCount(followingCount);
    }
  };

  const handleFollowClick = async () => {
    const { data: { user } } = await supabase.auth.getUser(); // Updated line
    if (!user || user.id === profile.id) return; // Prevent following yourself

    if (isFollowing) {
      // Unfollow logic
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);

      if (error) {
        setError('Error unfollowing user');
      } else {
        setIsFollowing(false);
        setFollowerCount(prevCount => prevCount - 1); // Decrease follower count
      }
    } else {
      // Follow logic
      const { error } = await supabase
        .from('followers')
        .insert({ follower_id: user.id, following_id: profile.id });

      if (error) {
        setError('Error following user');
      } else {
        setIsFollowing(true);
        setFollowerCount(prevCount => prevCount + 1); // Increase follower count
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img
          src={profile.avatar_url || '/default-avatar.png'} // Replace with your default avatar path
          alt={`${profile.username}'s avatar`}
          className="profile-picture"
        />
        <h2>{profile.username}</h2> {/* Username is now below the profile picture */}
      </div>
      <button className="follow-button" onClick={handleFollowClick}>
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
      <div className="follow-info">
        <p>{followerCount} Followers</p>
        <p>{followingCount} Following</p>
      </div>
    </div>
  );
};

export default Profile;