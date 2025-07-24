import React from 'react';

function Providers() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-8">Our Providers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">John Doe</h3>
          <p className="text-gray-600">Expert in home cleaning services.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Jane Smith</h3>
          <p className="text-gray-600">Professional plumber with 10 years of experience.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Mike Johnson</h3>
          <p className="text-gray-600">Experienced electrician for all your needs.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Emily Davis</h3>
          <p className="text-gray-600">Gardening and landscaping expert.</p>
      </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Chris Brown</h3>
          <p className="text-gray-600">Specialist in home repairs and maintenance.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Sarah Wilson</h3>
          <p className="text-gray-600">Professional painter with a keen eye for detail.</p>
        </div>
    </div>
    </div>
  );
}

export default Providers;