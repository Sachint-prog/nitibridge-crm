import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../api';

const ClientDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get('/client/dashboard');
                if (res.data.success) {
                    setPayments(res.data.payments);
                    setDeals(res.data.deals);
                }
            } catch (err) {
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">
                    <span>Niti<span className="brand-accent">bridge</span> Client Portal</span>
                </div>
                <div className="navbar-nav">
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '1rem', padding: '0.4rem 1rem' }}>Logout</button>
                </div>
            </nav>

            <main>
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="dashboard-grid">
                    <div className="glass-panel stat-card">
                        <h3>My Client ID</h3>
                        <div className="value">{user.userId}</div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Use this ID or your registered mobile number for future logins.</p>
                    </div>
                </div>

                {deals.length > 0 && (
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Active Deals Summary</h2>
                        <div className="dashboard-grid">
                            {deals.map(deal => (
                                <div key={deal._id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: '700', color: 'var(--primary)' }}>Deal Total: ₹{deal.totalAmount.toLocaleString()}</span>
                                        <span className={`badge ${deal.status === 'Paid' ? 'badge-success' : 'badge-warning'}`} style={{ backgroundColor: deal.status === 'Paid' ? 'var(--accent)' : 'var(--warning)', color: 'white' }}>{deal.status}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                        Collected: <strong>₹{deal.collectedAmount.toLocaleString()}</strong>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        Remaining: <strong style={{ color: 'var(--danger)' }}>₹{(deal.totalAmount - deal.collectedAmount).toLocaleString()}</strong>
                                    </div>
                                    <div style={{ marginTop: '1rem', height: '8px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(deal.collectedAmount / deal.totalAmount) * 100}%`, backgroundColor: 'var(--primary)' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="glass-panel">
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Payment History</h2>
                    {payments.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No payments recorded yet.</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Transaction ID</th>
                                        <th>Remarks</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(pay => (
                                        <tr key={pay._id}>
                                            <td>{new Date(pay.createdAt).toDateString()}</td>
                                            <td>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{pay.amount.toLocaleString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {pay.dealId ? `Installment for ₹${pay.dealId.totalAmount.toLocaleString()} Deal` : 'Single Payment'}
                                                </div>
                                            </td>
                                            <td style={{ fontFamily: 'monospace' }}>{pay.transactionId}</td>
                                            <td>{pay.remarks || 'None'}</td>
                                            <td>
                                                <span className="badge" style={{ background: 'var(--accent)', color: 'white' }}>Success</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
};

export default ClientDashboard;
