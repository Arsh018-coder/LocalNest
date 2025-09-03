import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminFetch } from '../utils/adminApi';

const AdminAudit = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminFetch('/api/admin/audit/logs', token);
        setLogs(data.data || []);
      } catch (e) { setError(e.message); }
    };
    load();
  }, [token]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Audit Logs</h2>
      {error && <div className="text-red-600">{error}</div>}
      <div className="bg-white/70 rounded shadow divide-y text-sm">
        {logs.map(l => (
          <div key={l.id} className="p-3">
            <div className="font-medium">{l.action} • {l.targetType} #{l.targetId || '-'}</div>
            <div className="text-gray-600">{new Date(l.createdAt).toLocaleString()} by {l.admin?.name || 'System'}</div>
          </div>
        ))}
        {logs.length === 0 && <div className="p-4 text-gray-600">No logs.</div>}
      </div>
    </div>
  );
};

export default AdminAudit;


