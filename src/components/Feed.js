import React, { useEffect } from 'react';
import Tweet from './Tweet';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAutoRefresh, useGlobalAutoRefreshSettings } from '../hooks/useAutoRefresh';
import { useQueryClient } from '@tanstack/react-query';
import { useBackendFeedQuery } from '../hooks/useBackendFeed';

const Feed = ({ refreshTrigger = 0, user = null }) => {
  const queryClient = useQueryClient();
  const {
    data: tweetsState = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useBackendFeedQuery();

  // Get global auto-refresh settings
  const { settings } = useGlobalAutoRefreshSettings();

  const fetchAllTweets = async () => {
    await queryClient.invalidateQueries({ queryKey: ['feed', 'items'] });
    await refetch();
  };

  // Set up auto-refresh with global settings
  const autoRefreshConfig = {
    interval: settings.interval,
    enabled: settings.enabled && settings.feedEnabled,
    pauseOnVisibilityChange: settings.pauseOnVisibilityChange,
    pauseOnOffline: settings.pauseOnOffline
  };

  const {
    isRefreshing: autoRefreshing,
    lastRefresh,
    error: autoRefreshError,
    manualRefresh,
    retryCount
  } = useAutoRefresh(fetchAllTweets, autoRefreshConfig);

  // Trigger a manual refresh when an external signal is received (e.g., after posting)
  useEffect(() => {
    if (refreshTrigger > 0) {
      manualRefresh();
    }
  }, [refreshTrigger, manualRefresh]);

  // Combine errors from both manual refresh and auto-refresh
  const displayError = error?.message || autoRefreshError;

  if (isLoading) {
    return (
      <div className="rounded-md bg-light-secondary/50 dark:bg-dark-secondary/50 p-3 md:p-4 mx-2 md:mx-4 my-3 md:mt-4">
        <div className="text-sm text-light-muted dark:text-dark-textSecondary">Loading posts...</div>
      </div>
    );
  }

  if (displayError && !tweetsState.length) return (
    <div className="rounded-md bg-red-50 p-3 md:p-4 mx-2 md:mx-4 my-3 md:mt-4">
      <div className="flex">
        <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
        <div className="ml-3">
          <h3 className="text-xs md:text-sm font-medium text-red-800">Error loading posts</h3>
          <div className="mt-1 md:mt-2 text-xs md:text-sm text-red-700">{displayError}</div>
          {retryCount > 0 && (
            <div className="mt-1 text-xs text-red-600">
              Failed attempts: {retryCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-none md:max-w-7xl mx-auto pt-4 pb-24 px-0 sm:px-4 md:px-8">
      {/* Auto-refresh status header */}
      <div className="mb-4 flex items-center justify-start bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg p-3">
        <div className="flex items-center space-x-3">
          <ArrowPathIcon
            className={`h-4 w-4 text-light-muted dark:text-dark-textSecondary ${(autoRefreshing || isFetching) ? 'animate-spin' : ''}`}
          />
          <span className="text-sm text-light-muted dark:text-dark-textSecondary">
            {(autoRefreshing || isFetching) ? 'Refreshing...' : 
             lastRefresh ? `Last updated: ${new Date(lastRefresh).toLocaleTimeString()}` :
             'Auto-refresh enabled'}
          </span>
        </div>
      </div>

      {/* Error banner (if posts are loaded but there's an error) */}
      {displayError && tweetsState.length > 0 && (
        <div className="mb-4 rounded-md bg-yellow-50 p-3">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Refresh Warning</h3>
              <div className="mt-1 text-sm text-yellow-700">{displayError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tweets Container */}
      <div className="rounded-none sm:rounded-xl bg-light-primary/80 dark:bg-dark-primary/80
        md:backdrop-blur-lg md:rounded-2xl"
      >
        <div className="px-0 sm:px-4">
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {tweetsState.length > 0 ? (
              tweetsState.map(tweet => (
                <Tweet 
                  key={tweet.id} 
                  tweet={tweet} 
                  currentUser={user}
                />
              ))
            ) : (
              <div className="py-6 text-center">
                <p className="text-light-muted dark:text-dark-textSecondary">
                  No posts yet. Start the conversation!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Feed;