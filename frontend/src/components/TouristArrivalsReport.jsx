import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../api';
import Icons from './Icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Tourism Arrivals report — monthly LGU arrival log categorized by origin
// (foreign / local) and sex (male / female). Rendered as the "Tourism
// Arrivals" category inside the admin Reports page.
const TouristArrivalsReport = () => {
  const [touristArrivals, setTouristArrivals] = useState([]);
  const [touristSummary, setTouristSummary] = useState(null);
  const [touristArrivalsLoading, setTouristArrivalsLoading] = useState(false);
  const [touristForm, setTouristForm] = useState({ month: '', foreign: '', local: '', male: '', female: '', notes: '' });
  const [touristSaving, setTouristSaving] = useState(false);

  const loadTouristArrivals = async () => {
    try {
      setTouristArrivalsLoading(true);
      const [listRes, summaryRes] = await Promise.all([
        api.get('/admin/tourist-arrivals'),
        api.get('/admin/tourist-arrivals/summary')
      ]);
      setTouristArrivals(Array.isArray(listRes.data) ? listRes.data : []);
      setTouristSummary(summaryRes.data || null);
    } catch (error) {
      console.error('Error loading tourist arrivals:', error);
    } finally {
      setTouristArrivalsLoading(false);
    }
  };

  const handleTouristArrivalSave = async () => {
    const month = String(touristForm.month || '').trim();
    if (!month) {
      alert('Please select the arrival month.');
      return;
    }
    const foreign = Number(touristForm.foreign) || 0;
    const local = Number(touristForm.local) || 0;
    const male = Number(touristForm.male) || 0;
    const female = Number(touristForm.female) || 0;
    if (male + female !== foreign + local) {
      alert('Counts do not match: Male + Female must equal Foreign + Local.');
      return;
    }
    try {
      setTouristSaving(true);
      await api.post('/admin/tourist-arrivals', {
        arrival_month: month,
        foreign_count: foreign,
        local_count: local,
        male_count: male,
        female_count: female,
        notes: touristForm.notes || null,
      });
      setTouristForm({ month: '', foreign: '', local: '', male: '', female: '', notes: '' });
      await loadTouristArrivals();
    } catch (error) {
      console.error('Error saving tourist arrival:', error);
      alert(error?.response?.data?.error || 'Failed to save tourist arrival.');
    } finally {
      setTouristSaving(false);
    }
  };

  const handleTouristArrivalDelete = async (arrivalId) => {
    if (!window.confirm('Delete this monthly tourist arrival record?')) return;
    try {
      await api.delete(`/admin/tourist-arrivals/${arrivalId}`);
      await loadTouristArrivals();
    } catch (error) {
      console.error('Error deleting tourist arrival:', error);
      alert(error?.response?.data?.error || 'Failed to delete tourist arrival.');
    }
  };

  useEffect(() => {
    loadTouristArrivals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="tourism-arrivals" className="reports-section">
      <h2 className="gov-page-title">
        <Icons.Users size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
        Tourist Arrivals
      </h2>
      <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
        Monthly tourist arrival log categorized by origin (foreign / local) and sex (male / female) for LGU reporting.
      </p>

      {touristArrivalsLoading && !touristSummary ? (
        <div className="gov-glass-panel gov-empty">Loading tourist arrivals...</div>
      ) : (
        <>
          {/* Summary KPI cards */}
          <div className="gov-stats-grid" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Arrivals', value: touristSummary?.totals?.total_arrivals ?? 0, color: '#16a34a' },
              { label: 'Foreign', value: touristSummary?.totals?.total_foreign ?? 0, color: '#3b82f6' },
              { label: 'Local', value: touristSummary?.totals?.total_local ?? 0, color: '#f59e0b' },
              { label: 'Male', value: touristSummary?.totals?.total_male ?? 0, color: '#8b5cf6' },
              { label: 'Female', value: touristSummary?.totals?.total_female ?? 0, color: '#ec4899' },
            ].map((kpi) => (
              <div key={kpi.label} className="gov-stat-card">
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.75 }}>{kpi.label}</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: kpi.color }}>{Number(kpi.value).toLocaleString()}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.6 }}>{touristSummary?.totals?.months_logged ?? 0} month(s) logged</div>
              </div>
            ))}
          </div>

          {/* Yearly trend chart */}
          {(touristSummary?.byYear?.length > 0) && (
            <div className="gov-glass-panel" style={{ marginBottom: '1.5rem' }}>
              <h3 className="gov-glass-panel__title">Yearly Arrival Trend</h3>
              <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: touristSummary.byYear.map((y) => String(y.year)),
                    datasets: [
                      { label: 'Foreign', data: touristSummary.byYear.map((y) => y.foreign_count), backgroundColor: '#3b82f6' },
                      { label: 'Local', data: touristSummary.byYear.map((y) => y.local_count), backgroundColor: '#f59e0b' },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: false, grid: { display: false } },
                      y: { beginAtZero: true, ticks: { precision: 0 } },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {/* Add / edit entry */}
          <div className="gov-glass-panel" style={{ marginBottom: '1.5rem' }}>
            <h3 className="gov-glass-panel__title">Log Monthly Arrivals</h3>
            <div className="gov-form-grid">
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Month</span>
                <input
                  type="month"
                  className="gov-input"
                  value={touristForm.month}
                  onChange={(e) => setTouristForm({ ...touristForm, month: e.target.value })}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Foreign</span>
                <input
                  type="number" min="0" step="1"
                  className="gov-input"
                  value={touristForm.foreign}
                  onChange={(e) => setTouristForm({ ...touristForm, foreign: e.target.value })}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Local</span>
                <input
                  type="number" min="0" step="1"
                  className="gov-input"
                  value={touristForm.local}
                  onChange={(e) => setTouristForm({ ...touristForm, local: e.target.value })}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Male</span>
                <input
                  type="number" min="0" step="1"
                  className="gov-input"
                  value={touristForm.male}
                  onChange={(e) => setTouristForm({ ...touristForm, male: e.target.value })}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Female</span>
                <input
                  type="number" min="0" step="1"
                  className="gov-input"
                  value={touristForm.female}
                  onChange={(e) => setTouristForm({ ...touristForm, female: e.target.value })}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', gridColumn: '1 / -1' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Notes (optional)</span>
                <input
                  type="text"
                  className="gov-input"
                  placeholder="e.g. Fiesta, peak season, special events"
                  value={touristForm.notes}
                  onChange={(e) => setTouristForm({ ...touristForm, notes: e.target.value })}
                />
              </label>
            </div>
            {(Number(touristForm.male) || 0) + (Number(touristForm.female) || 0) !== (Number(touristForm.foreign) || 0) + (Number(touristForm.local) || 0) && (
              <p style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.82rem' }}>
                Counts do not match: Male + Female must equal Foreign + Local.
              </p>
            )}
            <div className="gov-form-actions">
              <button
                className="gov-btn gov-btn-primary"
                onClick={handleTouristArrivalSave}
                disabled={touristSaving}
              >
                {touristSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>

          {/* Records table */}
          {touristArrivals.length > 0 && (
            <div className="gov-glass-panel">
              <h3 className="gov-glass-panel__title">Logged Months</h3>
              <div className="gov-table-wrap">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Foreign</th>
                      <th>Local</th>
                      <th>Male</th>
                      <th>Female</th>
                      <th>Total</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {touristArrivals.map((a) => (
                      <tr key={a.arrival_id}>
                        <td>
                          <strong>
                            {(() => {
                              const [y, m] = String(a.month).split('-');
                              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              return `${months[Number(m) - 1]} ${y}`;
                            })()}
                          </strong>
                        </td>
                        <td>{a.foreign_count}</td>
                        <td>{a.local_count}</td>
                        <td>{a.male_count}</td>
                        <td>{a.female_count}</td>
                        <td><strong>{a.foreign_count + a.local_count}</strong></td>
                        <td style={{ fontSize: '0.82rem', color: '#6b7280' }}>{a.notes || ''}</td>
                        <td>
                          <button
                            className="gov-btn gov-btn-danger"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            onClick={() => handleTouristArrivalDelete(a.arrival_id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default TouristArrivalsReport;
