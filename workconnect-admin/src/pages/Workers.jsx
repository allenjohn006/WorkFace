// src/pages/Workers.jsx — Worker Verification Queue

import { useState, useEffect } from 'react';
import {
  collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Badge from '../components/Badge';

const TABS = ['all', 'pending', 'verified', 'rejected'];

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => { loadWorkers(); }, []);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'workers'), orderBy('createdAt', 'desc'))
      );
      setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (workerId, status) => {
    setActionLoading(workerId + status);
    try {
      await updateDoc(doc(db, 'workers', workerId), {
        verificationStatus: status,
        verifiedAt: serverTimestamp(),
      });
      setWorkers((prev) =>
        prev.map((w) => w.id === workerId ? { ...w, verificationStatus: status } : w)
      );
      if (selectedWorker?.id === workerId) {
        setSelectedWorker((prev) => ({ ...prev, verificationStatus: status }));
      }
    } catch (err) {
      alert('Failed to update worker status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = workers.filter((w) => {
    const matchesTab = tab === 'all' || w.verificationStatus === tab;
    const matchesSearch = !search ||
      w.name?.toLowerCase().includes(search.toLowerCase()) ||
      w.phone?.includes(search);
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: workers.length,
    pending: workers.filter((w) => w.verificationStatus === 'pending').length,
    verified: workers.filter((w) => w.verificationStatus === 'verified').length,
    rejected: workers.filter((w) => w.verificationStatus === 'rejected').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Worker Verification</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Review and verify worker profiles before they go live
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
            background: 'transparent',
            color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
            textTransform: 'capitalize',
          }}>
            {t} ({counts[t]})
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{ marginBottom: 8, width: 240 }}
        />
      </div>

      {/* Main Content — Table + Detail Panel */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Table */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading workers...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No workers found for this filter.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Skills</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((worker) => (
                  <tr
                    key={worker.id}
                    onClick={() => setSelectedWorker(worker)}
                    style={{ cursor: 'pointer', background: selectedWorker?.id === worker.id ? 'var(--primary-light)' : undefined }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {worker.photoURL ? (
                          <img src={worker.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👷</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{worker.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{worker.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {worker.skills?.slice(0, 2).map((s) => (
                          <span key={s} className="badge badge-blue" style={{ fontSize: 11 }}>{s}</span>
                        ))}
                        {worker.skills?.length > 2 && (
                          <span className="badge badge-gray" style={{ fontSize: 11 }}>+{worker.skills.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>{worker.experience || 0} yr</td>
                    <td><Badge type={worker.verificationStatus} /></td>
                    <td>
                      {worker.createdAt?.toDate
                        ? worker.createdAt.toDate().toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {worker.verificationStatus !== 'verified' && (
                          <button
                            className="btn btn-success btn-sm"
                            disabled={actionLoading === worker.id + 'verified'}
                            onClick={(e) => { e.stopPropagation(); handleVerify(worker.id, 'verified'); }}
                          >
                            {actionLoading === worker.id + 'verified' ? '...' : '✓ Verify'}
                          </button>
                        )}
                        {worker.verificationStatus !== 'rejected' && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actionLoading === worker.id + 'rejected'}
                            onClick={(e) => { e.stopPropagation(); handleVerify(worker.id, 'rejected'); }}
                          >
                            {actionLoading === worker.id + 'rejected' ? '...' : '✕ Reject'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selectedWorker && (
          <div className="card" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Worker Detail</span>
              <button onClick={() => setSelectedWorker(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>✕</button>
            </div>

            {selectedWorker.photoURL ? (
              <img src={selectedWorker.photoURL} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />
            ) : (
              <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, background: 'var(--bg)', borderRadius: 12 }}>👷</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DetailRow label="Name" value={selectedWorker.name} />
              <DetailRow label="Phone" value={selectedWorker.phone} />
              <DetailRow label="Experience" value={`${selectedWorker.experience || 0} years`} />
              <DetailRow label="Service Radius" value={`${selectedWorker.serviceRadius || 10} km`} />
              <DetailRow label="Rating" value={`⭐ ${selectedWorker.rating?.toFixed(1) || '—'} (${selectedWorker.totalRatings || 0} reviews)`} />
              <DetailRow label="Jobs Done" value={selectedWorker.totalJobs || 0} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selectedWorker.skills?.map((s) => (
                    <span key={s} className="badge badge-blue">{s}</span>
                  ))}
                </div>
              </div>
              <DetailRow label="Status" value={<Badge type={selectedWorker.verificationStatus} />} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {selectedWorker.verificationStatus !== 'verified' && (
                <button
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  disabled={!!actionLoading}
                  onClick={() => handleVerify(selectedWorker.id, 'verified')}
                >
                  ✓ Verify
                </button>
              )}
              {selectedWorker.verificationStatus !== 'rejected' && (
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={!!actionLoading}
                  onClick={() => handleVerify(selectedWorker.id, 'rejected')}
                >
                  ✕ Reject
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
