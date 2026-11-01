import React from 'react';
import { getStayExtensions } from '../utils/stayBooking';

export default function StayExtensionHistory({ booking }) {
  const history = getStayExtensions(booking);
  if (!history.length) return null;
  return <section style={{ marginTop: '0.8rem', padding: '0.8rem', background: '#f0fdf4', borderRadius: 8 }}>
    <strong>Approved extensions</strong>
    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
      {history.map((item, index) => <li key={item.request_key || index}>
        +{item.hours} hours · {item.currency || booking.currency || 'PHP'} {Number(item.amount).toFixed(2)} added to total
        <small style={{ display: 'block' }}>Checkout: {item.to.slice(0, 16)} PHT</small>
      </li>)}
    </ul>
  </section>;
}
