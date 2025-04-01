import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LinkIcon,
  PencilIcon,
  ArrowPathIcon,
  PhotoIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid';
import { supabase } from '../supabaseClient';
import Tweet from './Tweet';

const Profile = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    website: '',
    avatar_url: '',
    bio: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchTweets();
  }, [id]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
    setFormData({
      username: data.username || '',
      full_name: data.full_name || '',
      website: data.website || '',
      avatar_url: data.avatar_url || '',
      bio: data.bio || ''
    });
    setLoading(false);
  };

  const fetchTweets = async () => {
    const { data, error } = await supabase
      .from('tweets')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tweets:', error);
      return;
    }

    setTweets(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      let avatar_url = formData.avatar_url;

      // Upload new avatar if there's a preview
      if (preview) {
        const file = await fetch(preview).then(r => r.blob());
        const fileExt = file.type.split('/')[1];
        const fileName = `${id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatar_url = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          avatar_url,
          updated_at: new Date()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      setPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 md:pt-28">
      <div className="max-w-3xl mx-auto px-4">
        {/* Profile Card */}
        <div className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
          border border-light-border dark:border-dark-border
          rounded-2xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500" />
            
            {/* Profile Image and Actions */}
            <div className="px-4 md:px-6">
              <div className="relative -mt-20 mb-4 flex justify-between items-end">
                <img
                  src={preview || profile.avatar_url || 'https://via.placeholder.com/150'}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full border-4 border-light-primary dark:border-dark-primary object-cover"
                />
                {currentUser?.id === profile.id && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg
                      bg-light-text dark:bg-dark-text
                      text-light-primary dark:text-dark-primary
                      hover:bg-light-textSecondary dark:hover:bg-dark-textSecondary
                      transition-all duration-200 
                      hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Info */}
              {!isEditing && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
                      {profile.full_name || profile.username}
                    </h1>
                    <p className="text-light-muted dark:text-dark-textSecondary">
                      @{profile.username}
                    </p>
                  </div>

                  {profile.bio && (
                    <p className="text-light-text dark:text-dark-text px-4 py-2">
                      {profile.bio}
                    </p>
                  )}

                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-dark-accent hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>{new URL(profile.website).hostname}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="p-4 md:p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer flex items-center justify-center h-10 w-10 
                    rounded-full bg-light-secondary dark:bg-dark-tertiary hover:opacity-80 transition-opacity">
                    <PhotoIcon className="h-6 w-6 text-light-text dark:text-dark-text" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleMediaChange}
                    />
                  </label>
                  {preview && (
                    <button 
                      onClick={() => setPreview(null)}
                      className="text-light-muted dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text"
                    >
                      Remove new avatar
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-lg
                          bg-light-secondary dark:bg-dark-tertiary 
                          text-light-text dark:text-dark-text
                          border border-light-border dark:border-dark-border
                          focus:ring-2 focus:ring-dark-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-lg
                          bg-light-secondary dark:bg-dark-tertiary 
                          text-light-text dark:text-dark-text
                          border border-light-border dark:border-dark-border
                          focus:ring-2 focus:ring-dark-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
                      Website
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-lg
                          bg-light-secondary dark:bg-dark-tertiary 
                          text-light-text dark:text-dark-text
                          border border-light-border dark:border-dark-border
                          focus:ring-2 focus:ring-dark-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg
                        bg-light-secondary dark:bg-dark-tertiary 
                        text-light-text dark:text-dark-text
                        border border-light-border dark:border-dark-border
                        focus:ring-2 focus:ring-dark-accent focus:outline-none
                        resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-dark-error/10 p-4 text-sm text-dark-error">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setPreview(null);
                      setError('');
                    }}
                    className="px-4 py-2 rounded-lg
                      border border-light-border dark:border-dark-border
                      text-light-text dark:text-dark-text
                      hover:bg-light-secondary dark:hover:bg-dark-tertiary
                      transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg
                      bg-light-text dark:bg-dark-text
                      text-light-primary dark:text-dark-primary
                      hover:bg-light-textSecondary dark:hover:bg-dark-textSecondary
                      transition-all duration-200 
                      hover:scale-[1.02] active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tweets Section */}
        <div className="mt-6">
          <div className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
            border border-light-border dark:border-dark-border
            rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-light-border dark:border-dark-border">
              <h2 className="text-xl font-bold text-light-text dark:text-dark-text">
                Posts
              </h2>
            </div>

            {tweets.length > 0 ? (
              <div className="divide-y divide-light-border dark:divide-dark-border">
                {tweets.map(tweet => (
                  <Tweet 
                    key={tweet.id} 
                    tweet={tweet}
                    className="p-4 hover:bg-light-secondary/50 dark:hover:bg-dark-tertiary/50 transition-colors"
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-light-muted dark:text-dark-textSecondary" />
                <p className="text-light-muted dark:text-dark-textSecondary">
                  {currentUser?.id === profile.id 
                    ? "You haven't posted anything yet"
                    : "This user hasn't posted anything yet"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;