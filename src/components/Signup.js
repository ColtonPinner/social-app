import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { supabase } from '../supabaseClient';
import { ReactComponent as Logo } from '../assets/basic-logo.svg';

const SignUp = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    dob: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email address.';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (!formData.phone.match(/^\d{10}$/)) newErrors.phone = 'Phone number must be 10 digits.';
    if (!formData.dob) newErrors.dob = 'Date of birth is required.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setError(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (signUpError) throw signUpError;

      if (user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          email: formData.email,
          phone: formData.phone,
          dob: formData.dob
        });

        if (profileError) throw profileError;

        setUser(user);
        navigate('/profile-setup'); // Redirect to Profile Setup Page (Page 2)
      }
    } catch (err) {
      setError({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <Logo className="mx-auto h-12 w-auto" />
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Create Your Account
        </h2>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 ">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email</label>
              <div className="relative mt-2">
                <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="w-full rounded-lg border-0 py-2 pl-10 ring-1 ring-gray-300 focus:ring-2 focus:ring-black transition"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {error.email && <p className="text-red-500 text-sm mt-1">{error.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
              <div className="relative mt-2">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  className="w-full rounded-lg border-0 py-2 pl-10 ring-1 ring-gray-300 focus:ring-2 focus:ring-black transition"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              {error.password && <p className="text-red-500 text-sm mt-1">{error.password}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-900">Phone Number</label>
              <div className="relative mt-2">
                <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  className="w-full rounded-lg border-0 py-2 pl-10 ring-1 ring-gray-300 focus:ring-2 focus:ring-black transition"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              {error.phone && <p className="text-red-500 text-sm mt-1">{error.phone}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-900">Date of Birth</label>
              <div className="relative mt-2">
                <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="dob"
                  id="dob"
                  className="w-full rounded-lg border-0 py-2 pl-10 ring-1 ring-gray-300 focus:ring-2 focus:ring-black transition"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>
              {error.dob && <p className="text-red-500 text-sm mt-1">{error.dob}</p>}
            </div>

            {error.form && <p className="text-red-500 text-sm mt-3">{error.form}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 rounded-lg bg-black py-2 text-white font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Next'}
            </button>

            {/* Return to Login Button */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full mt-4 text-center text-sm font-semibold text-gray-700 hover:text-black transition"
            >
              Already have an account? <span className="underline">Return to Login</span>
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;