import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminFetch } from '../utils/adminApi';

const AdminAnalytics = () => {
  const { token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [o, t] = await Promise.all([
          adminFetch('/api/admin/analytics/overview', token),
          adminFetch('/api/admin/analytics/trends?days=14', token)
        ]);
        setOverview(o);
        setTrends(t);
      } catch (e) { setError(e.message); }
    };
    load();
  }, [token]);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!overview || !trends) return null;

  const regEntries = Object.entries(trends.registrations);
  const bookingEntries = Object.entries(trends.bookings);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/70 rounded shadow">Users: {overview.totals.users}</div>
        <div className="p-4 bg-white/70 rounded shadow">Providers: {overview.totals.providers}</div>
        <div className="p-4 bg-white/70 rounded shadow">Bookings: {overview.totals.bookings}</div>
        <div className="p-4 bg-white/70 rounded shadow">Revenue: ${overview.revenue.total}</div>
      </div>
      <div className="bg-white/70 rounded shadow p-4">
        <h3 className="font-semibold mb-2">Registrations (last 14 days)</h3>
        <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
          {regEntries.map(([d, v]) => (
            <div key={d} className="p-2 bg-white rounded">{d}: {v}</div>
          ))}
        </div>
      </div>
      <div className="bg-white/70 rounded shadow p-4">
        <h3 className="font-semibold mb-2">Bookings (last 14 days)</h3>
        <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
          {bookingEntries.map(([d, v]) => (
            <div key={d} className="p-2 bg-white rounded">{d}: {v.total} total, {v.completed} completed</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;


