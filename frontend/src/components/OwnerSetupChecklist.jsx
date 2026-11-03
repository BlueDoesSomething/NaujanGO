import React from 'react';

export default function OwnerSetupChecklist({ hotel, rooms, verified, onNavigate, onEdit }) {
  const hasPhotos = Boolean(hotel?.image_url || hotel?.image_urls?.length || rooms.some(room => room.primary_image_url || room.image_urls?.length));
  const items = [
    ['Property details', Boolean(hotel?.name && hotel?.location && hotel?.description), () => onNavigate('hotels'), 'Add the name, public contact details and description.'],
    ['Rooms & rates', rooms.some(room => Number(room.is_active) === 1 && Number(room.price_per_night) > 0 && Number(room.quantity_available) > 0), () => onNavigate('rooms'), 'Add bookable room types and nightly/hourly rates.'],
    ['Photos', hasPhotos, () => hotel ? onEdit(hotel, 'photos') : onNavigate('hotels'), 'Show guests your property and rooms.'],
    ['Policies', null, () => hotel ? onEdit(hotel, 'policies') : onNavigate('hotels'), 'Review cancellation, check-in times and house rules.'],
    ['Business verification', verified, () => onNavigate('profile'), 'Submit requirements for booking access.']
  ];
  return <section className="gov-glass-panel owner-setup" aria-label="Property setup checklist">
    <h2>Property setup</h2><p>Complete the basics, then review your guest-facing listing. This checklist does not override verification or inventory restrictions.</p>
    <div className="owner-setup-list">{items.map(([label, complete, action, description]) => <button type="button" key={label} onClick={action}>
      <span className={`owner-setup-state${complete ? ' is-complete' : ''}`}>{complete ? '✓' : '→'}</span>
      <span><strong>{label}</strong><small>{description}</small></span><span>{complete ? 'Review' : complete === null ? 'Review' : 'Set up'}</span>
    </button>)}</div>
  </section>;
}
