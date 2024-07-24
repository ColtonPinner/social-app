import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Login from './components/Login';
import SignUp from './components/Signup';
import Post from './components/Post';
import Feed from './components/Feed';
import { supabase } from './supabaseClient';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session ? session.user : null);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? session.user : null);
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