import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Import the CSS for styling

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <Link to="/">MyApp</Link>
      </div>
      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/services">Services</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </header>
  );
};

export default Header;