// The calendar endpoint returns per-date inventory. Checkout is not a booked night.
export const assessStayAvailability = (days, checkIn, checkOut, roomCount, hourly = false) => {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  const nights = Math.round((end - start) / 86400000);
  if (!Number.isFinite(start) || !Number.isFinite(end) || (hourly ? nights < 0 : nights < 1)) {
    return { status: 'invalid', message: 'Choose a valid check-in and check-out date.' };
  }
  if (!hourly && nights > 180) {
    return { status: 'invalid', message: 'Choose a stay of 180 nights or fewer.' };
  }

  const byDate = new Map((Array.isArray(days) ? days : []).map(day => [day.date, day]));
  for (let offset = 0; offset < (hourly ? 1 : nights); offset += 1) {
    const date = new Date(start + offset * 86400000).toISOString().slice(0, 10);
    const day = byDate.get(date);
    if (!day) return { status: 'error', message: 'Could not confirm availability for every date. Please retry.' };
    if (Number(day.closed) === 1) {
      return { status: 'invalid', message: `${date} is closed. Choose new dates or another room.` };
    }
    if (!hourly && (!Number.isFinite(Number(day.available)) || Number(day.available) < roomCount)) {
      return { status: 'invalid', message: `Only ${Math.max(0, Number(day.available) || 0)} room(s) available on ${date}. Choose new dates, fewer rooms, or another room type.` };
    }
  }
  return { status: 'valid', message: '' };
};
