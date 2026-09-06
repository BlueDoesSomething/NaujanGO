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
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMessagesAndNotifications();
  }, [user, navigate]);

  const fetchMessagesAndNotifications = async () => {
    try {
      const [notificationsRes, messagesRes] = await Promise.all([
        api.get('/messages/notifications'),
        api.get('/messages/messages')
      ]);
      setNotifications(notificationsRes.data || []);
      setMessages(messagesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch messages and notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (message) => {
    if (message.is_read || message.receiver_id !== user?.user_id) return;
    try {
      await api.put(`/messages/messages/${message.message_id}/read`);
      setMessages(currentMessages => currentMessages.map(currentMessage => (
        currentMessage.message_id === message.message_id
          ? { ...currentMessage, is_read: true }
          : currentMessage
      )));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
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

  const unreadMessageCount = messages.filter(message => (
    !message.is_read && message.receiver_id === user?.user_id
  )).length;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ color: '#2E7D32', marginBottom: '2rem' }}>📬 Messages & Notifications</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#2E7D32', fontSize: '1.25rem' }}>Messages {unreadMessageCount > 0 && `(${unreadMessageCount} unread)`}</h2>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f5f5f5', borderRadius: '12px' }}>
            <p style={{ color: '#666' }}>No messages yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(message => {
              const received = message.receiver_id === user?.user_id;
              return (
                <article
                  key={message.message_id}
                  onClick={() => markMessageAsRead(message)}
                  style={{
                    padding: '1.5rem',
                    background: message.is_read || !received ? '#fff' : '#e8f5e9',
                    border: '1px solid #c8e6c9',
                    borderLeft: `4px solid ${message.is_read || !received ? '#c8e6c9' : '#2E7D32'}`,
                    borderRadius: '8px',
                    cursor: received && !message.is_read ? 'pointer' : 'default'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#2E7D32' }}>
                      {received ? `From: ${message.sender_name}` : `To: ${message.receiver_name}`}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>
                    {message.subject || 'No Subject'}
                  </strong>
                  <p style={{ margin: 0, color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{message.message}</p>
                  {received && !message.is_read && (
                    <span style={{ display: 'inline-block', marginTop: '0.75rem', color: '#2E7D32', fontWeight: 700, fontSize: '0.8rem' }}>
                      NEW - click to mark as read
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ color: '#2E7D32', fontSize: '1.25rem' }}>Notifications</h2>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f5f5f5', borderRadius: '12px' }}>
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
      </section>
    </div>
  );
};

export default Messages;
