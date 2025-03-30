import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, CalendarIcon } from '@heroicons/react/24/outline';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { supabase } from '../supabaseClient';
import { ReactComponent as LogoLight } from '../assets/basic-logo-light.svg';
import { ReactComponent as LogoDark } from '../assets/basic-logo-dark.svg';
import Footer from './Footer';

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
    <div className="min-h-screen flex flex-col bg-light-primary dark:bg-dark-primary">
      {/* Logo in upper left - with theme switching */}
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
              Create Your Account
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
              border border-light-border dark:border-dark-border
              p-6 md:p-8 rounded-2xl space-y-6 w-full"
            >
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Email
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <EnvelopeIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="block w-full rounded-lg py-1.5 pl-10
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none 
                      placeholder-light-muted dark:placeholder-dark-textSecondary"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {error.email && (
                  <p className="mt-1 text-sm text-dark-error">{error.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Password
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockClosedIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    className="block w-full rounded-lg py-1.5 pl-10
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none 
                      placeholder-light-muted dark:placeholder-dark-textSecondary"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {error.password && (
                  <p className="mt-1 text-sm text-dark-error">{error.password}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Phone Number
                </label>
                <div className="relative mt-2">
                  <PhoneInput
                    country="us"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    masks={{ us: '(...) ...-....' }}
                    disableDropdown
                    disableCountryCode
                    onlyCountries={['us']}
                    placeholder="(555) 555-5555"
                    inputClass="!w-full !rounded-lg !py-1.5 !pl-10
                      !bg-light-secondary dark:!bg-dark-tertiary 
                      !text-light-text dark:!text-dark-text
                      !border !border-light-border dark:!border-dark-border
                      focus:!ring-2 focus:!ring-dark-accent !outline-none"
                  />
                </div>
                {error.phone && (
                  <p className="mt-1 text-sm text-dark-error">{error.phone}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Date of Birth
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <CalendarIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                  </div>
                  <input
                    type="date"
                    name="dob"
                    id="dob"
                    required
                    className="block w-full rounded-lg py-1.5 pl-10
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none"
                    value={formData.dob}
                    onChange={handleChange}
                  />
                </div>
                {error.dob && (
                  <p className="mt-1 text-sm text-dark-error">{error.dob}</p>
                )}
              </div>

              {error.form && (
                <div className="rounded-md bg-dark-error/10 p-4 border border-dark-error/20">
                  <p className="text-sm text-dark-error">{error.form}</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-lg 
                    bg-dark-accent hover:bg-dark-accentHover
                    px-3 py-2 text-sm font-semibold text-white 
                    transition-all duration-200 
                    hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Next'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex w-full justify-center rounded-lg
                    border border-light-border dark:border-dark-border
                    bg-light-secondary dark:bg-dark-tertiary
                    px-3 py-2 text-sm font-semibold
                    text-light-text dark:text-dark-text
                    hover:bg-light-secondary/70 dark:hover:bg-dark-tertiary/70
                    transition-all duration-200"
                >
                  Return to Login
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

export default SignUp;