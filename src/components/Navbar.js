import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faBell, 
  faSearch,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { Transition } from '@headlessui/react';

const Navbar = ({ profile, toggleTheme }) => {
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

    // Close notifications and search when clicking outside
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
    
    // Close search and notifications when changing routes
    setShowNotifications(false);
    setShowSearchResults(false);
    setShowMobileSearch(false);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profile, location.pathname]);

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
      {/* Desktop Navbar - Island Style with compact icons */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <nav className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 flex items-center h-14 px-6 mx-auto max-w-5xl">
          <div className="flex items-center space-x-2">
            <Link to="/tweets" className="text-gray-700 dark:text-gray-200 text-xl hover:text-black dark:hover:text-white transition-colors">
              <FontAwesomeIcon icon={faHome} />
            </Link>
            
            <div className="relative" ref={notificationRef}>
              <button 
                className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative transition-colors"
                onClick={handleToggleNotifications}
                aria-label="Notifications"
              >
                <FontAwesomeIcon icon={faBell} className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute top-12 -right-32 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700">
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
            
            {profile && (
              <Link to="/settings" className="hover:opacity-80 transition-opacity border-2 border-green-500 rounded-full">
                <img
                  src={profile.avatar_url || 'https://via.placeholder.com/150'}
                  alt="Settings"
                  className="w-8 h-8 rounded-full object-cover"
                />
              </Link>
            )}
          </div>

          <div className="ml-auto relative" ref={searchResultsRef}>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-52 h-10 pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400" // Adjusted padding for height
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
                <div className="absolute top-12 left-0 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                  {searchResults.map((user) => (
                    <Link 
                      to={`/profile/${user.id}`} 
                      key={user.id} 
                      className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <img
                        src={user.avatar_url || 'https://via.placeholder.com/150'}
                        alt={user.username}
                        className="w-8 h-8 rounded-full mr-3 object-cover"
                      />
                      <span className="text-gray-800 dark:text-gray-200">{user.username}</span>
                    </Link>
                  ))}
                </div>
              </Transition>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Navbar - Island Style with reduced radius */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-2xl  border border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 px-2 mx-auto max-w-md pointer-events-auto">
          <Link to="/tweets" className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-200 px-2 py-1 hover:text-black dark:hover:text-white transition-colors active:scale-95">
            <FontAwesomeIcon icon={faHome} className="text-xl mb-1" />
            <span className="text-[10px]"></span>
          </Link>
          
          <button 
            className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-200 px-2 py-1 hover:text-black dark:hover:text-white transition-colors active:scale-95"
            onClick={toggleMobileSearch}
          >
            <FontAwesomeIcon icon={faSearch} className="text-xl mb-1" />
            <span className="text-[10px]"></span>
          </button>
          
          <button 
            className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-200 px-2 py-1 relative hover:text-black dark:hover:text-white transition-colors active:scale-95"
            onClick={handleToggleNotifications}
          >
            <FontAwesomeIcon icon={faBell} className="text-xl mb-1" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            <span className="text-[10px]"></span>
          </button>
          
          {profile && (
            <Link to={`/profile/${profile.id}`} className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-200 px-2 py-1 hover:text-black dark:hover:text-white transition-colors active:scale-95">
              <img
                src={profile.avatar_url || 'https://via.placeholder.com/150'}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-green-500"
              />
              <span className="text-[10px]"></span>
            </Link>
          )}
          
        </div>
      </nav>

      {/* Mobile Search Overlay - Enhanced */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-0 bg-white dark:bg-gray-800 z-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
            <div className="relative flex-1 mr-2">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400" // Adjusted padding for height
                autoFocus
              />
            </div>
            <button 
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" 
              onClick={toggleMobileSearch}
              aria-label="Close search"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
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

      {/* Mobile Notifications - Enhanced */}
      {showNotifications && (
        <div className="md:hidden fixed inset-0 bg-white dark:bg-gray-800 z-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium">Notifications</h3>
            <button 
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" 
              onClick={handleToggleNotifications}
              aria-label="Close notifications"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
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
                <FontAwesomeIcon icon={faBell} className="text-gray-300 dark:text-gray-600 text-4xl mb-3" />
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