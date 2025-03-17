import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 md:py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 text-center md:text-left mb-2 md:mb-0">
          © {new Date().getFullYear()} basic. All rights reserved.
        </div>
        <div className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-6">
          <Link to="/privacy" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            Privacy
          </Link>
          <Link to="/terms" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            Terms
          </Link>
          <a href="mailto:support@socialapp.com" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;