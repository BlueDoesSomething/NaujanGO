import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [user, navigate]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/messages/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/messages/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.notification_id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loading')}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ color: '#2E7D32', marginBottom: '2rem' }}>📬 {t('notifications')}</h1>
      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f5f5f5', borderRadius: '12px' }}>
          <p style={{ color: '#666' }}>{t('no_notifications_yet')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map(notif => (
            <div
              key={notif.notification_id}
              onClick={() => !notif.is_read && markAsRead(notif.notification_id)}
              style={{
                padding: '1.5rem',
                background: notif.is_read ? '#fff' : '#e8f5e9',
                border: '1px solid #ddd',
                borderRadius: '12px',
                cursor: notif.is_read ? 'default' : 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#2E7D32' }}>{notif.title}</strong>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                  {new Date(notif.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: 0, color: '#333' }}>{notif.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
