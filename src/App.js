import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          // Store session data in local storage to keep the user signed in
          localStorage.setItem('supabase-session', JSON.stringify(session));
        } else {
          // If no session is found, check local storage for existing session
          const storedSession = localStorage.getItem('supabase-session');
          if (storedSession) {
            const parsedSession = JSON.parse(storedSession);
            setUser(parsedSession.user);
          }
        }
      } catch (error) {
        console.error("Error getting user session: ", error);
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        localStorage.setItem('supabase-session', JSON.stringify(session));
      } else {
        setUser(null);
        localStorage.removeItem('supabase-session');
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  return (
    <div>
      {user ? <p>Welcome, {user.email}</p> : <p>Please log in</p>}
    </div>
  );
};

export default App;