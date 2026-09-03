import React from 'react';
import Icons from './Icons';

const LeadershipCard = ({ 
  name, 
  title, 
  term, 
  photoUrl, 
  index,
  onEdit,
  isAdmin = false,
  defaultPhoto = '/assets/default-profile.svg'
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const handlePhotoClick = () => {
    if (isAdmin) {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && onEdit) {
      onEdit(index, 'photo', file);
    }
  };

  const borderColors = [
    '#16a34a', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#f97316', // Orange
  ];

  const borderColor = borderColors[index % borderColors.length];

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePhotoUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        border: `3px solid ${borderColor}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
        
        {/* Photo Section */}
        <div style={{
          position: 'relative',
          paddingBottom: '100%',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${borderColor}15, ${borderColor}05)`
        }}>
          <img 
            src={photoUrl || defaultPhoto} 
            alt={name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transition: 'transform 0.3s ease'
            }}
          />
          
          {/* Hover Overlay */}
          {isHovered && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.3s ease'
            }}>
              {isAdmin && (
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <Icons.Upload size={32} style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Click to upload photo</div>
                </div>
              )}
              {!isAdmin && (
                <Icons.Photo size={32} color="white" />
              )}
            </div>
          )}

          {/* Placeholder Badge */}
          {!photoUrl && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(16, 185, 129, 0.9)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(4px)'
            }}>
              <Icons.Photo size={14} />
              Placeholder
            </div>
          )}
          
          {isAdmin && (
            <div 
              onClick={handlePhotoClick}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer'
              }}
            />
          )}
        </div>

        {/* Info Section */}
        <div style={{
          padding: '1.5rem',
          textAlign: 'center',
          background: 'white'
        }}>
          <h4 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#111827'
          }}>
            {name}
          </h4>
          <p style={{
            margin: '0 0 0.75rem 0',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: borderColor
          }}>
            {title}
          </p>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: '#9ca3af',
            fontStyle: 'italic'
          }}>
            {term}
          </p>
        </div>
      </div>
    </>
  );
};

export default LeadershipCard;
