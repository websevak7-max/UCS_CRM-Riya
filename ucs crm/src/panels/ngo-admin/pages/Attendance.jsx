import { useState, useEffect } from 'react';
import { apiGet } from '../api/auth';

export default function NgoAttendance() {
  const [records, setRecords] = useState([]);
  const [froWorkers, setFroWorkers] = useState([]);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [err, setErr] = useState('');

  useEffect(() => {
    apiGet('/attendance/all').then(setRecords).catch(e => setErr(e.message));
    apiGet('/ngo-admin/fro-workers').then(setFroWorkers).catch(() => {});
  }, []);

  const froIds = new Set(froWorkers.map(w => w.id));

  const [year, m] = month.split('-');
  const monthRecords = records.filter(r => {
    const d = r.date || '';
    return d.startsWith(`${year}-${m}`) && froIds.has(r.worker_id);
  });

  const grouped = {};
  monthRecords.forEach(r => {
    if (!grouped[r.worker_id]) grouped[r.worker_id] = { workerName: r.workers?.name || 'Unknown', days: {} };
    grouped[r.worker_id].days[r.date] = r;
  });

  let entries = Object.entries(grouped);

  if (search) {
    const s = search.toLowerCase();
    entries = entries.filter(([, g]) => g.workerName.toLowerCase().includes(s));
  }

  const daysInMonth = new Date(parseInt(year), parseInt(m), 0).getDate();
  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));

  const statusColor = (status) => {
    if (status === 'present') return '#10b981';
    if (status === 'late') return '#f59e0b';
    if (status === 'absent') return '#ef4444';
    if (status === 'half-day') return '#8b5cf6';
    if (status === 'leave') return '#3b82f6';
    return '#d1d5db';
  };

  const countStatus = (days, status) => Object.values(days).filter(d => d.status === status).length;

  const stats = monthRecords.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>FRO Attendance</h3></div>
        <div className="card-pad">
          {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#991b1b' }}>{err}</div>}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              style={{ fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--line, #e5e7eb)' }} />
            <input placeholder="Search worker…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--line, #e5e7eb)', flex: 1, maxWidth: 240 }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} style={{ fontSize: 13, color: '#6b7280' }}>
                <span style={{ color: statusColor(k), fontWeight: 600 }}>{k}</span>: {v}
              </div>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 2, minWidth: 140, textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line, #e5e7eb)' }}>Worker</th>
                  {dayHeaders.map(d => (
                    <th key={d} style={{ width: 28, padding: '4px 2px', textAlign: 'center', fontSize: 10, color: '#9ca3af', borderBottom: '1px solid var(--line, #e5e7eb)' }}>{d}</th>
                  ))}
                  <th style={{ minWidth: 32, padding: '4px 6px', textAlign: 'center', fontSize: 10, color: '#10b981', borderBottom: '1px solid var(--line, #e5e7eb)' }}>P</th>
                  <th style={{ minWidth: 32, padding: '4px 6px', textAlign: 'center', fontSize: 10, color: '#f59e0b', borderBottom: '1px solid var(--line, #e5e7eb)' }}>L</th>
                  <th style={{ minWidth: 32, padding: '4px 6px', textAlign: 'center', fontSize: 10, color: '#ef4444', borderBottom: '1px solid var(--line, #e5e7eb)' }}>A</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([wid, g]) => (
                  <tr key={wid}>
                    <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, padding: '6px 8px', borderBottom: '1px solid var(--line, #e5e7eb)', fontWeight: 500 }}>
                      {g.workerName}
                    </td>
                    {dayHeaders.map(d => {
                      const dateStr = `${year}-${m}-${d}`;
                      const rec = g.days[dateStr];
                      return (
                        <td key={d} style={{ padding: '4px 2px', textAlign: 'center', fontSize: 11, color: rec ? statusColor(rec.status) : '#e5e7eb', borderBottom: '1px solid var(--line, #e5e7eb)' }}>
                          {rec ? (rec.status === 'present' ? 'P' : rec.status === 'late' ? 'L' : rec.status === 'absent' ? 'A' : rec.status === 'half-day' ? 'HD' : rec.status === 'leave' ? 'LV' : '?') : '·'}
                        </td>
                      );
                    })}
                    <td style={{ fontWeight: 600, color: '#10b981', padding: '6px', textAlign: 'center', borderBottom: '1px solid var(--line, #e5e7eb)' }}>{countStatus(g.days, 'present') + countStatus(g.days, 'late')}</td>
                    <td style={{ fontWeight: 600, color: '#f59e0b', padding: '6px', textAlign: 'center', borderBottom: '1px solid var(--line, #e5e7eb)' }}>{countStatus(g.days, 'late')}</td>
                    <td style={{ fontWeight: 600, color: '#ef4444', padding: '6px', textAlign: 'center', borderBottom: '1px solid var(--line, #e5e7eb)' }}>{countStatus(g.days, 'absent')}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={daysInMonth + 4} style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>No FRO attendance records for this month</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}