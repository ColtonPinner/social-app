import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Auth.css'; // Import the Auth.css file
import { ReactComponent as Logo } from '../assets/basic-logo.svg'; // Correct the import path

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setUser(data.user);
      navigate('/tweets'); // Redirect to dashboard
    }
  };

  const handleForgotPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(error.message);
    } else {
      setError('Password reset link sent to your email.');
    }
  };

  return (
    <>
      <Logo className="logo" /> {/* Add the SVG outside the container */}
      <div className="auth-container">
        <h2>Login</h2>
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
        <button className="primary" onClick={handleLogin}>Login</button>
        <button className="secondary" onClick={() => navigate('/signup')}>Create an account</button>
        {error && <p>{error}</p>}
      </div>
    </>
  );
};

export default Login;