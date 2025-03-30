const Button = ({ variant = 'primary', children, ...props }) => {
  const variants = {
    primary: 'bg-dark-accent hover:bg-dark-accentHover text-white',
    secondary: 'bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text border border-light-border dark:border-dark-border',
    danger: 'bg-dark-error hover:bg-dark-error/90 text-white',
    white: 'bg-white dark:bg-dark-tertiary hover:bg-gray-50 dark:hover:bg-dark-tertiary/70 text-gray-900 dark:text-dark-text border border-gray-200 dark:border-dark-border',
    black: 'bg-gray-900 dark:bg-black hover:bg-gray-800 dark:hover:bg-gray-900 text-white border border-gray-800 dark:border-gray-700',
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