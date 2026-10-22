import React, { useEffect, useState } from 'react';
import axios from '../../api';

const EmployeeFollowups = () => {
    const [followups, setFollowups] = useState([]);
    const [myClients, setMyClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ clientId: '', date: '', remarks: '' });

    useEffect(() => {
        fetchFollowups();
    }, []);

    const fetchFollowups = async () => {
        try {
            const res = await axios.get('/followup');
            if (res.data.success) {
                setFollowups(res.data.followUps);
                setMyClients(res.data.myClients);
                if (res.data.myClients.length > 0) {
                    setFormData(prev => ({ ...prev, clientId: res.data.myClients[0]._id }));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/followup', formData);
            if (res.data.success) {
                setShowModal(false);
                setFormData({ clientId: myClients.length > 0 ? myClients[0]._id : '', date: '', remarks: '' });
                fetchFollowups();
                alert(res.data.message);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Error scheduling follow-up');
        }
    };

    const handleStatus = async (id, status) => {
        try {
            await axios.post(`/followup/toggle-status/${id}`, { status });
            fetchFollowups();
        } catch (err) {
            alert('Error updating status');
        }
    };

    if (loading) return <div>Loading follow-ups...</div>;

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'nowrap' }}>
                <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>Follow-ups</h2>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>+ Schedule</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem 0.5rem' }}>Client</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Scheduled For</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Remarks</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                        <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {followups.map(fu => (
                        <tr key={fu._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>
                                {fu.clientId?.name || 'Unknown'}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fu.clientId?.contactNumber}</div>
                            </td>
                            <td style={{ padding: '1rem 0.5rem' }}>{new Date(fu.date).toLocaleString()}</td>
                            <td style={{ padding: '1rem 0.5rem' }}>{fu.remarks}</td>
                            <td style={{ padding: '1rem 0.5rem' }}>
                                <span style={{
                                    color: fu.status === 'Completed' ? 'var(--success)' : fu.status === 'Overdue' ? 'var(--danger)' : 'var(--text-muted)',
                                    fontWeight: '600'
                                }}>{fu.status}</span>
                            </td>
                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                {fu.status !== 'Completed' && (
                                    <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleStatus(fu._id, 'Completed')}>Mark Done</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {followups.length === 0 && (
                        <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No follow-ups scheduled.</td></tr>
                    )}
                </tbody>
            </table>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', paddingTop: '10vh' }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px', background: 'var(--white)', margin: '0 auto' }}>
                        <h3>Schedule Follow-up</h3>
                        {myClients.length === 0 ? (
                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ padding: '1rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', marginBottom: '1.5rem' }}>
                                    You must add a client to your directory before you can schedule a follow-up.
                                </div>
                                <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowModal(false)}>Close</button>
                            </div>
                        ) : (
                            <form onSubmit={handleAdd} style={{ marginTop: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Client</label>
                                    <select className="form-control" required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                                        {myClients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.contactNumber})</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date & Time</label>
                                    <input type="datetime-local" className="form-control" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Remarks</label>
                                    <input type="text" className="form-control" required value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Schedule</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
export default EmployeeFollowups;
