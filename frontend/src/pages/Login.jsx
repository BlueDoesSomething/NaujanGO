import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import '../styles/auth.css';
import { useLanguage } from '../context/LanguageContext';
import api, { getApiBaseUrl } from '../api';
import Icons from '../components/Icons';
import { loadCachedSetting } from '../utils/siteSettingsCache';

// Style definitions moved before component to fix initialization order
const containerStyle = {
  minHeight: '100vh',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  position: 'relative'
};

const DEFAULT_LOGIN_BG_STYLE = {
  backgroundColor: 'transparent',
  backgroundImage: 'linear-gradient(135deg, rgba(22, 166, 75, 0.31) 0%, rgba(16, 160, 114, 0.52) 100%)'
};

const cardStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  borderRadius: '24px',
  padding: '3rem',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(255, 255, 255, 0.3)',
  width: '100%',
  maxWidth: '480px',
  border: '1px solid rgba(255, 255, 255, 0.18)'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '2rem'
};

const titleStyle = {
  fontSize: '2.5rem',
  fontWeight: '800',
  color: 'white',
  margin: '0 0 0.5rem 0',
  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
};

const subtitleStyle = {
  color: 'white',
  fontSize: '1.1rem',
  margin: 0
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const labelStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: 'white'
};

const inputStyle = {
  padding: '1rem 1.2rem',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '12px',
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.3s ease',
  color: 'white'
};

const passwordContainerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const passwordInputStyle = {
  padding: '1rem 1.2rem',
  paddingRight: '3.5rem',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '12px',
  fontSize: '1rem',
  outline: 'none',
  width: '100%',
  transition: 'all 0.3s ease',
  color: 'white'
};

const eyeButtonStyle = {
  position: 'absolute',
  right: '1rem',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.25rem',
  transition: 'color 0.2s ease'
};

const optionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.9rem',
  color: 'white'
};

const checkBoxStyle = {
  display: 'block',
  cursor: 'pointer',
  width: '20px',
  height: '20px',
  border: '3px solid rgba(255, 255, 255, 0)',
  borderRadius: '6px',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0px 0px 0px 2px #fff'
};

const checkBoxDivStyle = {
  width: '40px',
  height: '40px',
  backgroundColor: '#fff',
  top: '-35px',
  left: '-35px',
  position: 'absolute',
  transform: 'rotateZ(45deg)',
  zIndex: 100,
  transition: '300ms ease'
};

const linkButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#ffffffa5',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'color 0.2s ease'
};

const secondaryLinkButtonStyle = {
  ...linkButtonStyle,
  alignSelf: 'flex-start',
  padding: 0,
  marginTop: '-0.5rem'
};

const buttonStyle = {
  background: 'rgba(22, 163, 74, 0.3)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  color: 'white',
  padding: '1.1rem',
  border: '2px solid #16a34a',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3), 0 0 20px rgba(22, 163, 74, 0.4)'
};

const dividerStyle = {
  textAlign: 'center',
  margin: '2rem 0',
  position: 'relative'
};

const dividerTextStyle = {
  padding: '0 1rem',
  color: 'white',
  fontSize: '0.9rem'
};

const socialButtonsStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem'
};

const socialButtonStyle = {
  flex: 1,
  padding: '1rem',
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '12px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  color: 'white'
};

const footerStyle = {
  textAlign: 'center',
  color: 'white',
  fontSize: '0.9rem'
};

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  fontWeight: '700',
  transition: 'color 0.2s ease'
};

const errorStyle = {
  backgroundColor: '#fee2e2',
  color: '#dc2626',
  padding: '1rem',
  borderRadius: '12px',
  marginBottom: '1rem',
  textAlign: 'center',
  fontWeight: '600',
  border: '1px solid #fecaca'
};

const successStyle = {
  backgroundColor: '#d1fae5',
  color: '#166534',
  padding: '1rem',
  borderRadius: '12px',
  marginBottom: '1rem',
  textAlign: 'center',
  fontWeight: '600',
  border: '1px solid #a7f3d0'
};

const preloadImage = (src) => new Promise((resolve) => {
  if (!src) {
    resolve();
    return;
  }

  const image = new Image();
  image.onload = () => resolve();
  image.onerror = () => resolve();
  image.src = src;
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      // Start with rememberMe unchecked - never auto-restore
      // User must explicitly check it each time
      return false;
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [loginBgStyle, setLoginBgStyle] = useState({ ...containerStyle, ...DEFAULT_LOGIN_BG_STYLE });

  // Load auth pages settings
  useEffect(() => {
    let isMounted = true;

    const applySettings = async (settings) => {
      const bgStyle = generateBgStyle(settings.loginBgType, settings);
      if (settings.loginBgType === 'image' && settings.loginImage) {
        await preloadImage(settings.loginImage);
      }

      if (isMounted) {
        console.log('[LOGIN] Generated BG style:', bgStyle);
        setLoginBgStyle({ ...containerStyle, ...bgStyle });
      }
    };

    const loadAuthSettings = async () => {
      const cachedSettings = loadCachedSetting('auth-pages', null);
      if (cachedSettings) {
        applySettings(cachedSettings);
      }

      try {
        const response = await api.get('/admin/auth-pages');
        const settings = response.data;
        console.log('[LOGIN] Loaded auth settings:', settings);
        await applySettings(settings);
      } catch (err) {
        console.error('[LOGIN] Error loading auth pages settings:', err);
        if (!cachedSettings && isMounted) {
          setLoginBgStyle({ ...containerStyle, ...DEFAULT_LOGIN_BG_STYLE });
        }
      }
    };

    loadAuthSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const generateBgStyle = (bgType, settings) => {
    if (bgType === 'solid') {
      return {
        backgroundColor: settings.loginSolidColor,
        backgroundImage: 'none'
      };
    } else if (bgType === 'gradient') {
      return {
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(${settings.loginGradient.angle}deg, ${settings.loginGradient.color1}, ${settings.loginGradient.color2})`
      };
    } else if (bgType === 'image') {
      return {
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(rgba(0,0,0,${settings.loginOverlayOpacity}), rgba(0,0,0,${settings.loginOverlayOpacity})), url("${settings.loginImage}")`
      };
    }
    return {};
  };

  const handleRememberMeChange = (e) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    localStorage.setItem('rememberMe', isChecked ? 'true' : 'false');
    const checkBoxDiv = e.target.nextElementSibling;
    if (isChecked) {
      checkBoxDiv.style.left = '-7px';
      checkBoxDiv.style.top = '-7px';
    } else {
      checkBoxDiv.style.left = '-35px';
      checkBoxDiv.style.top = '-35px';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setVerificationMessage(null);
    setCanResendVerification(false);
    setIsLoading(true);
    
    try {
      const result = await login(emailOrUsername, password, rememberMe);
      if (!result.success) {
        setError(result.message);
        setCanResendVerification(result.code === 'EMAIL_NOT_VERIFIED');
      } else {
        const params = new URLSearchParams(location.search);
        const redirectParam = params.get('redirect');
        const finalRedirect = redirectParam && redirectParam.startsWith('/')
          ? redirectParam
          : (result.redirectTo || '/');
        navigate(finalRedirect);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const params = new URLSearchParams();
    if (emailOrUsername) {
      params.set('identifier', emailOrUsername);
    }
    navigate(`/forgot-password${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleResendVerification = async () => {
    if (!emailOrUsername) {
      setError('Enter your email or username to resend verification.');
      return;
    }

    setIsResendingVerification(true);
    setError(null);
    setVerificationMessage(null);

    try {
      const response = await api.post('/auth/resend-verification', { emailOrUsername });
      const baseMessage = response.data?.message || 'If the account still needs verification, a new email has been sent.';
      const devLink = response.data?.devVerificationUrl;
      setVerificationMessage(devLink ? `${baseMessage} Development link: ${devLink}` : baseMessage);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to resend verification email.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    const backendUrl = getApiBaseUrl();
    window.location.href = `${backendUrl}/auth/${provider}`;
  };

  const { t } = useLanguage();

  return (
    <div style={loginBgStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>{t('welcome_back')}</h1>
          <p style={subtitleStyle}>{t('sign_in_to_account')}</p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {verificationMessage && <div style={successStyle}>{verificationMessage}</div>}

        <form onSubmit={handleLogin} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>{t('email_or_username')}</label>
            <input
              type="text"
              placeholder={t('enter_email_or_username')}
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>{t('password')}</label>
            <div style={passwordContainerStyle}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('enter_password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={passwordInputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={eyeButtonStyle}
              >
                {showPassword ? <Icons.Eye size={20} /> : <Icons.EyeOff size={20} />}
              </button>
            </div>
          </div>

          <div style={optionsStyle}>
            <label style={checkboxLabelStyle}>
              <div style={checkBoxStyle}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  style={{position: 'absolute', left: '50px', visibility: 'hidden'}}
                />
                <div style={rememberMe ? {...checkBoxDivStyle, left: '-7px', top: '-7px'} : checkBoxDivStyle}></div>
              </div>
              {t('remember_me') || 'Remember me'}
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={linkButtonStyle}
            >
              {t('forgot_password') || 'Forgot password?'}
            </button>
          </div>

          {canResendVerification ? (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResendingVerification}
              style={secondaryLinkButtonStyle}
            >
              {isResendingVerification ? t('sending_verification') : t('resend_verification_email')}
            </button>
          ) : null}

          <button 
            type="submit" 
            disabled={isLoading}
            style={isLoading ? { ...buttonStyle, opacity: 0.7 } : buttonStyle}
          >
            {isLoading ? t('signing_in') || 'Signing in...' : t('login_button')}
          </button>
        </form>

        <div style={dividerStyle}>
          <span style={dividerTextStyle}>{t('or_sign_in_with')}</span>
        </div>

        <div style={socialButtonsStyle}>
          <button 
            type="button"
            onClick={() => handleOAuthLogin('google')}
            style={socialButtonStyle}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '18px', height: '18px', marginRight: '8px'}} />
            {t('google')}
          </button>
        </div>

        <div style={footerStyle}>
          <span>{t('no_account') || "Don't have an account?"} </span>
          <Link to="/register" style={linkStyle}>{t('register')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
