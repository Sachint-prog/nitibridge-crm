import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
    const { login, user } = useContext(AuthContext);
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (user) {
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'employee') return <Navigate to="/employee" replace />;
        return <Navigate to="/client" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await login(userId, password);
            if (res.error) {
                setError(res.error);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="navbar-brand" style={{ justifyContent: 'center' }}>Niti<span className="brand-accent">bridge</span> CRM</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Welcome back! Please login to your account.</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="userId">User ID or Contact Number</label>
                        <input
                            type="text"
                            id="userId"
                            className="form-control"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                            placeholder="Enter your User ID"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password (if applicable)"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
