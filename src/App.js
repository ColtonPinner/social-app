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
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <AppContent user={user} setUser={setUser} />
    </Router>
  );
};

const AppContent = ({ user, setUser }) => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className="container">
        <Routes>
          <Route path="/" element={!user ? <Navigate to="/login" /> : <Navigate to="/tweets" />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<SignUp setUser={setUser} />} />
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