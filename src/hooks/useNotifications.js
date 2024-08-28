import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch notifications when the component using this hook mounts
    const fetchNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          setNotifications(data);
        }
      } catch (err) {
        setError('Error fetching notifications');
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up a listener for notification changes (if desired)
    const subscription = supabase
      .from(`notifications:user_id=eq.${supabase.auth.user()?.id}`)
      .on('*', payload => {
        console.log('Change received!', payload);
        fetchNotifications(); // Refetch notifications on change
      })
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeSubscription(subscription);
    };
  }, []);

  // Function to mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update state to reflect the notification as read
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      setError('Error marking notification as read');
      console.error('Error marking notification as read:', err);
    }
  };

  return { notifications, loading, error, markAsRead };
};

export default useNotifications;