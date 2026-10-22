import React, { useEffect, useState } from 'react';
import axios from '../../api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.color = '#64748b';

const EmployeeOverview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form States Removed

    const fetchData = async () => {
        try {
            const res = await axios.get('/employee/dashboard');
            if (res.data.success) {
                setData(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Form handlers removed

    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard details...</div>;
    if (!data) return <div className="alert alert-danger" style={{ margin: '2rem' }}>Failed to load data</div>;

    const { 
        user = {}, 
        collection = 0, 
        remaining = 0, 
        trendData = [], 
        clientDist = [], 
        followUpStats = [], 
        clients = [] 
    } = data;
    const monthlyTarget = user.monthlyTarget || 0;

    // Trend Data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendLabels = trendData.map(d => {
        if (d._id.week) return `Week ${d._id.week}, ${d._id.year}`;
        if (d._id.month) return `${monthNames[d._id.month-1]} ${d._id.year}`;
        return `${d._id.year}`;
    });

    const lineData = {
        labels: trendLabels,
        datasets: [{
            label: 'Collection',
            data: trendData.map(d => d.total),
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.2)',
            fill: true,
            tension: 0.45,
            borderWidth: 3,
            pointRadius: trendData.length > 20 ? 0 : 4,
        }]
    };
    const lineOptions = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } };

    // Completion Doughnut
    const completionPercent = monthlyTarget > 0 ? Math.min(Math.round((collection / monthlyTarget) * 100), 100) : 0;
    const doughnutData = {
        labels: ['Achieved', 'Remaining'],
        datasets: [{
            data: [collection, Math.max(0, monthlyTarget - collection)],
            backgroundColor: ['#0d9488', '#e2e8f0'],
            borderWidth: 0,
            circumference: 270,
            rotation: 225,
            cutout: '80%',
            borderRadius: 20
        }]
    };
    const doughnutOptions = { maintainAspectRatio: false, plugins: { legend: { display: false } } };

    // Client Dist Data
    const cDistMap = { Hot: 0, Warm: 0, Cold: 0 };
    clientDist.forEach(s => { if(s._id) cDistMap[s._id] = s.count; });
    const distData = {
        labels: ['Hot', 'Warm', 'Cold'],
        datasets: [{
            data: [cDistMap.Hot, cDistMap.Warm, cDistMap.Cold],
            backgroundColor: ['#ef4444', '#f59e0b', '#0d9488'],
            borderWidth: 2,
            borderColor: '#fff',
            cutout: '70%'
        }]
    };

    // FollowUp Stats
    const fuMap = { Pending: 0, Completed: 0, Overdue: 0 };
    followUpStats.forEach(s => { if(s._id) fuMap[s._id] = s.count; });
    const fuData = {
        labels: ['Pending', 'Completed', 'Overdue'],
        datasets: [{
            data: [fuMap.Pending, fuMap.Completed, fuMap.Overdue],
            backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
            borderWidth: 2,
            borderColor: '#fff',
            cutout: '70%'
        }]
    };
    const fuOptions = { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };

    // Filtered Clients
    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.contactNumber.includes(searchTerm)
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div>
            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>My Monthly Target</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--charcoal)', marginTop: '0.5rem' }}>₹{monthlyTarget.toLocaleString()}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>My Collection (Current Month)</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--teal)', marginTop: '0.5rem' }}>₹{collection.toLocaleString()}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>Remaining Target</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: remaining > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '0.5rem' }}>
                        {remaining > 0 ? `₹${remaining.toLocaleString()}` : 'Goal Achieved!'}
                    </div>
                </div>
            </div>

            {/* 4 Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>My Collection Trend</h3>
                    <div style={{ height: '260px' }}>
                        <Line data={lineData} options={lineOptions} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '350px', position: 'relative' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>My Goal Status</h3>
                    <div style={{ height: '260px' }}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                    <div style={{ position: 'absolute', top: '58%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--teal)' }}>
                        {completionPercent}%
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>My Pipeline</h3>
                    <div style={{ height: '240px' }}>
                        <Doughnut data={distData} options={fuOptions} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Follow-up Status</h3>
                    <div style={{ height: '240px' }}>
                        <Doughnut data={fuData} options={fuOptions} />
                    </div>
                </div>
            </div>

            {/* Forms Grid Removed */}

            {/* My Client Directory Table */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>My Client Directory</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>List of clients managed by you.</p>
                    </div>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search by name, company or phone..." 
                        style={{ maxWidth: '300px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem 0.5rem' }}>Client ID</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Client Info</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Contact</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Location</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Type</th>
                                <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Added Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(c => (
                                <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem 0.5rem', fontFamily: 'monospace', color: 'var(--teal)', fontWeight: 'bold' }}>{c.userId}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <div style={{ fontWeight: '600' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--teal)', textTransform: 'uppercase' }}>{c.companyName || '-'}</div>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <div style={{ fontSize: '0.9rem' }}>{c.contactNumber}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.email || 'No email'}</div>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem' }}>{c.state}, {c.district}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <span style={{ 
                                            padding: '0.2rem 0.6rem', 
                                            borderRadius: '12px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '600',
                                            backgroundColor: c.clientType === 'Hot' ? '#fef2f2' : c.clientType === 'Warm' ? '#fffbeb' : '#f0fdfa',
                                            color: c.clientType === 'Hot' ? '#ef4444' : c.clientType === 'Warm' ? '#f59e0b' : '#0d9488'
                                        }}>{c.clientType}</span>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {filteredClients.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No clients found. Start by adding your first client above.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default EmployeeOverview;
