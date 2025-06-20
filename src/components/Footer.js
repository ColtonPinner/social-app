import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 
      bg-light-primary dark:bg-dark-primary 
      border-t border-light-border dark:border-dark-border 
      py-3 md:py-4 px-4 md:px-6
      backdrop-blur-lg bg-opacity-80 dark:bg-opacity-80"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-xs md:text-sm 
          text-light-muted dark:text-dark-textSecondary 
          text-center md:text-left mb-2 md:mb-0"
        >
          © {new Date().getFullYear()} basic. All rights reserved.
        </div>
         <div className="text-xs md:text-sm 
          text-light-muted dark:text-dark-textSecondary 
          text-center md:text-left mb-2 md:mb-0"
        >
          Made with ❤️ by the basic team in Florida
        </div>

        <div className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-6">
          <Link 
            to="/privacy" 
            className="text-xs md:text-sm 
              text-light-muted dark:text-dark-textSecondary
              hover:text-light-text dark:hover:text-dark-text 
              transition-colors duration-200"
          >
            Privacy
          </Link>
          <Link 
            to="/terms" 
            className="text-xs md:text-sm 
              text-light-muted dark:text-dark-textSecondary
              hover:text-light-text dark:hover:text-dark-text 
              transition-colors duration-200"
          >
            Terms
          </Link>
          <a 
            href="mailto:support@socialapp.com" 
            className="text-xs md:text-sm 
              text-light-muted dark:text-dark-textSecondary
              hover:text-light-text dark:hover:text-dark-text 
              transition-colors duration-200"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;