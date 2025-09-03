import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminFetch } from '../utils/adminApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B', '#4ECDC4'];

const StatCard = ({ title, value, change, icon, color = 'blue' }) => (
  <div className={`bg-white bg-opacity-100 border border-${color}-100 bg-gradient-to-br from-${color}-50 to-${color}-100 p-4 rounded-lg shadow`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
    </div>
    {change !== undefined && (
      <p className={`text-xs mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
      </p>
    )}
  </div>
);

const AdminAnalytics = () => {
  const { token } = useAuth();
  const [data, setData] = useState({
    overview: null,
    trends: null,
    userStats: null,
    serviceStats: null,
    revenueData: null
  });
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        // Only fetch the endpoints that exist in the backend
        const [overview, trends, revenue] = await Promise.all([
          adminFetch('/api/admin/analytics/overview', token).catch(() => ({})),
          adminFetch(`/api/admin/analytics/trends?days=${timeRange}`, token).catch(() => ({})),
          adminFetch('/api/admin/analytics/revenue', token).catch(() => ({}))
        ]);
        
        // Transform the data to match what the UI expects
        const userStats = {
          total: overview.totals?.users || 0,
          providers: overview.totals?.providers || 0,
          customers: overview.totals?.customers || 0,
          growth: 0 // Not available in current backend
        };
        
        const serviceStats = {
          total: 0, // Not available in current backend
          topServices: [] // Not available in current backend
        };
        
        setData({
          overview: overview || {},
          trends: trends || {},
          userStats,
          serviceStats,
          revenueData: revenue || {}
        });
      } catch (e) { 
        console.error('Error loading analytics:', e);
        setError(e.message); 
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, [token, timeRange]);
  
  const { overview, trends, userStats, serviceStats, revenueData } = data;
  
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '$0';
    if (typeof value !== 'number') value = Number(value) || 0;
    if (isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    if (typeof num !== 'number') num = Number(num) || 0;
    if (isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  const timeRanges = [
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' },
    { value: '90', label: '90 Days' },
    { value: '365', label: '1 Year' }
  ];

  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded">{error}</div>;
  if (loading || !overview || !trends) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {timeRanges.map(range => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(overview?.revenue?.total)} 
          change={overview?.revenue?.growth} 
          icon="💰"
          color="green"
        />
        <StatCard 
          title="Active Users" 
          value={formatNumber(overview?.totals?.activeUsers)} 
          change={overview?.userGrowth} 
          icon="👥"
          color="blue"
        />
        <StatCard 
          title="Total Bookings" 
          value={formatNumber(overview?.totals?.bookings)} 
          change={overview?.bookingGrowth} 
          icon="📅"
          color="purple"
        />
        <StatCard 
          title="Avg. Rating" 
          value={overview?.avgRating?.toFixed(1) || 'N/A'} 
          change={overview?.ratingChange} 
          icon="⭐"
          color="yellow"
        />
      </div>

      {/* Revenue & Bookings Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Revenue & Bookings</h2>
          <div className="flex space-x-2 text-sm">
            <span className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div> Revenue</span>
            <span className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div> Bookings</span>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData?.monthly || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
              <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
              <Tooltip 
                formatter={(value, name) => 
                  name === 'revenue' ? formatCurrency(value) : value
                }
              />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              <Area yAxisId="right" type="monotone" dataKey="bookings" stroke="#10B981" fillOpacity={1} fill="url(#colorBookings)" name="Bookings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Acquisition */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6">User Acquisition</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userStats?.acquisition || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="count" fill="#8884d8" name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Performance */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Top Performing Services</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={serviceStats?.topServices || []}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 20']} />
                <Radar name="Performance" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Booking Funnel */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Booking Funnel</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends.bookingFunnel}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="value" fill="#4F46E5" name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {overview.recentActivity?.map((activity, index) => (
            <div key={index} className="flex items-start pb-4 border-b border-gray-100 last:border-0">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)} mr-4`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
              {activity.amount && (
                <div className={`text-sm font-medium ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {activity.amount > 0 ? `+${formatCurrency(activity.amount)}` : formatCurrency(activity.amount)}
                </div>
              )}
            </div>
          ))}
          {(!overview.recentActivity || overview.recentActivity.length === 0) && (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions for activity items
const getActivityColor = (type) => {
  const colors = {
    booking: 'bg-blue-100 text-blue-600',
    payment: 'bg-green-100 text-green-600',
    user: 'bg-purple-100 text-purple-600',
    system: 'bg-gray-100 text-gray-600',
    alert: 'bg-yellow-100 text-yellow-600',
    default: 'bg-gray-100 text-gray-600'
  };
  return colors[type] || colors.default;
};

const getActivityIcon = (type) => {
  const icons = {
    booking: '📅',
    payment: '💳',
    user: '👤',
    system: '⚙️',
    alert: '⚠️',
    default: 'ℹ️'
  };
  return icons[type] || icons.default;
};

export default AdminAnalytics;


