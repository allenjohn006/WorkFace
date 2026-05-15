// src/pages/Jobs.jsx — Jobs Monitor & Management

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Badge from '../components/Badge';

const STATUS_TABS = ['all', 'open', 'accepted', 'in_progress', 'completed', 'cancelled'];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')));
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (jobId) => {
    if (!confirm('Cancel this job?')) return;
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'admin',
      });
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: 'cancelled' } : j));
      if (selected?.id === jobId) setSelected((prev) => ({ ...prev, status: 'cancelled' }));
    } catch {
      alert('Failed to cancel job.');
    }
  };

  const filtered = jobs.filter((j) => {
    const matchesTab = tab === 'all' || j.status === tab;
    const matchSearch = !search ||
      j.categoryLabel?.toLowerCase().includes(search.toLowerCase()) ||
      j.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      j.address?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchSearch;
  });

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === 'all' ? jobs.length : jobs.filter((j) => j.status === s).length;
    return acc;
  }, {});

  const formatDate = (ts) => ts?.toDate
    ? ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Jobs Monitor</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          All job requests across the platform — real-time visibility
        </p>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)} style={{
            padding: '8px 14px', border: 'none', cursor: 'pointer', background: 'transparent',
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12,
            color: tab === s ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: tab === s ? '2px solid var(--primary)' : '2px solid transparent',
            textTransform: 'capitalize', whiteSpace: 'nowrap',
          }}>
            {s} ({counts[s]})
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs..."
          style={{ marginBottom: 8, width: 220 }}
        />
      </div>

      {/* Content */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading jobs...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No jobs found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Worker</th>
                  <th>Budget</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id}
                    onClick={() => setSelected(job)}
                    style={{ cursor: 'pointer', background: selected?.id === job.id ? 'var(--primary-light)' : undefined }}
                  >
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>#{job.id.slice(-6).toUpperCase()}</span></td>
                    <td><span style={{ fontWeight: 600 }}>{job.categoryLabel}</span></td>
                    <td>{job.customerName || '—'}</td>
                    <td>{job.workerName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td>₹{job.budgetMax?.toLocaleString()}</td>
                    <td><Badge type={job.urgency} /></td>
                    <td><Badge type={job.status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(job.createdAt)}</td>
                    <td>
                      {!['completed', 'cancelled'].includes(job.status) && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => { e.stopPropagation(); handleCancel(job.id); }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Job Detail</span>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge type={selected.status} />
              <Badge type={selected.urgency} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DR label="Job ID" value={`#${selected.id.slice(-6).toUpperCase()}`} />
              <DR label="Service" value={selected.categoryLabel} />
              <DR label="Description" value={selected.description} />
              <DR label="Address" value={selected.address} />
              <DR label="Customer" value={selected.customerName || '—'} />
              <DR label="Worker" value={selected.workerName || 'Unassigned'} />
              <DR label="Budget" value={`₹${selected.budgetMin?.toLocaleString()} – ₹${selected.budgetMax?.toLocaleString()}`} />
              <DR label="Payment" value="💵 Cash" />
              <DR label="Posted On" value={formatDate(selected.createdAt)} />
            </div>
            {!['completed', 'cancelled'].includes(selected.status) && (
              <button className="btn btn-danger" onClick={() => handleCancel(selected.id)}>
                Cancel Job
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DR({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function formatDate(ts) {
  return ts?.toDate
    ? ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}
