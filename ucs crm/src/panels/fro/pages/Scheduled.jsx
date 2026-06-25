import { useState, useEffect } from 'react';
import { getMyDonors, getDonorDetail } from '../api/donors';

const TABS = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'callback', label: 'Callback' },
];

const statusStyles = {
  pending: { bg:'#fef3c7', color:'#92400e' },
  completed: { bg:'#dcfce7', color:'#166534' },
  missed: { bg:'#fef2f2', color:'#991b1b' },
};

export default function Scheduled() {
  const [tab, setTab] = useState('scheduled');
  const [donors, setDonors] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyDonors().then(async (list) => {
      setDonors(list);

      // Fetch detail for donors with scheduled/follow_up status to get next_schedule
      const scheduledIds = list.filter(d => d.status === 'scheduled' || d.status === 'follow_up').map(d => ({ id: d.id, ngo_id: d.ngo_id }));
      const results = await Promise.allSettled(
        scheduledIds.map(({ id, ngo_id }) => getDonorDetail(id, ngo_id))
      );
      const map = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value?.next_schedule) {
          map[scheduledIds[i].id] = r.value.next_schedule;
        }
      });
      setSchedules(map);
    }).catch(() => setDonors([]))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading…</div>;

  const scheduledList = donors.filter(d => d.status === 'scheduled');
  const callbackList = donors.filter(d => d.status === 'follow_up');
  const list = tab === 'scheduled' ? scheduledList : callbackList;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--line)', flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'10px 20px', border:'none', borderBottom: tab === t.id ? '2px solid var(--sage)' : '2px solid transparent', background:'transparent', fontSize:12, fontWeight:700, fontFamily:'inherit', cursor:'pointer', color: tab === t.id ? 'var(--sage)' : 'var(--ink-soft)', transition:'all .12s' }}>
            {t.label}
            <span style={{ marginLeft:6, fontSize:10, fontWeight:600, color:'var(--ink-soft)' }}>({(tab === 'scheduled' ? scheduledList : callbackList).length})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {list.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, fontSize:12, color:'var(--ink-soft)' }}>
            No {tab} donors.
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
              {list.map((d) => {
                const sch = schedules[d.id];
                return (
                  <tr key={d.id} style={{ borderBottom:'1px solid var(--line)' }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{d.donor_name || '—'}</td>
                    <td style={{ padding:'8px 10px' }}>{d.donor_mobile || '—'}</td>
                    <td style={{ padding:'8px 10px' }}>
                      {sch && !sch.is_completed ? new Date(sch.scheduled_at).toLocaleString('en-GB') : '—'}
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600, background: sch && !sch.is_completed && new Date(sch.scheduled_at) < new Date() ? '#fef2f2' : '#fef3c7', color: sch && !sch.is_completed && new Date(sch.scheduled_at) < new Date() ? '#991b1b' : '#92400e', textTransform:'capitalize' }}>
                        {sch && !sch.is_completed && new Date(sch.scheduled_at) < new Date() ? 'Overdue' : d.status?.replace(/_/g, ' ') || 'pending'}
                      </span>
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
