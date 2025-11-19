import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://auvzvptdakgqlinbzuqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dnp2cHRkYWtncWxpbmJ6dXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMzk3MDAsImV4cCI6MjA1MTYxNTcwMH0.lXtvE3Lsimf96xzfCzgYYCQ0gzI3yFXdMBk7m6VVO_4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
