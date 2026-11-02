import { formatBookingBoundary } from './stayBooking.js';
import { getBookingGuestName } from './bookingGuestName.js';
import { getBookingPaymentMethod, getPaymentMethodLabel, getPaymentReferences } from './paymentDisplay.js';

const columns = entries => entries.map(([key, label]) => ({ key, label }));
const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? '' : Number(value);
const money = (value, currency = 'PHP') => number(value) === '' ? 'Not available' : `${currency} ${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pdfColumns = entries => entries.map(([key, label, width]) => ({ key, label, width }));
const report = (title, fields, rows, notes = '') => ({
  title, filename: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  columns: columns(notes ? [...fields, ['scope', 'Export scope']] : fields), printColumns: columns(fields),
  rows: rows.map(row => notes ? { ...row, scope: notes } : row), notes
});

export const ownerRecordReport = (type, rows, notes = '') => {
  if (type === 'bookings') {
    const result = report('Bookings report', [['id', 'Booking ID'], ['reference', 'Booking reference'], ['hotel', 'Hotel'], ['room', 'Room type'],
      ['guest', 'Guest'], ['checkIn', 'Check-in (PHT)'], ['checkOut', 'Check-out (PHT)'], ['rooms', 'Rooms'], ['guests', 'Guests'],
      ['booked', 'Booked on'], ['currency', 'Currency'], ['total', 'Total'], ['paid', 'Recorded paid'], ['balance', 'Balance due'],
      ['method', 'Payment method'], ['paymentStatus', 'Payment status'], ['status', 'Booking status'], ['archived', 'Archived']], rows.map(row => ({
        id: row.booking_id, reference: row.booking_reference || row.receipt_number || '', hotel: row.hotel_name, room: row.room_type_name,
        guest: getBookingGuestName(row), checkIn: formatBookingBoundary(row), checkOut: formatBookingBoundary(row, 'out'), rooms: row.rooms, guests: row.guests,
        booked: row.booking_date || row.created_at || '', currency: row.currency || 'PHP', total: number(row.total_amount), paid: number(row.amount_paid),
        balance: number(row.balance_due), method: getPaymentMethodLabel(getBookingPaymentMethod(row)), paymentStatus: row.payment_status,
        status: row.status, archived: Number(row.archived) === 1 ? 'Yes' : 'No'
      })), notes);
    result.printColumns = result.columns.filter(column => ['id', 'hotel', 'guest', 'checkIn', 'checkOut', 'total', 'balance', 'currency', 'status', 'paymentStatus'].includes(column.key));
    result.documentType = 'RESERVATION REPORT'; result.pdfLandscape = true;
    result.summary = [['Loaded matching reservations', rows.length], ['Confirmed', rows.filter(row => row.status === 'confirmed').length], ['Pending', rows.filter(row => row.status === 'pending').length]];
    result.pdfSections = [{ title: 'Reservation details', notes, columns: pdfColumns([['id', 'ID', 5], ['hotelRoom', 'Hotel / room', 16], ['guest', 'Guest', 14], ['stay', 'Stay (PHT)', 22], ['financial', 'Recorded amounts', 23], ['state', 'Status', 20]]),
      rows: result.rows.map(row => ({ ...row, hotelRoom: [row.hotel, row.room].filter(Boolean).join('\n'), stay: `In: ${row.checkIn}\nOut: ${row.checkOut}\n${row.rooms ?? '—'} rooms · ${row.guests ?? '—'} guests`,
        financial: `Total: ${money(row.total, row.currency)}\nPaid: ${money(row.paid, row.currency)}\nBalance: ${money(row.balance, row.currency)}`,
        state: `Booking: ${row.status || 'Not available'}\nPayment: ${row.paymentStatus || 'Not available'}${row.archived === 'Yes' ? '\nArchived' : ''}` })) }];
    return result;
  }
  if (type === 'payments') {
    const result = report('Loaded payments report', [['id', 'Payment ID'], ['booking', 'Booking ID'], ['reference', 'Booking reference'],
    ['guest', 'Guest'], ['room', 'Room type'], ['amount', 'Amount'], ['currency', 'Currency'], ['method', 'Method'], ['status', 'Status'],
    ['references', 'Payment references'], ['created', 'Created at'], ['paid', 'Paid at'], ['archived', 'Archived']], rows.map(row => ({
      id: row.payment_id, booking: row.booking_id, reference: row.booking_reference, guest: row.customer_name, room: row.room_type_name,
      amount: number(row.amount), currency: row.currency || 'PHP', method: getPaymentMethodLabel(row.method), status: row.status,
      references: getPaymentReferences(row).map(reference => `${reference.label}: ${reference.value}`).join('\n'),
      created: row.created_at, paid: row.paid_at, archived: Number(row.archived) === 1 ? 'Yes' : 'No'
    })), notes);
    result.printColumns = result.printColumns.filter(column => ['id', 'booking', 'guest', 'amount', 'currency', 'method', 'status', 'references', 'created'].includes(column.key));
    result.documentType = 'PAYMENT ATTEMPTS'; result.pdfLandscape = true;
    result.summary = [['Loaded matching attempts', rows.length], ['Succeeded (loaded)', rows.filter(row => row.status === 'succeeded').length], ['Pending (loaded)', rows.filter(row => row.status === 'pending').length]];
    result.pdfSections = [{ title: 'Loaded payment attempts', notes,
      columns: pdfColumns([['id', 'ID', 5], ['bookingInfo', 'Booking', 12], ['guest', 'Guest', 14], ['amountText', 'Amount', 14], ['method', 'Method', 11], ['state', 'Status', 12], ['references', 'References', 18], ['created', 'Created at', 14]]),
      rows: result.rows.map(row => ({ ...row, bookingInfo: [row.booking, row.reference].filter(value => value != null && value !== '').join('\n'),
        amountText: money(row.amount, row.currency), state: `${row.status || 'Not available'}${row.archived === 'Yes' ? '\nArchived' : ''}` })) }];
    return result;
  }
  if (type === 'reviews') {
    const result = report('Reviews report', [['id', 'Review ID'], ['hotel', 'Hotel'], ['reviewer', 'Reviewer'], ['rating', 'Rating'],
    ['comment', 'Comment'], ['reply', 'Owner reply'], ['visibility', 'Visibility'], ['date', 'Created at']], rows.map(row => ({
      id: row.review_id, hotel: row.hotel_name, reviewer: row.username || 'Anonymous', rating: number(row.rating), comment: row.comment,
      reply: row.owner_reply, visibility: Number(row.moderated) === 0 ? 'Hidden' : 'Visible', date: row.created_at
    })), notes);
    result.documentType = 'CUSTOMER REVIEWS';
    const ratings = result.rows.map(row => row.rating).filter(value => value !== '');
    result.summary = [['Loaded reviews', rows.length], ['Average rating (loaded)', ratings.length ? `${(ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)} / 5` : 'Not available']];
    result.pdfSections = [{ title: 'Customer feedback', notes,
      columns: pdfColumns([['review', 'Review', 26], ['rating', 'Rating', 10], ['comment', 'Comment', 36], ['reply', 'Owner reply', 28]]),
      rows: result.rows.map(row => ({ ...row, review: `#${row.id ?? ''}\n${row.reviewer}\n${row.hotel || ''}\n${row.date || ''}\n${row.visibility}` })) }];
    return result;
  }
  throw new Error('Unsupported record report');
};

export const analyticsReport = (type, { data = {}, stats = {}, visitor = null, period = 'monthly', userRole = 'admin' } = {}) => {
  const key = period === '7d' ? 'day' : 'month';
  const trends = (period === '7d' ? data?.dailyTrends : data?.monthlyTrends) || [];
  const range = period === '7d' ? 'Daily (last 7 days)' : 'Monthly (last 6 months)';
  const trendRows = trends.map(row => ({ period: row[key] || '', bookings: number(row.bookings ?? row.count), revenue: number(row.revenue), occupancy: number(row.occupancy) }));
  const reports = {
    bookings: report('Booking trends', [['period', key === 'day' ? 'Day' : 'Month'], ['bookings', 'Bookings']], trendRows, range),
    revenue: report('Revenue trends', [['period', key === 'day' ? 'Day' : 'Month'], ['revenue', 'Revenue (PHP)']], trendRows, range),
    occupancy: report('Occupancy trends', [['period', key === 'day' ? 'Day' : 'Month'], ['occupancy', 'Occupancy (%)']], trendRows, range),
    hotels: report('Hotel performance', [['category', 'Hotel'], ['bookings', 'Bookings'], ['revenue', 'Revenue (PHP)'], ['rating', 'Average rating']],
      (data?.hotelPerformance || []).map(row => ({ category: row.name, bookings: number(row.bookings), revenue: number(row.revenue), rating: number(row.avg_rating) })), 'Current hotel performance; not limited by the trend date selector.'),
    performance: report('Performance totals', [['category', 'Metric'], ['count', 'Count']], Object.entries(stats?.totals || {})
      .filter(([metric]) => ['bookings', 'hotels', ...(userRole === 'admin' ? ['users', 'attractions'] : [])].includes(metric))
      .map(([category, value]) => ({ category, count: number(value) })), 'Current totals; not limited by the trend date selector.')
  };
  if (userRole === 'admin') {
    const visitorScope = visitor ? 'Current visitor demographics; not limited by the trend date selector.' : 'Visitor demographics are not available or are still loading; this is not a zero count.';
    reports.visitors = report('Visitor totals', [['category', 'Metric'], ['count', 'Count']],
      [['total_visitors', 'Website visitors'], ['total_visits', 'Total visits']].map(([key, category]) => ({ category, count: number(visitor?.totals?.[key]) })), visitorScope);
    reports.gender = report('Visitor gender distribution', [['category', 'Gender'], ['count', 'Visitors'], ['percentage', 'Percentage (%)']],
      (visitor?.gender_distribution || []).map(row => ({ category: row.gender, count: number(row.count), percentage: number(row.percentage) })), visitorScope);
    reports.usertype = report('Visitor type distribution', [['category', 'Visitor type'], ['count', 'Visitors'], ['percentage', 'Percentage (%)']],
      (visitor?.user_type_distribution || []).map(row => ({ category: row.user_type, count: number(row.count), percentage: number(row.percentage) })), visitorScope);
    reports.demographics = report('Visitor demographic breakdown', [['gender', 'Gender'], ['userType', 'Visitor type'], ['count', 'Visitors'], ['percentage', 'Percentage (%)']],
      (visitor?.combined_breakdown || []).map(row => ({ gender: row.gender, userType: row.user_type, count: number(row.count),
        percentage: Number(visitor?.totals?.total_visitors) > 0 ? Math.round(Number(row.count) / Number(visitor.totals.total_visitors) * 1000) / 10 : '' })), visitorScope);
    reports.roles = report('User role distribution', [['category', 'Role'], ['count', 'Users']],
      (stats?.roleDistribution || []).map(row => ({ category: row.role, count: number(row.count) })), 'Current user totals.');
  }
  if (type !== 'all') {
    if (!reports[type]) throw new Error('Unsupported analytics report');
    return { ...reports[type], documentType: 'ANALYTICS REPORT', filename: `${reports[type].filename}-${period}` };
  }
  const sections = Object.values(reports);
  return { title: 'Reports and analytics', filename: `analytics-${period}`, documentType: 'ANALYTICS SUMMARY', subtitle: `${range}. Demographic and performance tables use their own current totals.`,
    summary: [['Trend selection', range], ['Trend periods loaded', trends.length], ['Access scope', userRole === 'owner' ? 'Owner: accessible hotel data only' : 'Admin analytics']],
    columns: columns([['section', 'Report'], ['period', 'Period'], ['category', 'Category'], ['bookings', 'Bookings'], ['revenue', 'Revenue (PHP)'],
      ['occupancy', 'Occupancy (%)'], ['rating', 'Average rating'], ['count', 'Count'], ['gender', 'Gender'], ['userType', 'Visitor type'], ['percentage', 'Percentage (%)'], ['scope', 'Export scope']]),
    rows: sections.flatMap(section => section.rows.length
      ? section.rows.map(row => ({ ...row, section: section.title }))
      : [{ section: section.title, scope: `${section.notes || ''} No records available in this selection.`.trim() }]), sections };
};
