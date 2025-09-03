import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminFetch } from '../utils/adminApi';

const AdminUsers = () => {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminFetch(`/api/admin/users/${userId}`, token, { method: 'DELETE' });
        setList(list.filter(u => u.id !== userId));
      } catch (e) {
        setError(e.message);
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminFetch(`/api/admin/users?search=${encodeURIComponent(search)}`, token);
        setList(data.data || []);
      } catch (e) {
        setError(e.message);
      }
    };
    load();
  }, [token, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="p-2 border rounded w-full" placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <div className="bg-white/70 rounded shadow divide-y">
        {list.map(u => (
          <div key={u.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{u.name}</div>
              <div className="text-sm text-gray-600">{u.email} • {u.userType}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">{u.isActive ? 'Active' : 'Inactive'}</div>
              <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800">Delete</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="p-4 text-sm text-gray-600">No users found.</div>}
      </div>
    </div>
  );
};

export default AdminUsers;


