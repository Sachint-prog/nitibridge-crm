import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from '../../api';

const AdminSettings = () => {
    const { user, updateUser } = useContext(AuthContext);
    
    // Profile State
    const [profile, setProfile] = useState({
        name: user?.name || '',
        contactNumber: user?.contactNumber || ''
    });

    // Settings State
    const [settings, setSettings] = useState({
        theme: user?.settings?.theme || 'light',
        defaultView: user?.settings?.defaultView || 'monthly',
        notifications: user?.settings?.notifications ?? true
    });

    // Password State
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState({ profile: false, settings: false, password: false });
    const [message, setMessage] = useState({ type: '', text: '', section: '' });

    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handleSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
    };
    const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const clearMessage = () => setTimeout(() => setMessage({ type: '', text: '', section: '' }), 3000);

    const updateAdminProfile = async (e) => {
        e.preventDefault();
        setLoading({ ...loading, profile: true });
        try {
            const res = await axios.post('/admin/update-profile', profile);
            if (res.data.success) {
                updateUser(res.data.user);
                setMessage({ type: 'success', text: 'Profile updated successfully.', section: 'profile' });
                clearMessage();
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.', section: 'profile' });
        } finally {
            setLoading({ ...loading, profile: false });
        }
    };

    const updateAdminSettings = async (e) => {
        e.preventDefault();
        setLoading({ ...loading, settings: true });
        try {
            const res = await axios.post('/admin/update-settings', settings);
            if (res.data.success) {
                updateUser(res.data.user);
                setMessage({ type: 'success', text: 'System preferences updated.', section: 'settings' });
                clearMessage();
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update settings.', section: 'settings' });
        } finally {
            setLoading({ ...loading, settings: false });
        }
    };

    const updateAdminPassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return setMessage({ type: 'error', text: 'New passwords do not match.', section: 'password' });
        }
        setLoading({ ...loading, password: true });
        try {
            const res = await axios.post('/admin/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Password updated successfully.', section: 'password' });
                setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
                clearMessage();
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update password.', section: 'password' });
        } finally {
            setLoading({ ...loading, password: false });
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            <h2 style={{ marginBottom: '2rem' }}>Admin Settings</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                
                {/* Profile Section */}
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>👤 Profile Information</h3>
                    <form onSubmit={updateAdminProfile}>
                        {message.section === 'profile' && <div className={`alert alert-${message.type}`}>{message.text}</div>}
                        
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input type="text" name="name" className="form-control" value={profile.name} onChange={handleProfileChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Number</label>
                            <input type="text" name="contactNumber" className="form-control" value={profile.contactNumber} onChange={handleProfileChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">User ID (Permanent)</label>
                            <input type="text" className="form-control" value={user.userId || 'N/A'} disabled style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }} />
                        </div>
                        
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading.profile}>
                            {loading.profile ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                    </form>
                </div>

                {/* Settings Section */}
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚙️ System Preferences</h3>
                    <form onSubmit={updateAdminSettings}>
                        {message.section === 'settings' && <div className={`alert alert-${message.type}`}>{message.text}</div>}
                        
                        <div className="form-group">
                            <label className="form-label">Default Dashboard View</label>
                            <select name="defaultView" className="form-control" value={settings.defaultView} onChange={handleSettingsChange}>
                                <option value="weekly">Weekly Trend</option>
                                <option value="monthly">Monthly Trend</option>
                                <option value="yearly">Yearly Trend</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Theme Mode</label>
                            <select name="theme" className="form-control" value={settings.theme} onChange={handleSettingsChange}>
                                <option value="light">Light Mode</option>
                                <option value="dark" disabled>Dark Mode (Coming Soon)</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                                <input type="checkbox" name="notifications" checked={settings.notifications} onChange={handleSettingsChange} style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontWeight: '600' }}>Enable Email Notifications</span>
                            </label>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '2.1rem', marginTop: '0.3rem' }}>Receive alerts for new payments and target achievements.</p>
                        </div>
                        
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', marginTop: '1rem' }} disabled={loading.settings}>
                            {loading.settings ? 'Saving...' : 'Save Preferences'}
                        </button>
                    </form>
                </div>

                {/* Password Section */}
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔒 Account Security</h3>
                    <form onSubmit={updateAdminPassword}>
                        {message.section === 'password' && <div className={`alert alert-${message.type}`}>{message.text}</div>}
                        
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input type="password" name="oldPassword" className="form-control" value={passwords.oldPassword} onChange={handlePasswordChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input type="password" name="newPassword" className="form-control" value={passwords.newPassword} onChange={handlePasswordChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input type="password" name="confirmPassword" className="form-control" value={passwords.confirmPassword} onChange={handlePasswordChange} required />
                        </div>
                        
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading.password}>
                            {loading.password ? 'Updating...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
