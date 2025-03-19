import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, CalendarIcon } from '@heroicons/react/24/outline';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
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

  // Handle standard input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle phone input changes
  const handlePhoneChange = (value) => {
    setFormData({ ...formData, phone: value });
  };

  // Basic validation
  const validateForm = () => {
    const newErrors = {};

    // Email check
    if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email address.';
    }

    // Password length check
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    // Phone length check: strip out all non-digits
    const numericPhone = formData.phone.replace(/\D/g, '');
    if (numericPhone.length < 10 || numericPhone.length > 15) {
      newErrors.phone = 'Phone number must be between 10 and 15 digits.';
    }

    // DOB check
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required.';
    }

    return newErrors;
  };

  // Submit form
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
      // Sign up using Supabase Auth
      const {
        data: { user },
        error: signUpError
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (signUpError) throw signUpError;

      // Insert into 'profiles' table
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: formData.email,
            phone: formData.phone,
            dob: formData.dob
          });

        if (profileError) throw profileError;

        setUser(user);
        navigate('/profile-setup'); // Page 2 for further setup
      }
    } catch (err) {
      setError({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Logo in upper left */}
      <div className="absolute top-8 left-8">
        <Logo className="h-12 w-auto" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Create Your Account
          </h2>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                  Email
                </label>
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                  Password
                </label>
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900">
                  Phone Number
                </label>
                <div className="relative mt-2">
                  {/* 
                    Custom mask for US: (XXX) XXX-XXXX
                    Disables dropdown & country code for a purely US-based format 
                  */}
                  <PhoneInput
                    country="us"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    masks={{ us: '(...) ...-....' }}
                    disableDropdown
                    disableCountryCode
                    onlyCountries={['us']}
                    placeholder="(555) 555-5555"
                    inputClass="!w-full !rounded-lg !border-0 !py-2 !pl-10 !ring-1 !ring-gray-300 focus:!ring-2 focus:!ring-black transition"
                  />
                </div>
                {error.phone && <p className="text-red-500 text-sm mt-1">{error.phone}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-900">
                  Date of Birth
                </label>
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

              {/* Form-Level Error */}
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

export default SignUp;