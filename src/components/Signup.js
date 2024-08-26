import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Auth.css';
import { ReactComponent as Logo } from '../assets/basic-logo.svg';
import Login from './Login';

const SignUp = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setError('');
    try {
      // Sign up the user with email and password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, phone, dob } }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Insert profile information
      const { user } = data;
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: user.id, email: user.email, username, phone, dob }
      ]);

      if (profileError) {
        throw profileError;
      }

      // Automatically log in the user after successful signup
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        throw signInError;
      }

      setUser(user);
      navigate('/login'); // Redirect to dashboard
    } catch (error) {
      setError(error.message);
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
    <>
    <Logo className="logo" />
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
    <button className='pr'></button>
    </>
  );
};

export default SignUp;