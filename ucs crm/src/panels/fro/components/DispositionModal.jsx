import { useState } from 'react';
import { addDonorLog } from '../api/donors';

const NOT_CONNECTED = [
  { id: 'busy', label: 'Busy' }, { id: 'ringing', label: 'Ringing' },
  { id: 'unreachable', label: 'Unreachable' }, { id: 'switched_off', label: 'Switched Off' },
  { id: 'wrong_number', label: 'Wrong Number' }, { id: 'invalid', label: 'Invalid' },
  { id: 'rejected', label: 'Rejected' },
];
const CONNECTED = [
  { id: 'lead_done', label: 'Lead Done' }, { id: 'scheduled', label: 'Schedule' },
  { id: 'visit_donate', label: 'Visit & Donate' }, { id: 'promise_to_pay', label: 'Promise to Pay' },
  { id: 'payment_pending', label: 'Payment Pending' }, { id: 'already_donated', label: 'Already Donated' },
  { id: 'not_interested_now', label: 'Not Interested Now' }, { id: 'language_barrier', label: 'Language Barrier' },
  { id: 'transferred_senior', label: 'Transferred to Senior' }, { id: 'query_complaint', label: 'Query/Complaint' },
  { id: 'receipt_request', label: 'Request Receipt/Info' },
];
const ALL_DISPOSITIONS = [...NOT_CONNECTED, ...CONNECTED];
const CONNECTED_IDS = new Set(CONNECTED.map(d => d.id));
const findDisp = (id) => ALL_DISPOSITIONS.find(d => d.id === id);

export default function DispositionModal({ donorId, ngoId, donorName, scheduledAt: origScheduledAt, onClose, onDone }) {
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const isOverdue = origScheduledAt && new Date(origScheduledAt) < new Date();

  const handleSave = async () => {
    if (!selected) { setMessage({ type: 'error', text: 'Select a disposition' }); return; }
    if (selected === 'scheduled' && !scheduledAt) { setMessage({ type: 'error', text: 'Select date & time' }); return; }
    setSaving(true);
    try {
      await addDonorLog(donorId, {
        action: 'disposition',
        disposition_category: CONNECTED_IDS.has(selected) ? 'connected' : 'not_connected',
        disposition_detail: selected,
        notes: notes || null,
        ngo_id: ngoId,
        ...(selected === 'scheduled' && { scheduled_at: new Date(scheduledAt + ':00').toISOString() }),
      });
      onDone();
      onClose();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.4)' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, width: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{donorName}</span>
          <span className="material-symbols-outlined" style={{ fontSize: 18, cursor: 'pointer', color: 'var(--ink-soft)' }} onClick={onClose}>close</span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {message && (
            <div style={{ padding: '6px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', color: message.type === 'error' ? '#dc2626' : '#16a34a', border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
              {message.text}
            </div>
          )}
          {!isOverdue && origScheduledAt && (
            <div style={{ padding: '6px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
              Already scheduled at {new Date(origScheduledAt).toLocaleString('en-GB')} — skip or log a new disposition
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>Connected</label>
            <select value={selected !== null && CONNECTED_IDS.has(selected) ? selected : ''} onChange={e => { if (e.target.value) { setSelected(e.target.value); if (e.target.value === 'scheduled') { const n = new Date(); n.setMinutes(n.getMinutes() + 5 - n.getTimezoneOffset()); setScheduledAt(n.toISOString().slice(0, 16)); } }}}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 5, fontSize: 11, fontFamily: 'inherit' }}>
              <option value="">— Select —</option>
              {CONNECTED.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>Not Connected</label>
            <select value={selected !== null && !CONNECTED_IDS.has(selected) ? selected : ''} onChange={e => { if (e.target.value) setSelected(e.target.value); }}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 5, fontSize: 11, fontFamily: 'inherit' }}>
              <option value="">— Select —</option>
              {NOT_CONNECTED.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          {selected === 'scheduled' && (
            <div>
              <label style={{ display: 'block', fontSize: 9, fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>Schedule Date & Time</label>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                style={{ width: '100%', padding: '5px 7px', border: '1px solid var(--line)', borderRadius: 5, fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add notes..."
              style={{ width: '100%', padding: 6, border: '1px solid var(--line)', borderRadius: 5, fontSize: 10, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onClose}
              style={{ padding: '7px 12px', border: '1px solid var(--line)', borderRadius: 6, background: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '7px 12px', border: 'none', borderRadius: 6, background: 'var(--sage)', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? .5 : 1 }}>
              {saving ? 'Saving...' : selected ? `Log ${findDisp(selected)?.label || selected}` : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
