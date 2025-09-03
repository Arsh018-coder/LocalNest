import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminFetch } from '../utils/adminApi';

const AdminServices = () => {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', category: '', averagePrice: '' });
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const data = await adminFetch('/api/admin/services', token);
      setList(data.data || []);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await adminFetch('/api/admin/services', token, { method: 'POST', body: JSON.stringify({ ...form, averagePrice: Number(form.averagePrice) }) });
      setForm({ name: '', description: '', category: '', averagePrice: '' });
      await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    try {
      await adminFetch(`/api/admin/services/${id}`, token, { method: 'DELETE' });
      await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-white/70 p-3 rounded">
        <input className="p-2 border rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="p-2 border rounded" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="p-2 border rounded" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input className="p-2 border rounded" placeholder="Avg Price" value={form.averagePrice} onChange={(e) => setForm({ ...form, averagePrice: e.target.value })} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Add</button>
      </form>

      {error && <div className="text-red-600">{error}</div>}
      <div className="bg-white/70 rounded shadow divide-y">
        {list.map(s => (
          <div key={s.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-gray-600">{s.category} • ${s.averagePrice}</div>
            </div>
            <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => remove(s.id)}>Delete</button>
          </div>
        ))}
        {list.length === 0 && <div className="p-4 text-sm text-gray-600">No services.</div>}
      </div>
    </div>
  );
};

export default AdminServices;


