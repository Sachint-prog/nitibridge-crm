import React, { useEffect, useState } from 'react';
import axios from '../../api';

const AdminTargets = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTargets();
    }, [month, year]);

    const fetchTargets = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/admin/targets?month=${month}&year=${year}`);
            if (res.data.success) {
                setData(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e, empId) => {
        e.preventDefault();
        const targetValue = e.target.elements.targetAmount.value;
        try {
            const res = await axios.post(`/admin/targets/${empId}`, { target: targetValue, month, year });
            if (res.data.success) {
                alert('Target updated successfully');
                fetchTargets();
            }
        } catch (err) {
            alert('Error updating target');
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const filteredEmployees = data?.employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.userId.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div>
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ marginBottom: '0.25rem' }}>Target Management</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Assign and manage monetary targets for your team.</p>
                    </div>
                    
                    {/* Period Selector */}
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month</label>
                            <select className="form-control" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '0.4rem 2rem 0.4rem 1rem', fontSize: '0.875rem', minWidth: '140px' }}>
                                {monthNames.map((name, i) => <option key={i+1} value={i+1}>{name}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</label>
                            <select className="form-control" value={year} onChange={e => setYear(e.target.value)} style={{ padding: '0.4rem 2rem 0.4rem 1rem', fontSize: '0.875rem', minWidth: '100px' }}>
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }}></span>
                    <h3 style={{ fontWeight: '500', margin: 0 }}>Targets for: <span style={{ color: 'var(--teal)' }}>{monthNames[month-1]} {year}</span></h3>
                </div>
                <div style={{ position: 'relative', minWidth: '250px' }}>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search employee..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem' }}>Employee</th>
                                <th style={{ padding: '1rem' }}>Current Goal (INR)</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                            ) : filteredEmployees.map(emp => {
                                const empTargetDoc = data.targets.find(t => t.employeeId === emp._id);
                                const currentTarget = empTargetDoc ? empTargetDoc.amount : 0;
                                return (
                                    <tr key={emp._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: 'white', fontSize: '0.85rem', flexShrink: 0 }}>
                                                    {emp.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{emp.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>ID: {emp.userId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <form onSubmit={(e) => handleUpdate(e, emp._id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: 0 }}>
                                                <div style={{ position: 'relative', width: '220px' }}>
                                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>₹</span>
                                                    <input type="number" name="targetAmount" defaultValue={currentTarget} className="form-control" style={{ paddingLeft: '2rem', paddingTop: '0.4rem', paddingBottom: '0.4rem', fontSize: '0.9rem' }} required min="0" />
                                                </div>
                                                <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 1.25rem', fontSize: '0.8rem', width: 'auto' }}>
                                                    Update Goal
                                                </button>
                                            </form>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}></td>
                                    </tr>
                                );
                            })}
                            {!loading && filteredEmployees.length === 0 && (
                                <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active employees found matching search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default AdminTargets;
