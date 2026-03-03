import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import SignUp from './components/Signup';
import Post from './components/Post';
import Feed from './components/Feed';
import Settings from './components/Settings';
import Messages from './components/Messages';
import ProfilePage from './components/ProfilePage';
import { Analytics } from "@vercel/analytics/react"
import Footer from './components/Footer';
import { getAuthToken, setAuthToken } from './lib/apiClient';
import { useCurrentUserQuery } from './hooks/useBackendAuth';

const App = () => {
  const token = getAuthToken();
  const { data: user, isLoading: loading } = useCurrentUserQuery();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Router>
      <AppContent
        user={user || null}
        profile={user}
        hasToken={Boolean(token)}
        setUser={(nextUser) => {
          if (!nextUser) {
            setAuthToken(null);
          }
        }}
      />
    </Router>
  );
};

const AppContent = ({ user, profile, hasToken, setUser }) => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';
  const hideFooter = hideNavbar;
  const isAuthenticated = Boolean(hasToken && user);

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      {!hideNavbar && <Navbar profile={profile} />}
      <div className="container mx-auto px-4 pb-16 text-light-text dark:text-dark-text">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/tweets" /> : <Navigate to="/login" />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/tweets" /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/tweets" /> : <SignUp />} />
          <Route path="/tweets" element={isAuthenticated ? <HomePage user={user} /> : <Navigate to="/login" />} />
          <Route path="/messages" element={isAuthenticated ? <Messages user={user} /> : <Navigate to="/login" />} />
          <Route path="/profile/:id" element={isAuthenticated ? <ProfilePage currentUser={user} setUser={setUser} /> : <Navigate to="/login" />} />
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
  const [feedRefreshTrigger, setFeedRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setFeedRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="main flex flex-col items-center">
        <Post user={user} onPostCreated={handlePostCreated} />
        <div className="feed-container w-full max-w-5xl">
          <Feed user={user} refreshTrigger={feedRefreshTrigger} />
        </div>
      </div>
    </div>
  );
};

export default App;