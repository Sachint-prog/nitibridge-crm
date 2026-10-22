import React, { useEffect, useState, useRef } from 'react';
import axios from '../../api';

const EmployeeClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    
    const [clientForm, setClientForm] = useState({ 
        name: '', contactNumber: '', companyName: '', state: '', district: '', email: '', clientType: 'Cold',
        shouldFollowUp: false, followUpDate: '', followUpRemarks: '' 
    });
    const [paymentForm, setPaymentForm] = useState({ 
        clientContact: '', 
        amount: '', 
        remarks: '', 
        transactionId: '', 
        paymentSS: null,
        isNewDeal: true,
        totalAmount: '',
        dealId: ''
    });
    const [activeDeals, setActiveDeals] = useState([]);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            // Re-using dashboard endpoint since it returns my clients
            const res = await axios.get('/employee/dashboard');
            if (res.data.success) {
                setClients(res.data.clients);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClient = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/employee/client', clientForm);
            if (res.data.success) {
                setShowAddModal(false);
                setClientForm({ 
                    name: '', contactNumber: '', companyName: '', state: '', district: '', email: '', clientType: 'Cold',
                    shouldFollowUp: false, followUpDate: '', followUpRemarks: '' 
                });
                fetchClients();
                alert(res.data.message);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add client');
        }
    };

    const fetchDeals = async (contactNumber) => {
        try {
            const res = await axios.get(`/employee/deals/${contactNumber}`);
            if (res.data.success) {
                setActiveDeals(res.data.deals);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleClientChange = (contactNumber) => {
        setPaymentForm({ ...paymentForm, clientContact: contactNumber, dealId: '' });
        fetchDeals(contactNumber);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setPaymentForm({ ...paymentForm, paymentSS: e.dataTransfer.files[0] });
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('clientContact', paymentForm.clientContact);
            formData.append('amount', paymentForm.amount);
            formData.append('remarks', paymentForm.remarks);
            formData.append('transactionId', paymentForm.transactionId);
            formData.append('isNewDeal', paymentForm.isNewDeal);
            if (paymentForm.isNewDeal) {
                formData.append('totalAmount', paymentForm.totalAmount);
            } else {
                formData.append('dealId', paymentForm.dealId);
            }

            if (paymentForm.paymentSS) {
                formData.append('paymentSS', paymentForm.paymentSS);
            }

            const res = await axios.post('/employee/payment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.success) {
                setShowPaymentModal(false);
                setPaymentForm({ 
                    clientContact: '', amount: '', remarks: '', transactionId: '', paymentSS: null, 
                    isNewDeal: true, totalAmount: '', dealId: '' 
                });
                alert(res.data.message);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add payment');
        }
    };

    if (loading) return <div>Loading clients...</div>;

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'nowrap' }}>
                <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>My Client Directory</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowAddModal(true)}>+ New Client</button>
                    <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowPaymentModal(true)}>+ Add Payment</button>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem 0.5rem' }}>Name</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Company</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Contact Number</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Category</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map(c => (
                        <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>{c.name}</td>
                            <td style={{ padding: '1rem 0.5rem' }}>{c.companyName || '-'}</td>
                            <td style={{ padding: '1rem 0.5rem', fontFamily: 'monospace' }}>{c.contactNumber}</td>
                            <td style={{ padding: '1rem 0.5rem' }}>
                                <span className={`badge ${c.clientType.toLowerCase()}`}>{c.clientType}</span>
                            </td>
                        </tr>
                    ))}
                    {clients.length === 0 && (
                        <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>You haven't added any clients yet.</td></tr>
                    )}
                </tbody>
            </table>

            {/* Modals for Add Client and Add Payment */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', paddingTop: '10vh' }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px', background: 'var(--white)', margin: '0 auto' }}>
                        <h3>Add New Client</h3>
                        <form onSubmit={handleAddClient} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <input type="text" placeholder="Full Name" className="form-control" required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <input type="text" placeholder="Contact Number" className="form-control" required value={clientForm.contactNumber} onChange={e => setClientForm({...clientForm, contactNumber: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <input type="text" placeholder="Company Name" className="form-control" value={clientForm.companyName} onChange={e => setClientForm({...clientForm, companyName: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Client Category</label>
                                <select className="form-control" value={clientForm.clientType} onChange={e => setClientForm({...clientForm, clientType: e.target.value})}>
                                    <option value="Hot">Hot (High Priority)</option>
                                    <option value="Warm">Warm (Medium Priority)</option>
                                    <option value="Cold">Cold (Low Priority)</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: clientForm.shouldFollowUp ? '1rem' : 0 }}>
                                    <input type="checkbox" checked={clientForm.shouldFollowUp} onChange={e => setClientForm({...clientForm, shouldFollowUp: e.target.checked})} />
                                    <span style={{ fontWeight: '600' }}>Schedule a Follow-up?</span>
                                </label>
                                
                                {clientForm.shouldFollowUp && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        <div>
                                            <label className="form-label">Follow-up Date</label>
                                            <input type="date" className="form-control" required={clientForm.shouldFollowUp} value={clientForm.followUpDate} onChange={e => setClientForm({...clientForm, followUpDate: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="form-label">Follow-up Remarks</label>
                                            <textarea placeholder="What to discuss?" className="form-control" style={{ minHeight: '80px', resize: 'vertical' }} value={clientForm.followUpRemarks} onChange={e => setClientForm({...clientForm, followUpRemarks: e.target.value})} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Client</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPaymentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', paddingTop: '10vh' }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px', background: 'var(--white)', margin: '0 auto' }}>
                        <h3>Register Payment</h3>
                        <form onSubmit={handleAddPayment} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Client</label>
                                <select className="form-control" required value={paymentForm.clientContact} onChange={e => handleClientChange(e.target.value)}>
                                    <option value="" disabled>Select Client...</option>
                                    {clients.map(c => <option key={c._id} value={c.contactNumber}>{c.name} ({c.contactNumber})</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" name="paymentMode" checked={paymentForm.isNewDeal} onChange={() => setPaymentForm({...paymentForm, isNewDeal: true})} />
                                    New Deal
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" name="paymentMode" checked={!paymentForm.isNewDeal} onChange={() => setPaymentForm({...paymentForm, isNewDeal: false})} />
                                    Installment
                                </label>
                            </div>

                            {paymentForm.isNewDeal ? (
                                <div className="form-group">
                                    <label className="form-label">Total Deal Amount (₹)</label>
                                    <input type="number" placeholder="Total Deal Value" className="form-control" required value={paymentForm.totalAmount} onChange={e => setPaymentForm({...paymentForm, totalAmount: e.target.value})} />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">Select Active Deal</label>
                                    <select className="form-control" required={!paymentForm.isNewDeal} value={paymentForm.dealId} onChange={e => setPaymentForm({...paymentForm, dealId: e.target.value})}>
                                        <option value="" disabled>Select Deal...</option>
                                        {activeDeals.map(d => (
                                            <option key={d._id} value={d._id}>
                                                Total: ₹{d.totalAmount} | Balance: ₹{d.totalAmount - d.collectedAmount}
                                            </option>
                                        ))}
                                        {activeDeals.length === 0 && <option value="" disabled>No active deals found for this client</option>}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">{paymentForm.isNewDeal ? 'Initial Payment (₹)' : 'Installment Amount (₹)'}</label>
                                <input type="number" placeholder="Amount (₹)" className="form-control" required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                                
                                {/* Live Cut-off Split Preview */}
                                {paymentForm.amount && Number(paymentForm.amount) > 0 && (() => {
                                    const total = Number(paymentForm.amount);
                                    const cutoff = Math.floor(total * 0.5);
                                    const normal = total - cutoff;
                                    return (
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
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Normal (50%)</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0d9488' }}>₹{normal.toLocaleString()}</div>
                                            </div>
                                            <div style={{ width: '1px', backgroundColor: 'rgba(13,148,136,0.3)' }} />
                                            <div style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Cut-off (50%)</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>₹{cutoff.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Transaction ID</label>
                                <input type="text" placeholder="Transaction ID" className="form-control" required value={paymentForm.transactionId} onChange={e => setPaymentForm({...paymentForm, transactionId: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Remarks</label>
                                <input type="text" placeholder="Remarks (Optional)" className="form-control" value={paymentForm.remarks} onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Screenshot</label>
                                <div 
                                    className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        border: '2px dashed var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: isDragging ? 'rgba(38, 157, 157, 0.05)' : 'transparent',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {paymentForm.paymentSS ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--primary)', fontWeight: '600' }}>✓ {paymentForm.paymentSS.name}</span>
                                            <button type="button" className="btn-link" style={{ fontSize: '0.8rem', color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setPaymentForm({ ...paymentForm, paymentSS: null }); }}>Remove</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📁</div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                Drag & drop screenshot or <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Browse</span>
                                            </p>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        style={{ display: 'none' }} 
                                        accept="image/*" 
                                        onChange={e => setPaymentForm({...paymentForm, paymentSS: e.target.files[0]})} 
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default EmployeeClients;
