import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-secondary mb-6 leading-tight">
          Find Local
          <span className="block text-accent">Service Providers</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-secondary opacity-80 mb-8 max-w-2xl mx-auto">
          Connect with trusted professionals in your neighborhood. From plumbers to tutors, 
          find the right service provider for your needs.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/services" className="btn-primary text-lg px-8 py-4">
            Browse Services
          </Link>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/providers" className="btn-secondary text-lg px-8 py-4">
            Become a Provider
            </Link>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-secondary mb-2">Verified Providers</h3>
            <p className="text-secondary opacity-70">All service providers are background checked</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-secondary mb-2">Easy Booking</h3>
            <p className="text-secondary opacity-70">Simple online booking and scheduling</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-secondary mb-2">Rated & Reviewed</h3>
            <p className="text-secondary opacity-70">Real reviews from real customers</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
