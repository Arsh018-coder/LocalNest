import React from 'react';

function Services() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-8">Our Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Home Cleaning</h3>
          <p className="text-gray-600">Professional cleaning services for your home.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Plumbing</h3>
          <p className="text-gray-600">Expert plumbing repairs and maintenance.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Tutoring</h3>
          <p className="text-gray-600">Academic support for all subjects.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Gardening</h3>
          <p className="text-gray-600">Garden maintenance and landscaping.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Handyman</h3>
          <p className="text-gray-600">General repairs and maintenance.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Moving</h3>
          <p className="text-gray-600">Professional moving and packing services.</p>
        </div>
      </div>
    </div>
  );
}

export default Services;
