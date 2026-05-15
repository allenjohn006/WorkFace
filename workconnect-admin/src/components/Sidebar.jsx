// src/components/Sidebar.jsx
// Admin sidebar navigation

import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/workers', label: 'Worker Verification', icon: '👷' },
  { to: '/jobs', label: 'Jobs Monitor', icon: '🛠' },
  { to: '/users', label: 'All Users', icon: '👥' },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: '#fff',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
          WorkConnect
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Admin Dashboard</div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink
            key={to} to={to} end={end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Kerala, India — v1.0.0</div>
      </div>
    </aside>
  );
}
