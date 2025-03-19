import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { supabase } from '../supabaseClient';
import { ReactComponent as Logo } from '../assets/basic-logo.svg';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(error.message);
    } else {
      setError('Password reset link sent to your email.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Logo in upper left */}
      <div className="absolute top-8 left-8">
        <Logo className="h-12 w-auto" />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-10 px-4 py-12 sm:px-6 lg:px-8">
          <div>
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
              Hey there! 👋
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-200/50 space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                  Email
                </label>
                <div className="relative mt-2 rounded-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="block w-full rounded-lg border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Password
                </label>
                <div className="relative mt-2 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    className="block w-full rounded-lg border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  Create an account
                </button>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-white/80 backdrop-blur-xl border-t border-gray-200/50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-xs md:text-sm text-gray-500 text-center md:text-left mb-2 md:mb-0">
            © {new Date().getFullYear()} basic. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-6">
            <Link to="/privacy" className="text-xs md:text-sm text-gray-500 hover:text-gray-700">
              Privacy
            </Link>
            <Link to="/terms" className="text-xs md:text-sm text-gray-500 hover:text-gray-700">
              Terms
            </Link>
            <a 
              href="mailto:support@socialapp.com" 
              className="text-xs md:text-sm text-gray-500 hover:text-gray-700"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;