import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://auvzvptdakgqlinbzuqp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dnp2cHRkYWtncWxpbmJ6dXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMzk3MDAsImV4cCI6MjA1MTYxNTcwMH0.lXtvE3Lsimf96xzfCzgYYCQ0gzI3yFXdMBk7m6VVO_4';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage, // Explicitly use localStorage for session persistence
  },
});