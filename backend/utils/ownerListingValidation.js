// Validate only supplied fields so small, authenticated partial updates keep
// working. In particular zero configured rooms is a valid pause in inventory.
export const validateOwnerRoomWrite = (body, creating = false) => {
  if (creating && ['room_type_name', 'capacity', 'price_per_night', 'quantity_available'].some(key => body[key] == null || body[key] === '')) return 'Room name, guests per room, nightly rate and configured inventory are required.';
  if (body.room_type_name !== undefined && (typeof body.room_type_name !== 'string' || !body.room_type_name.trim())) return 'Room type name is required.';
  for (const [key, min] of [['capacity', 1], ['quantity_available', 0]]) {
    if (body[key] !== undefined && (!['string', 'number'].includes(typeof body[key]) || String(body[key]).trim() === '' || !Number.isSafeInteger(Number(body[key])) || Number(body[key]) < min)) return `${key} must be a whole number of at least ${min}.`;
  }
  if (body.price_per_night !== undefined && (!['string', 'number'].includes(typeof body.price_per_night) || !(Number(body.price_per_night) > 0) || !Number.isFinite(Number(body.price_per_night)))) return 'Nightly rate must be greater than zero.';
  for (const key of ['check_in_time', 'check_out_time']) {
    if (body[key] !== undefined && (typeof body[key] !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(body[key]))) return `${key} must be a valid time.`;
  }
  if (body.currency !== undefined && (typeof body.currency !== 'string' || !/^[A-Z]{3}$/.test(body.currency))) return 'Use a three-letter currency code.';
  if (body.is_active !== undefined && ![0, 1, '0', '1'].includes(body.is_active)) return 'Room visibility must be 0 or 1.';
  return null;
};

export const validateOwnerHotelWrite = body => {
  for (const key of ['name', 'location']) {
    if (body[key] !== undefined && (typeof body[key] !== 'string' || !body[key].trim())) return `${key} cannot be empty.`;
  }
  if (body.contact_email != null && body.contact_email !== '' && (typeof body.contact_email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contact_email))) return 'Enter a valid public contact email.';
  if (body.currency !== undefined && (typeof body.currency !== 'string' || !/^[A-Z]{3}$/.test(body.currency))) return 'Use a three-letter currency code.';
  return null;
};
