import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Custom hook for implementing auto-refresh functionality across the app
 * @param {Function} refreshCallback - Function to call on each refresh
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Refresh interval in milliseconds (default: 30000)
 * @param {boolean} options.enabled - Whether auto-refresh is enabled (default: true)
 * @param {boolean} options.pauseOnVisibilityChange - Pause when tab is not visible (default: true)
 * @param {boolean} options.pauseOnOffline - Pause when offline (default: true)
 * @param {number} options.maxRetries - Maximum retry attempts on failure (default: 3)
 * @returns {Object} - Auto-refresh controls and state
 */
export const useAutoRefresh = (refreshCallback, options = {}) => {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    pauseOnVisibilityChange = true,
    pauseOnOffline = true,
    maxRetries = 3
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);
  
  const intervalRef = useRef(null);
  const isVisibleRef = useRef(true);
  const isOnlineRef = useRef(navigator.onLine);
  const mountedRef = useRef(true);

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    if (!mountedRef.current || isRefreshing) return;

    try {
      setIsRefreshing(true);
      setError(null);
      await refreshCallback();
      setLastRefresh(new Date());
      setRetryCount(0);
    } catch (err) {
      console.error('Auto-refresh error:', err);
      setError(err.message);
      setRetryCount(prev => prev + 1);
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [refreshCallback, isRefreshing]);

  // Auto refresh function with retry logic
  const autoRefresh = useCallback(async () => {
    if (!mountedRef.current || !enabled || isRefreshing) return;
    
    // Check if we should pause
    if (pauseOnVisibilityChange && !isVisibleRef.current) return;
    if (pauseOnOffline && !isOnlineRef.current) return;
    if (retryCount >= maxRetries) return;

    await manualRefresh();
  }, [enabled, pauseOnVisibilityChange, pauseOnOffline, retryCount, maxRetries, manualRefresh]);

  // Start auto-refresh interval
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(autoRefresh, interval);
    }
  }, [autoRefresh, enabled, interval]);

  // Stop auto-refresh interval
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    isVisibleRef.current = !document.hidden;
    
    if (pauseOnVisibilityChange) {
      if (isVisibleRef.current) {
        startAutoRefresh();
        // Refresh immediately when tab becomes visible again
        setTimeout(autoRefresh, 100);
      } else {
        stopAutoRefresh();
      }
    }
  }, [pauseOnVisibilityChange, startAutoRefresh, stopAutoRefresh, autoRefresh]);

  // Handle online/offline status
  const handleOnlineStatusChange = useCallback(() => {
    isOnlineRef.current = navigator.onLine;
    
    if (pauseOnOffline) {
      if (isOnlineRef.current) {
        startAutoRefresh();
        // Refresh immediately when coming back online
        setTimeout(autoRefresh, 100);
      } else {
        stopAutoRefresh();
      }
    }
  }, [pauseOnOffline, startAutoRefresh, stopAutoRefresh, autoRefresh]);

  // Reset retry count when options change
  useEffect(() => {
    setRetryCount(0);
    setError(null);
  }, [enabled, interval]);

  // Set up auto-refresh
  useEffect(() => {
    if (enabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return stopAutoRefresh;
  }, [enabled, startAutoRefresh, stopAutoRefresh]);

  // Set up event listeners
  useEffect(() => {
    if (pauseOnVisibilityChange) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    if (pauseOnOffline) {
      window.addEventListener('online', handleOnlineStatusChange);
      window.addEventListener('offline', handleOnlineStatusChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [pauseOnVisibilityChange, pauseOnOffline, handleVisibilityChange, handleOnlineStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  return {
    // State
    isRefreshing,
    lastRefresh,
    error,
    retryCount,
    isEnabled: enabled,
    isVisible: isVisibleRef.current,
    isOnline: isOnlineRef.current,
    
    // Controls
    manualRefresh,
    startAutoRefresh,
    stopAutoRefresh,
    
    // Configuration
    interval,
    maxRetries
  };
};

/**
 * Hook for global auto-refresh settings that can be used across components
 */
export const useGlobalAutoRefreshSettings = () => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('autoRefreshSettings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      interval: 30000, // 30 seconds
      pauseOnVisibilityChange: true,
      pauseOnOffline: true,
      feedEnabled: true,
      messagesEnabled: true,
      profileEnabled: true,
      notificationsEnabled: true
    };
  });

  const updateSettings = useCallback((newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('autoRefreshSettings', JSON.stringify(updated));
  }, [settings]);

  const resetSettings = useCallback(() => {
    const defaultSettings = {
      enabled: true,
      interval: 30000,
      pauseOnVisibilityChange: true,
      pauseOnOffline: true,
      feedEnabled: true,
      messagesEnabled: true,
      profileEnabled: true,
      notificationsEnabled: true
    };
    setSettings(defaultSettings);
    localStorage.setItem('autoRefreshSettings', JSON.stringify(defaultSettings));
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings
  };
};

export default useAutoRefresh;