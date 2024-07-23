import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Navbar.css'; // Import the Navbar.css file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faHome, faUser } from '@fortawesome/free-solid-svg-icons'; // Import the necessary icons

const Navbar = () => {
  const handleSignOut = async () => {
	await supabase.auth.signOut();
	window.location.reload();
  };

  return (
	<nav>
	  <Link to="/tweets">
		<FontAwesomeIcon icon={faHome} />
	  </Link>
	  <Link to="/profile">
		<FontAwesomeIcon icon={faUser} />
	  </Link>
	   {/* Replace button with Link for sign out */}
     <Link to="/" onClick={handleSignOut}>
        <FontAwesomeIcon icon={faSignOutAlt} />
      </Link>
	</nav>
  );
};

export default Navbar;

