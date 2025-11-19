import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const DEFAULT_LIMIT = 40;

const parseMetadata = (metadata) => {
  if (!metadata) return {};

  if (typeof metadata === 'object') {
    return metadata;
  }

  try {
    return JSON.parse(metadata);
  } catch (error) {
    console.warn('Failed to parse notification metadata', metadata);
    return {};
  }
};

const buildMessage = (notification, senderProfile) => {
  if (notification.message) return notification.message;
  if (notification.content) return notification.content;

  const senderName = senderProfile?.username || 'Someone';
  const metadata = parseMetadata(notification.metadata);

  switch (notification.type) {
    case 'follow':
      return `${senderName} started following you`;
    case 'like':
      return `${senderName} liked your post`;
    case 'comment': {
      const preview = metadata?.comment_preview ? `: "${metadata.comment_preview}"` : '';
      return `${senderName} commented on your post${preview}`;
    }
    case 'message': {
      const preview = metadata?.message_preview ? `: "${metadata.message_preview}"` : '';
      return `${senderName} sent you a message${preview}`;
    }
    default:
      return 'You have a new notification';
  }
};

const useNotifications = (userId, options = {}) => {
  const {
    enabled = true,
    limit = DEFAULT_LIMIT
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId || !enabled) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      const notificationsData = data || [];
      const senderIds = [...new Set(notificationsData
        .map((notification) => notification.sender_id)
        .filter(Boolean))];

      let senderProfiles = {};
      if (senderIds.length) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', senderIds);

        if (!profilesError && profilesData) {
          senderProfiles = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }

      const enrichedNotifications = notificationsData.map((notification) => {
        const senderProfile = senderProfiles[notification.sender_id];
        return {
          ...notification,
          sender: senderProfile || null,
          metadata: parseMetadata(notification.metadata),
          message: buildMessage(notification, senderProfile)
        };
      });

      setNotifications(enrichedNotifications);
      setUnreadCount(enrichedNotifications.filter((notification) => !notification.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, enabled, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId || !enabled) return undefined;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, enabled, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Error marking notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      setNotifications((prev) => prev.map((notification) => ({
        ...notification,
        is_read: true
      })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Error marking all notifications as read');
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
};

export default useNotifications;