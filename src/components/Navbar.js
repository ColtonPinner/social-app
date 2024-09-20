import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faGear, faBell, faSearch } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient'; // Adjust import path as needed
import './Navbar.css';

const Navbar = ({ profile }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [searchResults, setSearchResults] = useState([]); // State for search results
  const [showSearchResults, setShowSearchResults] = useState(false); // Toggle search results display

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
        (payload) => {
          console.log('Change received!', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
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
      setUnreadCount((prev) => prev - 1);
    }
  };

  // Function to handle search input
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    if (event.target.value.trim() === '') {
      setShowSearchResults(false);
      setSearchResults([]);
    } else {
      fetchSearchResults(event.target.value);
    }
  };

  // Function to fetch users based on search input
  const fetchSearchResults = async (query) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`) // Case-insensitive search
      .limit(5); // Limit results to top 5

    if (error) {
      console.error('Error fetching search results:', error);
    } else {
      setSearchResults(data);
      setShowSearchResults(true);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-section">
        <Link to="/tweets">
          <FontAwesomeIcon icon={faHome} />
        </Link>
        {profile && (
          <Link to={`/profile/${profile.id}`}>
            <img
              src={profile.avatar_url || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="profile-link"
            />
          </Link>
        )}
      </div>

      {/* Center Bell Section */}
      <div className="nav-center">
        <FontAwesomeIcon
          icon={faBell}
          className="notification-bell"
          onClick={handleToggleNotifications}
        />
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
        {showNotifications && (
          <div className="notification-box">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.is_read ? '' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <p>{notification.message}</p>
                  <span>{new Date(notification.created_at).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p>No notifications.</p>
            )}
          </div>
        )}
      </div>

      <div className="nav-section">
        <Link to="/settings">
          <FontAwesomeIcon icon={faGear} />
        </Link>
      </div>

      {/* Search Bar Section moved to the right */}
      <div className="nav-section search-section">
        <div className="search-input-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search or Ask basic..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((user) => (
              <Link to={`/profile/${user.id}`} key={user.id} className="search-result-item">
                <img
                  src={user.avatar_url || 'https://via.placeholder.com/150'}
                  alt={user.username}
                  className="search-result-avatar"
                />
                <span>{user.username}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;