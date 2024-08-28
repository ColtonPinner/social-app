import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faMessage, faGear, faBell } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient'; // Adjust import path as needed
import './Navbar.css';

const Navbar = ({ profile }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
        setUnreadCount(data.filter(notification => !notification.is_read).length);
      }
    };

    fetchNotifications();

    // Correct Realtime Subscription Setup
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
          fetchNotifications(); // Refetch notifications when a change is detected
        }
      )
      .subscribe();

    // Clean up the subscription on component unmount
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

  return (
    <nav className="navbar">
      <Link to="/tweets">
        <FontAwesomeIcon icon={faHome} />
      </Link>
      <Link to="/profile">
        {profile ? (
          <img
            src={profile.avatar_url || 'https://via.placeholder.com/150'}
            alt="Profile"
            className="profile-link"
          />
        ) : (
          <img
            src="https://via.placeholder.com/150"
            alt="Profile"
            className="profile-link"
          />
        )}
      </Link>
      <Link to="/messages">
        <FontAwesomeIcon icon={faMessage} />
      </Link>
      <div className="notification-container">
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
      <Link to="/settings">
        <FontAwesomeIcon icon={faGear} />
      </Link>
    </nav>
  );
};

export default Navbar;