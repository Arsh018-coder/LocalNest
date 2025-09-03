import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Could report to monitoring here
    // console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="container mx-auto py-8">Something went wrong. Please reload.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


