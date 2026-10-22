import React, { useEffect, useState } from 'react';
import axios from '../../api';
import Pagination from '../../components/Pagination';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSS, setSelectedSS] = useState(null);
    
    const [filterClient, setFilterClient] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    // Edit modal state
    const [editPayment, setEditPayment] = useState(null); // payment being edited
    const [editForm, setEditForm] = useState({ amount: '', transactionId: '', remarks: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await axios.get('/admin/payments');
            if (res.data.success) {
                setPayments(res.data.payments);
            }
        } catch (err) {
            setError('Failed to load payments.');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (p) => {
        setEditPayment(p);
        setEditForm({
            amount: p.amount,
            transactionId: p.transactionId,
            remarks: p.remarks || ''
        });
        setEditError('');
    };

    const closeEditModal = () => {
        setEditPayment(null);
        setEditError('');
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError('');
        try {
            const res = await axios.put(`/admin/payment/${editPayment._id}`, {
                amount: Number(editForm.amount),
                transactionId: editForm.transactionId,
                remarks: editForm.remarks
            });
            if (res.data.success) {
                // Update local state
                setPayments(prev => prev.map(p => p._id === editPayment._id ? res.data.payment : p));
                closeEditModal();
            }
        } catch (err) {
            setEditError(err.response?.data?.error || 'Failed to update payment.');
        } finally {
            setEditLoading(false);
        }
    };

    if (loading) return <div>Loading payments...</div>;

    const filteredPayments = payments.filter(p => {
        const clientMatch = (p.clientId?.name || p.clientName || '').toLowerCase().includes(filterClient.toLowerCase()) || (p.clientId?.userId || '').toLowerCase().includes(filterClient.toLowerCase());
        const employeeMatch = (p.employeeId?.name || '').toLowerCase().includes(filterEmployee.toLowerCase()) || (p.employeeId?.userId || '').toLowerCase().includes(filterEmployee.toLowerCase());
        const statusMatch = filterStatus === 'All' || 
                           (filterStatus === 'Deal' && p.dealId) || 
                           (filterStatus === 'Single' && !p.dealId) ||
                           (filterStatus === 'Paid' && p.dealId?.status === 'Paid') ||
                           (filterStatus === 'Partial' && p.dealId?.status === 'Partial');
        return clientMatch && employeeMatch && statusMatch;
    });

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredPayments.slice(indexOfFirstEntry, indexOfLastEntry);

    // Compute live split for edit modal preview
    const editTotal = Number(editForm.amount) || 0;
    const editCutoff = Math.floor(editTotal * 0.5);
    const editNormal = editTotal - editCutoff;

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Collections &amp; Payments</h2>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label className="form-label">Search Client</label>
                    <input type="text" className="form-control" placeholder="Name or ID..." value={filterClient} onChange={e => {setFilterClient(e.target.value); setCurrentPage(1);}} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label className="form-label">Search Employee</label>
                    <input type="text" className="form-control" placeholder="Name or ID..." value={filterEmployee} onChange={e => {setFilterEmployee(e.target.value); setCurrentPage(1);}} />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label">Payment Type</label>
                    <select className="form-control" value={filterStatus} onChange={e => {setFilterStatus(e.target.value); setCurrentPage(1);}}>
                        <option value="All">All Payments</option>
                        <option value="Deal">All Deals</option>
                        <option value="Partial">Partial Deals Only</option>
                        <option value="Paid">Fully Paid Deals</option>
                        <option value="Single">Single Payments</option>
                    </select>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Client Info</th>
                            <th>Collected By</th>
                            <th>Total Amount</th>
                            <th style={{ color: '#0d9488' }}>Normal (50%)</th>
                            <th style={{ color: '#f59e0b' }}>Cut-off (50%)</th>
                            <th>Deal Progress</th>
                            <th>Transaction ID</th>
                            <th>Proof</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentEntries.map(p => {
                            // Use stored values if present, else compute on-the-fly for old records
                            const normal = p.normalAmount > 0 ? p.normalAmount : (p.amount - Math.floor(p.amount * 0.5));
                            const cutoff = p.cutoffAmount > 0 ? p.cutoffAmount : Math.floor(p.amount * 0.5);
                            return (
                                <tr key={p._id}>
                                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{p.clientId?.name || p.clientName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.clientId?.companyName || p.companyName}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{p.employeeId?.name || 'Unknown'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {p.employeeId?.userId}</div>
                                    </td>
                                    <td style={{ color: 'var(--primary)', fontWeight: '700' }}>₹{p.amount.toLocaleString()}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.2rem 0.6rem',
                                            backgroundColor: 'rgba(13,148,136,0.1)',
                                            color: '#0d9488',
                                            borderRadius: '6px',
                                            fontWeight: '700',
                                            fontSize: '0.9rem'
                                        }}>
                                            ₹{normal.toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.2rem 0.6rem',
                                            backgroundColor: 'rgba(245,158,11,0.1)',
                                            color: '#f59e0b',
                                            borderRadius: '6px',
                                            fontWeight: '700',
                                            fontSize: '0.9rem'
                                        }}>
                                            ₹{cutoff.toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        {p.dealId ? (
                                            <div style={{ fontSize: '0.8rem' }}>
                                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                                    Collected: ₹{p.dealId.collectedAmount.toLocaleString()} / ₹{p.dealId.totalAmount.toLocaleString()}
                                                </div>
                                                <div style={{ fontWeight: '600', marginTop: '0.2rem', color: p.dealId.status === 'Paid' ? 'var(--accent)' : 'var(--warning)' }}>
                                                    {p.dealId.status} ({Math.round((p.dealId.collectedAmount / p.dealId.totalAmount) * 100)}%)
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Single Payment</span>
                                        )}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.transactionId}</td>
                                    <td>
                                        {p.paymentSS ? (
                                            <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', width: 'auto' }} onClick={() => setSelectedSS(p.paymentSS)}>
                                                View SS
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>No Proof</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => openEditModal(p)}
                                            style={{
                                                background: 'none',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '6px',
                                                padding: '0.3rem 0.6rem',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                color: 'var(--text-main)',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Edit Payment"
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.color = '#0d9488'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                                        >
                                            ✏️
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {currentEntries.length === 0 && (
                            <tr><td colSpan="10" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No payments found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination 
                totalEntries={filteredPayments.length}
                entriesPerPage={entriesPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onEntriesPerPageChange={(val) => {setEntriesPerPage(val); setCurrentPage(1);}}
            />

            {/* Screenshot Modal */}
            {selectedSS && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setSelectedSS(null)}>
                    <div style={{ maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img src={`https://nitibridge-crm-ieqw.onrender.com${selectedSS}`} alt="Payment Proof" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }} />
                        <p style={{ color: 'white', textAlign: 'center', marginTop: '1.5rem', fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.5rem 1.5rem', borderRadius: '20px' }}>Click anywhere to close</p>
                    </div>
                </div>
            )}

            {/* Edit Payment Modal */}
            {editPayment && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '480px', background: 'var(--white)', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Edit Payment</h3>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                    {editPayment.clientId?.name || editPayment.clientName} · {new Date(editPayment.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <button
                                onClick={closeEditModal}
                                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            {/* Amount */}
                            <div className="form-group">
                                <label className="form-label">Total Amount (₹)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    required
                                    min="1"
                                    value={editForm.amount}
                                    onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                />
                                {/* Live Split Preview inside Edit Modal */}
                                {editTotal > 0 && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: 'rgba(13, 148, 136, 0.08)',
                                        border: '1px solid rgba(13, 148, 136, 0.3)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Normal (50%)</div>
                                            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0d9488' }}>₹{editNormal.toLocaleString()}</div>
                                        </div>
                                        <div style={{ width: '1px', backgroundColor: 'rgba(13,148,136,0.3)' }} />
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Cut-off (50%)</div>
                                            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f59e0b' }}>₹{editCutoff.toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Transaction ID */}
                            <div className="form-group">
                                <label className="form-label">Transaction ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    value={editForm.transactionId}
                                    onChange={e => setEditForm({ ...editForm, transactionId: e.target.value })}
                                />
                            </div>

                            {/* Remarks */}
                            <div className="form-group">
                                <label className="form-label">Remarks</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Optional remarks"
                                    value={editForm.remarks}
                                    onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                                />
                            </div>

                            {editError && (
                                <div style={{ padding: '0.6rem 1rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    {editError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeEditModal} disabled={editLoading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={editLoading}>
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPayments;
