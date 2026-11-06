import React, { useState } from 'react';
import Icons from './Icons';
import { notificationDestination } from '../utils/dashboardNotifications';
import './DashboardNotifications.css';

export function NotificationBadge({ count }) {
  return count > 0 ? <span className="dashboard-notification-badge" aria-label={`${count} unread notifications in the latest 50`}>{count}</span> : null;
}

export default function DashboardNotifications({ feed, role, onOpen }) {
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('all');
  const { notifications, loading, loaded, error, actionError, busy, refresh, markRead, unreadCount } = feed;
  const query = search.trim().toLowerCase();
  const filtered = notifications.filter(item => (filter !== 'unread' || !item.is_read)
    && (!query || `${item.title || ''} ${item.message || ''}`.toLowerCase().includes(query)));
  return <section className="dashboard-notifications" aria-label="Account notifications" aria-busy={loading}>
    <h1 className="gov-page-title"><Icons.Bell size={28} /> Notifications</h1>
    <p>Your latest 50 notifications, for this account only. Marking all read also includes older notifications. Refresh or return to this window to check for new activity.</p>
    <div className="gov-glass-panel dashboard-notifications-tools">
      <label>Search notifications<input className="gov-input" type="search" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <label>Show<select className="gov-select" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All notifications</option><option value="unread">Unread ({unreadCount})</option></select></label>
      <button type="button" className="gov-btn-ghost" onClick={refresh} disabled={loading || busy != null}>Refresh notifications</button>
      <button type="button" className="gov-btn-primary" onClick={() => markRead()} disabled={!loaded || loading || busy != null || notifications.length === 0}>{busy === 'all' ? 'Marking all read…' : 'Mark all read'}</button>
    </div>
    {loading && <p role="status">Loading notifications…</p>}
    {error && <p className="dashboard-notifications-error" role="alert">{error} {loaded && 'Previously loaded notifications may be out of date.'} <button type="button" className="gov-btn-ghost" onClick={refresh} disabled={loading || busy != null}>Retry notifications</button></p>}
    {actionError && <p className="dashboard-notifications-error" role="alert">{actionError} Your notifications have not been removed.</p>}
    <div className="dashboard-notifications-list">{filtered.map(item => {
      const destination = onOpen && notificationDestination(item, role);
      const date = item.created_at ? new Date(item.created_at) : null;
      return <article key={item.notification_id} className={`gov-glass-panel dashboard-notification${!item.is_read ? ' is-unread' : ''}`}>
        <div className="dashboard-notification-heading"><h2>{item.title || 'Notification'}</h2><span className="dashboard-notification-state">{item.is_read ? 'Read' : 'Unread'}</span></div>
        <p>{item.message}</p>
        <small>{date && Number.isFinite(date.getTime()) ? <time dateTime={date.toISOString()}>{date.toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} PHT</time> : 'Date unavailable'}</small>
        <div className="dashboard-notification-actions">
          {!item.is_read && <button type="button" className="gov-btn-ghost" onClick={() => markRead(item.notification_id)} disabled={busy != null || loading}>{busy === item.notification_id ? 'Marking read…' : 'Mark as read'}</button>}
          {destination && <button type="button" className="gov-btn-ghost" onClick={() => onOpen(destination.module)}>{destination.label}</button>}
        </div>
      </article>;
    })}</div>
    {loaded && !error && !loading && filtered.length === 0 && <p className="gov-glass-panel" role="status">{notifications.length ? 'No notifications match your filters.' : 'No notifications yet.'}</p>}
  </section>;
}
