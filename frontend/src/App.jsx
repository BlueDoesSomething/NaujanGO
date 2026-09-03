import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import Home from './pages/Home.jsx';
import Attractions from './pages/Attractions.jsx';
import AttractionDetails from './pages/AttractionDetails.jsx';
import InteractiveMap from './pages/InteractiveMap.jsx';
import Contact from './pages/Contact.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Messages from './pages/Messages.jsx';
import './App.css';
import './styles/animations.css';
import './styles/global.css';
import './styles/global-buttons.css';
import { LanguageProvider } from './context/LanguageContext.jsx';
import Chatbot from './components/Chatbot.jsx';
import Profile from './pages/Profile.jsx';
import ItineraryBuilder from './pages/ItineraryBuilder.jsx';
import ItineraryDetail from './pages/ItineraryDetail.jsx';
import { AuthProvider, useAuth } from './context/AuthContext';
import Hotels from './pages/Hotels.jsx';
import HotelDetail from './pages/HotelDetail.jsx';
import HotelPayment from './pages/HotelPayment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import PaymentRedirect from './pages/PaymentRedirect.jsx';
import ReferenceSubmitted from './pages/ReferenceSubmitted.jsx';
import BookingHistory from './pages/BookingHistory.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Moderation from './pages/Moderation.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import DebugAuth from './pages/DebugAuth.jsx';
import OAuthCallback from './pages/OAuthCallback.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import AnnouncementBar from './components/AnnouncementBar.jsx';
import { getApiBaseUrl } from './api';
import { loadCachedSetting, saveCachedSetting } from './utils/siteSettingsCache';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    console.log('🔄 Route changed to:', pathname);
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Home page with role-based redirect
const HomeWithRedirect = () => {
  const { user, isLoggedIn, loading } = useAuth();
  
  console.log('🏠 HomeWithRedirect render:', { isLoggedIn, loading, role: user?.role });
  
  if (loading) {
    console.log('⏳ Still loading auth...');
    return <div>Loading...</div>;
  }
  
  if (isLoggedIn && user?.role === 'admin') {
    console.log('➡️ Redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  if (isLoggedIn && user?.role === 'agent') {
    console.log('➡️ Redirecting to /admin/moderation');
    return <Navigate to="/admin/moderation" replace />;
  }
  
  if (isLoggedIn && user?.role === 'owner') {
    console.log('➡️ Redirecting to /owner');
    return <Navigate to="/owner" replace />;
  }
  
  return <Home />;
};

// Private Route wrapper component
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const { isLoggedIn, loading } = useAuth();
  
  console.log('🔒 PrivateRoute:', location.pathname, { isLoggedIn, loading });
  
  if (loading) return <div>Loading...</div>;
  if (isLoggedIn) return children;
  const redirectTo = `${location.pathname}${location.search || ''}`;
  console.log('🚫 Redirecting to login from:', redirectTo);
  return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
};

// Role-based route wrapper component
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, loading, user } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => {
  const { language } = useLanguage();
  
  // Load site-wide settings and apply CSS variables / document metadata
  React.useEffect(() => {
    const apiBase = getApiBaseUrl();

    const TYPOGRAPHY_DEFAULTS = {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontScale: 'medium',
      headingWeight: '800',
      bodyWeight: '400',
      headingLineHeight: '1.15',
      bodyLineHeight: '1.7',
      headingLetterSpacing: '-0.02',
      bodyLetterSpacing: '0',
      h1Size: '3.5rem',
      h2Size: '2.5rem',
      h3Size: '1.75rem',
      bodySize: '1rem',
      navFontSize: '0.95rem',
      buttonFontSize: '0.95rem',
      contentMaxWidth: '1200px',
      preset: 'balanced',
    };
    const SCALE_FACTOR_MAP = { small: 0.9, medium: 1, large: 1.1, xlarge: 1.2 };

    const scaleCssLength = (value, factor) => {
      const match = String(value || '').trim().match(/^(-?\d*\.?\d+)(px|rem|em)$/);
      if (!match) return value;
      const scaled = Number(match[1]) * factor;
      return `${Number(scaled.toFixed(3))}${match[2]}`;
    };

    const applySiteTheme = (theme) => {
      if (!theme) return;
      const root = document.documentElement;
      if (theme.primary)       root.style.setProperty('--primary', theme.primary);
      if (theme.primaryDark)   root.style.setProperty('--primary-dark', theme.primaryDark);
      if (theme.primaryLight)  root.style.setProperty('--primary-light', theme.primaryLight);
      if (theme.primary)       root.style.setProperty('--primary-color', theme.primary);
      if (theme.secondary)     root.style.setProperty('--secondary', theme.secondary);
      if (theme.secondaryDark) root.style.setProperty('--secondary-dark', theme.secondaryDark);
      if (theme.navBg)         root.style.setProperty('--nav-bg', theme.navBg);
    };

    const applyTypography = (typo) => {
      if (!typo) return;
      const resolved = { ...TYPOGRAPHY_DEFAULTS, ...typo };
      const scaleFactor = SCALE_FACTOR_MAP[resolved.fontScale] || 1;
      const root = document.documentElement;
      root.style.setProperty('--font-heading', `'${resolved.headingFont}', sans-serif`);
      root.style.setProperty('--font-body', `'${resolved.bodyFont}', sans-serif`);
      root.style.setProperty('--font-heading-weight', resolved.headingWeight);
      root.style.setProperty('--font-body-weight', resolved.bodyWeight);
      root.style.setProperty('--font-heading-line-height', resolved.headingLineHeight);
      root.style.setProperty('--font-body-line-height', resolved.bodyLineHeight);
      root.style.setProperty('--font-heading-letter-spacing', `${resolved.headingLetterSpacing}em`);
      root.style.setProperty('--font-body-letter-spacing', `${resolved.bodyLetterSpacing}em`);
      root.style.setProperty('--font-size-base', scaleCssLength(resolved.bodySize, scaleFactor));
      root.style.setProperty('--font-size-body', scaleCssLength(resolved.bodySize, scaleFactor));
      root.style.setProperty('--font-size-nav', scaleCssLength(resolved.navFontSize, scaleFactor));
      root.style.setProperty('--font-size-button', scaleCssLength(resolved.buttonFontSize, scaleFactor));
      root.style.setProperty('--font-size-h1', scaleCssLength(resolved.h1Size, scaleFactor));
      root.style.setProperty('--font-size-h2', scaleCssLength(resolved.h2Size, scaleFactor));
      root.style.setProperty('--font-size-h3', scaleCssLength(resolved.h3Size, scaleFactor));
      root.style.setProperty('--content-max-width', resolved.contentMaxWidth);
    };

    const applyBranding = (brand) => {
      if (!brand) return;
      if (brand.siteName) document.title = brand.siteName;
      if (brand.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = brand.faviconUrl;
      }
    };

    applySiteTheme(loadCachedSetting('site-theme'));
    applyTypography(loadCachedSetting('typography'));
    applyBranding(loadCachedSetting('branding'));

    // Site theme → CSS color variables
    fetch(`${apiBase}/api/admin/site-theme`)
      .then(res => res.ok ? res.json() : null)
      .then(theme => {
        if (!theme) return;
        saveCachedSetting('site-theme', theme);
        applySiteTheme(theme);
      })
      .catch(() => {});

    // Typography → CSS font variables
    fetch(`${apiBase}/api/admin/typography`)
      .then(res => res.ok ? res.json() : null)
      .then(typo => {
        if (!typo) return;
        saveCachedSetting('typography', typo);
        applyTypography(typo);
      })
      .catch(() => {});

    // Branding → document title + favicon
    fetch(`${apiBase}/api/admin/branding`)
      .then(res => res.ok ? res.json() : null)
      .then(brand => {
        if (!brand) return;
        saveCachedSetting('branding', brand);
        applyBranding(brand);
      })
      .catch(() => {});

    // Live-update listener: when admin saves Customization settings in the
    // same browser tab, apply changes immediately without a page reload.
    const handleSettingsUpdate = (e) => {
      const { key, data } = e.detail;
      if (key === 'site-theme') applySiteTheme(data);
      if (key === 'typography') applyTypography(data);
      if (key === 'branding')   applyBranding(data);
    };
    window.addEventListener('naujan:settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('naujan:settings-updated', handleSettingsUpdate);
  }, []);
  // Main website wrapper with navbar and footer
  const WebsiteLayout = () => {
    const location = useLocation();
    return (
      <>
        <ScrollToTop />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AnnouncementBar />
          <Navbar />
          <main key={`lang-content-${language}`} style={{ flexGrow: 1, width: '100%' }}>
            <Routes>
              <Route path="/" element={<HomeWithRedirect />} />
              <Route path="/attractions" element={<Attractions />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/hotels/:id" element={<HotelDetail />} />
              <Route
                path="/hotels/payment/:bookingId"
                element={
                  <PrivateRoute>
                    <HotelPayment />
                  </PrivateRoute>
                }
              />
              <Route
                path="/payment-success"
                element={<PaymentSuccess />}
              />
              <Route path="/reference-submitted" element={<ReferenceSubmitted />} />
              <Route
                path="/payment-redirect"
                element={<PaymentRedirect />}
              />
              <Route path="/attractions/:id" element={<AttractionDetails />} />
              <Route path="/map" element={<InteractiveMap />} />
              <Route path="/contact" element={<Contact />} />
              {/* About Section with all sub-routes handled by About component */}
              <Route path="/about" element={<About />} />
              <Route path="/about/:section" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/oauth-callback" element={<OAuthCallback />} />
              <Route path="/debug-auth" element={<DebugAuth />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/itinerary"
                element={
                  <PrivateRoute>
                    <ItineraryBuilder />
                  </PrivateRoute>
                }
              />
              <Route
                path="/itinerary/:id"
                element={
                  <PrivateRoute>
                    <ItineraryDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <PrivateRoute>
                    <BookingHistory />
                  </PrivateRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <PrivateRoute>
                    <Messages />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
          <Chatbot />
          <Footer />
        </div>
      </>
    );
  };

  const AppRoutes = () => {
    return (
      <>
        <ScrollToTop />
        <Routes>
          {/* Admin Dashboard Routes - Direct Access, No Main Website */}
          <Route
            path="/admin/*"
            element={
              <RoleBasedRoute allowedRoles={['admin']}>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/users" element={<AdminDashboard />} />
                  <Route path="/bookings" element={<AdminDashboard />} />
                  <Route path="/itineraries" element={<AdminDashboard />} />
                  <Route path="/roles" element={<AdminDashboard />} />
                  <Route path="/attractions" element={<AdminDashboard />} />
                  <Route path="/chatbot" element={<AdminDashboard />} />
                  <Route path="/reports" element={<AdminDashboard />} />
                  <Route path="/archive" element={<AdminDashboard />} />
                </Routes>
              </RoleBasedRoute>
            }
          />

          <Route
            path="/admin/moderation"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'agent']}>
                <Moderation />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/moderation"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'agent']}>
                <Moderation />
              </RoleBasedRoute>
            }
          />

          {/* Owner Dashboard Routes - Direct Access, No Main Website */}
          <Route
            path="/owner/*"
            element={
              <RoleBasedRoute allowedRoles={['owner', 'admin']}>
                <Routes>
                  <Route path="/" element={<OwnerDashboard />} />
                  <Route path="/hotels" element={<OwnerDashboard />} />
                  <Route path="/bookings" element={<OwnerDashboard />} />
                  <Route path="/analytics" element={<OwnerDashboard />} />
                  <Route path="/profile" element={<OwnerDashboard />} />
                  <Route path="/reviews" element={<OwnerDashboard />} />
                  <Route path="/payments" element={<OwnerDashboard />} />
                  <Route path="/notifications" element={<OwnerDashboard />} />
                  <Route path="/archive" element={<OwnerDashboard />} />
                </Routes>
              </RoleBasedRoute>
            }
          />

          {/* Main Website Routes */}
          <Route path="/*" element={<WebsiteLayout />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  };

  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppRoutes />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
