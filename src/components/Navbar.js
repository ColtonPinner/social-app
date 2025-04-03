import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  House,
  Bell,
  ChatDots,
  MagnifyingGlass,
  X
} from '@phosphor-icons/react';
import { supabase } from '../supabaseClient';
import { Transition } from '@headlessui/react';

const Navbar = ({ profile }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const location = useLocation();
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);
  const searchResultsRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!profile) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data);
        setUnreadCount(data.filter((notification) => !notification.is_read).length);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      
      if (searchResultsRef.current && 
          !searchResultsRef.current.contains(event.target) && 
          !event.target.classList.contains('search-input')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    setShowNotifications(false);
    setShowSearchResults(false);
    setShowMobileSearch(false);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profile, location.pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    document.documentElement.classList.toggle('dark', mediaQuery.matches);

    const handleChange = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowSearchResults(false);
    setShowMobileSearch(false);
  };

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    if (event.target.value.trim() === '') {
      setShowSearchResults(false);
      setSearchResults([]);
    } else {
      fetchSearchResults(event.target.value);
    }
  };

  const fetchSearchResults = async (query) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(5);

    if (error) {
      console.error('Error fetching search results:', error);
    } else {
      setSearchResults(data);
      setShowSearchResults(true);
    }
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    setShowNotifications(false);
    if (!showMobileSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-40 px-4 pt-4">
        <nav className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
          border border-light-border dark:border-dark-border
          rounded-2xl flex items-center h-14 px-6 mx-auto max-w-5xl"
        >
          <div className="flex items-center space-x-2">
            <Link to="/tweets" className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors">
              <House size={24} weight="fill" />
            </Link>
            
            <div className="relative" ref={notificationRef}>
              <button 
                className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative transition-colors"
                onClick={handleToggleNotifications}
                aria-label="Notifications"
              >
                <Bell size={24} weight="fill" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute top-12 -right-32 w-80 max-h-96 overflow-y-auto 
                  backdrop-blur-lg bg-white/80 dark:bg-black/80 
                  rounded-lg shadow-lg z-10 border border-white/20 dark:border-white/10"
                >
                  <h3 className="p-3 font-semibold border-b border-gray-200 dark:border-gray-700">Notifications</h3>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer ${notification.is_read ? '' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-600`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <p className="text-sm mb-1">{notification.message}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(notification.created_at).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications.</p>
                  )}
                </div>
              )}
            </div>

            <Link 
              to="/messages" 
              className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Messages"
            >
              <ChatDots size={24} weight="fill" />
            </Link>
            
            {profile && (
              <Link to="/settings" className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-200 px-2 py-1 hover:text-black dark:hover:text-white transition-colors active:scale-95">
                <img
                  src={profile.avatar_url || 'https://via.placeholder.com/150'}
                  alt="Settings"
                  className="w-8 h-8 rounded-full object-cover border-2 border-green-500"
                />
                <span className="text-[10px]"></span>
              </Link>
            )}
          </div>

          <div className="ml-auto relative" ref={searchResultsRef}>
            <div className="relative">
              <MagnifyingGlass size={20} weight="bold" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-52 h-10 pl-9 pr-4 py-2 rounded-lg 
                  bg-light-secondary dark:bg-dark-tertiary 
                  text-light-text dark:text-dark-text
                  border border-light-border dark:border-dark-border
                  focus:ring-2 focus:ring-dark-accent focus:outline-none 
                  placeholder-light-muted dark:placeholder-dark-textSecondary
                  transition-all duration-200"
              />
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <Transition
                show={showSearchResults}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <div className="absolute top-12 left-0 right-0 
                  backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
                  rounded-2xl shadow-lg z-10 border border-light-border dark:border-dark-border 
                  overflow-hidden"
                >
                  {searchResults.map((user) => (
                    <Link 
                      to={`/profile/${user.id}`} 
                      key={user.id} 
                      className="flex items-center p-3 hover:bg-light-secondary/50 dark:hover:bg-dark-tertiary/50
                        border-b border-light-border dark:border-dark-border last:border-none
                        text-light-text dark:text-dark-text"
                    >
                      <img
                        src={user.avatar_url || 'https://via.placeholder.com/150'}
                        alt={user.username}
                        className="w-8 h-8 rounded-full mr-3 object-cover 
                          border border-light-border dark:border-dark-border"
                      />
                      <span className="font-medium">{user.username}</span>
                    </Link>
                  ))}
                </div>
              </Transition>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 pt-4">
        <nav className="backdrop-blur-lg bg-light-primary/80 dark:bg-dark-primary/80 
          border border-light-border dark:border-dark-border
          rounded-2xl flex items-center h-12 mx-auto max-w-md"
        >
          <div className="flex justify-around items-center w-full px-4">
            <Link to="/tweets" className="flex items-center justify-center text-light-text dark:text-dark-text hover:text-light-muted dark:hover:text-dark-textSecondary transition-colors">
              <House size={24} weight="fill" />
            </Link>
            
            <Link 
              to="/messages" 
              className="flex items-center justify-center text-light-text dark:text-dark-text hover:text-light-muted dark:hover:text-dark-textSecondary transition-colors"
            >
              <ChatDots size={24} weight="fill" />
            </Link>
            
            <button 
              className="flex items-center justify-center text-light-text dark:text-dark-text hover:text-light-muted dark:hover:text-dark-textSecondary transition-colors"
              onClick={toggleMobileSearch}
            >
              <MagnifyingGlass size={24} weight="fill" />
            </button>
            
            <button 
              className="flex items-center justify-center text-light-text dark:text-dark-text hover:text-light-muted dark:hover:text-dark-textSecondary transition-colors relative"
              onClick={handleToggleNotifications}
            >
              <Bell size={24} weight="fill" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-dark-error text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {profile && (
              <Link to={`/profile/${profile.id}`} className="flex items-center justify-center text-light-text dark:text-dark-text hover:text-light-muted dark:hover:text-dark-textSecondary transition-colors">
                <img
                  src={profile.avatar_url || 'https://via.placeholder.com/150'}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-light-border dark:border-dark-border"
                />
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-0 
          backdrop-blur-xl bg-white/90 dark:bg-black/90 
          z-50 flex flex-col"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
            <div className="relative flex-1 mr-2">
              <MagnifyingGlass size={20} weight="bold" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-3 rounded-lg
                  bg-light-secondary dark:bg-dark-tertiary 
                  text-light-text dark:text-dark-text
                  border border-light-border dark:border-dark-border
                  focus:ring-2 focus:ring-dark-accent focus:outline-none 
                  placeholder-light-muted dark:placeholder-dark-textSecondary
                  transition-all duration-200"
                autoFocus
              />
            </div>
            <button 
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" 
              onClick={toggleMobileSearch}
              aria-label="Close search"
            >
              <X size={24} weight="bold" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <Link 
                  to={`/profile/${user.id}`} 
                  key={user.id} 
                  className="flex items-center p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
                  onClick={toggleMobileSearch}
                >
                  <img
                    src={user.avatar_url || 'https://via.placeholder.com/150'}
                    alt={user.username}
                    className="w-10 h-10 rounded-full mr-4 object-cover"
                  />
                  <span className="text-gray-800 dark:text-gray-200 text-base">{user.username}</span>
                </Link>
              ))
            ) : searchQuery ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No results found</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try a different search term</p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Search for users by username</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Start typing to see results</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Notifications Modal */}
      {showNotifications && (
        <div className="md:hidden fixed inset-0 
          backdrop-blur-xl bg-white/90 dark:bg-black/90 
          z-50 flex flex-col"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium">Notifications</h3>
            <button 
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" 
              onClick={handleToggleNotifications}
              aria-label="Close notifications"
            >
              <X size={24} weight="bold" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 ${notification.is_read ? '' : 'bg-gray-50 dark:bg-gray-700'} active:bg-gray-100 dark:active:bg-gray-600`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <p className="text-sm mb-1">{notification.message}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(notification.created_at).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Bell className="text-gray-300 dark:text-gray-600 h-10 w-10 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No notifications</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;