export const STAY_HOURS = [3, 12, 24];
export const PAYMENT_PLANS = ['reservation', 'half', 'full'];
const parse = value => { try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return null; } };
export const getHourlyRates = value => {
  const rates = parse(value) || {};
  return Object.fromEntries(STAY_HOURS.filter(hours => Number(rates[hours]) > 0 && Number.isFinite(Number(rates[hours])))
    .map(hours => [hours, Number(rates[hours])]));
};
export const getPaymentPlans = value => {
  if (value == null) return [...PAYMENT_PLANS];
  const plans = parse(value);
  return Array.isArray(plans) ? PAYMENT_PLANS.filter(plan => plans.includes(plan)) : [];
};
export const philippineToday = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
export const hourlyCheckout = (date, time, hours) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '') || !STAY_HOURS.includes(Number(hours))) return null;
  const start = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(start) || new Date(start).toISOString().slice(0, 10) !== date) return null;
  const value = new Date(start + Number(hours) * 3600000).toISOString().slice(0, 16);
  return { date: value.slice(0, 10), time: value.slice(11, 16), value: value.replace('T', ' ') };
};
export const bookingLocalTime = (booking, side = 'in') => {
  const snapshot = parse(booking?.policy_snapshot) || {};
  const history = getStayExtensions(booking);
  const value = (side === 'out' ? history.at(-1)?.to : null) || snapshot[`check_${side}_at`] || booking?.[`check_${side}_at`];
  return typeof value === 'string' ? value.replace('T', ' ').slice(0, 16) : '';
};

export const getStayExtensions = booking => {
  const snapshot = parse(booking?.policy_snapshot) || {};
  return Array.isArray(snapshot.stay_extensions) ? snapshot.stay_extensions.filter(item => item
    && Number(item.hours) > 0 && Number.isFinite(Number(item.hours))
    && Number(item.amount) > 0 && Number.isFinite(Number(item.amount)) && typeof item.to === 'string') : [];
};

export const extensionPreview = (checkout, hours, rate, rooms) => {
  if (typeof checkout !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(checkout)
      || !STAY_HOURS.includes(Number(hours)) || !(Number(rate) > 0) || !Number.isFinite(Number(rate))
      || !Number.isSafeInteger(Number(rooms)) || Number(rooms) < 1) return null;
  const start = Date.parse(`${checkout.replace(' ', 'T')}Z`);
  if (!Number.isFinite(start) || new Date(start).toISOString().slice(0, 19) !== checkout.replace(' ', 'T')) return null;
  return {
    checkout: new Date(start + Number(hours) * 3600000).toISOString().slice(0, 19).replace('T', ' '),
    amount: Math.round(Number(rate) * Number(rooms) * 100) / 100
  };
};

export const stayProgress = (booking, now = Date.now()) => {
  if (!booking?.stay_duration_hours || booking.status !== 'confirmed' || Number(booking.archived) === 1
      || ['refunded', 'refund_pending', 'disputed'].includes(booking.payment_status)) return null;
  const start = bookingInstant(booking).getTime(), end = bookingInstant(booking, 'out').getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start > now) return { state: 'upcoming', canExtend: false, label: 'Starts later' };
  if (end <= now) return { state: 'overdue', canExtend: true, label: 'Checkout due — staff follow-up needed' };
  const minutes = Math.ceil((end - now) / 60000);
  return minutes <= 30 ? { state: 'soon', canExtend: true, label: `Checkout in ${minutes} min` }
    : { state: 'active', canExtend: true, label: 'Stay in progress' };
};
export const bookingInstant = (booking, side = 'in') => {
  const local = bookingLocalTime(booking, side);
  if (local) return new Date(`${local.replace(' ', 'T')}:00+08:00`);
  const date = String(booking?.[`check_${side}`] || '').slice(0, 10);
  return new Date(`${date}T${side === 'in' ? '14:00' : '12:00'}:00+08:00`);
};
export const formatBookingBoundary = (booking, side = 'in') => {
  if (booking?.stay_duration_hours) {
    const instant = bookingInstant(booking, side);
    return Number.isFinite(instant.getTime()) ? `${instant.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    })} PHT` : '—';
  }
  const date = String(booking?.[`check_${side}`] || '').slice(0, 10);
  const instant = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(instant.getTime()) ? instant.toLocaleDateString('en-PH', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }) : '—';
};
