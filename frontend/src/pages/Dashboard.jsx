import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiCall from '../utils/api';
import ProfileEditModal from '../components/ProfileEditModal';
import ServiceManagement from '../components/ServiceManagement';

export default function Dashboard() {
  const { user, token, logout, isAuthenticated, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    const fetchProfile = async () => {
      try {
        const profileData = await apiCall('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        setProfile(profileData);
      } catch (error) {
        console.error('Profile fetch error:', error);
        setError(error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, token, navigate, authLoading]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileUpdate = async (updatedProfile) => {
    // Update the profile state with the complete updated data
    setProfile(updatedProfile);
    
    // Also update the auth context with the updated user data
    updateUser(updatedProfile);
  };

  const handleVerificationRequest = async () => {
    if (!profile?.provider?.id) {
      console.error('No provider ID found');
      alert('Provider information not found. Please try again.');
      return;
    }
    
    try {
      console.log('Sending verification request for provider:', profile.provider.id);
      console.log('Using token:', token ? 'Token exists' : 'No token found');
      
      const response = await apiCall(`/api/providers/${profile.provider.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({})
      });
      
      console.log('Verification response:', response);
      
      if (response && response.provider) {
        // Update the profile to reflect verification request
        setProfile(prev => ({
          ...prev,
          provider: {
            ...prev.provider,
            verificationRequested: true,
            verificationRequestedAt: new Date().toISOString()
          }
        }));
        
        alert('Verification request submitted successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Verification request error:', error);
      alert(`Failed to submit verification request: ${error.message}. Please try again or contact support.`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dominant flex items-center justify-center">
        <div className="text-secondary text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dominant flex items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dominant py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-secondary">
                Welcome, {profile?.firstName} {profile?.lastName}!
              </h1>
              <p className="text-secondary/70 capitalize">
                {profile?.userType?.toLowerCase()} Dashboard
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-secondary text-dominant px-4 py-2 rounded-lg hover:bg-secondary/90 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-secondary mb-4">Profile Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-secondary/70 text-sm">Name</label>
                <p className="text-secondary font-semibold">
                  {profile?.firstName} {profile?.lastName}
                </p>
              </div>
              <div>
                <label className="text-secondary/70 text-sm">Email</label>
                <p className="text-secondary font-semibold">{profile?.email}</p>
              </div>
              <div>
                <label className="text-secondary/70 text-sm">Phone</label>
                <p className="text-secondary font-semibold">
                  {profile?.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <label className="text-secondary/70 text-sm">Account Type</label>
                <p className="text-secondary font-semibold capitalize">
                  {profile?.userType?.toLowerCase()}
                </p>
              </div>
              <div>
                <label className="text-secondary/70 text-sm">Member Since</label>
                <p className="text-secondary font-semibold">
                  {new Date(profile?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Provider-specific info */}
          {profile?.userType === 'PROVIDER' && profile?.provider && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-secondary mb-4">Provider Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-secondary/70 text-sm">Rating</label>
                  <p className="text-secondary font-semibold">
                    ⭐ {profile.provider.rating}/5.0 ({profile.provider.reviews} reviews)
                  </p>
                </div>
                <div>
                  <label className="text-secondary/70 text-sm">Experience</label>
                  <p className="text-secondary font-semibold">
                    {profile.provider.experience || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-secondary/70 text-sm">Location</label>
                  <p className="text-secondary font-semibold">
                    {profile.provider.location || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-secondary/70 text-sm">Hourly Rate</label>
                  <p className="text-secondary font-semibold">
                    ${profile.provider.hourlyRate || 0}/hour
                  </p>
                </div>
                <div>
                  <label className="text-secondary/70 text-sm">Verification Status</label>
                  <p className="text-secondary font-semibold">
                    {profile.provider.verified 
                      ? '✅ Verified' 
                      : profile.provider.verificationRequested 
                        ? '⏳ Verification Pending' 
                        : '❌ Not verified'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer-specific info */}
          {profile?.userType === 'CUSTOMER' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-secondary mb-4">Customer Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-secondary/70 text-sm">Total Bookings</label>
                  <p className="text-secondary font-semibold">
                    {profile.customer?.bookings?.length || 0}
                  </p>
                </div>
                <div>
                  <label className="text-secondary/70 text-sm">Account Status</label>
                  <p className="text-secondary font-semibold">
                    {profile.isActive ? '✅ Active' : '❌ Inactive'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-secondary mb-4">Recent Activity</h2>
          
          {profile?.userType === 'PROVIDER' && profile?.provider?.bookings?.length > 0 ? (
            <div className="space-y-3">
              {profile.provider.bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="border-l-4 border-accent pl-4 py-2">
                  <p className="text-secondary font-semibold">
                    {booking.service.name} - {booking.status}
                  </p>
                  <p className="text-secondary/70 text-sm">
                    Customer: {booking.customer.user.firstName} {booking.customer.user.lastName}
                  </p>
                  <p className="text-secondary/70 text-sm">
                    Date: {new Date(booking.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : profile?.userType === 'CUSTOMER' && profile?.customer?.bookings?.length > 0 ? (
            <div className="space-y-3">
              {profile.customer.bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="border-l-4 border-accent pl-4 py-2">
                  <p className="text-secondary font-semibold">
                    {booking.service.name} - {booking.status}
                  </p>
                  <p className="text-secondary/70 text-sm">
                    Provider: {booking.provider.user.firstName} {booking.provider.user.lastName}
                  </p>
                  <p className="text-secondary/70 text-sm">
                    Date: {new Date(booking.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary/70">No recent activity</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-secondary mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/services" className="btn-primary">
              Browse Services
            </Link>
            {profile?.userType === 'PROVIDER' && (
              <>
                <button 
                  onClick={() => setShowServiceModal(true)}
                  className="btn-secondary"
                >
                  Manage Services
                </button>
                <button 
                  onClick={handleVerificationRequest}
                  disabled={profile?.provider?.verificationRequested}
                  className={`px-4 py-2 rounded-lg transition ${
                    profile?.provider?.verificationRequested 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {profile?.provider?.verificationRequested ? 'Verification Pending' : 'Request Verification'}
                </button>
              </>
            )}
            <button 
              onClick={() => setShowEditModal(true)}
              className="btn-secondary"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Provider Card Preview */}
        {profile?.userType === 'PROVIDER' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-secondary mb-4">Your Provider Card</h2>
            <div className="border-2 border-dashed border-secondary/20 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-secondary">
                      {profile?.firstName} {profile?.lastName}
                    </h3>
                    {profile?.provider?.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-secondary/70 mb-2">
                    {profile?.provider?.bio || 'No bio provided yet'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-secondary/70">
                    <span>⭐ {profile?.provider?.rating || 0}/5.0</span>
                    <span>📍 {profile?.provider?.location || 'Location not set'}</span>
                    <span>💰 ${profile?.provider?.hourlyRate || 0}/hour</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-secondary/10">
                <p className="text-sm text-secondary/70">
                  This is how customers will see your profile. Complete your information to attract more clients!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onUpdate={handleProfileUpdate}
      />

      <ServiceManagement
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
      />
    </div>
  );
}