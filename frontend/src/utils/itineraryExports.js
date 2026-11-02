import { formatBookingBoundary, getStayExtensions } from './stayBooking.js';
import { getBookingGuestName } from './bookingGuestName.js';
import { getBookingPaymentMethod, getPaymentMethodLabel } from './paymentDisplay.js';
import { buildPolicyLines } from './bookingPolicy.js';

const columns = entries => entries.map(([key, label, width]) => ({ key, label, ...(width ? { width } : {}) }));
const amount = value => value == null || value === '' || !Number.isFinite(Number(value)) ? '' : Number(value);
const money = (value, currency = 'PHP') => amount(value) === '' ? 'Not available' : `${currency} ${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = value => {
  const date = new Date(`${String(value || '').slice(0, 10)}T00:00:00Z`);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-PH', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';
};
const dayDate = (start, day) => {
  const date = new Date(`${String(start || '').slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + day - 1);
  return dateLabel(date.toISOString());
};
const statusLabel = value => String(value || 'draft').replace(/_/g, ' ').replace(/^./, char => char.toUpperCase());

export const itineraryStopReport = ({ itinerary = {}, items = [], draft = false }) => ({
  title: 'Itinerary stops', filename: `${itinerary.name || 'itinerary'}-stops`,
  columns: columns([['trip', 'Trip'], ['status', 'Trip status'], ['start', 'Start date'], ['end', 'End date'],
    ['day', 'Day'], ['order', 'Stop'], ['place', 'Place'], ['location', 'Location'], ['time', 'Start time'],
    ['duration', 'Duration (minutes)'], ['cost', 'Estimated cost (PHP)'], ['completed', 'Visited'], ['notes', 'Notes'], ['source', 'Export source']]),
  printColumns: columns([['day', 'Day', 6], ['order', 'Stop', 6], ['place', 'Place', 20], ['location', 'Location', 17],
    ['details', 'Time / notes', 31], ['cost', 'Est. cost (PHP)', 12], ['completed', 'Visited', 8]]),
  rows: [...items].sort((a, b) => Number(a.day_number || 1) - Number(b.day_number || 1)
    || Number(a.order_in_day ?? a.order_sequence ?? 0) - Number(b.order_in_day ?? b.order_sequence ?? 0)).map((item, index, sorted) => ({
      trip: itinerary.name || 'Untitled itinerary', status: itinerary.status || 'draft', source: draft ? 'Current builder draft (may include unsaved changes)' : 'Saved itinerary',
      start: itinerary.start_date || itinerary.startDate || '', end: itinerary.end_date || itinerary.endDate || '',
      day: Number(item.day_number || 1),
      order: sorted.slice(0, index + 1).filter(row => Number(row.day_number || 1) === Number(item.day_number || 1)).length,
      place: item.custom_name || item.attraction_name || item.name || '',
      location: item.custom_location || item.attraction_location || item.location || '',
      time: item.start_time || '', duration: amount(item.duration_minutes ?? item.estimated_duration),
      details: [item.start_time, item.duration_minutes != null || item.estimated_duration != null ? `${amount(item.duration_minutes ?? item.estimated_duration)} min` : '', item.notes].filter(Boolean).join('\n'),
      cost: amount(item.estimated_cost), completed: item.completed === true || Number(item.completed) === 1 ? 'Yes' : 'No', notes: item.notes || ''
    })),
  notes: `${draft ? 'Current builder draft; unsaved changes are not stored by this export. ' : ''}Costs and durations are estimates. Visited stops and the overall trip status are separate.`
});

export const itineraryBudgetReport = (rows = [], name = 'itinerary') => ({
  title: 'Daily estimated budget', filename: `${name}-budget-breakdown`,
  documentType: 'BUDGET BREAKDOWN', pdfLandscape: true,
  summary: [['Trip', name], ['Days in breakdown', rows.length], ['Basis', 'Displayed estimates, not payments']],
  columns: columns([['day', 'Day'], ['dayBudget', 'Allocated budget (PHP)'], ['attractionCost', 'Attractions (PHP)'],
    ['fareCost', 'Fare (PHP)'], ['foodCost', 'Food (PHP)'], ['otherCost', 'Other (PHP)'],
    ['estimatedNeed', 'Estimated need (PHP)'], ['balance', 'Balance (PHP)'], ['fits', 'Within allocated budget']]),
  printColumns: columns([['day', 'Day', 7], ['dayBudget', 'Allocated budget (PHP)', 14], ['attractionCost', 'Attractions (PHP)', 13],
    ['fareCost', 'Fare (PHP)', 13], ['foodCost', 'Food (PHP)', 13], ['otherCost', 'Other (PHP)', 13], ['estimatedNeed', 'Estimated need (PHP)', 14], ['balance', 'Balance (PHP)', 13]]),
  rows: rows.map(row => ({ ...Object.fromEntries(['day', 'dayBudget', 'attractionCost', 'fareCost', 'foodCost', 'otherCost', 'estimatedNeed', 'balance']
    .map(key => [key, amount(row[key])])), fits: row.fits == null ? '' : row.fits === true || Number(row.fits) === 1 ? 'Yes' : 'No' })),
  notes: 'Estimates reflect the displayed assumptions, not actual payments. Blank values are not available. Exporting does not save assumptions.'
});

export const itineraryPrintReport = ({ itinerary, items, budget = [], draft = false, totals = {} }) => {
  const stops = itineraryStopReport({ itinerary, items, draft });
  const dailyBudget = itineraryBudgetReport(budget, itinerary.name);
  const days = [...new Set([...stops.rows.map(row => row.day), ...budget.map(row => Number(row.day))])].sort((a, b) => a - b);
  const pdfSections = days.flatMap(day => {
    const date = dayDate(itinerary.start_date || itinerary.startDate, day);
    const costs = budget.find(row => Number(row.day) === day);
    const sections = [{ title: `Day ${day}${date ? ` · ${date}` : ''}`,
      columns: columns([['order', '#', 6], ['destination', 'Destination', 32], ['details', 'Schedule / notes', 38], ['cost', 'Est. cost (PHP)', 14], ['completed', 'Visited', 10]]),
      rows: stops.rows.filter(row => row.day === day).map(row => ({ ...row, destination: [row.place || 'Unnamed stop', row.location].filter(Boolean).join('\n') })) }];
    if (costs) sections.push({ title: `Day ${day} · Budget estimate`,
      notes: draft ? 'Daily estimated need covers fare, food and other costs. Attraction estimates are separate and included in the trip summary.' : 'Based on the displayed budget assumptions; these are estimates, not actual payments.',
      columns: columns([['field', 'Category', 50], ['value', 'Estimate', 50]]),
      rows: [['Attractions', costs.attractionCost], ['Fare', costs.fareCost], ['Food', costs.foodCost], ['Other', costs.otherCost],
        ['Estimated need', costs.estimatedNeed], ...(costs.dayBudget != null ? [['Allocated budget', costs.dayBudget]] : []),
        ...(costs.balance != null ? [['Balance', costs.balance]] : [])].map(([field, value]) => ({ field, value: money(value) })) });
    return sections;
  });
  return {
    title: itinerary.name || 'Untitled itinerary', filename: itinerary.name ? `${itinerary.name}-itinerary-summary` : 'itinerary-summary', documentType: 'ITINERARY SUMMARY',
    subtitle: `${draft ? 'Current builder draft · Unsaved changes are included, not saved.' : `Saved itinerary${itinerary.itinerary_id ? ` #${itinerary.itinerary_id}` : ''}`}\n${itinerary.description || ''}`,
    summary: [['Trip status', statusLabel(itinerary.status)], ['Travel dates', `${dateLabel(itinerary.start_date || itinerary.startDate)} — ${dateLabel(itinerary.end_date || itinerary.endDate)}`],
      ['Days / stops', `${itinerary.duration_days || itinerary.durationDays || days.length || 1} day(s) · ${items.length} stop(s)`], ['Estimated trip budget', money(totals.budget ?? itinerary.total_budget)],
      ['Travel estimates', `${totals.distance ?? itinerary.total_distance ?? 'Not available'} km · ${totals.time ?? itinerary.total_time ?? 'Not available'} minutes`],
      ['Visited stops', `${stops.rows.filter(row => row.completed === 'Yes').length} of ${items.length}`]],
    sections: [stops, dailyBudget], pdfSections: pdfSections.length ? pdfSections : [stops, dailyBudget],
    footer: 'Travel times, costs and routes are estimates, not bookings or quotations. This document does not save or complete the trip.'
  };
};

export const receiptExportReport = (receipt, t = key => key) => {
  let snapshot = receipt.policy_snapshot;
  if (typeof snapshot === 'string') { try { snapshot = JSON.parse(snapshot); } catch { snapshot = null; } }
  const policyLines = snapshot ? buildPolicyLines(snapshot, {
    checkIn: receipt.check_in, balanceDueAt: snapshot.balance_due_at || null,
    showBalance: Number(receipt.balance_due) > 0, t
  }) : [];
  const fields = [
    ['Receipt', receipt.receipt_number], ['Booking ID', receipt.booking_id], ['Booking reference', receipt.booking_reference],
    ['Hotel', receipt.hotel_name], ['Location', receipt.hotel_location], ['Guest', getBookingGuestName(receipt)],
    ['Email', receipt.customer_email], ['Phone', receipt.customer_phone],
    ['Check-in', formatBookingBoundary(receipt)], ['Check-out', formatBookingBoundary(receipt, 'out')],
    [receipt.stay_duration_hours ? 'Stay hours' : 'Nights', receipt.stay_duration_hours || receipt.nights],
    ['Rooms', receipt.rooms], ['Guests', receipt.guests], ['Booking status', receipt.status], ['Payment status', receipt.payment_status],
    ['Payment method', getPaymentMethodLabel(getBookingPaymentMethod(receipt))], ['Payment reference', receipt.payment_reference],
    ['Total', money(receipt.total_amount, receipt.currency)], ['Recorded paid', money(receipt.amount_paid, receipt.currency)],
    ['Balance due', money(receipt.balance_due, receipt.currency)], ['Issued at', receipt.issued_at],
    ['Payment plan', ({ reservation: 'Reservation fee', half: 'Half payment', full: 'Full payment' })[receipt.payment_option] || receipt.payment_option || ''],
    ['Amount due now', money(receipt.amount_due_now, receipt.currency)], ['Balance due date', receipt.balance_due_at],
    ['Policy agreed at', snapshot?.agreed_at || ''],
    ...getStayExtensions(receipt).map((extension, index) => [`Approved extension ${index + 1}`, `+${extension.hours} hours; ${money(extension.amount, extension.currency || receipt.currency)}; checkout ${extension.to} PHT`]),
    ...policyLines.map((line, index) => [`Booking policy ${index + 1}`, line.text])
  ];
  const rows = fields.map(([field, value]) => ({ field, value: value ?? '' }));
  const pairColumns = columns([['field', 'Field', 28], ['value', 'Value', 72]]);
  const section = (title, names, extra = () => false) => ({ title, columns: pairColumns, rows: rows.filter(row => names.includes(row.field) || extra(row.field)) });
  return { title: 'Booking receipt', filename: `receipt-${receipt.receipt_number || receipt.booking_id}`, documentType: 'BOOKING RECEIPT',
    subtitle: 'Booking and payment statuses are shown as recorded; this document is not a new payment confirmation.',
    summary: [['Receipt number', receipt.receipt_number || 'Not available'], ['Payment status', statusLabel(receipt.payment_status || 'unknown')],
      ['Total', money(receipt.total_amount, receipt.currency)], ['Recorded paid', money(receipt.amount_paid, receipt.currency)], ['Balance due', money(receipt.balance_due, receipt.currency)]],
    columns: pairColumns, rows,
    pdfSections: [section('Reservation', ['Receipt', 'Booking ID', 'Booking reference', 'Hotel', 'Location', 'Booking status', 'Issued at']),
      section('Guest', ['Guest', 'Email', 'Phone']), section('Stay details', ['Check-in', 'Check-out', 'Stay hours', 'Nights', 'Rooms', 'Guests'], field => field.startsWith('Approved extension ')),
      section('Payment record', ['Payment status', 'Payment method', 'Payment reference', 'Total', 'Recorded paid', 'Balance due', 'Payment plan', 'Amount due now', 'Balance due date']),
      { ...section('Policies agreed at booking', ['Policy agreed at'], field => field.startsWith('Booking policy ')), notes: snapshot ? 'Terms from the booking’s stored policy snapshot.' : 'No policy snapshot is available for this receipt.' }],
    footer: 'Exporting this receipt does not record a payment, approve an extension or change the terms agreed at booking.' };
};
