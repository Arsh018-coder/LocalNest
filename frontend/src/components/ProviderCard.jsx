import React from 'react';

const ProviderCard = ({ provider }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {provider.user.firstName?.[0]}{provider.user.lastName?.[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-secondary">
              {provider.user.firstName} {provider.user.lastName}
            </h3>
            {provider.verified && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-secondary/70 mb-2">
            {provider.bio || 'No bio provided yet'}
          </p>
          <div className="flex items-center space-x-4 text-sm text-secondary/70">
            <span>⭐ {provider.rating || 0}/5.0</span>
            <span>📍 {provider.location || 'Location not set'}</span>
            <span>💰 ${provider.hourlyRate || 0}/hour</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;