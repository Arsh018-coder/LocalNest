import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminFetch } from '../utils/adminApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Stat = ({ title, value, sub, icon }) => (
  <div className="p-4 bg-white border border-gray-100 rounded shadow flex items-start">
    {icon && <div className="text-2xl mr-3">{icon}</div>}
    <div>
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  </div>
);

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AdminDashboard = () => {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Only fetch the endpoints that exist in the backend
        const [overview, trends] = await Promise.all([
          adminFetch('/api/admin/analytics/overview', token).catch(() => ({})),
          adminFetch('/api/admin/analytics/trends?days=30', token).catch(() => ({}))
        ]);
        
        // Transform the data to match what the UI expects
        const stats = {
          totalUsers: overview.totals?.users || 0,
          totalBookings: overview.totals?.bookings || 0,
          totalRevenue: overview.revenue?.total || 0,
          completedBookings: overview.bookings?.completed || 0,
          cancelledBookings: overview.bookings?.cancelled || 0,
          newUsers: 0, // Not available in current backend
          newProviders: 0 // Not available in current backend
        };
        
        const userStats = {
          total: overview.totals?.users || 0,
          providers: overview.totals?.providers || 0,
          customers: overview.totals?.customers || 0,
          growth: 0 // Not available in current backend
        };
        
        const serviceStats = {
          topServices: [] // Not available in current backend
        };
        
        setDashboardData({
          stats,
          trends: trends || {},
          userStats,
          serviceStats
        });
        setLoading(false);
      } catch (e) {
        setError(e.message);
      }
    };
    loadDashboardData();
  }, [token]);

  if (error) return <div className="container mx-auto py-8">{error}</div>;
  if (loading || !dashboardData) return <div className="container mx-auto py-8">Loading...</div>;

  const { stats, userStats } = dashboardData;

  // Prepare data for charts
  const bookingData = [
    { name: 'Completed', value: stats.completedBookings || 0 },
    { name: 'Cancelled', value: stats.cancelledBookings || 0 },
  ];

  const userData = [
    { name: 'Users', value: userStats.customers || 0 },
    { name: 'Providers', value: userStats.providers || 0 },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-6">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Stat 
            title="Total Users" 
            value={userStats.total} 
            sub={`${userStats.customers} customers, ${userStats.providers} providers`} 
            icon="👥"
          />
          <Stat 
            title="Total Bookings" 
            value={stats.totalBookings} 
            sub={`${stats.completedBookings} completed, ${stats.cancelledBookings} cancelled`}
            icon="📅"
          />
          <Stat 
            title="Total Revenue" 
            value={`$${stats.totalRevenue.toLocaleString()}`} 
            sub="This month"
            icon="💰"
          />
          <Stat 
            title="Active Services" 
            value="N/A" 
            sub="Coming soon"
            icon="🔧"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/70 p-6 rounded shadow">
          <h3 className="text-lg font-medium mb-4">Bookings Overview</h3>
          {bookingData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bookingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No booking data available
            </div>
          )}
        </div>

        <div className="bg-white/70 p-6 rounded shadow">
          <h3 className="text-lg font-medium mb-4">User Distribution</h3>
          {userData.some(item => item.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {userData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No user data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


