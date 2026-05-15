// src/pages/Dashboard.jsx — Admin Dashboard home page with live stats

import { useState, useEffect } from 'react';
import {
  collection, getCountFromServer, query, where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalWorkers: '—', pendingVerification: '—',
    activeJobs: '—', completedJobs: '—',
    totalCustomers: '—', totalJobs: '—',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        workersSnap, pendingSnap,
        activeSnap, completedSnap,
        customersSnap, totalJobsSnap,
      ] = await Promise.all([
        getCountFromServer(collection(db, 'workers')),
        getCountFromServer(query(collection(db, 'workers'), where('verificationStatus', '==', 'pending'))),
        getCountFromServer(query(collection(db, 'jobs'), where('status', 'in', ['accepted', 'in_progress']))),
        getCountFromServer(query(collection(db, 'jobs'), where('status', '==', 'completed'))),
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'jobs')),
      ]);
      setStats({
        totalWorkers: workersSnap.data().count,
        pendingVerification: pendingSnap.data().count,
        activeJobs: activeSnap.data().count,
        completedJobs: completedSnap.data().count,
        totalCustomers: customersSnap.data().count,
        totalJobs: totalJobsSnap.data().count,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Live snapshot of the WorkConnect platform
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard icon="👷" label="Total Workers" value={loading ? '...' : stats.totalWorkers} color="#0C4A8F" />
        <StatCard icon="⏳" label="Pending Verification" value={loading ? '...' : stats.pendingVerification} sub="Needs review" color="#D97706" />
        <StatCard icon="⚡" label="Active Jobs" value={loading ? '...' : stats.activeJobs} sub="In progress right now" color="#E85D04" />
        <StatCard icon="✅" label="Completed Jobs" value={loading ? '...' : stats.completedJobs} color="#16A34A" />
        <StatCard icon="🙋" label="Total Customers" value={loading ? '...' : stats.totalCustomers} color="#7C3AED" />
        <StatCard icon="📋" label="Total Jobs" value={loading ? '...' : stats.totalJobs} color="#0891B2" />
      </div>

      {/* Quick Links */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {stats.pendingVerification > 0 && (
            <a href="/workers" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary">
                ⏳ Review {stats.pendingVerification} Pending Workers
              </button>
            </a>
          )}
          <a href="/jobs" style={{ textDecoration: 'none' }}>
            <button className="btn btn-outline">🛠 Monitor Jobs</button>
          </a>
          <a href="/users" style={{ textDecoration: 'none' }}>
            <button className="btn btn-outline">👥 View All Users</button>
          </a>
        </div>
      </div>

      {/* Platform info */}
      <div className="card" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>🇮🇳 Kerala Market</div>
        <p style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
          WorkConnect connects skilled local workers (electricians, plumbers, carpenters, and more) with customers across Kerala.
          All payments are cash-based. Workers are verified by this admin panel before being marked as trusted.
        </p>
      </div>
    </div>
  );
}
