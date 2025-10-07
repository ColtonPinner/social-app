# Auto-Refresh System Documentation

## Overview

The auto-refresh system provides automatic content updating across the entire social app. It includes a centralized configuration system, smart pause/resume functionality, and comprehensive error handling.

## Features

- ✅ **Global Configuration**: Centralized settings that apply across all components
- ✅ **Component-Specific Controls**: Enable/disable auto-refresh per component type
- ✅ **Smart Pausing**: Automatically pause when tab is hidden or device is offline
- ✅ **Error Handling**: Retry logic with exponential backoff
- ✅ **Manual Refresh**: User-controlled refresh with visual feedback
- ✅ **Performance Optimized**: Cleanup on unmount, memory leak prevention

## Components Enhanced

### 1. Feed Component (`src/components/Feed.js`)
- Auto-refreshes posts every 30 seconds (configurable)
- Shows refresh status and last update time
- Manual refresh button with loading state
- Error handling with retry functionality

### 2. Messages Component (`src/components/Messages.js`)
- Auto-refreshes messages to keep conversations current
- Integrated status indicator
- Configurable refresh intervals

### 3. ProfilePage Component (`src/components/ProfilePage.js`)
- Auto-refreshes profile data, posts, and follow information
- Only refreshes when viewing profile (not when editing)
- Combined refresh for all profile-related data

### 4. Settings Component (`src/components/Settings.js`)
- Complete auto-refresh configuration interface
- Global and component-specific toggles
- Interval selection (10s, 30s, 1m, 2m, 5m)
- Behavior settings (pause on visibility/offline)
- Reset to defaults option

## Auto-Refresh Hook (`src/hooks/useAutoRefresh.js`)

### Basic Usage

```javascript
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const MyComponent = () => {
  const fetchData = useCallback(async () => {
    // Your data fetching logic
    const response = await api.getData();
    setData(response.data);
  }, []);

  const {
    isRefreshing,
    lastRefresh,
    error,
    manualRefresh
  } = useAutoRefresh(fetchData, {
    interval: 30000,  // 30 seconds
    enabled: true,
    pauseOnVisibilityChange: true,
    pauseOnOffline: true
  });

  return (
    <div>
      {isRefreshing && <div>Refreshing...</div>}
      {error && <div>Error: {error}</div>}
      <button onClick={manualRefresh}>Refresh Now</button>
    </div>
  );
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `interval` | number | 30000 | Refresh interval in milliseconds |
| `enabled` | boolean | true | Whether auto-refresh is enabled |
| `pauseOnVisibilityChange` | boolean | true | Pause when tab is not visible |
| `pauseOnOffline` | boolean | true | Pause when device is offline |
| `maxRetries` | number | 3 | Maximum retry attempts on error |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isRefreshing` | boolean | Whether a refresh is currently in progress |
| `lastRefresh` | Date | Timestamp of last successful refresh |
| `error` | string | Last error message |
| `retryCount` | number | Current number of retry attempts |
| `manualRefresh` | function | Trigger manual refresh |
| `startAutoRefresh` | function | Start auto-refresh interval |
| `stopAutoRefresh` | function | Stop auto-refresh interval |

## Global Settings Hook

### Usage

```javascript
import { useGlobalAutoRefreshSettings } from '../hooks/useAutoRefresh';

const SettingsComponent = () => {
  const { settings, updateSettings, resetSettings } = useGlobalAutoRefreshSettings();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => updateSettings({ enabled: e.target.checked })}
        />
        Enable Auto-Refresh
      </label>
    </div>
  );
};
```

### Global Settings Structure

```javascript
{
  enabled: true,                    // Global auto-refresh toggle
  interval: 30000,                 // Default interval (30 seconds)
  pauseOnVisibilityChange: true,   // Pause when tab hidden
  pauseOnOffline: true,            // Pause when offline
  feedEnabled: true,               // Enable for Feed component
  messagesEnabled: true,           // Enable for Messages component
  profileEnabled: true,            // Enable for Profile components
  notificationsEnabled: true       // Enable for Notifications (future)
}
```

## Integration with Global Settings

Components automatically respect global settings when configured properly:

```javascript
const { settings } = useGlobalAutoRefreshSettings();

const autoRefreshConfig = {
  interval: settings.interval,
  enabled: settings.enabled && settings.feedEnabled, // Component-specific
  pauseOnVisibilityChange: settings.pauseOnVisibilityChange,
  pauseOnOffline: settings.pauseOnOffline
};

const { isRefreshing, manualRefresh } = useAutoRefresh(fetchData, autoRefreshConfig);
```

## Best Practices

### 1. Error Handling
Always handle errors in your fetch function and re-throw them for the hook to manage retries:

```javascript
const fetchData = useCallback(async () => {
  try {
    setError(null);
    const response = await api.getData();
    setData(response.data);
  } catch (err) {
    console.error('Fetch error:', err);
    setError(err.message);
    throw err; // Important: re-throw for auto-refresh error handling
  }
}, []);
```

### 2. Dependencies
Always use `useCallback` for fetch functions to prevent unnecessary re-renders:

```javascript
const fetchData = useCallback(async () => {
  // fetch logic
}, [dependency1, dependency2]);
```

### 3. Cleanup
The hook automatically handles cleanup, but ensure your components don't perform state updates after unmounting.

### 4. Performance
- Use reasonable refresh intervals (minimum 10 seconds recommended)
- Consider the user's data usage and battery life
- Pause refreshing when appropriate (tab hidden, offline)

## Testing

A test component is available at `src/components/AutoRefreshTest.js` that provides:
- Real-time status monitoring
- Manual controls for testing
- Error simulation
- Settings integration testing

To use the test component, temporarily add it to your app:

```javascript
import AutoRefreshTest from './components/AutoRefreshTest';

// Add to your route or component
<AutoRefreshTest />
```

## Troubleshooting

### Common Issues

1. **Auto-refresh not working**
   - Check if global auto-refresh is enabled in settings
   - Verify component-specific setting is enabled
   - Check browser console for errors

2. **Too frequent refreshes**
   - Adjust the interval in settings
   - Check if multiple auto-refresh hooks are running simultaneously

3. **Memory leaks**
   - Ensure fetch functions use `useCallback`
   - Check that components properly unmount

4. **Performance issues**
   - Increase refresh intervals
   - Enable pause on visibility change
   - Monitor network requests in browser dev tools

### Debug Information

The hook provides debug information that can be logged:

```javascript
const refreshState = useAutoRefresh(fetchData, config);
console.log('Auto-refresh state:', {
  isRefreshing: refreshState.isRefreshing,
  lastRefresh: refreshState.lastRefresh,
  error: refreshState.error,
  retryCount: refreshState.retryCount,
  isEnabled: refreshState.isEnabled,
  isVisible: refreshState.isVisible,
  isOnline: refreshState.isOnline
});
```

## Future Enhancements

- [ ] Exponential backoff for retry intervals
- [ ] Background sync when coming back online
- [ ] Push notification integration
- [ ] Analytics for refresh patterns
- [ ] Adaptive refresh intervals based on user activity