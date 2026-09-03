import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './DashboardLayout.css';

const DashboardLayout = ({ type = 'admin' }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleLogout = async () => {
    try {
      console.log('🔓 Logout initiated...');
      await logout();
      console.log('✅ Logout completed, redirecting to login...');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if logout fails, redirect anyway
      navigate('/login', { replace: true });
    }
  };

  const isActive = (path) => location.pathname === path;

  const adminMenuItems = [
    { path: '/admin', icon: '📊', label: 'Overview' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
    { path: '/admin/bookings', icon: '📋', label: 'Bookings' },
    { path: '/admin/roles', icon: '🔐', label: 'Role Changes' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' }
  ];

  const ownerMenuItems = [
    { path: '/owner', icon: '📊', label: 'Reports & Analytics' },
    { path: '/owner/hotels', icon: '🏨', label: 'Listings & Availability' },
    { path: '/owner/bookings', icon: '📋', label: 'Booking & Reservations' },
    { path: '/owner/analytics', icon: '📄', label: 'Report Generation' },
    { path: '/owner/profile', icon: '🏢', label: 'Business Profile' },
    { path: '/owner/reviews', icon: '⭐', label: 'Customer Reviews' },
    { path: '/owner/notifications', icon: '🔔', label: 'Notifications & Messaging' }
  ];

  const menuItems = type === 'admin' ? adminMenuItems : ownerMenuItems;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">{type === 'admin' ? '🛡️' : '🏨'}</span>
            {sidebarOpen && (
              <span className="logo-text">
                {type === 'admin' ? 'Admin' : 'Owner'} Panel
              </span>
            )}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link
            to="/"
            className="nav-item"
            title={t('auth_back_to_website')}
          >
            <span className="nav-icon">🌐</span>
            {sidebarOpen && <span className="nav-label">{t('auth_back_to_website')}</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">
              {type === 'admin' ? 'Admin' : 'Owner'} Dashboard
            </h1>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.first_name || user?.username}</span>
                <span className={`user-role ${user?.role}`}>{t(`${user?.role}_role`) || user?.role}</span>
              </div>
              <button 
                className="logout-btn"
                onClick={handleLogout}
                title={t('auth_logout')}
              >
                🚪
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
