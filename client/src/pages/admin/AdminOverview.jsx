import React, { useEffect, useState } from 'react';
import axios from '../../api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.color = '#64748b';

const AdminOverview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [topPerformers, setTopPerformers] = useState([]);
    const [performerPeriod, setPerformerPeriod] = useState('monthly');
    const [loadingPerformers, setLoadingPerformers] = useState(false);

    const fetchData = async () => {
        try {
            const res = await axios.get('/admin/dashboard');
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopPerformers = async (period) => {
        setLoadingPerformers(true);
        try {
            const res = await axios.get(`/admin/top-performers?period=${period}`);
            setTopPerformers(res.data.topPerformers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPerformers(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTopPerformers(performerPeriod);
    }, []);

    useEffect(() => {
        fetchTopPerformers(performerPeriod);
    }, [performerPeriod]);

    if (loading) return <div>Loading dashboard analytics...</div>;
    if (!data) return <div className="alert alert-danger">Failed to load analytics data from server.</div>;

    const { 
        collection = 0, 
        totalTarget = 0, 
        targetSummary = [], 
        trendData = [], 
        clientDistribution = [] 
    } = data;

    // Process Trend Data
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

    const lineOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
    };

    const barData = {
        labels: targetSummary.map(s => s.name),
        datasets: [
            {
                label: 'Target',
                data: targetSummary.map(s => s.target),
                backgroundColor: 'rgba(71, 85, 105, 0.1)',
                borderColor: 'rgba(71, 85, 105, 0.3)',
                borderWidth: 1,
                borderRadius: 6,
            },
            {
                label: 'Achieved',
                data: targetSummary.map(s => s.collection),
                backgroundColor: '#0d9488',
                borderRadius: 6,
            }
        ]
    };
    const barOptions = {
        maintainAspectRatio: false,
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
    };

    const completionPercent = totalTarget > 0 ? Math.min(Math.round((collection / totalTarget) * 100), 100) : 0;
    const doughnutData = {
        labels: ['Achieved', 'Remaining'],
        datasets: [{
            data: [collection, Math.max(0, totalTarget - collection)],
            backgroundColor: ['#0d9488', '#e2e8f0'],
            borderWidth: 0,
            circumference: 270,
            rotation: 225,
            cutout: '80%',
            borderRadius: 20
        }]
    };
    const doughnutOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    };

    const distMap = { Hot: 0, Warm: 0, Cold: 0 };
    clientDistribution.forEach(d => { if(d._id) distMap[d._id] = d.count; });
    const distData = {
        labels: ['Hot', 'Warm', 'Cold'],
        datasets: [{
            data: [distMap.Hot, distMap.Warm, distMap.Cold],
            backgroundColor: ['#ef4444', '#f59e0b', '#0d9488'],
            borderWidth: 3,
            borderColor: '#ffffff',
            cutout: '70%'
        }]
    };
    const distOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>This Month Collection</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--charcoal)', marginTop: '0.5rem' }}>₹{collection.toLocaleString()}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>This Month Target</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--charcoal)', marginTop: '0.5rem' }}>₹{totalTarget.toLocaleString()}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Collection Trend</h3>
                    <div style={{ height: '260px' }}>
                        <Line data={lineData} options={lineOptions} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Employee Performance</h3>
                    <div style={{ height: '260px' }}>
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '350px', position: 'relative' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Overall Goal Progress</h3>
                    <div style={{ height: '260px' }}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                    <div style={{ position: 'absolute', top: '58%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--teal)' }}>
                        {completionPercent}%
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Lead Distribution</h3>
                    <div style={{ height: '240px' }}>
                        <Doughnut data={distData} options={distOptions} />
                    </div>
                </div>
            </div>

            {/* Top Performer Card - Full Width Single Row */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>🏆 Top Performers</h3>
                    <select 
                        value={performerPeriod} 
                        onChange={(e) => setPerformerPeriod(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="monthly">This Month</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="yearly">Last 1 Year</option>
                    </select>
                </div>
                {loadingPerformers ? (
                    <div style={{ color: 'var(--text-muted)' }}>Loading performers...</div>
                ) : (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', overflowX: 'hidden' }}>
                        {topPerformers.length > 0 ? topPerformers.map((tp, idx) => (
                            <div key={tp._id} style={{ 
                                flex: 1,
                                background: idx === 0 ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : 'var(--bg-secondary)',
                                color: idx === 0 ? 'white' : 'var(--text-primary)',
                                padding: '1rem', 
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                                minWidth: 0 // Allows flex items to shrink below their content size
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 700 }}>#{idx + 1}</span>
                                    {idx === 0 && <span style={{ fontSize: '1rem' }}>⭐</span>}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tp.employee.name}</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>₹{tp.totalCollected.toLocaleString()}</div>
                            </div>
                        )) : (
                            <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>No data available.</div>
                        )}
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Employee Target Summary</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem 0' }}>Employee</th>
                                <th style={{ padding: '1rem 0' }}>Target</th>
                                <th style={{ padding: '1rem 0' }}>Collected</th>
                                <th style={{ padding: '1rem 0' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {targetSummary.map(emp => (
                                <tr key={emp._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem 0', fontWeight: '500' }}>{emp.name} {!emp.isActive && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>(Fired)</span>}</td>
                                    <td style={{ padding: '1rem 0' }}>₹{emp.target.toLocaleString()}</td>
                                    <td style={{ padding: '1rem 0', color: 'var(--teal)', fontWeight: '600' }}>₹{emp.collection.toLocaleString()}</td>
                                    <td style={{ padding: '1rem 0' }}>
                                        {emp.remaining <= 0 ? 
                                            <span style={{ color: 'var(--success)', fontWeight: '600' }}>Goal Achieved</span> : 
                                            <span style={{ color: 'var(--charcoal-light)' }}>₹{emp.remaining.toLocaleString()} Remaining</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default AdminOverview;
