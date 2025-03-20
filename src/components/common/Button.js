const Button = ({ variant = 'primary', children, ...props }) => {
  const variants = {
    primary: 'bg-dark-accent hover:bg-dark-accentHover text-white',
    secondary: 'bg-light-accent dark:bg-dark-tertiary text-light-text dark:text-dark-text',
    danger: 'bg-dark-error hover:bg-dark-error/90 text-white',
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg transition-colors ${variants[variant]} disabled:opacity-50`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;