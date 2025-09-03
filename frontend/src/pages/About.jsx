import React from 'react';
import { Link } from 'react-router-dom';

function About() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-8">About LocalNest</h1>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              LocalNest connects homeowners with trusted local service providers, 
              making it easy to find reliable help for all your home needs.
            </p>
            <h2 className="text-2xl font-semibold mb-4">Why Choose Us?</h2>
            <ul className="text-gray-600 space-y-2">
              <li>• Verified and trusted service providers</li>
              <li>• Competitive pricing</li>
              <li>• Easy booking process</li>
              <li>• Customer satisfaction guarantee</li>
              <li>• 24/7 customer support</li>
            </ul>
          </div>
          <div className="bg-gray-100 p-8 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Get Started Today</h3>
            <p className="text-gray-600 mb-4">
              Join thousands of satisfied customers who trust LocalNest 
              for their home service needs.
            </p>
            <Link to="/services" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Find Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
