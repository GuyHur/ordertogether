import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart
} from 'recharts'
import { ArrowLeft, Activity, Users, ShoppingBag, MapPin, Award, Truck, DollarSign, Tag, Clock } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast/Toast'
import './BIDashboard.css'

const COLORS = [
    'var(--accent-primary)',
    'var(--accent-warning)',
    'var(--accent-success)',
    'var(--accent-danger)',
    'var(--accent-purple)',
    'var(--accent-pink)'
]

export default function BIDashboard() {
    const { addToast } = useToast()
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)

    const loadMetrics = useCallback(async () => {
        try {
            const data = await api.get('/admin/metrics')
            setMetrics(data)
        } catch (err) {
            addToast(err.message, 'error')
        } finally {
            setLoading(false)
        }
    }, [addToast])

    useEffect(() => { loadMetrics() }, [loadMetrics])

    if (loading) return <div className="admin-page"><div className="skeleton-card" style={{ height: 400 }} /></div>
    if (!metrics) return <div className="admin-page">Failed to load BI Metrics</div>

    return (
        <div className="bi-dashboard">
            <div className="bi-header">
                <div>
                    <h1 className="page-title"><Activity size={24} style={{ marginRight: 8, display: 'inline' }} /> Business Intelligence</h1>
                    <p className="page-subtitle">Platform-wide historical metrics</p>
                </div>
                <Link to="/admin" className="btn btn-secondary btn-sm">
                    <ArrowLeft size={14} style={{ marginRight: 4 }} /> Back to Admin
                </Link>
            </div>

            {/* Top Stat Cards */}
            <div className="bi-stats-grid">
                <div className="bi-stat-card">
                    <div className="stat-icon" style={{ color: 'var(--accent-primary)', backgroundColor: 'rgba(99, 179, 237, 0.1)' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{metrics.summary.total_orders}</div>
                        <div className="stat-label">Total Orders Generated</div>
                    </div>
                </div>
                <div className="bi-stat-card">
                    <div className="stat-icon" style={{ color: 'var(--accent-success)', backgroundColor: 'rgba(104, 211, 145, 0.1)' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{metrics.summary.total_participants}</div>
                        <div className="stat-label">Total Order Participants</div>
                    </div>
                </div>

                <div className="bi-stat-card">
                    <div className="stat-icon" style={{ color: 'var(--accent-danger)', backgroundColor: 'rgba(252, 129, 129, 0.1)' }}>
                        <Truck size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{metrics.summary.deliveries_saved}</div>
                        <div className="stat-label">Single Deliveries Saved</div>
                    </div>
                </div>

                <div className="bi-stat-card">
                    <div className="stat-icon" style={{ color: 'var(--accent-warning)', backgroundColor: 'rgba(246, 173, 85, 0.1)' }}>
                        <Award size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{metrics.top_creators?.[0]?.name || 'N/A'}</div>
                        <div className="stat-label">Top Order Creator</div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="bi-charts-grid">

                {/* Timeline Chart */}
                <div className="bi-chart-card full-width">
                    <h3 className="chart-title">Orders & Participants Over Time (Last 30 Active Days)</h3>
                    <div className="chart-wrapper" style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics.timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorParts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8 }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: 20 }} />
                                <Area type="monotone" dataKey="orders" name="Orders" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorOrders)" />
                                <Area type="monotone" dataKey="participants" name="Participants" stroke="var(--accent-success)" fillOpacity={1} fill="url(#colorParts)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Delivery Services Pie */}
                <div className="bi-chart-card">
                    <h3 className="chart-title">Orders by Delivery Service</h3>
                    <div className="chart-wrapper" style={{ height: 300 }}>
                        {metrics.by_service.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metrics.by_service}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {metrics.by_service.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">No service data</div>
                        )}
                    </div>
                </div>

                {/* Status Distribution Pie */}
                <div className="bi-chart-card">
                    <h3 className="chart-title">Status Distribution</h3>
                    <div className="chart-wrapper" style={{ height: 300 }}>
                        {metrics.by_status.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metrics.by_status}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, value }) => `${name} (${value})`}
                                    >
                                        {metrics.by_status.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">No status data</div>
                        )}
                    </div>
                </div>

                {/* Food Tags Bar Chart */}
                <div className="bi-chart-card">
                    <h3 className="chart-title"><Tag size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} /> Popular Food Categories</h3>
                    <div className="chart-wrapper" style={{ height: 300 }}>
                        {metrics.by_food_tag?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.by_food_tag} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                                    <XAxis type="number" stroke="var(--text-muted)" />
                                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={120} tick={{ fontSize: 13 }} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'var(--bg-input)' }}
                                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8 }}
                                    />
                                    <Bar dataKey="value" name="Occurrences" fill="var(--accent-danger)" radius={[0, 4, 4, 0]}>
                                        {metrics.by_food_tag.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">No food tags available</div>
                        )}
                    </div>
                </div>

                {/* Buildings Bar Chart */}
                <div className="bi-chart-card">
                    <h3 className="chart-title"><MapPin size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} /> Orders by Building</h3>
                    <div className="chart-wrapper" style={{ height: 300 }}>
                        {metrics.by_building.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.by_building} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                                    <XAxis type="number" stroke="var(--text-muted)" />
                                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={100} tick={{ fontSize: 13 }} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'var(--bg-input)' }}
                                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8 }}
                                    />
                                    <Bar dataKey="value" name="Orders" fill="var(--accent-purple)" radius={[0, 4, 4, 0]}>
                                        {metrics.by_building.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">No building data</div>
                        )}
                    </div>
                </div>

                {/* Hourly Usage Radar Chart */}
                <div className="bi-chart-card">
                    <h3 className="chart-title"><Clock size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} /> Peak Order Times</h3>
                    <div className="chart-wrapper" style={{ height: 350 }}>
                        {metrics.by_hour?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={metrics.by_hour}>
                                    <PolarGrid stroke="var(--border-color)" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 'auto']} stroke="var(--text-muted)" />
                                    <Radar name="Active Orders" dataKey="value" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.6} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">No hourly data</div>
                        )}
                    </div>
                </div>

                {/* Day of Week Radar Chart */}
                <div className="bi-chart-card">
                    <h3 className="chart-title">Busiest Days of Week</h3>
                    <div className="chart-wrapper" style={{ height: 350 }}>
                        {metrics.by_day?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={metrics.by_day}>
                                    <PolarGrid stroke="var(--border-color)" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="var(--text-muted)" />
                                    <Radar name="Active Orders" dataKey="value" stroke="var(--accent-success)" fill="var(--accent-success)" fillOpacity={0.6} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">No daily data</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
