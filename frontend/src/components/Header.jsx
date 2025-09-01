import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Providers', path: '/Providers' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/Contact' },
    
  ];

  return (
    // src/components/Header.jsx
    <header className="menu-bar-dark">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-secondary">
            Local<span className="text-accent">Nest</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-medium transition-colors duration-300 ${
                  location.pathname === item.path
                    ? 'text-accent'
                    : 'text-secondary hover:text-accent'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex space-x-4 items-center">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <button className="btn-secondary">
                    Dashboard
                  </button>
                </Link>
                <span className="text-secondary">
                  Hi, {user.firstName}!
                </span>
                <button onClick={handleLogout} className="btn-primary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <button className='btn-secondary'> 
                    Sign In
                  </button>
                </Link>
                
                <Link to="/register">
                  <button className="btn-primary">Get Started</button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-secondary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block text-secondary hover:text-accent transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-secondary/20 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="text-secondary text-center">
                    Hi, {user.firstName}!
                  </div>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full btn-secondary text-center">
                      Dashboard
                    </button>
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full btn-primary text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/signin" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full btn-secondary text-center">
                      Sign In
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full btn-primary text-center">
                      Get Started
                    </button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
