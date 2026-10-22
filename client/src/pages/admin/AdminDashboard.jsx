import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

import AdminOverview from './AdminOverview';
import AdminEmployees from './AdminEmployees';
import AdminClients from './AdminClients';
import AdminTargets from './AdminTargets';
import AdminDataNexus from './AdminDataNexus';
import AdminPayments from './AdminPayments';
import AdminSettings from './AdminSettings';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">
                    <span>Niti<span className="brand-accent">bridge</span> Admin</span>
                </div>
                <div className="navbar-nav">
                    <Link to="/admin" className="nav-link">Dashboard</Link>
                    <Link to="/admin/employees" className="nav-link">Employees</Link>
                    <Link to="/admin/clients" className="nav-link">Clients</Link>
                    <Link to="/admin/targets" className="nav-link">Targets</Link>
                    <Link to="/admin/payments" className="nav-link">Payments</Link>
                    <Link to="/admin/data-management" className="nav-link">Data Nexus</Link>
                    <Link to="/admin/settings" className="nav-link">Settings</Link>
                    <button onClick={handleLogout} className="btn btn-danger" style={{ marginLeft: '1rem', padding: '0.4rem 1rem' }}>Logout</button>
                </div>
            </nav>

            <main>
                <header style={{ marginBottom: '2rem' }}>
                    <h2>Welcome, {user.name}</h2>
                </header>
                
                <Routes>
                    <Route path="/" element={<AdminOverview />} />
                    <Route path="/employees" element={<AdminEmployees />} />
                    <Route path="/clients" element={<AdminClients />} />
                    <Route path="/targets" element={<AdminTargets />} />
                    <Route path="/payments" element={<AdminPayments />} />
                    <Route path="/data-management" element={<AdminDataNexus />} />
                    <Route path="/settings" element={<AdminSettings />} />
                </Routes>
            </main>
        </>
    );
};

export default AdminDashboard;
