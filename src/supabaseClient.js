// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebahbzhyyhjvtevcxsns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYWhiemh5eWhqdnRldmN4c25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAwMjEyNDYsImV4cCI6MjAzNTU5NzI0Nn0.pY-bUSz4d2iLBSjS44YhkwjrZz8Cp1YltpvYGVtVOLc';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});