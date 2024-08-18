import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Login from './components/Login';
import SignUp from './components/Signup';
import Post from './components/Post';
import Feed from './components/Feed';
import Settings from './components/Settings';
import Messages from './components/Messages'; // Import the Messages component
import Profile from './components/Profile'; // Import the Profile component
import { supabase } from './supabaseClient';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const getUser = async () => {
      // Check if there is a session stored in local storage
      const storedSession = localStorage.getItem('supabase-session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        setUser(session.user);
        // Set the Supabase session manually
        await supabase.auth.setSession(session);
      } else {
        // Otherwise, get the session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          localStorage.setItem('supabase-session', JSON.stringify(session));
        }
      }
      setLoading(false);
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
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Render a loading state until the user is determined
  if (loading) {
    return <div>Loading...</div>; // Add a loading spinner or similar
  }

  return (
    <Router>
      <AppContent user={user} setUser={setUser} toggleTheme={toggleTheme} />
    </Router>
  );
};

const AppContent = ({ user, setUser, toggleTheme }) => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      {!hideNavbar && <Navbar toggleTheme={toggleTheme} />}
      <div className="container">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/tweets" /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/tweets" /> : <Login setUser={setUser} />} />
          <Route path="/signup" element={user ? <Navigate to="/tweets" /> : <SignUp setUser={setUser} />} />
          <Route path="/tweets" element={user ? <HomePage user={user} /> : <Navigate to="/login" />} />
          <Route path="/messages" element={user ? <Messages user={user} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </>
  );
};

const HomePage = ({ user }) => {
  const [tweets, setTweets] = useState([]);

  const addTweet = (tweet) => {
    setTweets([tweet, ...tweets]);
  };

  return (
    <div className="container">
      <div className="main">
        <Post user={user} addTweet={addTweet} />
        <div className="feed-container">
          <Feed />
        </div>
      </div>
    </div>
  );
};

export default App;