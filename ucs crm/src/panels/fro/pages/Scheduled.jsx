import { useState, useEffect } from 'react';
import { getMyDonors, getDonorDetail } from '../api/donors';

const TABS = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'callback', label: 'Callback' },
];

const SCHEDULE_STATUSES = ['scheduled', 'follow_up', 'pending', 'contacted'];

export default function Scheduled() {
  const [tab, setTab] = useState('scheduled');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyDonors().then(async (list) => {
      // Fetch detail for all donors to find next_schedule entries
      const detailResults = await Promise.allSettled(
        list.map(d => getDonorDetail(d.id, d.ngo_id))
      );

      const items = [];
      detailResults.forEach((r, i) => {
        const d = list[i];
        if (r.status === 'fulfilled' && r.value?.next_schedule && !r.value.next_schedule.is_completed) {
          items.push({
            id: d.id,
            donor_name: d.donor_name,
            donor_mobile: d.donor_mobile,
            scheduled_at: r.value.next_schedule.scheduled_at,
            status: new Date(r.value.next_schedule.scheduled_at) < new Date() ? 'overdue' : 'pending',
          });
        }
      });

      // Also add donors with scheduled/follow_up status even if no next_schedule detail
      list.forEach(d => {
        if ((d.status === 'scheduled' || d.status === 'follow_up') && !items.find(i => i.id === d.id)) {
          items.push({
            id: d.id,
            donor_name: d.donor_name,
            donor_mobile: d.donor_mobile,
            scheduled_at: null,
            status: d.status,
          });
        }
      });

      setRows(items);
    }).catch(() => setRows([]))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading…</div>;

  const scheduledList = rows.filter(r => tab === 'scheduled' ? r.status !== 'follow_up' : r.status === 'follow_up');
  const list = tab === 'scheduled'
    ? rows.filter(r => r.status !== 'follow_up')
    : rows.filter(r => r.status === 'follow_up');

  const statusStyles = {
    pending: { bg:'#fef3c7', color:'#92400e' },
    overdue: { bg:'#fef2f2', color:'#991b1b' },
    scheduled: { bg:'#dbeafe', color:'#1e40af' },
    follow_up: { bg:'#e0e7ff', color:'#4338ca' },
    completed: { bg:'#dcfce7', color:'#166534' },
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--line)', flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'10px 20px', border:'none', borderBottom: tab === t.id ? '2px solid var(--sage)' : '2px solid transparent', background:'transparent', fontSize:12, fontWeight:700, fontFamily:'inherit', cursor:'pointer', color: tab === t.id ? 'var(--sage)' : 'var(--ink-soft)', transition:'all .12s' }}>
            {t.label}
            <span style={{ marginLeft:6, fontSize:10, fontWeight:600, color:'var(--ink-soft)' }}>
              ({t.id === 'scheduled' ? rows.filter(r => r.status !== 'follow_up').length : rows.filter(r => r.status === 'follow_up').length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {list.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, fontSize:12, color:'var(--ink-soft)' }}>
            No {tab} entries.
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--line)' }}>
                <th style={{ textAlign:'left', padding:'8px 10px', fontSize:10, fontWeight:600, textTransform:'uppercase', color:'var(--ink-soft)' }}>Donor</th>
                <th style={{ textAlign:'left', padding:'8px 10px', fontSize:10, fontWeight:600, textTransform:'uppercase', color:'var(--ink-soft)' }}>Mobile</th>
                <th style={{ textAlign:'left', padding:'8px 10px', fontSize:10, fontWeight:600, textTransform:'uppercase', color:'var(--ink-soft)' }}>Schedule</th>
                <th style={{ textAlign:'left', padding:'8px 10px', fontSize:10, fontWeight:600, textTransform:'uppercase', color:'var(--ink-soft)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const st = statusStyles[r.status] || statusStyles.pending;
                return (
                  <tr key={r.id} style={{ borderBottom:'1px solid var(--line)' }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{r.donor_name || '—'}</td>
                    <td style={{ padding:'8px 10px' }}>{r.donor_mobile || '—'}</td>
                    <td style={{ padding:'8px 10px' }}>{r.scheduled_at ? new Date(r.scheduled_at).toLocaleString('en-GB') : '—'}</td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600, background:st.bg, color:st.color, textTransform:'capitalize' }}>{r.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
