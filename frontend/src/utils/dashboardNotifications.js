export const notificationIsRead = value => value === true || value === 1 || value === '1';

// Only known activity types get a destination. Never follow a URL from stored
// notification text or guess that an unrelated record belongs to this account.
export const notificationDestination = (notification, role) => {
  if (['booking', 'booking_message'].includes(notification.type)) return { module: 'bookings', label: role === 'admin' ? 'Open Bookings' : 'Open Reservations' };
  if (notification.type === 'payment') return { module: 'payments', label: role === 'admin' ? 'Open Payments' : 'Open Payment History' };
  if (notification.type === 'message' && role === 'owner') return { module: 'messages', label: 'Open Messages' };
  return null;
};
