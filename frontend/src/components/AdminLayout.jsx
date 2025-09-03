import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className="min-h-[70vh] container mx-auto py-6 grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 space-y-2">
        <Link className="block p-2 bg-white/70 rounded" to="/admin">Dashboard</Link>
        <Link className="block p-2 bg-white/70 rounded" to="/admin/users">Users</Link>
        <Link className="block p-2 bg-white/70 rounded" to="/admin/providers">Providers</Link>
        <Link className="block p-2 bg-white/70 rounded" to="/admin/services">Services</Link>
        <Link className="block p-2 bg-white/70 rounded" to="/admin/analytics">Analytics</Link>
        <Link className="block p-2 bg-white/70 rounded" to="/admin/audit">Audit Logs</Link>
      </aside>
      <section className="col-span-12 md:col-span-9">
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;


