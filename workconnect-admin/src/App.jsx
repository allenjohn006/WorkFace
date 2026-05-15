// src/App.jsx — Root app with routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Jobs from './pages/Jobs';
import Users from './pages/Users';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        {/* Main content — offset by sidebar width */}
        <main style={{ flex: 1, marginLeft: 240, padding: 32, maxWidth: 'calc(100vw - 240px)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
