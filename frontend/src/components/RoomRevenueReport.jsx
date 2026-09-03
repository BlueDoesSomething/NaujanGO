import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const RoomRevenueReport = ({ hotelId, hotelName }) => {
  const { t } = useLanguage();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hotelId) return;
    fetchRevenueReport();
  }, [hotelId]);

  const fetchRevenueReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `/api/owner/hotels/${hotelId}/reports/rooms`,
        { withCredentials: true }
      );
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load revenue report');
      console.error('Revenue report error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: '#fff',
        borderRadius: '12px',
        marginTop: '2rem'
      }}>
        <p style={{ color: '#666' }}>Loading revenue report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        background: '#fff',
        borderRadius: '12px',
        marginTop: '2rem',
        border: '1px solid #fee2e2',
        color: '#991b1b'
      }}>
        <p>{error}</p>
        <button
          onClick={fetchRevenueReport}
          style={{
            marginTop: '1rem',
            background: '#2e7d32',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!reportData || !reportData.rooms || reportData.rooms.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        background: '#fff',
        borderRadius: '12px',
        marginTop: '2rem',
        textAlign: 'center',
        color: '#666'
      }}>
        <p>No booking data available yet</p>
      </div>
    );
  }

  const { rooms, totals } = reportData;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ color: '#2e7d32', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
        📊 {hotelName} - Room Revenue Report
      </h2>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #2e7d32, #388e3c)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px #2e7d324d'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
            ${totals.confirmed_revenue.toFixed(2)}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #1976d2, #1565c0)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px #1976d24d'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Confirmed Bookings</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
            {totals.confirmed_bookings}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #f57c00, #e65100)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px #f57c004d'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Nights Booked</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
            {totals.total_nights}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #7b1fa2, #6a1b9a)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px #7b1fa24d'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Occupancy Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
            {totals.average_occupancy_rate}%
          </div>
        </div>
      </div>

      {/* Room Details Table */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px #0000001a',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: 0, color: '#2e7d32' }}>Room Breakdown</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#2e7d32' }}>
                  Room Type
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#2e7d32' }}>
                  Bookings
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#2e7d32' }}>
                  Nights
                </th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#2e7d32' }}>
                  Revenue
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#2e7d32' }}>
                  Occupancy
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#2e7d32' }}>
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, idx) => (
                <tr
                  key={room.room_id}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    background: idx % 2 === 0 ? '#fff' : '#f8f9fa'
                  }}
                >
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#2c3e50' }}>
                    {room.room_type_name}
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                      ${room.price_per_night}/night
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: '#555' }}>
                    {room.confirmed_bookings}/{room.total_bookings}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: '#555' }}>
                    {room.total_nights}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#2e7d32' }}>
                    ${room.confirmed_revenue.toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: '#555' }}>
                    {room.occupancy_rate}%
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {room.average_rating ? (
                      <div>
                        <span style={{ color: '#f39c12', fontWeight: 600 }}>
                          ⭐ {room.average_rating}
                        </span>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          ({room.review_count} reviews)
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <button
          onClick={fetchRevenueReport}
          style={{
            background: '#2e7d32',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#1b4d24';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#2e7d32';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🔄 Refresh Report
        </button>
      </div>
    </div>
  );
};

export default RoomRevenueReport;
