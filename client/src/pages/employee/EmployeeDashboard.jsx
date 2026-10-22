import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from '../../api';

import EmployeeOverview from './EmployeeOverview';
import EmployeeClients from './EmployeeClients';
import EmployeeFollowups from './EmployeeFollowups';

const EmployeeDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [reminders, setReminders] = useState([]);

    useEffect(() => {
        const checkReminders = async () => {
            try {
                const res = await axios.get('/followup/upcoming');
                if (res.data.success) {
                    setReminders(res.data.upcoming);
                }
            } catch (err) {
                console.error('Reminder check failed');
            }
        };
        checkReminders();
        const interval = setInterval(checkReminders, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">
                    <span>Niti<span className="brand-accent">bridge</span> Employee</span>
                </div>
                <div className="navbar-nav">
                    <Link to="/employee" className="nav-link">Dashboard</Link>
                    <Link to="/employee/clients" className="nav-link">My Clients</Link>
                    <Link to="/employee/followups" className="nav-link">Follow-ups</Link>
                    <button onClick={handleLogout} className="btn btn-danger" style={{ marginLeft: '1rem', padding: '0.4rem 1rem' }}>Logout</button>
                </div>
            </nav>

            <main>
                <header style={{ marginBottom: '2rem' }}>
                    <h2>Welcome, {user.name}</h2>
                </header>
                
                <Routes>
                    <Route path="/" element={<EmployeeOverview />} />
                    <Route path="/clients" element={<EmployeeClients />} />
                    <Route path="/followups" element={<EmployeeFollowups />} />
                </Routes>

                {/* Global Reminders */}
                {reminders.length > 0 && (
                    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '350px' }}>
                        {reminders.map(rem => (
                            <div key={rem._id} className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--warning)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', backgroundColor: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <strong style={{ color: 'var(--primary)' }}>Upcoming Follow-up</strong>
                                    <button onClick={() => setReminders(reminders.filter(r => r._id !== rem._id))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>&times;</button>
                                </div>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                    <strong>{rem.clientId?.name}</strong> at {new Date(rem.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>{rem.remarks}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
};

export default EmployeeDashboard;
