import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'auto-refresh-settings';
const defaultSettings = {
  enabled: true,
  interval: 30000,
  feedEnabled: true,
  profileEnabled: true,
  notificationsEnabled: true
};

const AutoRefreshContext = createContext({
  settings: defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {}
});

export const AutoRefreshProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setSettings((prev) => ({ ...prev, ...JSON.parse(raw) }));
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load auto refresh settings', error);
      }
    };
    hydrate();
  }, []);

  const persist = async (updated) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save auto refresh settings', error);
    }
  };

  const updateSettings = (partial) => {
    setSettings((prev) => {
      const merged = { ...prev, ...partial };
      persist(merged);
      return merged;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    persist(defaultSettings);
  };

  const value = useMemo(() => ({ settings, updateSettings, resetSettings }), [settings]);

  return (
    <AutoRefreshContext.Provider value={value}>
      {children}
    </AutoRefreshContext.Provider>
  );
};

export const useAutoRefreshSettings = () => useContext(AutoRefreshContext);
