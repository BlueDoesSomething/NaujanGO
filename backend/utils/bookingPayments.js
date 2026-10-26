// Display metadata only: do not change booking/payment rows or paid totals.
// IDs must come from the owner's already-authorized booking query.
export const fetchBookingPaymentDetails = async (dbLike, bookingIds) => {
  const ids = [...new Set(bookingIds.map(Number).filter(id => Number.isInteger(id) && id > 0))];
  const details = new Map();
  if (ids.length === 0) return details;

  // Older databases may not have migration 036's customer-entered reference.
  // Reading that optional field must not break the Reservations endpoint.
  const [columns] = await dbLike.query(
    "SHOW COLUMNS FROM hotel_payments LIKE 'customer_reference_number'"
  );
  const customerReference = columns.some(column => column.Field === 'customer_reference_number')
    ? 'customer_reference_number'
    : 'NULL AS customer_reference_number';
  const [rows] = await dbLike.query(
    `SELECT payment_id, booking_id, method, provider, status,
            transaction_reference, ${customerReference}
     FROM hotel_payments
     WHERE booking_id IN (?)
     ORDER BY payment_id DESC`,
    [ids]
  );
  const allowedIds = new Set(ids);
  for (const row of rows) {
    const bookingId = Number(row.booking_id);
    if (!allowedIds.has(bookingId)) continue;
    const current = details.get(bookingId);
    const succeeded = row.status === 'succeeded';
    const currentSucceeded = current?.status === 'succeeded';
    if (!current || (succeeded && !currentSucceeded)
        || (succeeded === currentSucceeded && Number(row.payment_id) > Number(current.payment_id))) {
      details.set(bookingId, {
        payment_id: row.payment_id,
        method: row.method,
        provider: row.provider,
        status: row.status,
        transaction_reference: row.transaction_reference,
        customer_reference_number: row.customer_reference_number
      });
    }
  }
  return details;
};

const text = value => typeof value === 'string' ? value.trim() || null : null;

export const getBookingPaymentFields = (booking, details) => {
  const payment = details.get(Number(booking.booking_id));
  return {
    display_payment_method: text(payment?.method) || text(booking.payment_method),
    payment_record_id: payment?.payment_id ?? null,
    payment_record_status: payment?.status ?? null,
    payment_provider: payment?.provider ?? null,
    payment_customer_reference: text(payment?.customer_reference_number),
    // Only use a legacy booking reference when there is no selected payment.
    // Never attach an older attempt's reference to a different payment method.
    payment_transaction_reference: payment
      ? text(payment.transaction_reference)
      : text(booking.payment_reference)
  };
};
