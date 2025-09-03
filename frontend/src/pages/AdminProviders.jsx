import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminFetch } from '../utils/adminApi';

const AdminProviders = () => {
  const { token } = useAuth();
  const [pending, setPending] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const data = await adminFetch('/api/admin/providers/pending-verifications', token);
      setPending(data.data || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    try {
      await adminFetch(`/api/admin/providers/${id}/verify`, token, { method: 'PUT' });
      await load();
    } catch (e) { setError(e.message); }
  };
  const reject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await adminFetch(`/api/admin/providers/${id}/reject`, token, { method: 'PUT', body: JSON.stringify({ reason }) });
      await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pending Verifications</h2>
      {error && <div className="text-red-600">{error}</div>}
      <div className="bg-white/70 rounded shadow divide-y">
        {pending.map(p => (
          <div key={p.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">{p.email} • {p.services?.map(s => s.name).join(', ')}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => verify(p.id)}>Verify</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => reject(p.id)}>Reject</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <div className="p-4 text-sm text-gray-600">No pending verifications.</div>}
      </div>
    </div>
  );
};

export default AdminProviders;


