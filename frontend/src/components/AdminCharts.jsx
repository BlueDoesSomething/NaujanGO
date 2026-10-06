import React from 'react';

export const ChartLoader = () => (
  <div style={{ 
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    minHeight: '300px'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #e8f5e9',
        borderTop: '4px solid #2e7d32',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem'
      }} />
      <div style={{ color: '#718096', fontSize: '0.95rem', fontWeight: 600 }}>Loading chart data...</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);
