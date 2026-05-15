// src/components/Badge.jsx — Status badge component
const CONFIG = {
  verified:     { label: '✓ Verified',    cls: 'badge-green' },
  pending:      { label: '⏳ Pending',    cls: 'badge-yellow' },
  rejected:     { label: '✕ Rejected',   cls: 'badge-red' },
  available:    { label: '🟢 Available',  cls: 'badge-green' },
  busy:         { label: '🟡 Busy',       cls: 'badge-yellow' },
  offline:      { label: '🔴 Offline',    cls: 'badge-gray' },
  open:         { label: '🔍 Open',       cls: 'badge-blue' },
  accepted:     { label: '✅ Accepted',   cls: 'badge-blue' },
  in_progress:  { label: '🚗 In Progress',cls: 'badge-yellow' },
  completed:    { label: '🎉 Completed',  cls: 'badge-green' },
  cancelled:    { label: '✕ Cancelled',  cls: 'badge-red' },
  customer:     { label: '🙋 Customer',   cls: 'badge-blue' },
  worker:       { label: '🔧 Worker',     cls: 'badge-gray' },
  urgent:       { label: '🔴 Urgent',     cls: 'badge-red' },
  normal:       { label: '🟢 Normal',     cls: 'badge-green' },
};

export default function Badge({ type }) {
  const cfg = CONFIG[type] || { label: type, cls: 'badge-gray' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}
