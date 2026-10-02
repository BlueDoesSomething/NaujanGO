// Flexible payment options: reservation fee / half / full.
// Amount paid is always derived from succeeded hotel_payments rows (never a
// denormalized column) so display, checkout validation and enforcement agree.

export const PAYMENT_OPTIONS = ['reservation', 'half', 'full'];

const round2 = (value) => Math.round(value * 100) / 100;

// Amount due for the FIRST payment of a booking under its chosen option.
// Returns null when the option cannot be honoured (missing/oversized fee).
export const dueNow = (option, total, reservationFee) => {
  const amount = Number(total) || 0;
  if (amount <= 0) return 0;

  if (option === 'half') return round2(Math.ceil(amount / 2));

  if (option === 'reservation') {
    const fee = reservationFee == null ? null : Number(reservationFee);
    if (fee == null || Number.isNaN(fee) || fee <= 0) return null;
    if (fee >= amount) return null;
    return round2(fee);
  }

  return round2(amount);
};

// Still owed on a booking given what has already succeeded.
// Paid bookings are treated as settled regardless of row history.
export const balanceOf = (total, amountPaidSucceeded, paymentStatus) => {
  if (paymentStatus === 'paid' || paymentStatus === 'refunded') return 0;
  const totalAmount = Number(total) || 0;
  const paid = Number(amountPaidSucceeded) || 0;
  const remaining = round2(totalAmount - paid);
  return remaining > 0 ? remaining : 0;
};

// Booking status after payments reach `amountPaidSucceeded`.
// With nothing paid yet the previous status is kept (unpaid/pending/failed);
// with something paid it is 'partial' until the total is covered.
export const statusAfterPayment = (total, amountPaidSucceeded, previousStatus = 'unpaid') => {
  const paid = Number(amountPaidSucceeded) || 0;
  if (paid <= 0) return previousStatus;
  const totalAmount = Number(total) || 0;
  return paid + 0.01 >= totalAmount ? 'paid' : 'partial';
};

// Gateways reject tiny amounts; reservation fees below this are invalid.
export const MIN_GATEWAY_AMOUNT = 10;
