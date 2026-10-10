import React, { useState, useEffect } from 'react';
import axios from 'axios';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #dde8e2',
  borderRadius: '12px',
  padding: '1.25rem 1.5rem'
};

const cardLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#6b7280'
};

const cardValueStyle = {
  fontSize: '1.75rem',
  fontWeight: 800,
  color: '#1B5E20',
  marginTop: '0.5rem',
  lineHeight: 1
};

const tableHeaderCellStyle = {
  padding: '1rem',
  fontWeight: 700,
  color: '#1B5E20'
};

const RoomRevenueReport = ({ hotelId, hotelName }) => {
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

  const summaryCards = [
    { label: 'Total Revenue', value: `₱${totals.confirmed_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Confirmed Bookings', value: totals.confirmed_bookings },
    { label: 'Total Nights Booked', value: totals.total_nights },
    { label: 'Occupancy Rate', value: `${totals.average_occupancy_rate}%` }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ color: '#1B5E20', marginBottom: '1.5rem', fontSize: '1.35rem', fontWeight: 800 }}>
        {hotelName} — Room Revenue Report
      </h2>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {summaryCards.map((card) => (
          <div key={card.label} style={cardStyle}>
            <div style={cardLabelStyle}>{card.label}</div>
            <div style={cardValueStyle}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Room Details Table */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #dde8e2',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, color: '#1B5E20', fontSize: '1.05rem', fontWeight: 700 }}>Room Breakdown</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ ...tableHeaderCellStyle, textAlign: 'left' }}>Room Type</th>
                <th style={{ ...tableHeaderCellStyle, textAlign: 'center' }}>Bookings</th>
                <th style={{ ...tableHeaderCellStyle, textAlign: 'center' }}>Nights</th>
                <th style={{ ...tableHeaderCellStyle, textAlign: 'right' }}>Revenue</th>
                <th style={{ ...tableHeaderCellStyle, textAlign: 'center' }}>Occupancy</th>
                <th style={{ ...tableHeaderCellStyle, textAlign: 'center' }}>Rating</th>
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
                      ₱{Number(room.price_per_night).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/night
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: '#555' }}>
                    {room.confirmed_bookings}/{room.total_bookings}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: '#555' }}>
                    {room.total_nights}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#1B5E20' }}>
                    ₱{room.confirmed_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: '#555' }}>
                    {room.occupancy_rate}%
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {room.average_rating ? (
                      <div>
                        <span style={{ fontWeight: 600, color: '#2c3e50' }}>
                          {room.average_rating}
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
            transition: 'background 0.3s ease'
          }}
          onMouseOver={(e) => { e.target.style.background = '#1b4d24'; }}
          onMouseOut={(e) => { e.target.style.background = '#2e7d32'; }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default RoomRevenueReport;
