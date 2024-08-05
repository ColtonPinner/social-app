import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Auth.css'; // Import the Auth.css file

const SignUp = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async () => {
    // Sign up the user with email and password
    const { data, error } = await supabase.auth.signUp({ email, password, options:{data:{username,phone,dob}} });

    if (error) {
      setError(error.message);
    } else {
      // After signing up, save the username, phone, and dob to the user's profile
      const { error: updateError } = await supabase.from('profiles').insert([
        { id: data.user.id, username, phone, dob }
      ]);

      if (updateError) {
        setError(updateError.message);
      } else {
        setUser(data.user);
        navigate('/dashboard'); // Redirect to dashboard
      }
    }
  };

  const handleGitHubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    });
    if (error) {
      setError(error.message);
    } else {
      // Redirect will be handled by Supabase on successful login
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
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
      <button className="primary" onClick={handleSignUp}>Sign Up</button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default SignUp;