import React, { useEffect, useState } from 'react';
import axios from '../../api';
import Pagination from '../../components/Pagination';

const AdminEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', contactNumber: '', userId: '', password: '' });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', name: '', contactNumber: '', password: '' });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/admin/employees');
            if (res.data.success) {
                setEmployees(res.data.employees);
            }
        } catch (err) {
            setError('Failed to load employees.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/admin/employee', createForm);
            if (res.data.success) {
                setShowCreateModal(false);
                setCreateForm({ name: '', contactNumber: '', userId: '', password: '' });
                fetchEmployees();
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating employee');
        }
    };

    const openEdit = (emp) => {
        setEditForm({ id: emp._id, name: emp.name, contactNumber: emp.contactNumber, password: '' });
        setShowEditModal(true);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`/admin/employee/edit/${editForm.id}`, {
                name: editForm.name,
                contactNumber: editForm.contactNumber,
                password: editForm.password
            });
            if (res.data.success) {
                setShowEditModal(false);
                fetchEmployees();
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Error updating employee');
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm('Are you sure you want to fire this employee?')) return;
        try {
            const res = await axios.get(`/admin/employee/delete/${id}`);
            if (res.data.success) {
                fetchEmployees();
            }
        } catch (err) {
            alert('Error deactivating employee');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading employees...</div>;

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.contactNumber.includes(searchTerm)
    ).sort((a,b) => b.isActive - a.isActive);

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredEmployees.slice(indexOfFirstEntry, indexOfLastEntry);

    return (
        <div>
            {/* Top Info Bar */}
            <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>Employee Management</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage your team, track statuses, and update credentials.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', minWidth: '300px' }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search by name, ID or phone..." 
                            value={searchTerm}
                            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                        />
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        + Create Employee
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="glass-panel" style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem' }}>Employee</th>
                                <th style={{ padding: '1rem' }}>Contact info</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentEntries.map(emp => (
                                <tr key={emp._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '0.9rem', flexShrink: 0 }}>
                                                {emp.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{emp.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>ID: {emp.userId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.9rem' }}>{emp.contactNumber}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Personal Contact</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {emp.isActive ? 
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Active</span> : 
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Terminated</span>
                                        }
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button onClick={() => openEdit(emp)} className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>Edit</button>
                                            {emp.isActive && (
                                                <button onClick={() => handleDeactivate(emp._id)} className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Fire</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentEntries.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '0 1.5rem' }}>
                    <Pagination 
                        totalEntries={filteredEmployees.length}
                        entriesPerPage={entriesPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onEntriesPerPageChange={(val) => {setEntriesPerPage(val); setCurrentPage(1);}}
                    />
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px', background: 'var(--white)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Create New Employee</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-control" placeholder="John Doe" required value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Number (Login ID)</label>
                                <input type="text" className="form-control" placeholder="+91 00000 00000" required value={createForm.contactNumber} onChange={e => setCreateForm({...createForm, contactNumber: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Employee ID (Unique)</label>
                                <input type="text" className="form-control" placeholder="NIT-2024-XX" required value={createForm.userId} onChange={e => setCreateForm({...createForm, userId: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Set Password</label>
                                <input type="password" className="form-control" placeholder="••••••••" required value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ background: '#f1f5f9', color: 'var(--text-main)' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '450px', background: 'var(--white)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Edit: {editForm.name}</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                        </div>
                        <form onSubmit={handleEdit}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-control" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Number</label>
                                <input type="text" className="form-control" required value={editForm.contactNumber} onChange={e => setEditForm({...editForm, contactNumber: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password (Leave blank to keep same)</label>
                                <input type="password" className="form-control" placeholder="••••••••" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ background: '#f1f5f9', color: 'var(--text-main)' }} onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Update Details</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminEmployees;
