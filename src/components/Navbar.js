import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faMessage, faGear } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css'

const Navbar = ({ profile }) => {
  return (
    <nav>
      <Link to="/tweets">
        <FontAwesomeIcon icon={faHome} />
      </Link>
      <Link to="/profile">
        {profile ? (
          <button
            src={profile.avatar_url || ''}
            alt="Profile"
            className="profile-link"
          />
        ) : (
          <button
            src=""
            alt="Profile"
            className="profile-link"
          />
        )}
      </Link>
      <Link to="/messages">
        <FontAwesomeIcon icon={faMessage} />
      </Link>
      <Link to="/settings">
        <FontAwesomeIcon icon={faGear} />
      </Link>
    </nav>
  );
};

export default Navbar;