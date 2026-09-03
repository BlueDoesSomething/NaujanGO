import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { ChartLoader } from './AdminCharts';
import { useLanguage } from '../context/LanguageContext';
import './ReportsAndAnalyticsDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const ReportsAndAnalyticsDashboard = ({ 
  data,
  loading = false,
  userRole = 'admin', // 'admin' or 'owner'
  onExport = () => {},
  stats = null
}) => {
  const { t } = useLanguage();
  const [selectedDateRange, setSelectedDateRange] = useState('30d');
  const [displayMode, setDisplayMode] = useState('overview');
  const [visitorAnalytics, setVisitorAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const trendSeries = selectedDateRange === '7d' && data?.dailyTrends?.length
    ? data.dailyTrends
    : data?.monthlyTrends || [];
  const trendLabel = selectedDateRange === '7d' ? 'day' : 'month';
  const trendTitle = selectedDateRange === '7d' ? 'Daily Booking Trends' : 'Booking Trends';
  const trendSubtitle = selectedDateRange === '7d' ? 'Daily booking patterns and growth' : 'Monthly booking patterns and growth';
  const revenueTitle = selectedDateRange === '7d' ? 'Daily Revenue Report' : 'Revenue Report';
  const revenueSubtitle = selectedDateRange === '7d' ? 'Daily revenue analysis and trends' : 'Monthly revenue analysis and trends';

  // Fetch visitor analytics on mount (admin only)
  useEffect(() => {
    if (userRole === 'admin') {
      fetchVisitorAnalytics();
    }
  }, [userRole]);

  const fetchVisitorAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch('/api/admin/visitor-analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVisitorAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch visitor analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Calculate KPIs
  const calculateKPIs = () => {
    if (!data) return {};

    const currentTrends = trendSeries;
    const currentPeriod = currentTrends[currentTrends.length - 1] || {};
    const previousPeriod = currentTrends[currentTrends.length - 2] || {};
    const toNumber = (value) => Number.parseFloat(value ?? 0) || 0;

    const totalBookings = currentTrends.reduce((sum, m) => sum + (m.bookings || m.count || 0), 0);
    const totalRevenue = currentTrends.reduce((sum, m) => sum + toNumber(m.revenue), 0);
    const avgOccupancy = currentTrends.length > 0 
      ? (currentTrends.reduce((sum, m) => sum + toNumber(m.occupancy), 0) / currentTrends.length).toFixed(1)
      : 0;
    
    const bookingGrowth = previousPeriod?.bookings 
      ? (((currentPeriod?.bookings || 0) - previousPeriod?.bookings) / previousPeriod?.bookings * 100).toFixed(1)
      : 0;

    return {
      totalBookings,
      totalRevenue,
      avgOccupancy,
      bookingGrowth,
      currentTrends
    };
  };

  const kpis = calculateKPIs();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12, weight: '500' },
          color: '#333'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        borderRadius: 8,
        usePointStyle: true
      }
    }
  };

  // Booking Trends Chart Data
  const bookingTrendsData = {
    labels: trendSeries?.map(m => m[trendLabel]) || [],
    datasets: [
      {
        label: 'Bookings',
        data: trendSeries?.map(m => m.bookings || m.count || 0) || [],
        borderColor: '#2E7D32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#2E7D32',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  // Revenue Chart Data
  const revenueData = {
    labels: trendSeries?.map(m => m[trendLabel]) || [],
    datasets: [
      {
        label: 'Revenue',
        data: trendSeries?.map(m => Number.parseFloat(m.revenue ?? 0) || 0) || [],
        backgroundColor: 'rgba(46, 125, 50, 0.8)',
        borderColor: '#2E7D32',
        borderWidth: 2,
        borderRadius: 8,
        maxBarThickness: 50
      }
    ]
  };

  // Performance Chart Data
  const performanceData = {
    labels: ['Bookings', 'Hotels', 'Users', 'Attractions'].slice(0, stats?.totals ? Object.keys(stats.totals).length : 4),
    datasets: [
      {
        label: 'Count',
        data: [
          stats?.totals?.bookings || 0,
          stats?.totals?.hotels || 0,
          stats?.totals?.users || 0,
          stats?.totals?.attractions || 0
        ].slice(0, stats?.totals ? Object.keys(stats.totals).length : 4),
        backgroundColor: ['#2E7D32CC', '#388E3CCC', '#43A047CC', '#4CAF50CC'],
        borderColor: ['#2E7D32', '#388E3C', '#43A047', '#4CAF50'],
        borderWidth: 2,
        borderRadius: 10
      }
    ]
  };

  // User Distribution Data
  const userDistributionData = {
    labels: stats?.roleDistribution?.map(r => r.role.toUpperCase()) || ['ADMIN', 'OWNER', 'USER'],
    datasets: [
      {
        data: stats?.roleDistribution?.map(r => r.count) || [0, 0, 0],
        backgroundColor: ['#2E7D32', '#43A047', '#FFB74D'],
        borderWidth: 3,
        borderColor: '#fff'
      }
    ]
  };

  const exportHandler = (type) => {
    onExport(type, trendSeries);
  };

  const KPICard = ({ label, value, change }) => (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {change !== undefined && (
        <div className={`kpi-change ${change >= 0 ? 'positive' : 'negative'}`}>
          <span className="kpi-change-icon">{change >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(change)}% vs last month</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="reports-analytics-dashboard">
      {/* Header */}
      <div className="reports-header">
        <div className="reports-title-section">
          <h1 className="reports-title">Reports & Analytics</h1>
          <p className="reports-subtitle">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="reports-controls">
          <select 
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="7d">Daily</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          
          <button 
            onClick={() => exportHandler('all')}
            className="export-btn"
            title={t('analytics_export_all')}
          >
            {t('analytics_export')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard 
          label={t('analytics_total_bookings')}
          value={kpis.totalBookings || 0}
          change={parseFloat(kpis.bookingGrowth) || 0}
        />
        <KPICard 
          label={t('analytics_total_revenue')}
          value={`₱${Number(kpis.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <KPICard 
          label={t('analytics_avg_occupancy')}
          value={`${kpis.avgOccupancy || 0}%`}
        />
        {userRole === 'admin' && (
          <>
            <KPICard 
              label={t('analytics_total_users')}
              value={stats?.totals?.users || 0}
            />
            <KPICard 
              label={t('analytics_website_visitors')}
              value={visitorAnalytics?.totals?.total_visitors || 0}
            />
            <KPICard 
              label={t('analytics_total_visits')}
              value={visitorAnalytics?.totals?.total_visits || 0}
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      {loading ? (
        <ChartLoader />
      ) : (
        <>
          {/* Top Row - Large Charts */}
          <div className="charts-grid charts-grid-2">
            {/* Booking Trends */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">{trendTitle}</h3>
                  <p className="chart-subtitle">{trendSubtitle}</p>
                </div>
                <button 
                  onClick={() => exportHandler('bookings')}
                  className="mini-export-btn"
                  title={t('analytics_export_bookings')}
                  aria-label={t('analytics_export_bookings')}
                >
                  ↓
                </button>
              </div>
              {trendSeries && trendSeries.length > 0 ? (
                <div className="chart-container">
                  <Line data={bookingTrendsData} options={{ ...chartOptions }} />
                </div>
              ) : (
                <div className="chart-empty">
                  <p>No booking data available</p>
                </div>
              )}
            </div>

            {/* Revenue Report */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">{revenueTitle}</h3>
                  <p className="chart-subtitle">{revenueSubtitle}</p>
                </div>
                <button 
                  onClick={() => exportHandler('revenue')}
                  className="mini-export-btn"
                  title={t('analytics_export_revenue')}
                  aria-label={t('analytics_export_revenue')}
                >
                  ↓
                </button>
              </div>
              {trendSeries && trendSeries.length > 0 ? (
                <div className="chart-container">
                  <Bar data={revenueData} options={{ ...chartOptions, scales: { y: { beginAtZero: true } } }} />
                </div>
              ) : (
                <div className="chart-empty">
                  <p>No revenue data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row - Smaller Charts */}
          <div className="charts-grid charts-grid-3">
            {/* Performance Metrics */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Performance Metrics</h3>
                  <p className="chart-subtitle">Key system indicators</p>
                </div>
              </div>
              {stats?.totals ? (
                <div className="chart-container">
                  <Bar 
                    data={performanceData} 
                    options={{ 
                      ...chartOptions, 
                      indexAxis: 'y',
                      scales: { x: { beginAtZero: true } } 
                    }} 
                  />
                </div>
              ) : (
                <div className="chart-empty">
                  <p>No performance data</p>
                </div>
              )}
            </div>

            {/* User Distribution */}
            {userRole === 'admin' && (
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <h3 className="chart-title">User Distribution</h3>
                    <p className="chart-subtitle">Users by role</p>
                  </div>
                </div>
                {stats?.roleDistribution && stats.roleDistribution.length > 0 ? (
                  <div className="chart-container chart-container-small">
                    <Doughnut 
                      data={userDistributionData} 
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }} 
                    />
                  </div>
                ) : (
                  <div className="chart-empty">
                    <p>No user data</p>
                  </div>
                )}
              </div>
            )}

            {/* Occupancy Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Occupancy Rate</h3>
                  <p className="chart-subtitle">Average occupancy over time</p>
                </div>
              </div>
              {trendSeries && trendSeries.length > 0 ? (
                <div className="chart-container chart-container-small">
                  <Pie 
                    data={{
                      labels: ['Occupied', 'Available'],
                      datasets: [{
                        data: [kpis.avgOccupancy || 0, 100 - (kpis.avgOccupancy || 0)],
                        backgroundColor: ['#2E7D32', '#E8F5E9'],
                        borderColor: '#fff',
                        borderWidth: 3
                      }]
                    }}
                    options={{ ...chartOptions }}
                  />
                </div>
              ) : (
                <div className="chart-empty">
                  <p>No occupancy data</p>
                </div>
              )}
            </div>
          </div>

          {/* Visitor Analytics Section - Admin Only */}
          {userRole === 'admin' && visitorAnalytics && (
            <>
              {/* Visitor Demographics Row */}
              <div className="charts-grid charts-grid-2">
                {/* Gender Distribution */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div>
                      <h3 className="chart-title">Visitor Gender Distribution</h3>
                      <p className="chart-subtitle">Male, Female, and Other</p>
                    </div>
                    <button 
                      onClick={() => exportHandler('gender')}
                      className="mini-export-btn"
                      title={t('analytics_export_gender')}
                      aria-label={t('analytics_export_gender')}
                    >
                      ↓
                    </button>
                  </div>
                  {visitorAnalytics.gender_distribution && visitorAnalytics.gender_distribution.length > 0 ? (
                    <div className="chart-container chart-container-small">
                      <Pie 
                        data={{
                          labels: visitorAnalytics.gender_distribution.map(g => g.gender),
                          datasets: [{
                            data: visitorAnalytics.gender_distribution.map(g => g.count),
                            backgroundColor: ['#64B5F6', '#F48FB1', '#81C784', '#FFD54F'],
                            borderColor: '#fff',
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            tooltip: {
                              ...chartOptions.plugins.tooltip,
                              callbacks: {
                                label: function(context) {
                                  const label = context.label || '';
                                  const value = context.parsed;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${label}: ${value} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="chart-empty">
                      <p>No gender data available</p>
                    </div>
                  )}
                </div>

                {/* User Type Distribution (Local/Resident/Foreigner) */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div>
                      <h3 className="chart-title">Visitor Type Distribution</h3>
                      <p className="chart-subtitle">Local, Resident, or Foreigner</p>
                    </div>
                    <button 
                      onClick={() => exportHandler('usertype')}
                      className="mini-export-btn"
                      title={t('analytics_export_user_type')}
                      aria-label={t('analytics_export_user_type')}
                    >
                      ↓
                    </button>
                  </div>
                  {visitorAnalytics.user_type_distribution && visitorAnalytics.user_type_distribution.length > 0 ? (
                    <div className="chart-container chart-container-small">
                      <Doughnut 
                        data={{
                          labels: visitorAnalytics.user_type_distribution.map(u => u.user_type),
                          datasets: [{
                            data: visitorAnalytics.user_type_distribution.map(u => u.count),
                            backgroundColor: ['#66BB6A', '#FFA726', '#29B6F6'],
                            borderColor: '#fff',
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            tooltip: {
                              ...chartOptions.plugins.tooltip,
                              callbacks: {
                                label: function(context) {
                                  const label = context.label || '';
                                  const value = context.parsed;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${label}: ${value} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="chart-empty">
                      <p>No user type data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visitor Demographics Details Table */}
              <div className="details-section">
                <h2 className="details-title">Visitor Demographics Breakdown</h2>
                <div className="metrics-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Gender</th>
                        <th>User Type</th>
                        <th>Count</th>
                        <th>% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitorAnalytics.combined_breakdown && visitorAnalytics.combined_breakdown.length > 0 ? (
                        visitorAnalytics.combined_breakdown.map((item, idx) => {
                          const totalVisitors = visitorAnalytics.totals.total_visitors || 1;
                          const percentage = ((item.count / totalVisitors) * 100).toFixed(1);
                          return (
                            <tr key={idx}>
                              <td><strong>{item.gender}</strong></td>
                              <td>{item.user_type}</td>
                              <td>{item.count}</td>
                              <td>{percentage}%</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center' }}>No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gender Statistics Summary */}
              <div className="details-section">
                <h2 className="details-title">Gender Statistics</h2>
                <div className="metrics-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Gender</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitorAnalytics.gender_distribution && visitorAnalytics.gender_distribution.length > 0 ? (
                        visitorAnalytics.gender_distribution.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.gender}</strong></td>
                            <td>{item.count}</td>
                            <td>{item.percentage}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center' }}>No gender data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User Type Statistics Summary */}
              <div className="details-section">
                <h2 className="details-title">User Type Statistics</h2>
                <div className="metrics-table">
                  <table>
                    <thead>
                      <tr>
                        <th>User Type</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitorAnalytics.user_type_distribution && visitorAnalytics.user_type_distribution.length > 0 ? (
                        visitorAnalytics.user_type_distribution.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.user_type}</strong></td>
                            <td>{item.count}</td>
                            <td>{item.percentage}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center' }}>No user type data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Details Section */}
          <div className="details-section">
            <h2 className="details-title">Detailed Metrics</h2>
            <div className="metrics-table">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                    {userRole === 'admin' && <th>Occupancy %</th>}
                    <th>Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {trendSeries && trendSeries.map((period, idx) => {
                    const previousPeriod = idx > 0 ? trendSeries[idx - 1] : null;
                    const growth = previousPeriod 
                      ? (((period.bookings || period.count || 0) - (previousPeriod.bookings || previousPeriod.count || 0)) / (previousPeriod.bookings || previousPeriod.count || 1) * 100).toFixed(1)
                      : 0;
                    
                    return (
                      <tr key={idx}>
                        <td><strong>{period[trendLabel]}</strong></td>
                        <td>{period.bookings || period.count || 0}</td>
                        <td>₱{(period.revenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        {userRole === 'admin' && <td>{(period.occupancy || 0).toFixed(1)}%</td>}
                        <td>
                          <span className={`growth-badge ${growth >= 0 ? 'positive' : 'negative'}`}>
                            {growth >= 0 ? '+' : ''}{growth}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsAndAnalyticsDashboard;
