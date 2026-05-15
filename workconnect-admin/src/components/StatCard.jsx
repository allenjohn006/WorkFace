// src/components/StatCard.jsx — Reusable stat display card
export default function StatCard({ icon, label, value, sub, color = 'var(--primary)' }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}
