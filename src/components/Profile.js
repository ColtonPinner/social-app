import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Profile.css'; // Import the Profile.css file

const Profile = ({ user }) => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('username, phone, dob')
        .eq('id', user.id)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const formatPhoneNumber = (phoneNumber) => {
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phoneNumber;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="profile-container">
      <h2>{profile.username}</h2>
      <div className="profile-field">
        <label>Email:</label>
        <p>{user.email}</p>
      </div>
      <div className="profile-field">
        <label>Username:</label>
        <p>{profile.username}</p>
      </div>
      <div className="profile-field">
        <label>Phone:</label>
        <p>{formatPhoneNumber(profile.phone)}</p>
      </div>
      <div className="profile-field">
        <label>Date of Birth:</label>
        <p>{formatDate(profile.dob)}</p>
      </div>
    </div>
  );
};

export default Profile;