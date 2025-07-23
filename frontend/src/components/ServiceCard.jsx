import React from 'react';

const ServiceCard = ({ service }) => {
  return (
    <div className="card hover:transform hover:scale-105 cursor-pointer">
      <div className="text-center">
        <div className="text-4xl mb-4">{service.icon}</div>
        <h3 className="text-xl font-semibold text-secondary mb-2">{service.name}</h3>
        <p className="text-secondary opacity-70 mb-4">{service.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-secondary opacity-60">
            {service.providers} providers
          </span>
          <button className="btn-primary text-sm px-4 py-2">
            View All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
