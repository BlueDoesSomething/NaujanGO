import React, { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import api from '../api';

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
    check_in_time: '2:00 PM', // NEW: Check-in policy
    check_out_time: '11:00 AM', // NEW: Check-out policy
    smoking_allowed: false, // NEW: Smoking policy
    pets_allowed: false, // NEW: Pet policy
    events_allowed: false // NEW: Events policy
  };

  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [amenitiesInput, setAmenitiesInput] = useState('');
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
    setRoomForm(room);
    setAmenitiesInput(Array.isArray(room.amenities) ? room.amenities.join(', ') : '');
    setSelectedImages([]);
  };

  const startCreateRoom = () => {
    setEditingRoom(null);
    setCreatingRoom(true);
    setRoomForm(emptyRoom);
    setAmenitiesInput('');
    setSelectedImages([]);
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid #c8e6c9'
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            color: '#1B5E20', 
            fontSize: '1.5rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Icons.Hotel size={28} style={{ color: '#2E7D32' }} />
            Room Types & Inventory
          </h2>
          <p style={{ 
            margin: '0.35rem 0 0 0', 
            color: '#718096', 
            fontSize: '0.9rem' 
          }}>
            Manage room types and availability for {hotel.name}
          </p>
        </div>
        <button
          className="gov-btn-primary"
          onClick={startCreateRoom}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            background: '#2E7D32',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s',
            boxShadow: '0 2px 8px rgba(46, 125, 50, 0.12)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#1B5E20';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#2E7D32';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(46, 125, 50, 0.12)';
          }}
        >
          <Icons.Plus size={18} />
          Add Room Type
        </button>
      </div>

      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 2rem', 
          color: '#718096',
          background: '#f8fdf7',
          borderRadius: '12px'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #c8e6c9',
            borderTop: '3px solid #2E7D32',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>Loading room types...</p>
        </div>
      ) : (
        <>
          {/* Room Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {rooms.map((room) => (
              <div
                key={room.room_id}
                style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(2, 6, 23, 0.08)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(46, 125, 50, 0.15)';
                  e.currentTarget.style.borderColor = '#c8e6c9';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 6, 23, 0.08)';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Room Image */}
                <div style={{
                  position: 'relative',
                  background: '#f0fdf4',
                  height: '160px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {room.primary_image_url ? (
                    <img
                      src={room.primary_image_url}
                      alt={room.room_type_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <Icons.Hotel size={48} style={{ color: '#c8e6c9' }} />
                  )}
                  {!room.is_active && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      background: '#EF5350',
                      color: 'white',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      Inactive
                    </div>
                  )}
                </div>

                {/* Room Details */}
                <div style={{ 
                  padding: '1.25rem',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#1B5E20'
                  }}>
                    {room.room_type_name}
                  </h3>

                  {room.description && (
                    <p style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      color: '#718096',
                      lineHeight: 1.4,
                      maxHeight: '2.8em',
                      overflow: 'hidden'
                    }}>
                      {room.description}
                    </p>
                  )}

                  {/* Features */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    padding: '0.75rem 0',
                    borderTop: '1px solid #e0e0e0',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                      <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.2rem' }}>
                        <Icons.Users size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                        Capacity
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#2E7D32', fontWeight: 600 }}>
                        {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                    {room.bed_type && (
                      <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                        <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.2rem' }}>
                          <Icons.Heart size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem', color: '#EF5350' }} />
                          Bed Type
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#2E7D32', fontWeight: 600 }}>
                          {room.bed_type}
                        </div>
                      </div>
                    )}
                    {room.room_size_sqm && (
                      <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                        <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.2rem' }}>
                          <Icons.Archive size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                          Size
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#2E7D32', fontWeight: 600 }}>
                          {room.room_size_sqm} m²
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Room Policies Badges */}
                  {(room.smoking_allowed || room.pets_allowed || room.events_allowed || room.check_in_time) && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      padding: '0.75rem 0',
                      borderTop: '1px solid #e0e0e0',
                      borderBottom: '1px solid #e0e0e0'
                    }}>
                      {room.check_in_time && (
                        <span style={{
                          background: '#e3f2fd',
                          color: '#1565c0',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <Icons.Clock size={12} />
                          {room.check_in_time}
                        </span>
                      )}
                      {room.smoking_allowed && (
                        <span style={{
                          background: '#fff3e0',
                          color: '#e65100',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          ✓ Smoking
                        </span>
                      )}
                      {room.pets_allowed && (
                        <span style={{
                          background: '#f3e5f5',
                          color: '#6a1b9a',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          ✓ Pets
                        </span>
                      )}
                      {room.events_allowed && (
                        <span style={{
                          background: '#fce4ec',
                          color: '#c2185b',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          ✓ Events
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price & Availability */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginTop: '0.75rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>
                        Price/Night
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2E7D32' }}>
                        ₱{parseFloat(room.price_per_night).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>
                        Available
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2E7D32' }}>
                        {room.quantity_available}
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                        Amenities
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem'
                      }}>
                        {room.amenities.slice(0, 3).map((amenity, i) => (
                          <span key={i} style={{
                            background: '#f0fdf4',
                            color: '#2E7D32',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            border: '1px solid #c8e6c9'
                          }}>
                            {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span style={{ 
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            color: '#718096',
                            fontWeight: 600
                          }}>
                            +{room.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginTop: 'auto',
                    paddingTop: '1rem'
                  }}>
                    <button
                      onClick={() => startEditRoom(room)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #2E7D32',
                        background: '#ffffff',
                        color: '#2E7D32',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f0fdf4';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      <Icons.Pencil size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.room_id)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #EF5350',
                        background: '#ffffff',
                        color: '#EF5350',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#ffebee';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      <Icons.X size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {rooms.length === 0 && !creatingRoom && !editingRoom && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              background: '#f8fdf7',
              borderRadius: '12px',
              border: '2px dashed #c8e6c9',
              color: '#718096'
            }}>
              <Icons.Hotel size={48} style={{ color: '#c8e6c9', marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#718096', fontSize: '1.05rem' }}>
                No Room Types Yet
              </h3>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem' }}>
                Create your first room type to get started with inventory management
              </p>
              <button
                className="gov-btn-primary"
                onClick={startCreateRoom}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2E7D32',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#1B5E20';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#2E7D32';
                }}
              >
                <Icons.Plus size={18} />
                Add First Room Type
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit/Create Form */}
      {(editingRoom || creatingRoom) && (
        <div style={{
          background: 'white',
          border: '2px solid #2E7D32',
          borderRadius: '12px',
          padding: '2rem',
          marginTop: '2rem',
          boxShadow: '0 4px 16px rgba(46, 125, 50, 0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            color: '#1B5E20',
            fontSize: '1.25rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Icons.Plus size={24} style={{ color: '#2E7D32' }} />
            {creatingRoom ? t('admin_add_new_room_type') : `${t('edit')}: ${editingRoom?.room_type_name}`}
          </h3>

          {/* Form Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                Room Type Name <span style={{ color: '#EF5350' }}>*</span>
              </span>
              <input
                type="text"
                value={roomForm.room_type_name}
                onChange={(e) => setRoomForm({ ...roomForm, room_type_name: e.target.value })}
                className="gov-input"
                placeholder={t('form_room_type_name')}
                required
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.95rem'
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                Capacity (People) <span style={{ color: '#EF5350' }}>*</span>
              </span>
              <input
                type="number"
                value={roomForm.capacity}
                onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 1 })}
                className="gov-input"
                min="1"
                required
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.95rem'
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                Bed Type
              </span>
              <input
                type="text"
                value={roomForm.bed_type || ''}
                onChange={(e) => setRoomForm({ ...roomForm, bed_type: e.target.value })}
                className="gov-input"
                placeholder={t('form_bed_type')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.95rem'
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                Room Size (m²)
              </span>
              <input
                type="number"
                value={roomForm.room_size_sqm}
                onChange={(e) => setRoomForm({ ...roomForm, room_size_sqm: e.target.value })}
                className="gov-input"
                step="0.1"
                placeholder={t('form_room_size')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.95rem'
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                Price per Night (₱) <span style={{ color: '#EF5350' }}>*</span>
              </span>
              <input
                type="number"
                value={roomForm.price_per_night}
                onChange={(e) => setRoomForm({ ...roomForm, price_per_night: e.target.value })}
                className="gov-input"
                step="0.01"
                min="0"
                required
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.95rem'
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                Available Rooms <span style={{ color: '#EF5350' }}>*</span>
              </span>
              <input
                type="number"
                value={roomForm.quantity_available}
                onChange={(e) => setRoomForm({ ...roomForm, quantity_available: parseInt(e.target.value) || 1 })}
                className="gov-input"
                min="1"
                required
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.95rem'
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                Status
              </span>
              <select
                value={roomForm.is_active ? '1' : '0'}
                onChange={(e) => setRoomForm({ ...roomForm, is_active: e.target.value === '1' ? 1 : 0 })}
                className="gov-input"
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.95rem',
                  background: 'white'
                }}
              >
                <option value="1">● Active</option>
                <option value="0">○ Inactive</option>
              </select>
            </label>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                Description
              </span>
              <textarea
                value={roomForm.description}
                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                className="gov-input"
                rows={3}
                placeholder={t('form_room_description')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </label>
          </div>

          {/* Amenities */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                Amenities (comma-separated)
              </span>
              <input
                type="text"
                value={amenitiesInput}
                onChange={(e) => setAmenitiesInput(e.target.value)}
                className="gov-input"
                placeholder={t('form_room_amenities')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #c8e6c9',
                  fontSize: '0.95rem'
                }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Tip: Enter amenities separated by commas for better organization
              </small>
            </label>
          </div>

          {/* Room Images Gallery */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.Cloud size={16} style={{ color: '#2E7D32' }} />
                Room Images
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px dashed #c8e6c9',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  backgroundColor: '#f8fdf7'
                }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Upload high-quality images (JPG, PNG). Upload multiple images to showcase different views of the room.
              </small>
            </label>

            {/* Existing Images */}
            {roomForm.image_urls && roomForm.image_urls.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1B5E20', marginBottom: '0.75rem' }}>
                  Current Images ({roomForm.image_urls.length})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                  {roomForm.image_urls.map((url, index) => (
                    <div key={`existing-${index}`} style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #c8e6c9',
                      aspectRatio: '1'
                    }}>
                      <img
                        src={url}
                        alt={`Room ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        onClick={() => handleRemoveExistingImage(index)}
                        type="button"
                        style={{
                          position: 'absolute',
                          top: '0.25rem',
                          right: '0.25rem',
                          background: '#EF5350',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#E53935'}
                        onMouseOut={(e) => e.target.style.background = '#EF5350'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Selected Images */}
            {selectedImages.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1B5E20', marginBottom: '0.75rem' }}>
                  New Images to Upload ({selectedImages.length})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                  {selectedImages.map((img, index) => (
                    <div key={`new-${index}`} style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid #2E7D32',
                      aspectRatio: '1',
                      backgroundColor: '#f0fdf4'
                    }}>
                      <img
                        src={img.preview}
                        alt={`New ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        type="button"
                        style={{
                          position: 'absolute',
                          top: '0.25rem',
                          right: '0.25rem',
                          background: '#EF5350',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#E53935'}
                        onMouseOut={(e) => e.target.style.background = '#EF5350'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Room Policies Section */}
          <div style={{
            background: '#f8fdf7',
            border: '1px solid #c8e6c9',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#1B5E20', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Shield size={18} style={{ color: '#2E7D32' }} />
              Room Policies & Rules
            </h4>

            {/* Check-in/Check-out Times */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                  <Icons.Clock size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                  Check-in Time
                </span>
                <input
                  type="time"
                  value={roomForm.check_in_time}
                  onChange={(e) => setRoomForm({ ...roomForm, check_in_time: e.target.value })}
                  className="gov-input"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #c8e6c9',
                    fontSize: '0.95rem'
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20' }}>
                  <Icons.Clock size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                  Check-out Time
                </span>
                <input
                  type="time"
                  value={roomForm.check_out_time}
                  onChange={(e) => setRoomForm({ ...roomForm, check_out_time: e.target.value })}
                  className="gov-input"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #c8e6c9',
                    fontSize: '0.95rem'
                  }}
                />
              </label>
            </div>

            {/* Policy Checkboxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={roomForm.smoking_allowed || false}
                  onChange={(e) => setRoomForm({ ...roomForm, smoking_allowed: e.target.checked })}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#2E7D32'
                  }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>
                  <Icons.Info size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                  Smoking Allowed
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={roomForm.pets_allowed || false}
                  onChange={(e) => setRoomForm({ ...roomForm, pets_allowed: e.target.checked })}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#2E7D32'
                  }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>
                  <Icons.Filter size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                  Pets Allowed
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={roomForm.events_allowed || false}
                  onChange={(e) => setRoomForm({ ...roomForm, events_allowed: e.target.checked })}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#2E7D32'
                  }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>
                  <Icons.Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                  Events & Parties
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end',
            paddingTop: '1.5rem',
            borderTop: '1px solid #c8e6c9'
          }}>
            <button
              onClick={() => {
                setEditingRoom(null);
                setCreatingRoom(false);
                setRoomForm(emptyRoom);
                setAmenitiesInput('');
                setSelectedImages([]);
              }}
              disabled={roomSaving}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #c8e6c9',
                background: '#ffffff',
                color: '#718096',
                cursor: roomSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: roomSaving ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!roomSaving) e.currentTarget.style.background = '#f8fdf7';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              Cancel
            </button>
            <button
              className="gov-btn-primary"
              onClick={handleSaveRoom}
              disabled={roomSaving}
              style={{
                padding: '0.75rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                background: roomSaving ? '#a5d6a7' : '#2E7D32',
                color: 'white',
                cursor: roomSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                if (!roomSaving) e.currentTarget.style.background = '#1B5E20';
              }}
              onMouseOut={(e) => {
                if (!roomSaving) e.currentTarget.style.background = '#2E7D32';
              }}
            >
              {roomSaving ? (
                <>
                  <div style={{ width: '14px', height: '14px', border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  Saving...
                </>
              ) : (
                <>
                  <Icons.Check size={18} />
                  {creatingRoom ? 'Add Room Type' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
