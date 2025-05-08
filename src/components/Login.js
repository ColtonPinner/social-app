import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../supabaseClient';
import { ReactComponent as LogoLight } from '../assets/basic-logo-light.svg';
import { ReactComponent as LogoDark } from '../assets/basic-logo-dark.svg';
import Footer from './Footer';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;
      setUser(data.user);
      navigate('/tweets');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Validate email first
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address first');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage('Password reset link sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-light-primary dark:bg-dark-primary">
      {/* Logo in upper left */}
      <div className="p-8">
        <div className="dark:hidden">
          <LogoLight className="h-12 w-auto text-light-text" />
        </div>
        <div className="hidden dark:block">
          <LogoDark className="h-12 w-auto text-dark-text" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-center text-3xl font-bold tracking-tight text-light-text dark:text-dark-text">
              Hey there! 👋
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
              border border-light-border dark:border-dark-border
              p-6 md:p-8 rounded-2xl space-y-6 w-full"
            >
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Email
                </label>
                <div className="relative mt-2 rounded-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <EnvelopeIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    autoComplete="email"
                    className="block w-full rounded-lg py-1.5 pl-10
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none 
                      placeholder-light-muted dark:placeholder-dark-textSecondary"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Password
                </label>
                <div className="relative mt-2 rounded-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockClosedIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" aria-hidden="true" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    required
                    autoComplete="current-password"
                    className="block w-full rounded-lg py-1.5 pl-10 pr-10
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none 
                      placeholder-light-muted dark:placeholder-dark-textSecondary"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      className="text-light-muted dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-md bg-dark-error/10 p-4 border border-dark-error/20">
                  <p className="text-sm text-dark-error">{error}</p>
                </div>
              )}

              {/* Success message */}
              {message && (
                <div className="rounded-md bg-green-500/10 p-4 border border-green-500/20">
                  <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-lg 
                    bg-light-text dark:bg-dark-text
                    hover:bg-light-textSecondary dark:hover:bg-dark-textSecondary
                    px-3 py-2 text-sm font-semibold
                    text-light-primary dark:text-dark-primary
                    transition-all duration-200 
                    hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="flex w-full justify-center rounded-lg
                    border border-light-border dark:border-dark-border
                    bg-light-secondary dark:bg-dark-tertiary
                    px-3 py-2 text-sm font-semibold
                    text-light-text dark:text-dark-text
                    hover:bg-light-secondary/70 dark:hover:bg-dark-tertiary/70
                    transition-all duration-200"
                >
                  Create an account
                </button>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-light-muted dark:text-dark-textSecondary 
                    hover:text-light-text dark:hover:text-dark-text"
                >
                  Forgot your password?
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;