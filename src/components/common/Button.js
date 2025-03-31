const Button = ({ variant = 'primary', children, ...props }) => {
  const variants = {
    primary: 'bg-dark-accent hover:bg-dark-accentHover text-white',
    secondary: 'bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border',
    danger: 'bg-dark-error hover:bg-dark-error/90 text-white',
    white: `bg-white text-gray-900 border border-gray-200
      dark:bg-white dark:text-gray-900 dark:border-gray-300
      hover:bg-gray-50 dark:hover:bg-gray-100`,
    black: `bg-black text-white border border-black
      dark:bg-white dark:text-black dark:border-white
      hover:bg-gray-900 dark:hover:bg-gray-100`,
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg transition-all duration-200 
        ${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-[1.02] active:scale-[0.98]`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;