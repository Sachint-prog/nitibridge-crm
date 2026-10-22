import React, { useState } from 'react';
import axios from '../../api';

const AdminDataNexus = () => {
    const [importType, setImportType] = useState('');
    const [file, setFile] = useState(null);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert('Please select a file');
        if (!importType) return alert('Please select a category');

        const formData = new FormData();
        formData.append('file', file); // Matches the 'file' field from EJS, wait EJS had name="file". Wait, in the backend routes/data.js: upload.single('file') or upload.single('csvFile')? 
        // EJS: <input type="file" name="file" class="drop-zone__input" accept=".csv" required>
        // My previous code: formData.append('csvFile', fileInput.files[0]);

        try {
            const res = await axios.post(`/admin/data/import/${importType}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                alert(res.data.message);
                setFile(null);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Import failed');
        }
    };

    const modules = [
        { id: 'clients', icon: '👥', label: 'Clients' },
        { id: 'employees', icon: '💼', label: 'Employees' },
        { id: 'payments', icon: '💰', label: 'Payments' },
        { id: 'targets', icon: '🎯', label: 'Targets' }
    ];

    return (
        <div>
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5))', border: '1px solid rgba(255,255,255,0.6)' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--charcoal)' }}>Data Nexus</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: 0 }}>Bulk manage your CRM data. Export existing records to CSV or import new ones using our templates.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                
                {/* Export Section */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(13, 148, 136, 0.1)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Bulk Export</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Download data in CSV format</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {modules.map(mod => (
                             <a key={mod.id} href={`https://nitibridge-crm-ieqw.onrender.com/admin/data/export/${mod.id}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(248, 250, 252, 0.5)', border: '1px solid #e2e8f0', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                                <span style={{ fontSize: '1.5rem' }}>{mod.icon}</span>
                                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{mod.label}</span>
                            </a>
                        ))}
                        <a href={`https://nitibridge-crm-ieqw.onrender.com/admin/data/export/followups`} target="_blank" rel="noreferrer" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(248, 250, 252, 0.5)', border: '1px solid #e2e8f0', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                            <span style={{ fontSize: '1.5rem' }}>📞</span>
                            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Follow-ups History</span>
                        </a>
                    </div>
                </div>

                {/* Import Section */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Bulk Import</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upload CSV files to update CRM</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpload}>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Data Category</label>
                            <select className="form-control" required value={importType} onChange={e => setImportType(e.target.value)}>
                                <option value="" disabled>Select category to import...</option>
                                <option value="clients">Clients</option>
                                <option value="employees">Employees</option>
                                <option value="payments">Payments</option>
                                <option value="targets">Targets</option>
                                <option value="followups">Follow-ups</option>
                            </select>
                        </div>

                        <div style={{ height: '150px', padding: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontWeight: '500', fontSize: '0.9rem', color: '#94a3b8', border: '2px dashed #cbd5e1', borderRadius: '12px', background: 'rgba(248, 250, 252, 0.5)', position: 'relative', overflow: 'hidden' }}>
                            <input 
                                type="file" 
                                accept=".csv" 
                                required 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                                onChange={e => setFile(e.target.files[0])}
                            />
                            {file ? <div style={{ color: 'var(--teal)', fontWeight: 'bold' }}>{file.name}</div> : "Drop CSV file here or click to upload"}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                            {importType ? (
                                <a href={`https://nitibridge-crm-ieqw.onrender.com/admin/data/template/${importType}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: 'auto' }}>
                                    📥 Download Template
                                </a>
                            ) : <div></div>}
                            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
                                🚀 Start Import
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default AdminDataNexus;
