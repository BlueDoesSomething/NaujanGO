import React, { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import api from '../api';
import './RoomManagement.css';
import '../pages/HotelDetail.css';

const amenityIconFor = (amenity) => {
  const a = String(amenity || '').toLowerCase();
  if (a.includes('wi-fi') || a.includes('wifi') || a.includes('internet')) return <Icons.Wifi size={16} />;
  if (a.includes('air-con') || a.includes('air con') || a.includes('aircond') || a.includes('condition') || a.includes('snow')) return <Icons.Snowflake size={16} />;
  if (a.includes('laundry') || a.includes('wash') || a.includes('linen') || a.includes('shirt') || a.includes('iron')) return <Icons.Shirt size={16} />;
  if (a.includes('restaurant') || a.includes('dining') || a.includes('breakfast') || a.includes('bar') || a.includes('kitchen')) return <Icons.Utensils size={16} />;
  if (a.includes('pool') || a.includes('spa') || a.includes('water')) return <Icons.Waves size={16} />;
  if (a.includes('parking') || a.includes('car') || a.includes('shuttle')) return <Icons.MapPin size={16} />;
  if (a.includes('coffee') || a.includes('tea')) return <Icons.Coffee size={16} />;
  if (a.includes('gym') || a.includes('fitness') || a.includes('sport')) return <Icons.Users size={16} />;
  if (a.includes('tv') || a.includes('television') || a.includes('cable')) return <Icons.Photo size={16} />;
  return <Icons.Check size={16} />;
};

// '14:00' / '14:00:00' -> '2:00 PM' (mysql2 returns TIME with seconds).
const fmtTime = (value) => {
  if (!value) return '';
  const m = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!m) return String(value);
  const hour = parseInt(m[1], 10);
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m[2]} ${meridiem}`;
};

const RoomManagement = ({ hotel, onClose, t = (key) => key }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomSaving, setRoomSaving] = useState(false);
  
  const emptyRoom = {
    room_type_name: '',
    bed_type: '', // NEW: Bed type
    description: '',
    capacity: 1,
    room_size_sqm: '',
    price_per_night: '',
    currency: 'PHP',
    quantity_available: 1,
    amenities: [],
    image_urls: [],
    is_active: 1,
    room_features: [], // NEW: Why guests love this room
    check_in_time: '14:00', // NEW: Check-in policy (24h for <input type="time">)
    check_out_time: '11:00', // NEW: Check-out policy (24h for <input type="time">)
    smoking_allowed: false, // NEW: Smoking policy
    pets_allowed: false, // NEW: Pet policy
    events_allowed: false // NEW: Events policy
  };

  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    fetchRooms();
  }, [hotel]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/owner/hotels/${hotel.hotel_id}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true
    }));
    setSelectedImages([...selectedImages, ...newImages]);
  };

  const handleRemoveImage = (index) => {
    const imageToRemove = selectedImages[index];
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index) => {
    const updatedUrls = roomForm.image_urls.filter((_, i) => i !== index);
    setRoomForm({ ...roomForm, image_urls: updatedUrls });
  };

  const handleSaveRoom = async () => {
    if (!roomForm.room_type_name || !roomForm.price_per_night || !roomForm.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setRoomSaving(true);
      const amenities = amenitiesInput
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      const roomFeatures = featuresInput
        .split(',')
        .map(f => f.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.append('room_type_name', roomForm.room_type_name);
      formData.append('bed_type', roomForm.bed_type || '');
      formData.append('description', roomForm.description);
      formData.append('capacity', roomForm.capacity);
      formData.append('room_size_sqm', roomForm.room_size_sqm || '');
      formData.append('price_per_night', roomForm.price_per_night);
      formData.append('currency', roomForm.currency);
      formData.append('quantity_available', roomForm.quantity_available);
      formData.append('amenities', JSON.stringify(amenities));
      formData.append('room_features', JSON.stringify(roomFeatures));
      
      // Append existing image URLs
      formData.append('image_urls', JSON.stringify(roomForm.image_urls));
      
      // Append new image files
      selectedImages.forEach((img) => {
        if (img.isNew && img.file) {
          formData.append('images', img.file);
        }
      });
      
      formData.append('is_active', roomForm.is_active ? 1 : 0);
      formData.append('check_in_time', roomForm.check_in_time);
      formData.append('check_out_time', roomForm.check_out_time);
      formData.append('smoking_allowed', roomForm.smoking_allowed ? 1 : 0);
      formData.append('pets_allowed', roomForm.pets_allowed ? 1 : 0);
      formData.append('events_allowed', roomForm.events_allowed ? 1 : 0);

      if (editingRoom) {
        await api.put(`/owner/hotels/${hotel.hotel_id}/rooms/${editingRoom.room_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/owner/hotels/${hotel.hotel_id}/rooms`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setEditingRoom(null);
      setCreatingRoom(false);
      setRoomForm(emptyRoom);
      setAmenitiesInput('');
      setFeaturesInput('');
      setSelectedImages([]);
      await fetchRooms();
    } catch (error) {
      console.error('Failed to save room:', error);
      alert(error.response?.data?.error || 'Failed to save room');
    } finally {
      setRoomSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room type?')) return;

    try {
      await api.delete(`/owner/hotels/${hotel.hotel_id}/rooms/${roomId}`);
      await fetchRooms();
    } catch (error) {
      console.error('Failed to delete room:', error);
      alert('Failed to delete room');
    }
  };

  const startEditRoom = (room) => {
    setEditingRoom(room);
    setCreatingRoom(false);
    // Merge with defaults so nullable DB fields never leave inputs uncontrolled.
    setRoomForm({
      ...emptyRoom,
      ...room,
      description: room.description || '',
      room_size_sqm: room.room_size_sqm || '',
      bed_type: room.bed_type || '',
      // TIME comes back as 'HH:MM:SS'; time inputs need 'HH:MM'.
      check_in_time: String(room.check_in_time || emptyRoom.check_in_time).slice(0, 5),
      check_out_time: String(room.check_out_time || emptyRoom.check_out_time).slice(0, 5),
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
      room_features: Array.isArray(room.room_features) ? room.room_features : [],
      image_urls: Array.isArray(room.image_urls) ? room.image_urls : []
    });
    setAmenitiesInput(Array.isArray(room.amenities) ? room.amenities.join(', ') : '');
    setFeaturesInput(Array.isArray(room.room_features) ? room.room_features.join(', ') : '');
    setSelectedImages([]);
  };

  const startCreateRoom = () => {
    setEditingRoom(null);
    setCreatingRoom(true);
    setRoomForm(emptyRoom);
    setAmenitiesInput('');
    setFeaturesInput('');
    setSelectedImages([]);
  };

  const cancelForm = () => {
    setEditingRoom(null);
    setCreatingRoom(false);
    setRoomForm(emptyRoom);
    setAmenitiesInput('');
    setFeaturesInput('');
    setSelectedImages([]);
  };

  const amenityPreview = amenitiesInput.split(',').map(a => a.trim()).filter(Boolean);
  const featurePreview = featuresInput.split(',').map(f => f.trim()).filter(Boolean);
  const totalUnits = rooms.reduce((sum, r) => sum + (parseInt(r.quantity_available, 10) || 0), 0);
  const activeRooms = rooms.filter(r => Number(r.is_active) === 1).length;

  return (
    <>
      <div className="hd-rm-scroll">
        <div className="hd-rm-grid">
          {/* Left: rooms + form */}
          <div className="hd-rm-main">
            <div className="hd-rm-head">
              <h2>Room Types &amp; Inventory</h2>
              <p>
                <Icons.MapPin size={13} />
                {hotel.name} · {hotel.location || 'Location not specified'}
              </p>
              <div className="hd-rm-chips">
                <span className="hd-rm-chip hd-rm-chip-green">
                  <Icons.Check size={12} /> {rooms.length} {rooms.length === 1 ? 'room type' : 'room types'}
                </span>
                <span className="hd-rm-chip hd-rm-chip-green">
                  <Icons.Bed size={12} /> {totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
                </span>
                {rooms.length - activeRooms > 0 && (
                  <span className="hd-rm-chip hd-rm-chip-amber">
                    <Icons.Info size={12} /> {rooms.length - activeRooms} inactive
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="rm-loading">
                <div className="rm-spinner" />
                <p>Loading room types...</p>
              </div>
            ) : (
              <>
                {rooms.length > 0 && (
                  <div className="rm-list">
                    {rooms.map((room) => {
                      const imgCount = Array.isArray(room.image_urls) ? room.image_urls.length : 0;
                      return (
                        <article className="rm-card" key={room.room_id}>
                          <div className="hd-rm-gallery rm-gallery">
                            {room.primary_image_url ? (
                              <img src={room.primary_image_url} alt={room.room_type_name} />
                            ) : (
                              <div className="hd-rm-ph"><Icons.Bed size={56} /></div>
                            )}
                            <span className={`hd-rm-flag ${room.is_active ? 'hd-rm-flag-ok' : 'hd-rm-flag-bad'}`}>
                              {room.is_active ? (
                                <><Icons.Check size={12} /> Active</>
                              ) : (
                                <><Icons.X size={12} /> Inactive</>
                              )}
                            </span>
                            {imgCount > 0 && (
                              <span className="hd-rm-gcount">
                                <Icons.Camera size={12} />
                                1 / {imgCount}
                              </span>
                            )}
                          </div>

                          <div className="rm-body">
                            <h3 className="rm-title">{room.room_type_name}</h3>

                            {room.description && (
                              <p className="hd-rm-desc">{room.description}</p>
                            )}

                            <div className="rm-stats">
                              <div className="hd-rm-stat">
                                <Icons.Users size={16} />
                                <p className="hd-rm-stat-label">Capacity</p>
                                <p className="hd-rm-stat-value">
                                  {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                                </p>
                              </div>
                              {room.bed_type && (
                                <div className="hd-rm-stat">
                                  <Icons.Bed size={16} />
                                  <p className="hd-rm-stat-label">Bed Type</p>
                                  <p className="hd-rm-stat-value">{room.bed_type}</p>
                                </div>
                              )}
                              {room.room_size_sqm ? (
                                <div className="hd-rm-stat">
                                  <Icons.Ruler size={16} />
                                  <p className="hd-rm-stat-label">Room Size</p>
                                  <p className="hd-rm-stat-value">{room.room_size_sqm} m²</p>
                                </div>
                              ) : (
                                <div className="hd-rm-stat">
                                  <Icons.Calendar size={16} />
                                  <p className="hd-rm-stat-label">Availability</p>
                                  <p className="hd-rm-stat-value">{room.quantity_available}</p>
                                </div>
                              )}
                            </div>

                            {(room.check_in_time || room.check_out_time || room.smoking_allowed || room.pets_allowed || room.events_allowed) && (
                              <div className="hd-rm-chips">
                                {room.check_in_time && (
                                  <span className="hd-rm-chip hd-rm-chip-green">
                                    <Icons.Clock size={12} /> In from {fmtTime(room.check_in_time)}
                                  </span>
                                )}
                                {room.check_out_time && (
                                  <span className="hd-rm-chip hd-rm-chip-green">
                                    <Icons.Clock size={12} /> Out by {fmtTime(room.check_out_time)}
                                  </span>
                                )}
                                {room.smoking_allowed && (
                                  <span className="hd-rm-chip hd-rm-chip-amber">
                                    <Icons.Info size={12} /> Smoking
                                  </span>
                                )}
                                {room.pets_allowed && (
                                  <span className="hd-rm-chip hd-rm-chip-amber">
                                    <Icons.Info size={12} /> Pets
                                  </span>
                                )}
                                {room.events_allowed && (
                                  <span className="hd-rm-chip hd-rm-chip-amber">
                                    <Icons.Sparkles size={12} /> Events
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="hd-rm-pricebox">
                              <div>
                                <p className="hd-rm-sec-title">Price per night</p>
                                <p className="hd-rm-price">₱{parseFloat(room.price_per_night).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="hd-rm-sec-title">Availability</p>
                                <p className={`hd-rm-avail${room.quantity_available > 0 ? '' : ' bad'}`}>
                                  <span className="hd-rm-dot" />
                                  {room.quantity_available}
                                </p>
                                <p className="hd-rm-avail-sub">
                                  {room.quantity_available > 0 ? 'units ready to book' : 'room currently unavailable'}
                                </p>
                              </div>
                            </div>

                            {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                              <div>
                                <p className="hd-rm-sec-title">Amenities</p>
                                <div className="hd-rm-amen">
                                  {room.amenities.slice(0, 4).map((amenity, i) => (
                                    <div className="hd-rm-amen-row" key={i}>
                                      <span className="hd-rm-amen-ic">{amenityIconFor(amenity)}</span>
                                      <p>{amenity}</p>
                                    </div>
                                  ))}
                                </div>
                                {room.amenities.length > 4 && (
                                  <p className="rm-more">+{room.amenities.length - 4} more</p>
                                )}
                              </div>
                            )}

                            {Array.isArray(room.room_features) && room.room_features.length > 0 && (
                              <div>
                                <p className="hd-rm-sec-title">Why guests love this room</p>
                                <div className="hd-rm-chips">
                                  {room.room_features.slice(0, 4).map((feature, i) => (
                                    <span className="hd-rm-chip hd-rm-chip-green" key={`feat-${i}`}>
                                      <Icons.Sparkles size={12} /> {feature}
                                    </span>
                                  ))}
                                  {room.room_features.length > 4 && (
                                    <span className="hd-rm-chip">+{room.room_features.length - 4}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="rm-actions">
                              <button
                                type="button"
                                className="rm-btn rm-btn-ghost"
                                onClick={() => startEditRoom(room)}
                              >
                                <Icons.Pencil size={14} /> Edit
                              </button>
                              <button
                                type="button"
                                className="rm-btn rm-btn-danger"
                                onClick={() => handleDeleteRoom(room.room_id)}
                              >
                                <Icons.X size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {rooms.length === 0 && !creatingRoom && !editingRoom && (
                  <div className="rm-empty">
                    <Icons.Bed size={48} />
                    <h3>No Room Types Yet</h3>
                    <p>Create your first room type to get started with inventory management</p>
                    <button type="button" className="rm-btn rm-btn-primary" onClick={startCreateRoom}>
                      <Icons.Plus size={16} /> Add First Room Type
                    </button>
                  </div>
                )}

                {/* Edit / Create Form */}
                {(editingRoom || creatingRoom) && (
                  <div className="rm-form">
                    <div className="rm-form-head">
                      <span className="rm-form-ic">
                        {creatingRoom ? <Icons.Plus size={18} /> : <Icons.Pencil size={18} />}
                      </span>
                      <div>
                        <h3>
                          {creatingRoom ? t('admin_add_new_room_type') : `${t('edit')}: ${editingRoom?.room_type_name}`}
                        </h3>
                        <p>Fields marked with * are required</p>
                      </div>
                    </div>

                    {/* Basics */}
                    <div className="rm-form-sec">
                      <p className="hd-rm-sec-title">Basics</p>
                      <div className="rm-grid3">
                        <label className="rm-field">
                          <span className="rm-label">
                            Room Type Name <span className="req">*</span>
                          </span>
                          <input
                            type="text"
                            value={roomForm.room_type_name}
                            onChange={(e) => setRoomForm({ ...roomForm, room_type_name: e.target.value })}
                            className="rm-input"
                            placeholder={t('form_room_type_name')}
                            required
                          />
                        </label>

                        <label className="rm-field">
                          <span className="rm-label">
                            Capacity (People) <span className="req">*</span>
                          </span>
                          <input
                            type="number"
                            value={roomForm.capacity}
                            onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 1 })}
                            className="rm-input"
                            min="1"
                            required
                          />
                        </label>

                        <label className="rm-field">
                          <span className="rm-label">Bed Type</span>
                          <input
                            type="text"
                            value={roomForm.bed_type || ''}
                            onChange={(e) => setRoomForm({ ...roomForm, bed_type: e.target.value })}
                            className="rm-input"
                            placeholder={t('form_bed_type')}
                          />
                        </label>

                        <label className="rm-field">
                          <span className="rm-label">Room Size (m²)</span>
                          <input
                            type="number"
                            value={roomForm.room_size_sqm}
                            onChange={(e) => setRoomForm({ ...roomForm, room_size_sqm: e.target.value })}
                            className="rm-input"
                            step="0.1"
                            placeholder={t('form_room_size')}
                          />
                        </label>

                        <label className="rm-field">
                          <span className="rm-label">
                            Price per Night (₱) <span className="req">*</span>
                          </span>
                          <input
                            type="number"
                            value={roomForm.price_per_night}
                            onChange={(e) => setRoomForm({ ...roomForm, price_per_night: e.target.value })}
                            className="rm-input"
                            step="0.01"
                            min="0"
                            required
                          />
                        </label>

                        <label className="rm-field">
                          <span className="rm-label">
                            Available Rooms <span className="req">*</span>
                          </span>
                          <input
                            type="number"
                            value={roomForm.quantity_available}
                            onChange={(e) => setRoomForm({ ...roomForm, quantity_available: parseInt(e.target.value) || 1 })}
                            className="rm-input"
                            min="1"
                            required
                          />
                        </label>

                        <label className="rm-field">
                          <span className="rm-label">Status</span>
                          <select
                            value={roomForm.is_active ? '1' : '0'}
                            onChange={(e) => setRoomForm({ ...roomForm, is_active: e.target.value === '1' ? 1 : 0 })}
                            className="gov-input"
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.75rem',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.88rem',
                              background: 'white'
                            }}
                          >
                            <option value="1">● Active</option>
                            <option value="0">○ Inactive</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="rm-form-sec">
                      <p className="hd-rm-sec-title">Description</p>
                      <textarea
                        value={roomForm.description}
                        onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                        className="rm-input"
                        rows={3}
                        placeholder={t('form_room_description')}
                      />
                    </div>

                    {/* Amenities */}
                    <div className="rm-form-sec">
                      <p className="hd-rm-sec-title">Amenities</p>
                      <input
                        type="text"
                        value={amenitiesInput}
                        onChange={(e) => setAmenitiesInput(e.target.value)}
                        className="rm-input"
                        placeholder={t('form_room_amenities')}
                      />
                      <small className="rm-hint">
                        Tip: Enter amenities separated by commas for better organization
                      </small>
                      {amenityPreview.length > 0 && (
                        <div className="hd-rm-chips">
                          {amenityPreview.slice(0, 8).map((amenity, i) => (
                            <span className="hd-rm-chip hd-rm-chip-green" key={`amen-${i}`}>
                              {amenity}
                            </span>
                          ))}
                          {amenityPreview.length > 8 && (
                            <span className="hd-rm-chip">+{amenityPreview.length - 8}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Why guests love this room */}
                    <div className="rm-form-sec">
                      <p className="hd-rm-sec-title">Why guests love this room</p>
                      <input
                        type="text"
                        value={featuresInput}
                        onChange={(e) => setFeaturesInput(e.target.value)}
                        className="rm-input"
                        placeholder="e.g. City view, Free breakfast, Private balcony"
                      />
                      <small className="rm-hint">
                        Tip: Enter highlights separated by commas — shown to guests on the room card
                      </small>
                      {featurePreview.length > 0 && (
                        <div className="hd-rm-chips">
                          {featurePreview.slice(0, 8).map((feature, i) => (
                            <span className="hd-rm-chip hd-rm-chip-green" key={`feat-${i}`}>
                              <Icons.Sparkles size={12} /> {feature}
                            </span>
                          ))}
                          {featurePreview.length > 8 && (
                            <span className="hd-rm-chip">+{featurePreview.length - 8}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Photos */}
                    <div className="rm-form-sec">
                      <p className="hd-rm-sec-title">Photos</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="rm-file"
                      />
                      <small className="rm-hint">
                        Upload high-quality images (JPG, PNG). Upload multiple images to showcase different views of the room.
                      </small>

                      {roomForm.image_urls && roomForm.image_urls.length > 0 && (
                        <div>
                          <p className="rm-sublabel">Current Images ({roomForm.image_urls.length})</p>
                          <div className="rm-thumbs">
                            {roomForm.image_urls.map((url, index) => (
                              <div key={`existing-${index}`} className="rm-thumb">
                                <img src={url} alt={`Room ${index + 1}`} />
                                <button
                                  type="button"
                                  className="rm-thumb-x"
                                  onClick={() => handleRemoveExistingImage(index)}
                                  aria-label="Remove image"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedImages.length > 0 && (
                        <div>
                          <p className="rm-sublabel">New Images to Upload ({selectedImages.length})</p>
                          <div className="rm-thumbs">
                            {selectedImages.map((img, index) => (
                              <div key={`new-${index}`} className="rm-thumb new">
                                <img src={img.preview} alt={`New ${index + 1}`} />
                                <button
                                  type="button"
                                  className="rm-thumb-x"
                                  onClick={() => handleRemoveImage(index)}
                                  aria-label="Remove image"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Room policies */}
                    <div className="rm-form-sec">
                      <p className="hd-rm-sec-title">Room policies &amp; rules</p>
                      <div className="rm-grid2">
                        <label className="rm-field">
                          <span className="rm-label">
                            <Icons.Clock size={13} /> Check-in Time
                          </span>
                          <input
                            type="time"
                            value={roomForm.check_in_time}
                            onChange={(e) => setRoomForm({ ...roomForm, check_in_time: e.target.value })}
                            className="rm-input"
                          />
                        </label>
                        <label className="rm-field">
                          <span className="rm-label">
                            <Icons.Clock size={13} /> Check-out Time
                          </span>
                          <input
                            type="time"
                            value={roomForm.check_out_time}
                            onChange={(e) => setRoomForm({ ...roomForm, check_out_time: e.target.value })}
                            className="rm-input"
                          />
                        </label>
                      </div>

                      <div className="rm-checks">
                        <label className="rm-check">
                          <input
                            type="checkbox"
                            checked={roomForm.smoking_allowed || false}
                            onChange={(e) => setRoomForm({ ...roomForm, smoking_allowed: e.target.checked })}
                          />
                          <Icons.Info size={14} />
                          Smoking Allowed
                        </label>
                        <label className="rm-check">
                          <input
                            type="checkbox"
                            checked={roomForm.pets_allowed || false}
                            onChange={(e) => setRoomForm({ ...roomForm, pets_allowed: e.target.checked })}
                          />
                          <Icons.Filter size={14} />
                          Pets Allowed
                        </label>
                        <label className="rm-check">
                          <input
                            type="checkbox"
                            checked={roomForm.events_allowed || false}
                            onChange={(e) => setRoomForm({ ...roomForm, events_allowed: e.target.checked })}
                          />
                          <Icons.Sparkles size={14} />
                          Events &amp; Parties
                        </label>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="rm-form-actions">
                      <button
                        type="button"
                        className="rm-btn rm-btn-ghost"
                        onClick={cancelForm}
                        disabled={roomSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="rm-btn rm-btn-primary"
                        onClick={handleSaveRoom}
                        disabled={roomSaving}
                      >
                        {roomSaving ? (
                          <>
                            <span className="rm-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Icons.Check size={16} />
                            {creatingRoom ? 'Add Room Type' : 'Save Changes'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: side panel (mirrors the room modal booking panel) */}
          <div className="hd-rm-side">
            <div className="hd-rm-side-inner">
              <button type="button" className="hd-rm-book" onClick={startCreateRoom}>
                <Icons.Plus size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                Add Room Type
              </button>

              <div className="hd-rm-pricebox">
                <div>
                  <p className="hd-rm-sec-title">Room types</p>
                  <p className="hd-rm-price">{rooms.length}</p>
                </div>
                <div>
                  <p className="hd-rm-sec-title">Total units</p>
                  <p className={`hd-rm-avail${totalUnits > 0 ? '' : ' bad'}`}>
                    <span className="hd-rm-dot" />
                    {totalUnits}
                  </p>
                  <p className="hd-rm-avail-sub">across all room types</p>
                </div>
              </div>

              <div className={`hd-rm-status${rooms.length > 0 && activeRooms === 0 ? ' bad' : ''}`}>
                <p className="hd-rm-status-label">Inventory status</p>
                <p className="hd-rm-status-value">
                  <Icons.Check size={14} />
                  {rooms.length === 0 ? 'No rooms yet' : `${activeRooms} of ${rooms.length} active`}
                </p>
              </div>

              <div className="hd-rm-note">
                <Icons.Info size={13} />
                <p>Changes go live on your public listing immediately after saving.</p>
              </div>

              {onClose && (
                <div className="hd-rm-cta">
                  <button type="button" className="rm-btn rm-btn-done" onClick={onClose}>
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bar (mirrors the room modal) */}
      <div className="hd-rm-mbar">
        <div className="hd-rm-mbar-price">
          <small>Room types</small>
          <strong>{rooms.length} · {totalUnits} units</strong>
        </div>
        <button type="button" className="hd-rm-book" onClick={onClose}>
          Done
        </button>
      </div>
    </>
  );
};

export default RoomManagement;
