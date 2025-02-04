import React from 'react';
import { Alert } from '@mui/material';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <Alert severity="error">Something went wrong. Please refresh.</Alert>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;