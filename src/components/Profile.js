import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Profile.css';

const Profile = () => {
  const { id } = useParams(); // Get the user ID from the URL
  const [profile, setProfile] = useState(null);
  const [tweets, setTweets] = useState([]); // State to store the user's tweets
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false); // State to manage follow status
  const [followerCount, setFollowerCount] = useState(0); // State to store the number of followers
  const [followingCount, setFollowingCount] = useState(0); // State to store the number of users this profile is following

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) {
        setError('Error fetching profile');
      } else {
        setProfile(profileData);
        checkIfFollowing(profileData.id); // Check if the current user is following this profile
        fetchFollowCounts(profileData.id); // Fetch follower and following counts
        fetchTweets(profileData.id); // Fetch the user's tweets
      }
      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  const fetchTweets = async (profileId) => {
    const { data: tweetsData, error: tweetsError } = await supabase
      .from('tweets')
      .select('*')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false });

    if (tweetsError) {
      setError('Error fetching tweets');
    } else {
      setTweets(tweetsData);
    }
  };

  const checkIfFollowing = async (profileId) => {
    const { data: { user } } = await supabase.auth.getUser();
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
    const { count: followersCount, error: followerError } = await supabase
      .from('followers')
      .select('id', { count: 'exact' })
      .eq('following_id', profileId);

    if (!followerError) {
      setFollowerCount(followersCount);
    }

    const { count: followingCount, error: followingError } = await supabase
      .from('followers')
      .select('id', { count: 'exact' })
      .eq('follower_id', profileId);

    if (!followingError) {
      setFollowingCount(followingCount);
    }
  };

  const handleFollowClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isFollowing) {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);

      if (error) {
        setError('Error unfollowing user');
      } else {
        setIsFollowing(false);
        setFollowerCount(prevCount => prevCount - 1);
      }
    } else {
      const { error } = await supabase
        .from('followers')
        .insert({ follower_id: user.id, following_id: profile.id });

      if (error) {
        setError('Error following user');
      } else {
        setIsFollowing(true);
        setFollowerCount(prevCount => prevCount + 1);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img
          src={profile.avatar_url || 'https://via.placeholder.com/150'}
          alt="Profile"
          className="profile-picture"
        />
        <h2>{profile.username}</h2>
      </div>
      <button className="follow-button" onClick={handleFollowClick}>
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
      <div className="follow-info">
        <p>{followerCount} Followers</p>
        <p>{followingCount} Following</p>
      </div>

      <div className="tweets-box">
        {tweets.length > 0 ? (
          tweets.map(tweet => (
            <div key={tweet.id} className="tweet">
              <p>{tweet.content}</p>
              <span>{new Date(tweet.created_at).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <p>No tweets yet.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;