import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminFetch } from '../utils/adminApi';

const AdminUsers = () => {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

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
            <div className="text-sm">{u.isActive ? 'Active' : 'Inactive'}</div>
          </div>
        ))}
        {list.length === 0 && <div className="p-4 text-sm text-gray-600">No users found.</div>}
      </div>
    </div>
  );
};

export default AdminUsers;


