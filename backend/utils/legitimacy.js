import db from '../db.js';

// Legitimacy & authorization rules (feature: Legitimacy & Accreditation Badges).
//
// Full authorization = business permit present AND (DOT accreditation OR
// PhilGEPS approval) present AND the business profile is admin-verified.
// Anything else = limited (hotels + profile only, listing-only hotels).

const hasText = (value) => typeof value === 'string' && value.trim() !== '';

export const LEGITIMACY_FIELDS = [
  'business_permit_no', 'business_permit_expiry', 'business_permit_file',
  'dot_no', 'dot_expiry', 'dot_file',
  'philgeps_no', 'philgeps_expiry', 'philgeps_file'
];

// Per-item badges shown to guests — only admin-verified items count.
export const badgesFor = (businessProfile) => {
  const verified = !!businessProfile && businessProfile.verification_status === 'verified';
  return {
    business_permit: verified && hasText(businessProfile.business_permit_no),
    dot: verified && hasText(businessProfile.dot_no),
    philgeps: verified && hasText(businessProfile.philgeps_no)
  };
};

// { authorization: 'full'|'limited', missing_requirements: [...] }
export const computeAuthorization = (businessProfile) => {
  const missing = [];
  const permit = !!businessProfile && hasText(businessProfile.business_permit_no);
  const extra = !!businessProfile && (hasText(businessProfile.dot_no) || hasText(businessProfile.philgeps_no));
  const verified = !!businessProfile && businessProfile.verification_status === 'verified';

  if (!permit) missing.push('business_permit');
  if (!extra) missing.push('dot_or_philgeps');
  if (!verified) missing.push('verification');

  return { authorization: missing.length === 0 ? 'full' : 'limited', missing_requirements: missing };
};

// Legitimacy of the owners of the given hotels (any fully-authorized owner of a
// hotel enables booking for it). Returns { ok, map } where ok=false means the
// lookup itself failed — callers should fail open (booking stays enabled) so a
// broken join never takes down reservations.
export const getHotelLegitimacy = async (hotelIds) => {
  const map = new Map();
  const ids = (hotelIds || []).map(Number).filter(Number.isFinite);
  if (ids.length === 0) return { ok: true, map };

  try {
    const [rows] = await db.promise().query(
      `SELECT ho.hotel_id,
              MAX(CASE WHEN bp.verification_status = 'verified'
                         AND bp.business_permit_no IS NOT NULL AND bp.business_permit_no <> '' THEN 1 ELSE 0 END) AS permit,
              MAX(CASE WHEN bp.verification_status = 'verified'
                         AND bp.dot_no IS NOT NULL AND bp.dot_no <> '' THEN 1 ELSE 0 END) AS dot,
              MAX(CASE WHEN bp.verification_status = 'verified'
                         AND bp.philgeps_no IS NOT NULL AND bp.philgeps_no <> '' THEN 1 ELSE 0 END) AS philgeps
       FROM hotel_owners ho
       INNER JOIN business_profiles bp ON bp.owner_id = ho.user_id
       WHERE ho.hotel_id IN (?)
       GROUP BY ho.hotel_id`,
      [ids]
    );

    for (const row of rows) {
      const legitimacy = {
        business_permit: !!row.permit,
        dot: !!row.dot,
        philgeps: !!row.philgeps
      };
      map.set(Number(row.hotel_id), {
        legitimacy,
        booking_enabled: legitimacy.business_permit && (legitimacy.dot || legitimacy.philgeps)
      });
    }
    return { ok: true, map };
  } catch (error) {
    console.error('Hotel legitimacy lookup failed:', error.message);
    return { ok: false, map };
  }
};

const NO_LEGITIMACY = Object.freeze({
  legitimacy: Object.freeze({ business_permit: false, dot: false, philgeps: false }),
  booking_enabled: false
});

export const NO_LEGITIMACY_DEFAULT = NO_LEGITIMACY;

// Attach legitimacy + booking_enabled to one hotel object.
export const attachHotelLegitimacy = async (hotel) => {
  if (!hotel || hotel.id === undefined || hotel.id === null) return hotel;
  const { ok, map } = await getHotelLegitimacy([hotel.id]);
  const info = ok ? (map.get(Number(hotel.id)) || NO_LEGITIMACY) : NO_LEGITIMACY;
  hotel.legitimacy = info.legitimacy;
  hotel.booking_enabled = ok ? info.booking_enabled : true;
  return hotel;
};

// Attach legitimacy + booking_enabled to a list of hotel objects.
export const attachHotelLegitimacyList = async (hotels) => {
  if (!Array.isArray(hotels) || hotels.length === 0) return hotels;
  const { ok, map } = await getHotelLegitimacy(hotels.map((h) => h.id));
  for (const hotel of hotels) {
    const info = ok ? (map.get(Number(hotel.id)) || NO_LEGITIMACY) : NO_LEGITIMACY;
    hotel.legitimacy = info.legitimacy;
    hotel.booking_enabled = ok ? info.booking_enabled : true;
  }
  return hotels;
};
