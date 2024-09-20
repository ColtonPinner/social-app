import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Settings.css';

const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
  <input
    type="text"
    value={value}
    onClick={onClick}
    ref={ref}
    inputMode="numeric"
    placeholder="Date of Birth"
    className="custom-date-input"
  />
));

const Settings = ({ user }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone ? parsePhoneNumberFromString(user.phone, 'US').formatInternational() : '');
  const [dob, setDob] = useState(user?.dob ? new Date(user.dob) : null);
  const [profileImage, setProfileImage] = useState(null);
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
      // Update the user's profile details
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

  const handleImageUpload = async () => {
    if (!profileImage) return;

    try {
      // Get signed URL from backend
      const response = await fetch('http://localhost:3000/api/generate-upload-url', { // Fixed the URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, fileName: profileImage.name }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate upload URL. Please try again.');
      }

      const { signedUrl } = await response.json();

      // Upload the image to Supabase using signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': profileImage.type,
        },
        body: profileImage,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      setSuccess('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error.message);
      setError('Error uploading image');
    }
  };

  const handleFileChange = (event) => {
    setProfileImage(event.target.files[0]);
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
        dateFormat="MM-dd-yyyy"
        customInput={<CustomDateInput />}
      />
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpdate}>Update Profile</button>
      <button onClick={handleImageUpload}>Upload Image</button>
      <button className="signout-button" onClick={handleSignOut}>Sign Out</button>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default Settings;