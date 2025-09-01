import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const ServiceManagement = ({ isOpen, onClose }) => {
  const { token, user } = useAuth();
  const [availableServices, setAvailableServices] = useState([]);
  const [providerServices, setProviderServices] = useState([]);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchData();
    }
  }, [isOpen, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all available services
      const servicesData = await apiCall('/api/services');
      setAvailableServices(servicesData);
      
      // Fetch provider profile to get current services
      const providerData = await apiCall(`/api/providers/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setProvider(providerData);
      setProviderServices(providerData.services || []);
      
    } catch (error) {
      setError('Failed to load data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addServiceToProvider = async (serviceId) => {
    if (!provider) return;
    
    try {
      setLoading(true);
      await apiCall(`/api/services/provider/${provider.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ serviceId }),
      });
      
      // Refresh data
      await fetchData();
    } catch (error) {
      setError(error.message || 'Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  const removeServiceFromProvider = async (serviceId) => {
    if (!provider || !window.confirm('Are you sure you want to remove this service?')) return;

    try {
      setLoading(true);
      await apiCall(`/api/services/provider/${provider.id}/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Refresh data
      await fetchData();
    } catch (error) {
      setError(error.message || 'Failed to remove service');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-secondary">Manage Services</h2>
          <button
            onClick={onClose}
            className="text-secondary/50 hover:text-secondary text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Available Services */}
          <div>
            <h3 className="text-lg font-semibold text-secondary mb-4">Available Services</h3>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableServices
                  .filter(service => !providerServices.some(ps => ps.id === service.id))
                  .map((service) => (
                    <div key={service.id} className="border border-secondary/20 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-secondary">{service.name}</h4>
                          <p className="text-secondary/70 text-sm mb-2">{service.category}</p>
                          <p className="text-secondary/80 text-sm mb-2">{service.description}</p>
                          <div className="text-sm text-secondary/70">
                            Average: ${service.averagePrice}
                          </div>
                        </div>
                        <button
                          onClick={() => addServiceToProvider(service.id)}
                          disabled={loading}
                          className="bg-accent text-white px-3 py-1 rounded text-sm hover:bg-accent/90 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                {availableServices.filter(service => !providerServices.some(ps => ps.id === service.id)).length === 0 && (
                  <div className="text-center py-8 text-secondary/70">
                    All available services have been added to your profile.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Your Services */}
          <div>
            <h3 className="text-lg font-semibold text-secondary mb-4">Your Services</h3>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : providerServices.length === 0 ? (
              <div className="text-center py-8 text-secondary/70">
                No services added yet. Add services from the available list to get started!
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {providerServices.map((service) => (
                  <div key={service.id} className="border border-secondary/20 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-secondary">{service.name}</h4>
                        <p className="text-secondary/70 text-sm mb-2">{service.category}</p>
                        <p className="text-secondary/80 text-sm mb-2">{service.description}</p>
                        <div className="text-sm text-secondary/70">
                          Average: ${service.averagePrice}
                        </div>
                      </div>
                      <button
                        onClick={() => removeServiceFromProvider(service.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 px-3 py-1 text-sm disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceManagement;