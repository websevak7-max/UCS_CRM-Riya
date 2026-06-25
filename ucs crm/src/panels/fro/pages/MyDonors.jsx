import { useState, useEffect, useCallback } from 'react';
import { getMyDonors, getDonorDetail, addDonorLog, uploadPaymentScreenshot, markDonorSeen } from '../api/donors';

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
const isConnected = (id) => CONNECTED_IDS.has(id);
const findDisp = (id) => ALL_DISPOSITIONS.find(d => d.id === id);

const STATUS_PILL_MAP = {
  pending: 'pill-yellow', contacted: 'pill-blue', scheduled: 'pill-purple',
  follow_up: 'pill-purple', busy: 'pill-gray', ringing: 'pill-gray',
  unreachable: 'pill-gray', switched_off: 'pill-gray', wrong_number: 'pill-gray',
  invalid_number: 'pill-gray', rejected: 'pill-red', lead_done: 'pill-green',
  visit_donate: 'pill-green', donation_collected: 'pill-green', promise_to_pay: 'pill-blue',
  payment_pending: 'pill-yellow', already_donated: 'pill-gray', not_interested: 'pill-red',
  not_interested_now: 'pill-red', language_barrier: 'pill-gray', transferred_senior: 'pill-blue',
  query_complaint: 'pill-yellow', receipt_request: 'pill-blue', payment_rejected: 'pill-red',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' }, { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' }, { value: 'scheduled', label: 'Scheduled' },
  { value: 'follow_up', label: 'Follow Up' }, { value: 'busy', label: 'Busy' },
  { value: 'ringing', label: 'Ringing' }, { value: 'unreachable', label: 'Unreachable' },
  { value: 'switched_off', label: 'Switched Off' }, { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'invalid_number', label: 'Invalid' }, { value: 'rejected', label: 'Rejected' },
  { value: 'lead_done', label: 'Lead Done' }, { value: 'visit_donate', label: 'Visit & Donate' },
  { value: 'promise_to_pay', label: 'Promise to Pay' }, { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'already_donated', label: 'Already Donated' }, { value: 'not_interested', label: 'Not Interested' },
  { value: 'not_interested_now', label: 'Not Interested Now' }, { value: 'language_barrier', label: 'Language Barrier' },
  { value: 'transferred_senior', label: 'Transferred to Senior' }, { value: 'query_complaint', label: 'Query/Complaint' },
  { value: 'receipt_request', label: 'Receipt Request' }, { value: 'donation_collected', label: 'Donation Collected' },
  { value: 'payment_rejected', label: 'Payment Rejected' },
];

const initials = (name) => (name || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export default function MyDonors() {
  const [donors, setDonors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [panNumber, setPanNumber] = useState('');
  const [addressField, setAddressField] = useState('');
  const [dobField, setDobField] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    getMyDonors(filterStatus).then(r => { setDonors(r); setMessage(null); }).catch(err => setMessage({ type: 'error', text: err.message })).finally(() => setLoading(false));
  }, [filterStatus]);

  useEffect(() => { setIndex(0); }, [donors.length]);

  const donor = donors[index];
  const logs = detail?.logs || [];
  const totalCollected = detail?.total_collected || 0;
  const nextSchedule = detail?.next_schedule;

  const loadDetail = useCallback(() => {
    if (!donor) return;
    setDetailLoading(true);
    if (donor.is_new) {
      markDonorSeen(donor.id, donor.ngo_id).then(() => {
        setDonors(prev => prev.map(d =>
          d.id === donor.id && d.ngo_id === donor.ngo_id ? { ...d, is_new: false } : d
        ));
      }).catch(err => console.error('markDonorSeen error:', err));
    }
    getDonorDetail(donor.id, donor.ngo_id).then(setDetail).catch(err => console.error('getDonorDetail error:', err)).finally(() => setDetailLoading(false));
  }, [donor?.id, donor?.ngo_id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const handleDropdownChange = (detailId) => {
    setSelected(detailId);
    setMessage(null);
    if (detailId === 'scheduled') {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5 - now.getTimezoneOffset());
      setScheduledAt(now.toISOString().slice(0, 16));
    }
    if (detailId !== 'lead_done') {
      setPaymentAmount(''); setPaymentScreenshot(null); setPanNumber(''); setAddressField(''); setDobField('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPaymentScreenshot({ base64: reader.result.split(',')[1], mime_type: file.type });
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selected) { setMessage({ type: 'error', text: 'Select a disposition' }); return; }
    if (selected === 'scheduled' && !scheduledAt) { setMessage({ type: 'error', text: 'Select date & time' }); return; }
    if (selected === 'lead_done') {
      if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
        setMessage({ type: 'error', text: 'Enter a valid payment amount' }); return;
      }
    }
    setSaving(true); setMessage(null); setUploading(false);
    try {
      let screenshotUrl = null;
      if (selected === 'lead_done' && paymentScreenshot) {
        setUploading(true);
        screenshotUrl = (await uploadPaymentScreenshot(paymentScreenshot.base64, paymentScreenshot.mime_type)).file_url;
      }
      const logData = {
        action: 'disposition',
        disposition_category: isConnected(selected) ? 'connected' : 'not_connected',
        disposition_detail: selected,
        notes: notes || null,
        ngo_id: donor.ngo_id,
      };
      if (selected === 'scheduled') logData.scheduled_at = new Date(scheduledAt + ':00').toISOString();
      if (selected === 'lead_done') {
        logData.amount_collected = parseFloat(paymentAmount);
        if (screenshotUrl) logData.payment_screenshot_url = screenshotUrl;
        if (panNumber) logData.pan_number = panNumber;
        if (addressField) logData.donor_address = addressField;
        if (dobField) logData.donor_dob = dobField;
      }
      await addDonorLog(donor.id, logData);
      setMessage({ type: 'success', text: selected === 'lead_done' ? 'Sent to Accounts for review' : 'Disposition logged' });
      setSelected(null); setNotes(''); setPaymentAmount(''); setPaymentScreenshot(null);
      setPanNumber(''); setAddressField(''); setDobField('');
      loadDetail();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally { setSaving(false); setUploading(false); }
  };

  if (loading) return <div className="loading">Loading donors...</div>;

  if (donors.length === 0) {
    return (
      <div className="bento-grid">
        <div className="bento-col-12">
          <div className="bento-card" style={{ alignItems: 'center', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: .3 }}>👫</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No donors assigned</div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Your assigned donors will appear here once assigned.</div>
          </div>
        </div>
      </div>
    );
  }

  const timelineIcon = (log) => {
    if (log.action === 'disposition') return log.disposition_category === 'connected' ? 'check_circle' : 'cancel';
    const map = { call: 'call', visit: 'home', message: 'mail', follow_up: 'history', donation: 'payments', note: 'note' };
    return map[log.action] || 'circle';
  };

  const formatTime = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase();

  const statusPill = (status) => {
    const label = status ? status.replace(/_/g, ' ') : 'unknown';
    return <span className={`pill ${STATUS_PILL_MAP[status] || 'pill-gray'}`}>{label}</span>;
  };

  return (
    <div className="detail-split">
      {/* LEFT PANEL */}
      <div className="detail-left">
        {/* Avatar + Name + Phone card */}
        <div className="detail-card" style={{ flexShrink: 0 }}>
          <div style={{ padding: '16px 14px 12px', textAlign: 'center' }}>
            <div className="detail-avatar">{initials(donor.donor_name)}</div>
            <div className="detail-name">
              {donor.donor_name}
              {donor.is_new && (
                <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 4, background: '#16a34a', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: .5, verticalAlign: 'middle' }}>NEW</span>
              )}
            </div>
            <div className="detail-phone">{donor.donor_mobile || '—'}</div>
            {statusPill(donor.status || 'pending')}
            {donor.ngo_name && (
              <div style={{ marginTop: 6 }}>
                <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '1px 7px', borderRadius: 999, fontSize: 8, fontWeight: 700 }}>{donor.ngo_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fields card */}
        <div className="detail-card" style={{ flex: 1, minHeight: 0 }}>
          <div className="detail-card-head">
            <span>Donor Details</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '2px 6px', fontSize: 9, fontFamily: 'inherit', outline: 'none' }}>
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="detail-card-scroll">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="detail-field-row">
                <div className="fld">
                  <label>Name</label>
                  <div className="val">{donor.donor_name || '—'}</div>
                </div>
                <div className="fld">
                  <label>Mobile</label>
                  <div className="val">{donor.donor_mobile || '—'}</div>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="fld">
                  <label>City</label>
                  <div className="val">{donor.donor_city || 'NA'}</div>
                </div>
                <div className="fld fld-sm">
                  <label>Amount</label>
                  <div className="val">₹{Number(donor.donor_amount || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="fld">
                  <label>Email</label>
                  <div className="val" style={{ fontStyle: donor.donor_email ? 'normal' : 'italic', color: donor.donor_email ? 'inherit' : 'var(--ink-soft)' }}>{donor.donor_email || 'No email'}</div>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="fld">
                  <label>Project</label>
                  <div className="val">{donor.donor_project || '—'}</div>
                </div>
                <div className="fld">
                  <label>Donations</label>
                  <div className="val">{donor.donation_count || 0} time{donor.donation_count !== 1 ? 's' : ''} (₹{Number(donor.total_donated || 0).toLocaleString('en-IN')})</div>
                </div>
              </div>
              {donor.donor_address && (
                <div className="detail-field-row">
                  <div className="fld">
                    <label>Address</label>
                    <div className="val">{donor.donor_address}</div>
                  </div>
                </div>
              )}
              {donor.donor_pan && (
                <div className="detail-field-row">
                  <div className="fld">
                    <label>PAN</label>
                    <div className="val">{donor.donor_pan}</div>
                  </div>
                </div>
              )}
              {donor.donor_dob && (
                <div className="detail-field-row">
                  <div className="fld">
                    <label>DOB</label>
                    <div className="val">{donor.donor_dob}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status block */}
        {nextSchedule && !nextSchedule.is_completed && (
          <div className="detail-status-block" style={{
            background: new Date(nextSchedule.scheduled_at) < new Date() ? 'var(--md-error-container, #fef2f2)' : '#e0f2fe',
            color: new Date(nextSchedule.scheduled_at) < new Date() ? 'var(--md-error, #dc2626)' : '#0369a1',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{new Date(nextSchedule.scheduled_at) < new Date() ? 'warning' : 'schedule'}</span>
            {new Date(nextSchedule.scheduled_at) < new Date() ? 'Overdue schedule' : 'Next: ' + new Date(nextSchedule.scheduled_at).toLocaleString()}
          </div>
        )}
        {donor.status === 'payment_rejected' && (
          <div className="detail-status-block" style={{ background: 'var(--md-error-container, #fef2f2)', color: 'var(--md-error, #dc2626)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
            Payment rejected by Accounts
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="detail-right">
        {message && (
          <div className={`detail-message ${message.type}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{message.type === 'error' ? 'error' : 'check_circle'}</span>
            {message.text}
          </div>
        )}

        {/* Dropdowns + Notes card */}
        <div className="detail-card" style={{ flex: 1, minHeight: 0 }}>
          <div className="detail-card-head">Connection Status</div>
          <div className="detail-card-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="detail-dropdown-row">
              <div className="dd">
                <label>Connected</label>
                <select value={selected !== null && isConnected(selected) ? selected : ''} onChange={e => { if (e.target.value) handleDropdownChange(e.target.value); }}
                  style={{ borderColor: selected !== null && isConnected(selected) ? '#16a34a' : undefined }}>
                  <option value="">— Select —</option>
                  {CONNECTED.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </div>
              <div className="dd">
                <label>Not Connected</label>
                <select value={selected !== null && !isConnected(selected) ? selected : ''} onChange={e => { if (e.target.value) handleDropdownChange(e.target.value); }}
                  style={{ borderColor: selected !== null && !isConnected(selected) ? '#dc2626' : undefined }}>
                  <option value="">— Select —</option>
                  {NOT_CONNECTED.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            {/* Extra fields for scheduled */}
            {selected === 'scheduled' && (
              <div className="detail-field-row">
                <div className="fld">
                  <label>Schedule Date & Time</label>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                </div>
              </div>
            )}

            {/* Extra fields for lead_done */}
            {selected === 'lead_done' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="detail-field-row">
                  <div className="fld">
                    <label>Amount (₹)</label>
                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} min="1" placeholder="Enter amount" />
                  </div>
                </div>
                <div className="detail-field-row">
                  <div className="fld">
                    <label>Screenshot</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: 10, padding: '3px 0' }} />
                    {paymentScreenshot && <span style={{ fontSize: 9, color: 'var(--sage)' }}> ✓ Selected</span>}
                  </div>
                  <div className="fld">
                    <label>PAN</label>
                    <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                </div>
                {!donor.donor_address && (
                  <div className="detail-field-row">
                    <div className="fld">
                      <label>Address</label>
                      <input type="text" value={addressField} onChange={e => setAddressField(e.target.value)} placeholder="Donor address" />
                    </div>
                  </div>
                )}
                {!donor.donor_dob && (
                  <div className="detail-field-row">
                    <div className="fld">
                      <label>DOB</label>
                      <input type="date" value={dobField} onChange={e => setDobField(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="detail-notes">
              <label style={{ display: 'block', fontSize: 9, fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add notes here..." />
            </div>
          </div>
        </div>

        {/* Timeline card */}
        <div className="detail-card" style={{ flex: 1, minHeight: 0 }}>
          <div className="detail-card-head">
            <span>CRM Timeline</span>
            {totalCollected > 0 && <span style={{ color: 'var(--sage)', fontSize: 10 }}>₹{totalCollected.toLocaleString('en-IN')}</span>}
          </div>
          <div className="detail-card-scroll">
            {detailLoading ? (
              <div className="empty-timeline">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="empty-timeline">No activity yet.</div>
            ) : (
              <div className="detail-timeline-list">
                {logs.slice(0, 12).map(log => {
                  const isDisp = log.action === 'disposition';
                  const cat = log.disposition_category;
                  const icon = timelineIcon(log);
                  const connected = isDisp && cat === 'connected';
                  const lbl = isDisp ? (log.disposition_detail?.replace(/_/g, ' ') || '') : log.action.replace(/_/g, ' ');
                  const bg = isDisp ? (connected ? '#f0fdf4' : '#fef2f2') : 'var(--bg)';
                  return (
                    <div key={log.id} className="detail-timeline-item" style={{ background: bg }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, color: connected ? 'var(--sage)' : 'var(--md-error, #dc2626)', flexShrink: 0, marginTop: 1 }}>{icon}</span>
                      <div className="tl-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="tl-lbl">{lbl}</span>
                          <span className="tl-time">{formatTime(log.created_at)}</span>
                        </div>
                        {log.notes && <div className="tl-note">{log.notes}</div>}
                        {log.amount_collected && <div className="tl-note" style={{ color: 'var(--sage)', fontWeight: 600 }}>₹{Number(log.amount_collected).toLocaleString('en-IN')}</div>}
                        {log.disposition_detail === 'lead_done' && (
                          <span style={{ fontSize: 8, fontWeight: 700, background: 'var(--md-tertiary-fixed, #e0e7ff)', padding: '1px 4px', borderRadius: 2, textTransform: 'uppercase', display: 'inline-block', marginTop: 1 }}>
                            {log.accounts_status === 'verified' ? 'Verified' : log.accounts_status === 'rejected' ? 'Rejected' : 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {logs.length > 12 && <div className="empty-timeline" style={{ padding: '8px 0' }}>+{logs.length - 12} more</div>}
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="detail-action-bar">
          <span className="counter">{index + 1} of {donors.length}</span>
          <button className="btn-prev" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>← Prev</button>
          <button className="btn-next"
            disabled={saving || uploading}
            onClick={handleSave}>
            {uploading ? 'Uploading...' : saving ? 'Saving...' : selected === 'lead_done' ? 'Send to Accounts' : selected ? `Log ${findDisp(selected)?.label || selected}` : 'NEXT'}
          </button>
          <button className="btn-prev" disabled={index === donors.length - 1} onClick={() => setIndex(i => i + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
