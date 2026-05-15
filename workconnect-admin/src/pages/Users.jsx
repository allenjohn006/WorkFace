// src/pages/Users.jsx — All users table (both customers and workers)

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Badge from '../components/Badge';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleTab, setRoleTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersSnap, workersSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'workers'), orderBy('createdAt', 'desc'))),
      ]);

      const usersData = usersSnap.docs.map((d) => ({ id: d.id, role: 'customer', ...d.data() }));
      const workersData = workersSnap.docs.map((d) => ({ id: d.id, role: 'worker', ...d.data() }));

      setUsers(usersData);
      setWorkers(workersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Combine and filter
  const all = [
    ...(roleTab === 'worker' ? [] : users),
    ...(roleTab === 'customer' ? [] : workers),
  ];

  const filtered = all.filter((u) => {
    if (!search) return true;
    return (
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    );
  });

  const counts = {
    all: users.length + workers.length,
    customer: users.length,
    worker: workers.length,
  };

  const formatDate = (ts) =>
    ts?.toDate ? ts.toDate().toLocaleDateString('en-IN') : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>All Users</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Combined view of all registered customers and workers
        </p>
      </div>

      {/* Stats summary row */}
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          { label: '👥 Total Users', value: counts.all, color: 'var(--primary)' },
          { label: '🙋 Customers', value: counts.customer, color: '#7C3AED' },
          { label: '🔧 Workers', value: counts.worker, color: 'var(--accent)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab + Search */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'customer', 'worker'].map((t) => (
            <button key={t} onClick={() => setRoleTab(t)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', background: 'transparent',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
              color: roleTab === t ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: roleTab === t ? '2px solid var(--primary)' : '2px solid transparent',
              textTransform: 'capitalize',
            }}>
              {t} ({counts[t]})
            </button>
          ))}
        </div>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{ marginBottom: 8, width: 240 }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Details</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id + user.role}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: 18,
                          background: user.role === 'worker' ? '#FFF3EE' : 'var(--primary-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        }}>
                          {user.role === 'worker' ? '👷' : '🙋'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{user.id.slice(0, 10)}...</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge type={user.role} /></td>
                  <td>{user.phone || '—'}</td>
                  <td style={{ maxWidth: 160 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.role === 'customer' ? (user.address || '—') : (user.location ? `${user.location.lat?.toFixed(4)}, ${user.location.lng?.toFixed(4)}` : '—')}
                    </div>
                  </td>
                  <td>
                    {user.role === 'worker' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Badge type={user.verificationStatus} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          ⭐ {user.rating?.toFixed(1) || '—'} · {user.totalJobs || 0} jobs
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pincode: {user.pincode || '—'}</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
