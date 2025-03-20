import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import SignUp from './components/Signup';
import Post from './components/Post';
import Feed from './components/Feed';
import Settings from './components/Settings';
import Messages from './components/Messages';
import Profile from './components/Profile';
import { supabase } from './supabaseClient';
import { Analytics } from "@vercel/analytics/react"
import Footer from './components/Footer';
import useSystemTheme from './hooks/useSystemTheme';

const App = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const systemTheme = useSystemTheme();
  const [theme, setTheme] = useState(() => {
    // Check for saved preference first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Otherwise use system theme
    return systemTheme;
  });

  // Update theme when system preference changes
  useEffect(() => {
    // Only update if user hasn't manually set a preference
    if (!localStorage.getItem('theme')) {
      setTheme(systemTheme);
    }
  }, [systemTheme]);

  // Apply theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Save manual preference
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const getUser = async () => {
      const storedSession = localStorage.getItem('supabase-session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        setUser(session.user);
        await supabase.auth.setSession(session);
        fetchUserProfile(session.user.id);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          localStorage.setItem('supabase-session', JSON.stringify(session));
          fetchUserProfile(session.user.id);
        }
      }
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        localStorage.setItem('supabase-session', JSON.stringify(session));
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('supabase-session');
      }
    });

    const refreshInterval = setInterval(() => {
      getUser();
    }, 60000); // Refresh session every 60 seconds

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Router>
      <AppContent user={user} profile={profile} setUser={setUser} toggleTheme={toggleTheme} />
    </Router>
  );
};

const AppContent = ({ user, profile, setUser, toggleTheme }) => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';
  const hideFooter = hideNavbar;

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      {!hideNavbar && <Navbar profile={profile} toggleTheme={toggleTheme} />}
      <div className="container mx-auto px-4 pb-16 text-light-text dark:text-dark-text">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/tweets" /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/tweets" /> : <Login setUser={setUser} />} />
          <Route path="/signup" element={user ? <Navigate to="/tweets" /> : <SignUp setUser={setUser} />} />
          <Route path="/tweets" element={user ? <HomePage user={user} /> : <Navigate to="/login" />} />
          <Route path="/messages" element={user ? <Messages user={user} /> : <Navigate to="/login" />} />
          <Route path="/profile/:id" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
      {!hideFooter && (
        <Footer className="bg-light-secondary dark:bg-dark-secondary border-t border-light-accent dark:border-dark-border" />
      )}
      <Analytics />
    </div>
  );
};

const HomePage = ({ user }) => {
  const [tweets, setTweets] = useState([]);

  const addTweet = (tweet) => {
    setTweets([tweet, ...tweets]);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="main flex flex-col items-center">
        <Post user={user} addTweet={addTweet} />
        <div className="feed-container w-full max-w-5xl">
          <Feed />
        </div>
      </div>
    </div>
  );
};

export default App;