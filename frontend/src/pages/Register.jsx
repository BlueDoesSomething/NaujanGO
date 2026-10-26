import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getApiBaseUrl } from '../api';
import '../styles/auth.css';
import { useLanguage } from '../context/LanguageContext';
import Icons from '../components/Icons';
import { loadCachedSetting } from '../utils/siteSettingsCache';
import './Register.css';

const DEFAULT_REGISTER_BG_STYLE = {
  backgroundColor: 'transparent',
  backgroundImage: 'none'
};

const passwordStrengthStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginTop: '0.5rem'
};

const strengthBarStyle = {
  flex: 1,
  height: '6px',
  backgroundColor: '#e5e7eb',
  borderRadius: '3px',
  overflow: 'hidden'
};

const strengthFillStyle = {
  height: '100%',
  transition: 'all 0.3s ease'
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
  color: '#16a34a',
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

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say',
    userType: 'foreigner',
    agreeToTerms: false
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [registrationStage, setRegistrationStage] = useState('form'); // 'form' or 'verify'
  const [verificationCode, setVerificationCode] = useState('');
  const [tempUserData, setTempUserData] = useState(null); // Store user data waiting for verification
  const [resendCooldown, setResendCooldown] = useState(0);
  const [registerBgStyle, setRegisterBgStyle] = useState({ ...DEFAULT_REGISTER_BG_STYLE });
  const navigate = useNavigate();

  const { t } = useLanguage();

  // Load auth pages settings
  useEffect(() => {
    let isMounted = true;

    const applySettings = async (settings) => {
      const bgStyle = generateBgStyle(settings.registerBgType, settings);
      if (settings.registerBgType === 'image' && settings.registerImage) {
        await preloadImage(settings.registerImage);
      }

      if (isMounted) {
        console.log('[REGISTER] Generated BG style:', bgStyle);
        setRegisterBgStyle(bgStyle);
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
        console.log('[REGISTER] Loaded auth settings:', settings);
        await applySettings(settings);
      } catch (err) {
        console.error('[REGISTER] Error loading auth pages settings:', err);
        if (!cachedSettings && isMounted) {
          setRegisterBgStyle({ ...DEFAULT_REGISTER_BG_STYLE });
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
        backgroundColor: settings.registerSolidColor,
        backgroundImage: 'none'
      };
    } else if (bgType === 'gradient') {
      return {
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(${settings.registerGradient.angle}deg, ${settings.registerGradient.color1}, ${settings.registerGradient.color2})`
      };
    } else if (bgType === 'image') {
      return {
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(rgba(0,0,0,${settings.registerOverlayOpacity}), rgba(0,0,0,${settings.registerOverlayOpacity})), url("${settings.registerImage}")`
      };
    }
    return {};
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError(t('password_mismatch_error'));
      return false;
    }
    if (formData.password.length < 12) {
      setError(t('password_length_error'));
      return false;
    }
    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[^A-Za-z0-9]/.test(formData.password)) {
      setError(t('password_strength_error'));
      return false;
    }
    if (!formData.agreeToTerms) {
      setError(t('terms_agreement_error'));
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Step 1: Send registration data and get verification code
      const response = await api.post('/auth/register-send-code', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        user_type: formData.userType,
        preferred_language: 'en'
      });

      console.log('Verification code sent:', response.data);
      setTempUserData(formData);
      setRegistrationStage('verify');
      setSuccessMessage(response.data?.message || 'Verification code sent to your email. Please enter the code to continue.');
    } catch (err) {
      console.error('Registration error:', err);
      const errMsg = err.response?.data?.code === 'EMAIL_DELIVERY_UNAVAILABLE'
        ? 'Registration email could not be sent. Please ask the administrator to check the SMTP email settings.'
        : err.response?.data?.error || err.message || 'Registration failed';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);

    try {
      // Step 2: Verify code and create account
      const response = await api.post('/auth/register-verify-code', {
        username: formData.username,
        email: formData.email,
        code: verificationCode
      });

      console.log('Account verified and created:', response.data);
      setSuccessMessage(response.data?.message || 'Account created successfully! Redirecting to login...');
      setRegistrationStage('form');
      setVerificationCode('');
      setTempUserData(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        gender: 'prefer_not_to_say',
        userType: 'foreigner',
        agreeToTerms: false
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Verification error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Verification failed';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register-resend-code', {
        email: formData.email
      });

      console.log('Resend code response:', response.data);
      setSuccessMessage(response.data?.message || 'Verification code resent to your email');
      
      // Show dev code if available
      if (response.data?.devVerificationCode) {
        console.log('[DEV] Verification code:', response.data.devVerificationCode);
      }

      // Set cooldown timer (60 seconds)
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Resend code error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to resend code';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return '#ef4444';
      case 2: return '#f59e0b';
      case 3: return '#eab308';
      case 4: return '#84cc16';
      case 5: return '#16a34a';
      default: return '#e5e7eb';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return t('password_strength_weak');
      case 2: return t('password_strength_fair');
      case 3: return t('password_strength_good');
      case 4: return t('password_strength_strong');
      case 5: return t('password_strength_very_strong');
      default: return '';
    }
  };

  const handleOAuthLogin = (provider) => {
    const backendUrl = getApiBaseUrl();
    window.location.href = `${backendUrl}/auth/${provider}`;
  };

  return (
    <div className="register-page" style={registerBgStyle}>
      <div className="register-card">
        <div className="register-header">
          <h1>{t('create_account')}</h1>
          <p>{t('join_us_start_exploring')}</p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {successMessage && (
          <div style={successStyle}>
            <p>{successMessage}</p>
          </div>
        )}
        {successMessage && (
          <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d', color: '#92400e'}}>
            <p style={{margin: '0 0 0.5rem 0', fontWeight: '600'}}>📧 Check your email</p>
            <p style={{margin: 0, fontSize: '0.9rem'}}>A verification code has been sent to your email. Enter it below to verify your account.</p>
          </div>
        )}

        {registrationStage === 'form' && !successMessage && (
        <form id="register-form" className="register-form" onSubmit={handleRegister}>
          <div className="register-row">
            <div className="register-field">
              <label htmlFor="register-first-name">{t('first_name')}</label>
              <input
                type="text"
                name="firstName"
                id="register-first-name"
                autoComplete="given-name"
                placeholder={t('enter_first_name')}
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="register-input"
              />
            </div>
            <div className="register-field">
              <label htmlFor="register-last-name">{t('last_name')}</label>
              <input
                type="text"
                name="lastName"
                id="register-last-name"
                autoComplete="family-name"
                placeholder={t('enter_last_name')}
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="register-input"
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="register-username">{t('username')}</label>
            <input
              type="text"
              name="username"
              id="register-username"
              autoComplete="username"
              placeholder={t('choose_username')}
              value={formData.username}
              onChange={handleInputChange}
              required
              className="register-input"
            />
          </div>

          <div className="register-field">
            <label htmlFor="register-email">{t('email_address')}</label>
            <input
              type="email"
              name="email"
              id="register-email"
              autoComplete="email"
              placeholder={t('enter_your_email')}
              value={formData.email}
              onChange={handleInputChange}
              required
              className="register-input"
            />
          </div>

          <div className="register-row">
            <div className="register-field">
              <label htmlFor="register-phone">{t('phone_number')}</label>
              <input
                type="tel"
                name="phone"
                id="register-phone"
                autoComplete="tel"
                placeholder={t('enter_phone_number')}
                value={formData.phone}
                onChange={handleInputChange}
                className="register-input"
              />
            </div>
            <div className="register-field">
              <label htmlFor="register-birth-date">{t('date_of_birth')}</label>
              <input
                type="date"
                name="dateOfBirth"
                id="register-birth-date"
                autoComplete="bday"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="register-input"
              />
            </div>
          </div>

          <div className="register-row">
            <div className="register-field">
              <label htmlFor="register-gender">Gender</label>
              <select
                name="gender"
                id="register-gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="register-input"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="register-field">
              <label htmlFor="register-visitor-type">Visitor Type</label>
              <select
                name="userType"
                id="register-visitor-type"
                value={formData.userType}
                onChange={handleInputChange}
                className="register-input"
              >
                <option value="foreigner">Foreigner</option>
                <option value="resident">Resident</option>
                <option value="local">Local</option>
              </select>
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="register-password">{t('password')}</label>
            <div className="register-password">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="register-password"
                autoComplete="new-password"
                aria-describedby="register-password-hint"
                placeholder={t('create_password')}
                value={formData.password}
                onChange={handleInputChange}
                required
                className="register-input register-input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="register-reveal"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <Icons.Eye size={20} /> : <Icons.EyeOff size={20} />}
              </button>
            </div>
            {formData.password && (
              <div style={passwordStrengthStyle}>
                <div style={strengthBarStyle}>
                  <div 
                    style={{
                      ...strengthFillStyle,
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.8rem', color: getPasswordStrengthColor(), fontWeight: '600' }}>
                  {getPasswordStrengthText()}
                </span>
              </div>
            )}
            <p id="register-password-hint" className="register-hint">{t('password_requirements')}</p>
          </div>

          <div className="register-field">
            <label htmlFor="register-confirm-password">{t('confirm_password')}</label>
            <div className="register-password">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="register-confirm-password"
                autoComplete="new-password"
                placeholder={t('confirm_your_password')}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="register-input register-input-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="register-reveal"
                aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? <Icons.Eye size={20} /> : <Icons.EyeOff size={20} />}
              </button>
            </div>
          </div>

          <label className="register-terms">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              required
              className="register-terms-checkbox"
            />
            <span>
              I agree to the <Link to="/terms" className="register-link">Terms of Service</Link> and <Link to="/privacy" className="register-link">Privacy Policy</Link>
            </span>
          </label>

          <button 
            type="submit" 
            disabled={isLoading}
            className="register-submit"
          >
            {isLoading ? t('creating_account') : t('create_account')}
          </button>
        </form>
        )}

        {registrationStage === 'verify' && successMessage && (
        <form id="register-verification-form" className="register-form" onSubmit={handleVerifyCode}>
          <div className="register-field">
            <label htmlFor="register-verification-code">Verification Code</label>
            <input
              type="text"
              name="verificationCode"
              id="register-verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit code from email"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              maxLength="6"
              className="register-input register-code"
            />
            <p className="register-hint">
              Check your email for the 6-digit verification code
            </p>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || verificationCode.length !== 6}
            className="register-submit"
          >
            {isLoading ? 'Verifying...' : 'Verify and Create Account'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading || resendCooldown > 0}
            className="register-secondary"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>

          <button
            type="button"
            onClick={() => {
              setRegistrationStage('form');
              setSuccessMessage(null);
              setError(null);
              setVerificationCode('');
              setResendCooldown(0);
            }}
            className="register-secondary"
          >
            Back to Registration
          </button>
        </form>
        )}

        {!successMessage && (
        <>
        <div className="register-divider">
          <span>{t('or_sign_up_with')}</span>
        </div>

        <div className="register-social-buttons">
          <button type="button" className="register-social" onClick={() => handleOAuthLogin('google')}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '18px', height: '18px', marginRight: '8px'}} />
            {t('google')}
          </button>
        </div>

        <div className="register-footer">
          <span>{t('already_have_account')} </span>
          <Link to="/login" className="register-link">{t('sign_in_link')}</Link>
          {successMessage ? (
            <button type="button" onClick={() => navigate('/login')} className="register-secondary">
              {t('continue_to_login')}
            </button>
          ) : null}
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Register;
