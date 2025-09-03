import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Stat = ({ title, value, sub }) => (
  <div className="p-4 bg-white/70 rounded shadow">
    <div className="text-sm text-gray-600">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
    {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
  </div>
);

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load');
        setStats(data);
      } catch (e) {
        setError(e.message);
      }
    };
    load();
  }, [token]);

  if (error) return <div className="container mx-auto py-8">{error}</div>;
  if (!stats) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat title="Users" value={stats.overview.totalUsers} />
        <Stat title="Providers" value={stats.overview.totalProviders} />
        <Stat title="Active Bookings" value={stats.overview.activeBookings} />
        <Stat title="Completed" value={stats.overview.completedBookings.count} sub={`Rate ${stats.overview.completedBookings.completionRate}`} />
      </div>
    </div>
  );
};

export default AdminDashboard;


