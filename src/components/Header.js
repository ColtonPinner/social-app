import React from 'react';
import { Link } from 'react-router-dom';
import { 
  House, 
  Info, 
  Gear, 
  EnvelopeSimple,
  Laptop
} from '@phosphor-icons/react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <Laptop size={24} weight="bold" />
          <span className="ml-2">MyApp</span>
        </Link>
      </div>
      <nav className="nav-links">
        <Link to="/" className="flex items-center space-x-2">
          <House size={20} />
          <span>Home</span>
        </Link>
        <Link to="/about" className="flex items-center space-x-2">
          <Info size={20} />
          <span>About</span>
        </Link>
        <Link to="/services" className="flex items-center space-x-2">
          <Gear size={20} />
          <span>Services</span>
        </Link>
        <Link to="/contact" className="flex items-center space-x-2">
          <EnvelopeSimple size={20} />
          <span>Contact</span>
        </Link>
      </nav>
    </header>
  );
};

export default Header;