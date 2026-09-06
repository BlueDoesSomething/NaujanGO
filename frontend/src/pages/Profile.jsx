import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Cropper from 'react-easy-crop';
import HeroSlideshow from '../components/HeroSlideshow';
import api from '../api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say',
    userType: 'foreigner',
    profilePicture: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerViewDate, setPickerViewDate] = useState(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0, width: 300 });
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const datePickerTriggerRef = useRef(null);
  const datePickerPopupRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data && response.data.user) {
          const userData = response.data.user;
          setFormData({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            dateOfBirth: userData.date_of_birth ? userData.date_of_birth.split('T')[0] : '',
            gender: userData.gender || 'prefer_not_to_say',
            userType: userData.user_type || 'foreigner',
            profilePicture: userData.profile_picture || ''
          });
          updateUser(userData);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await api.get('/messages/messages');
        setMessages(response.data || []);
      } catch (error) {
        console.error('Failed to load profile messages:', error);
      } finally {
        setMessagesLoading(false);
      }
    };

    if (user) loadMessages();
  }, [user]);

  const markMessageAsRead = async (messageId) => {
    try {
      await api.put(`/messages/messages/${messageId}/read`);
      setMessages(currentMessages => currentMessages.map(currentMessage => (
        currentMessage.message_id === messageId
          ? { ...currentMessage, is_read: true }
          : currentMessage
      )));
    } catch (error) {
      console.error('Failed to mark profile message as read:', error);
    }
  };

  // Outside-click handled by transparent backdrop overlay in the portal — no document listener needed

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result);
      setShowCropModal(true);
    });
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    try {
      setUploading(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const uploadFormData = new FormData();
      uploadFormData.append('image', croppedBlob, 'profile.jpg');

      const uploadResponse = await api.post('/auth/upload-profile-picture', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (!uploadResponse.data || !uploadResponse.data.url) {
        throw new Error('Upload failed - no URL returned');
      }
      
      const newProfilePicture = uploadResponse.data.url;
      setFormData(prev => ({ ...prev, profilePicture: newProfilePicture }));
      
      // Immediately save to backend and update user context
      const saveResponse = await api.put('/auth/profile', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        user_type: formData.userType,
        profile_picture: newProfilePicture
      });
      
      if (!saveResponse.data || !saveResponse.data.user) {
        throw new Error('Profile save failed - no user data returned');
      }
      
      updateUser(saveResponse.data.user);
      setShowCropModal(false);
      setImageSrc(null);
      setMessage('Profile picture updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Profile picture save error:', error);
      setMessage(error.response?.data?.error || error.message || 'Failed to update profile picture');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        user_type: formData.userType,
        profile_picture: formData.profilePicture
      });
      
      updateUser(response.data.user);
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile');
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  const openDatePicker = (e) => {
    e.stopPropagation();
    if (showDatePicker) { setShowDatePicker(false); return; }
    const base = formData.dateOfBirth
      ? new Date(formData.dateOfBirth + 'T00:00:00')
      : new Date(2000, 0, 1);
    setPickerViewDate(new Date(base.getFullYear(), base.getMonth(), 1));
    if (datePickerTriggerRef.current) {
      const rect = datePickerTriggerRef.current.getBoundingClientRect();
      // Flip upward if not enough space below
      const spaceBelow = window.innerHeight - rect.bottom;
      const popupH = 320;
      const top = spaceBelow >= popupH ? rect.bottom + 6 : rect.top - popupH - 6;
      setPickerPos({ top, left: rect.left, width: rect.width });
    }
    setShowDatePicker(true);
  };
  const prevPickerMonth = () => setPickerViewDate(p => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const nextPickerMonth = () => setPickerViewDate(p => new Date(p.getFullYear(), p.getMonth() + 1, 1));
  const prevPickerYear  = () => setPickerViewDate(p => new Date(p.getFullYear() - 1, p.getMonth(), 1));
  const nextPickerYear  = () => setPickerViewDate(p => new Date(p.getFullYear() + 1, p.getMonth(), 1));
  const selectDateFromPicker = (day) => {
    const y = pickerViewDate.getFullYear();
    const m = String(pickerViewDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setFormData(prev => ({ ...prev, dateOfBirth: `${y}-${m}-${d}` }));
    setShowDatePicker(false);
  };
  const formatDOBDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [y, mo, d] = dateStr.split('-');
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[parseInt(mo, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
  };
  const buildCalendarCells = () => {
    if (!pickerViewDate) return [];
    const y = pickerViewDate.getFullYear();
    const mo = pickerViewDate.getMonth();
    const firstDay = new Date(y, mo, 1).getDay();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  return (
    <div style={pageStyle}>
      {/* Hero Section with Slideshow */}
      <HeroSlideshow 
        title="My Profile"
        subtitle="Manage your personal information"
        height="350px"
        showControls={false}
      />

      <div style={containerStyle}>
        {/* Profile Card */}
        <div style={profileCard}>
          <div style={profileHeader}>
            <div style={avatarSection}>
              <div style={avatarContainerStyle}>
                {formData.profilePicture ? (
                  <img src={formData.profilePicture} alt="Profile" style={avatarImageStyle} />
                ) : (
                  <div style={avatarStyle}>
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}{user?.last_name?.[0] || ''}
                  </div>
                )}
                {isEditing && (
                  <label style={uploadLabelStyle}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </label>
                )}
              </div>
              <div style={userInfo}>
                <h2 style={userName}>{user?.username || 'User'}</h2>
                <p style={userEmail}>{user?.email || ''}</p>
              </div>
            </div>
            <div style={actionButtons}>
              {!isEditing ? (
                <button style={editButton} onClick={() => setIsEditing(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <div style={editActions}>
                  <button style={cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                  <button style={saveBtn} onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {message && (
            <div style={messageStyle}>
              {message}
            </div>
          )}

          <div style={formSection}>
            <h3 style={sectionTitle}>Personal Information</h3>
            <div style={formGrid}>
              <div style={inputGroup}>
                <label style={labelStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={isEditing ? inputStyle : disabledInputStyle}
                  placeholder="Enter first name"
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={isEditing ? inputStyle : disabledInputStyle}
                  placeholder="Enter last name"
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Date of Birth
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    ref={datePickerTriggerRef}
                    style={{ ...(isEditing ? inputStyle : disabledInputStyle), cursor: isEditing ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
                    onClick={isEditing ? openDatePicker : undefined}
                  >
                    <span style={{ color: formData.dateOfBirth ? 'inherit' : '#9ca3af' }}>
                      {formData.dateOfBirth ? formatDOBDisplay(formData.dateOfBirth) : 'Select date of birth'}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.6 }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  {isEditing && showDatePicker && pickerViewDate && ReactDOM.createPortal(
                    <>
                      {/* Transparent backdrop — clicking outside the popup closes it */}
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
                        onClick={() => setShowDatePicker(false)}
                      />
                      {/* Calendar popup — stopPropagation prevents backdrop click */}
                      <div
                        ref={datePickerPopupRef}
                        style={{
                          position: 'fixed',
                          top: pickerPos.top,
                          left: pickerPos.left,
                          width: Math.max(pickerPos.width, 300),
                          ...datePickerPopup
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div style={dpHeader}>
                          <button type="button" onClick={prevPickerYear}  style={dpNavBtn} title="Prev year">«</button>
                          <button type="button" onClick={prevPickerMonth} style={dpNavBtn} title="Prev month">‹</button>
                          <span style={dpMonthLabel}>
                            {['January','February','March','April','May','June','July','August','September','October','November','December'][pickerViewDate.getMonth()]} {pickerViewDate.getFullYear()}
                          </span>
                          <button type="button" onClick={nextPickerMonth} style={dpNavBtn} title="Next month">›</button>
                          <button type="button" onClick={nextPickerYear}  style={dpNavBtn} title="Next year">»</button>
                        </div>
                        <div style={dpDayRow}>
                          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(wd => (
                            <div key={wd} style={dpDayHeader}>{wd}</div>
                          ))}
                        </div>
                        <div style={dpGrid}>
                          {buildCalendarCells().map((cell, i) => {
                            if (!cell) return <div key={i} />;
                            const cy  = pickerViewDate.getFullYear();
                            const cm  = String(pickerViewDate.getMonth() + 1).padStart(2, '0');
                            const dStr = `${cy}-${cm}-${String(cell).padStart(2, '0')}`;
                            const isSel   = formData.dateOfBirth === dStr;
                            const isToday = new Date().toISOString().split('T')[0] === dStr;
                            return (
                              <div
                                key={i}
                                style={{ ...dpDayCell, ...(isSel ? dpSelectedDay : isToday ? dpTodayDay : {}), transition: 'background 0.15s' }}
                                onClick={() => selectDateFromPicker(cell)}
                              >
                                {cell}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={formSection}>
            <h3 style={sectionTitle}>Contact Information</h3>
            <div style={formGrid}>
              <div style={inputGroup}>
                <label style={labelStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={isEditing ? inputStyle : disabledInputStyle}
                  placeholder="Enter email address"
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={isEditing ? inputStyle : disabledInputStyle}
                  placeholder="Enter phone number"
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={isEditing ? inputStyle : disabledInputStyle}
                >
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Visitor Type</label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={isEditing ? inputStyle : disabledInputStyle}
                >
                  <option value="foreigner">Foreigner</option>
                  <option value="resident">Resident</option>
                  <option value="local">Local</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...profileCard, marginTop: '1.5rem' }}>
          <div style={formSection}>
            <h3 style={sectionTitle}>Messages from Hotel Owners</h3>
            <p style={{ color: '#6b7280', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
              Replies to your hotel inquiries appear here.
            </p>
            {messagesLoading ? (
              <p style={{ color: '#6b7280' }}>Loading messages...</p>
            ) : messages.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No owner messages yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {messages.map((ownerMessage) => {
                  const isReceived = ownerMessage.receiver_id === user?.user_id;
                  return (
                    <article
                      key={ownerMessage.message_id}
                      onClick={() => isReceived && !ownerMessage.is_read && markMessageAsRead(ownerMessage.message_id)}
                      style={{
                        padding: '1.25rem',
                        background: isReceived && !ownerMessage.is_read ? '#e8f5e9' : '#f8fafc',
                        border: '1px solid #d1d5db',
                        borderLeft: `4px solid ${isReceived && !ownerMessage.is_read ? '#2E7D32' : '#c8e6c9'}`,
                        borderRadius: '8px',
                        cursor: isReceived && !ownerMessage.is_read ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#1B5E20' }}>
                          {isReceived ? `From: ${ownerMessage.sender_name}` : `To: ${ownerMessage.receiver_name}`}
                        </strong>
                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                          {new Date(ownerMessage.created_at).toLocaleString()}
                        </span>
                      </div>
                      <strong style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>
                        {ownerMessage.subject || 'No Subject'}
                      </strong>
                      <p style={{ margin: 0, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {ownerMessage.message}
                      </p>
                      {isReceived && !ownerMessage.is_read && (
                        <span style={{ display: 'inline-block', marginTop: '0.75rem', color: '#2E7D32', fontSize: '0.8rem', fontWeight: 700 }}>
                          NEW - click to mark as read
                        </span>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div style={cropModalBackdrop}>
          <div style={cropModalContent}>
            <h2 style={cropModalTitle}>Crop Profile Picture</h2>
            <div style={cropContainer}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={cropControls}>
              <label style={zoomLabel}>Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(e.target.value)}
                style={zoomSlider}
              />
            </div>
            <div style={cropButtons}>
              <button 
                style={cancelButton} 
                onClick={() => {
                  setShowCropModal(false);
                  setImageSrc(null);
                }}
              >
                Cancel
              </button>
              <button 
                style={saveButton} 
                onClick={handleCropSave}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const cropModalBackdrop = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
};

const cropModalContent = {
  backgroundColor: 'white',
  borderRadius: '20px',
  padding: '2rem',
  width: '90%',
  maxWidth: '500px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const cropModalTitle = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#2e7d32',
  textAlign: 'center'
};

const cropContainer = {
  position: 'relative',
  width: '100%',
  height: '400px',
  backgroundColor: '#f0f0f0',
  borderRadius: '10px',
  overflow: 'hidden'
};

const cropControls = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const zoomLabel = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#333'
};

const zoomSlider = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  outline: 'none',
  cursor: 'pointer'
};

const cropButtons = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center'
};

const cancelButton = {
  padding: '0.75rem 2rem',
  backgroundColor: 'transparent',
  color: '#2e7d32',
  border: '2px solid #2e7d32',
  borderRadius: '50px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem',
  transition: 'all 0.3s ease'
};

const saveButton = {
  padding: '0.75rem 2rem',
  backgroundColor: '#2e7d32',
  color: 'white',
  border: 'none',
  borderRadius: '50px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem',
  transition: 'all 0.3s ease'
};

const pageStyle = {
  /* Responsive Change: fluid spacing and safer overflow on all devices */
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
  paddingBottom: 'clamp(2rem, 5vw, 3rem)',
  position: 'relative',
  overflowX: 'hidden'
};

const heroSection = {
  background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
  color: 'white',
  padding: 'clamp(2rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  marginBottom: '2rem'
};

const heroContent = {
  maxWidth: '800px',
  margin: '0 auto'
};

const heroTitle = {
  fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
  fontWeight: '800',
  margin: '0 0 0.5rem 0',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const heroSubtitle = {
  fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
  opacity: 0.95,
  margin: 0
};

const containerStyle = {
  width: 'min(100%, 900px)',
  margin: '3rem auto 0 auto',
  padding: '0 clamp(0.75rem, 3vw, 1.5rem)'
};

const profileCard = {
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  borderRadius: 'clamp(16px, 3vw, 24px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(255, 255, 255, 0.3)',
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.18)'
};

const profileHeader = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  padding: 'clamp(1.25rem, 3vw, 2rem)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'clamp(1rem, 3vw, 1.5rem)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.18)'
};

const avatarSection = {
  display: 'flex',
  alignItems: 'center',
  gap: 'clamp(0.9rem, 3vw, 1.5rem)',
  flexWrap: 'wrap'
};

const avatarContainerStyle = {
  position: 'relative',
  flexShrink: 0
};

const avatarStyle = {
  width: 'clamp(80px, 14vw, 100px)',
  height: 'clamp(80px, 14vw, 100px)',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #16a34a, #059669)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
  fontWeight: 'bold',
  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
  border: '4px solid white'
};

const avatarImageStyle = {
  width: 'clamp(80px, 14vw, 100px)',
  height: 'clamp(80px, 14vw, 100px)',
  borderRadius: '50%',
  objectFit: 'cover',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  border: '4px solid white'
};

const uploadLabelStyle = {
  position: 'absolute',
  bottom: '0',
  right: '0',
  width: 'clamp(30px, 6vw, 36px)',
  height: 'clamp(30px, 6vw, 36px)',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #16a34a, #059669)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: '3px solid white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  transition: 'all 0.3s ease'
};

const userInfo = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const userName = {
  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
  fontWeight: '700',
  color: '#1f2937',
  margin: 0
};

const userEmail = {
  fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)',
  color: '#6b7280',
  margin: 0
};

const actionButtons = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap'
};

const editButton = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.9rem 1.15rem',
  background: 'rgba(22, 163, 74, 0.15)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  color: '#16a34a',
  border: '2px solid #16a34a',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '700',
  fontSize: 'clamp(0.9rem, 2.2vw, 1rem)',
  minHeight: '46px',
  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
  transition: 'all 0.3s ease'
};

const editActions = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap'
};

const cancelBtn = {
  padding: '0.9rem 1.15rem',
  backgroundColor: 'rgba(107, 114, 128, 0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  color: '#6b7280',
  border: '2px solid #9ca3af',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: 'clamp(0.9rem, 2.2vw, 1rem)',
  minHeight: '46px',
  transition: 'all 0.3s ease'
};

const saveBtn = {
  padding: '0.9rem 1.15rem',
  background: 'rgba(22, 163, 74, 0.15)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  color: '#16a34a',
  border: '2px solid #16a34a',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '700',
  fontSize: 'clamp(0.9rem, 2.2vw, 1rem)',
  minHeight: '46px',
  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
  transition: 'all 0.3s ease'
};

const messageStyle = {
  margin: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 2rem)',
  padding: '1rem 1.25rem',
  backgroundColor: 'rgba(209, 250, 229, 0.5)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  color: '#065f46',
  borderRadius: '12px',
  fontSize: '0.95rem',
  fontWeight: '500',
  border: '1px solid rgba(110, 231, 183, 0.5)'
};

const formSection = {
  padding: 'clamp(1.25rem, 3vw, 2rem)',
  borderBottom: '1px solid #f3f4f6'
};

const sectionTitle = {
  fontSize: 'clamp(1.05rem, 2.8vw, 1.25rem)',
  fontWeight: '700',
  color: '#1f2937',
  margin: '0 0 1.5rem 0',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
  gap: 'clamp(1rem, 3vw, 1.5rem)'
};

const inputGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const labelStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#374151',
  display: 'flex',
  alignItems: 'center'
};

const inputStyle = {
  padding: '0.95rem 1rem',
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '2px solid rgba(156, 163, 175, 0.3)',
  borderRadius: '12px',
  fontSize: '1rem',
  minHeight: '46px',
  outline: 'none',
  transition: 'all 0.3s ease',
  color: '#1f2937',
  boxSizing: 'border-box',
  width: '100%'
};

const disabledInputStyle = {
  ...inputStyle,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: '#9ca3af',
  cursor: 'not-allowed'
};

// Responsive styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @media (max-width: 1024px) {
      .profile-card { margin: 0 1rem; }
    }
    
    @media (max-width: 768px) {
      .hero-title { font-size: 2rem !important; }
      .hero-subtitle { font-size: 1rem !important; }
      .profile-header { flex-direction: column; align-items: flex-start !important; }
      .avatar-section { width: 100%; justify-content: center; }
      .action-buttons { width: 100%; justify-content: center; }
      .edit-actions { width: 100%; }
      .form-grid { grid-template-columns: 1fr !important; }
      .user-name { font-size: 1.5rem !important; }
    }
    
    @media (max-width: 480px) {
      .hero-section { padding: 2rem 1rem !important; }
      .hero-title { font-size: 1.75rem !important; }
      .profile-header { padding: 1.5rem !important; }
      .form-section { padding: 1.5rem !important; }
      .avatar-style, .avatar-image-style { width: 80px !important; height: 80px !important; }
      .user-name { font-size: 1.25rem !important; }
      .cancel-btn, .save-btn { width: 100%; }
    }
  `;
  if (!document.head.querySelector('style[data-profile-responsive]')) {
    styleSheet.setAttribute('data-profile-responsive', 'true');
    document.head.appendChild(styleSheet);
  }
}

const datePickerPopup = {
  zIndex: 99999,
  backgroundColor: '#fff',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(46,125,50,0.18), 0 2px 8px rgba(0,0,0,0.12)',
  padding: '1rem 1rem 0.75rem',
  border: '1px solid #c8e6c9',
};
const dpHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: '0.7rem', gap: '2px',
};
const dpMonthLabel = {
  fontWeight: '700', fontSize: '0.9rem', color: '#1B5E20',
  flex: 1, textAlign: 'center', letterSpacing: '0.01em',
};
const dpNavBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#2e7d32', fontSize: '1.15rem', fontWeight: '700',
  padding: '0.2rem 0.45rem', borderRadius: '8px', lineHeight: 1,
  transition: 'background 0.15s',
};
const dpDayRow = {
  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '2px', marginBottom: '4px',
};
const dpDayHeader = {
  textAlign: 'center', fontSize: '0.67rem', fontWeight: '700',
  color: '#4caf50', padding: '3px 0',
};
const dpGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px',
  paddingBottom: '0.5rem',
};
const dpDayCell = {
  textAlign: 'center', fontSize: '0.82rem', padding: '6px 0',
  borderRadius: '8px', cursor: 'pointer', color: '#374151',
  fontWeight: '500', transition: 'background 0.15s',
};
const dpSelectedDay = {
  background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
  color: '#fff', fontWeight: '700', boxShadow: '0 2px 6px rgba(46,125,50,0.35)',
};
const dpTodayDay = {
  background: '#e8f5e9', color: '#2e7d32', fontWeight: '700',
};

export default Profile;
