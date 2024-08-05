// src/components/Settings.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Settings.css';

const Settings = ({ user }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleUpdate = async () => {
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase.from('profiles').update({
        username,
        phone,
        dob
      }).eq('id', user.id);

      if (error) {
        throw error;
      }

      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="date"
        placeholder="Date of Birth"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
      />
      <button onClick={handleUpdate}>Update Profile</button>
      <button className="signout-button" onClick={handleSignOut}>Sign Out</button>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default Settings;