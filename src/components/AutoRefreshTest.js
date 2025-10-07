import React, { useState } from 'react';
import { useAutoRefresh, useGlobalAutoRefreshSettings } from '../hooks/useAutoRefresh';
import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Test component to verify auto-refresh functionality
 * This component can be temporarily added to test the auto-refresh system
 */
const AutoRefreshTest = () => {
  const [testData, setTestData] = useState([]);
  const [fetchCount, setFetchCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [simulateError, setSimulateError] = useState(false);

  const { settings, updateSettings } = useGlobalAutoRefreshSettings();

  // Mock data fetch function
  const mockFetchData = async () => {
    setFetchCount(prev => prev + 1);
    setLastFetchTime(new Date());

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (simulateError) {
      throw new Error('Simulated fetch error for testing');
    }

    // Generate mock data
    const newData = Array.from({ length: 3 }, (_, index) => ({
      id: Date.now() + index,
      title: `Test Item ${Date.now() + index}`,
      timestamp: new Date().toLocaleTimeString()
    }));

    setTestData(newData);
  };

  // Set up auto-refresh with test settings
  const {
    isRefreshing,
    lastRefresh,
    error,
    manualRefresh,
    retryCount,
    isEnabled,
    isVisible,
    isOnline
  } = useAutoRefresh(mockFetchData, {
    interval: 10000, // 10 seconds for testing
    enabled: true,
    pauseOnVisibilityChange: true,
    pauseOnOffline: true
  });

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Auto-Refresh Test Component
      </h2>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="font-semibold text-gray-900 dark:text-white">Status</div>
          <div className={`text-sm ${isRefreshing ? 'text-blue-600' : 'text-green-600'}`}>
            {isRefreshing ? 'Refreshing...' : 'Ready'}
          </div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="font-semibold text-gray-900 dark:text-white">Fetch Count</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{fetchCount}</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="font-semibold text-gray-900 dark:text-white">Visible</div>
          <div className={`text-sm ${isVisible ? 'text-green-600' : 'text-yellow-600'}`}>
            {isVisible ? 'Yes' : 'No'}
          </div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="font-semibold text-gray-900 dark:text-white">Online</div>
          <div className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={manualRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Manual Refresh
        </button>

        <button
          onClick={() => setSimulateError(!simulateError)}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            simulateError 
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
              : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
          }`}
        >
          {simulateError ? 'Disable Error' : 'Simulate Error'}
        </button>

        <button
          onClick={() => updateSettings({ enabled: !settings.enabled })}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            settings.enabled 
              ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
              : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
          }`}
        >
          {settings.enabled ? 'Disable Auto-Refresh' : 'Enable Auto-Refresh'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</div>
              {retryCount > 0 && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Retry attempts: {retryCount}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last Refresh Info */}
      {lastRefresh && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Last Auto-Refresh
              </h3>
              <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Data Display */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Test Data</h3>
          {lastFetchTime && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Last fetch: {lastFetchTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="px-4 py-3">
          {testData.length > 0 ? (
            <ul className="space-y-2">
              {testData.map(item => (
                <li key={item.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-900 dark:text-white">{item.title}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.timestamp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 text-center py-4">
              No data loaded yet. Auto-refresh will load data automatically.
            </p>
          )}
        </div>
      </div>

      {/* Settings Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          Current Global Settings
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <div>Auto-refresh enabled: {settings.enabled ? 'Yes' : 'No'}</div>
          <div>Interval: {settings.interval / 1000} seconds</div>
          <div>Pause on visibility change: {settings.pauseOnVisibilityChange ? 'Yes' : 'No'}</div>
          <div>Pause when offline: {settings.pauseOnOffline ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
};

export default AutoRefreshTest;