import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Settings.css'; // Import the Settings.css file

const Settings = ({ user }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone ? parsePhoneNumberFromString(user.phone, 'US').formatInternational() : '');
  const [dob, setDob] = useState(user?.dob ? new Date(user.dob) : null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const validatePhoneNumber = (phoneNumber) => {
    const phoneNumberObj = parsePhoneNumberFromString(phoneNumber, 'US');
    return phoneNumberObj && phoneNumberObj.isValid();
  };

  const formatPhoneNumber = (phoneNumber) => {
    const phoneNumberObj = parsePhoneNumberFromString(phoneNumber, 'US');
    return phoneNumberObj ? phoneNumberObj.formatInternational() : phoneNumber;
  };

  const handleUpdate = async () => {
    setError('');
    setSuccess('');

    if (!validatePhoneNumber(phone)) {
      setError('Invalid phone number');
      return;
    }

    try {
      const { error } = await supabase.from('profiles').update({
        username,
        phone,
        dob: dob ? format(dob, 'yyyy-MM-dd') : null
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
        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
      />
      <DatePicker
        selected={dob}
        onChange={(date) => setDob(date)}
        dateFormat="yyyy-MM-dd"
        placeholderText="Date of Birth"
      />
      <button onClick={handleUpdate}>Update Profile</button>
      <button className="signout-button" onClick={handleSignOut}>Sign Out</button>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default Settings;