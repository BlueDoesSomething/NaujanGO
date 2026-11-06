import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';
import { notificationIsRead } from '../utils/dashboardNotifications';

export default function useDashboardNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true), [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(''), [actionError, setActionError] = useState(''), [busy, setBusy] = useState(null);
  const sequence = useRef(0), writing = useRef(false), identity = useRef(userId);
  identity.current = userId;
  const refresh = useCallback(async () => {
    if (!userId || writing.current) return;
    const request = ++sequence.current;
    setLoading(true); setError('');
    try {
      const response = await api.get('/messages/notifications');
      if (!Array.isArray(response.data)) throw new Error('Invalid notifications response');
      if (request === sequence.current) {
        setNotifications(response.data.map(item => ({ ...item, is_read: notificationIsRead(item.is_read) })));
        setLoaded(true);
      }
    } catch (error) {
      if (request === sequence.current) setError(error.response?.data?.error || 'Could not load notifications. Please retry.');
    } finally { if (request === sequence.current) setLoading(false); }
  }, [userId]);
  useEffect(() => {
    setNotifications([]); setLoaded(false); setError(''); setActionError(''); setBusy(null); writing.current = false;
    refresh(); window.addEventListener('focus', refresh);
    return () => { sequence.current += 1; window.removeEventListener('focus', refresh); };
  }, [refresh]);
  const markRead = async (id = null) => {
    if (writing.current || !userId) return;
    const account = userId;
    writing.current = true; sequence.current += 1; setLoading(false); setBusy(id ?? 'all'); setActionError('');
    try {
      await api.put(id == null ? '/messages/notifications/read-all' : `/messages/notifications/${id}/read`);
      if (identity.current === account) setNotifications(current => current.map(item => id == null || item.notification_id === id ? { ...item, is_read: true } : item));
    } catch (error) {
      if (identity.current === account) setActionError(error.response?.data?.error || 'Could not mark notifications as read. Please try again.');
    } finally { if (identity.current === account) { writing.current = false; setBusy(null); } }
  };
  return { notifications, loading, loaded, error, actionError, busy, refresh, markRead,
    unreadCount: notifications.filter(item => !item.is_read).length };
}
