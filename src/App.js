import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
      setUser(session ? session.user.email : null);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? session.user.email : null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={!user ? <Navigate to="/login" /> : <Navigate to="/tweets" />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<SignUp setUser={setUser} />} />
          <Route path="/tweets" element={user ? <Tweets user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

const Tweets = ({ user }) => {
  const [tweets, setTweets] = useState([]);

  const addTweet = (tweet) => {
    setTweets([tweet, ...tweets]);
  };

  return (
    <div>
      <Post addTweet={addTweet} />
      <Feed tweets={tweets} />
    </div>
  );
};

export default App;