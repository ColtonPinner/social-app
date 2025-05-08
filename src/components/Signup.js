import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, CalendarIcon, UserIcon, InformationCircleIcon, LinkIcon } from '@heroicons/react/24/outline';
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
    username: '',
    full_name: '', // Add this field
    website: '',   // Add this field
    phone: '',
    dob: '',
    bio: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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

  // Handle file input change for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError({ ...error, profileImage: 'Only JPEG, PNG, or WEBP images are allowed' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError({ ...error, profileImage: 'Image must be less than 5MB' });
      return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError({ ...error, profileImage: null });
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

    // Username check
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required.';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
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
      // 1. Sign up user with metadata (to use in trigger)
      const {
        data: { user },
        error: signUpError
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name || formData.username,
            username: formData.username,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Signup failed');

      // 2. Upload profile picture if available
      let avatarUrl = null;
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profileImage, {
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = data.publicUrl;
      }

      // 3. Update the profile with additional info
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name || formData.username,
          avatar_url: avatarUrl,
          website: formData.website || null,
          // Store extra data in metadata if needed
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Success! Set user and navigate
      setUser(user);
      navigate('/tweets');
      
    } catch (err) {
      console.error('Signup error:', err);
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
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden 
                    bg-light-secondary dark:bg-dark-tertiary
                    border border-light-border dark:border-dark-border">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-light-muted dark:text-dark-textSecondary">
                        <UserIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer px-3 py-2 rounded-lg
                      bg-light-secondary dark:bg-dark-tertiary
                      text-light-text dark:text-dark-text text-sm
                      border border-light-border dark:border-dark-border
                      hover:bg-light-secondary/70 dark:hover:bg-dark-tertiary/70
                      transition-colors">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    {error.profileImage && (
                      <p className="mt-1 text-sm text-dark-error">{error.profileImage}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Username
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    required
                    className="block w-full rounded-lg py-1.5 pl-10
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none 
                      placeholder-light-muted dark:placeholder-dark-textSecondary"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                  />
                </div>
                {error.username && (
                  <p className="mt-1 text-sm text-dark-error">{error.username}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Full Name <span className="text-light-muted dark:text-dark-textSecondary text-xs">(optional)</span>
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    className="block w-full rounded-lg py-1.5 pl-10
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none 
                      placeholder-light-muted dark:placeholder-dark-textSecondary"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Bio <span className="text-light-muted dark:text-dark-textSecondary text-xs">(optional)</span>
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute top-2 left-3">
                    <InformationCircleIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                  </div>
                  <textarea
                    name="bio"
                    id="bio"
                    rows="3"
                    className="block w-full rounded-lg py-2 pl-10
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none 
                      placeholder-light-muted dark:placeholder-dark-textSecondary
                      resize-none"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Website <span className="text-light-muted dark:text-dark-textSecondary text-xs">(optional)</span>
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LinkIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                  </div>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    className="block w-full rounded-lg py-1.5 pl-10
                      bg-light-secondary dark:bg-dark-tertiary 
                      text-light-text dark:text-dark-text
                      border border-light-border dark:border-dark-border
                      focus:ring-2 focus:ring-dark-accent focus:outline-none 
                      placeholder-light-muted dark:placeholder-dark-textSecondary"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

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