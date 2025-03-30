/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'media', // Changed from 'class' to 'media'
  theme: {
    extend: {
      colors: {
        light: {
          primary: '#ffffff',
          secondary: '#f8fafc',
          accent: 'black',
          text: 'black',
          muted: '#64748b'
        },
        dark: {
          // Main backgrounds
          primary: '#000000',    // Pure black background
          secondary: '#1c1c1e',  // Slightly lighter for cards/sections
          tertiary: '#2c2c2e',   // Even lighter for elevated content
          
          // Interactive elements
          accent: '#0A84FF',     // iOS blue for primary actions
          accentHover: '#409CFF', // Lighter blue for hover states
          
          // Borders and dividers
          border: '#3a3a3c',     // Subtle borders
          divider: '#2c2c2e',    // List dividers
          
          // Text colors
          text: '#ffffff',       // Primary text
          textSecondary: '#98989d', // Secondary text
          textTertiary: '#636366',  // Tertiary/disabled text
          
          // System colors for states
          success: '#32D74B',    // Green
          warning: '#FF9F0A',    // Orange
          error: '#FF453A',      // Red
          info: '#5E5CE6'        // Purple
        }
      }
    },
  },
  plugins: [],
}