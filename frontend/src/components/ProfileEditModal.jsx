import React, { useState } from 'react';
import apiCall from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const ProfileEditModal = ({ isOpen, onClose, profile, onUpdate }) => {
  const { token, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phone: profile?.phone || '',
    experience: profile?.provider?.experience || '',
    location: profile?.provider?.location || '',
    hourlyRate: profile?.provider?.hourlyRate || '',
    bio: profile?.provider?.bio || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      // Update both the auth context and the dashboard profile
      updateUser(response.user);
      onUpdate(response.user);
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-secondary">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-secondary/50 hover:text-secondary"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-secondary/70 text-sm mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary/20 rounded-lg focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-secondary/70 text-sm mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary/20 rounded-lg focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-secondary/70 text-sm mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary/20 rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          {profile?.userType === 'PROVIDER' && (
            <>
              <div>
                <label className="block text-secondary/70 text-sm mb-1">Experience</label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-secondary/20 rounded-lg focus:outline-none focus:border-accent"
                  placeholder="Describe your experience and skills..."
                />
              </div>

              <div>
                <label className="block text-secondary/70 text-sm mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-secondary/20 rounded-lg focus:outline-none focus:border-accent"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-secondary/70 text-sm mb-1">Hourly Rate ($)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-secondary/20 rounded-lg focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-secondary/70 text-sm mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-secondary/20 rounded-lg focus:outline-none focus:border-accent"
                  placeholder="Tell customers about yourself..."
                />
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-secondary/20 text-secondary rounded-lg hover:bg-secondary/5"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;