import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getApiBaseUrl } from '../api';
import '../styles/auth.css';
import { useLanguage } from '../context/LanguageContext';
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

const DEFAULT_REGISTER_BG_STYLE = {
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
  maxWidth: '650px',
  border: '1px solid rgba(255, 255, 255, 0.18)'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '2rem'
};

const titleStyle = {
  fontSize: '3rem',
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

const rowStyle = {
  display: 'flex',
  gap: '1rem'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  flex: 1
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

const passwordStrengthStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginTop: '0.5rem'
};

const passwordHintStyle = {
  marginTop: '0.75rem',
  marginBottom: 0,
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '0.85rem',
  lineHeight: 1.5
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

const checkboxContainerStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.5rem'
};

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.5rem',
  fontSize: '0.9rem',
  color: 'white',
  lineHeight: '1.4'
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
  boxShadow: '0px 0px 0px 2px #fff',
  flexShrink: 0
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

const postRegisterButtonStyle = {
  display: 'block',
  margin: '1rem auto 0',
  border: '1px solid rgba(255, 255, 255, 0.45)',
  background: 'rgba(255, 255, 255, 0.12)',
  color: '#fff',
  borderRadius: '999px',
  padding: '0.75rem 1.25rem',
  cursor: 'pointer',
  fontWeight: '700'
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
  const [registerBgStyle, setRegisterBgStyle] = useState({ ...containerStyle, ...DEFAULT_REGISTER_BG_STYLE });
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
        setRegisterBgStyle({ ...containerStyle, ...bgStyle });
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
          setRegisterBgStyle({ ...containerStyle, ...DEFAULT_REGISTER_BG_STYLE });
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
    
    if (name === 'agreeToTerms' && type === 'checkbox') {
      const checkBoxDiv = e.target.nextElementSibling;
      if (checked) {
        checkBoxDiv.style.left = '-7px';
        checkBoxDiv.style.top = '-7px';
      } else {
        checkBoxDiv.style.left = '-35px';
        checkBoxDiv.style.top = '-35px';
      }
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
    <div style={registerBgStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>{t('create_account')}</h1>
          <p style={subtitleStyle}>{t('join_us_start_exploring')}</p>
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
        <form onSubmit={handleRegister} style={formStyle}>
          <div style={rowStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('first_name')}</label>
              <input
                type="text"
                name="firstName"
                placeholder={t('enter_first_name')}
                value={formData.firstName}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('last_name')}</label>
              <input
                type="text"
                name="lastName"
                placeholder={t('enter_last_name')}
                value={formData.lastName}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>{t('username')}</label>
            <input
              type="text"
              name="username"
              placeholder={t('choose_username')}
              value={formData.username}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>{t('email_address')}</label>
            <input
              type="email"
              name="email"
              placeholder={t('enter_your_email')}
              value={formData.email}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('phone_number')}</label>
              <input
                type="tel"
                name="phone"
                placeholder={t('enter_phone_number')}
                value={formData.phone}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('date_of_birth')}</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={rowStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                style={inputStyle}
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Visitor Type</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                style={inputStyle}
              >
                <option value="foreigner">Foreigner</option>
                <option value="resident">Resident</option>
                <option value="local">Local</option>
              </select>
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>{t('password')}</label>
            <div style={passwordContainerStyle}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder={t('create_password')}
                value={formData.password}
                onChange={handleInputChange}
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
            <p style={passwordHintStyle}>{t('password_requirements')}</p>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>{t('confirm_password')}</label>
            <div style={passwordContainerStyle}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder={t('confirm_your_password')}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                style={passwordInputStyle}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={eyeButtonStyle}
              >
                {showConfirmPassword ? <Icons.Eye size={20} /> : <Icons.EyeOff size={20} />}
              </button>
            </div>
          </div>

          <div style={checkboxContainerStyle}>
            <label style={checkboxLabelStyle}>
              <div style={checkBoxStyle}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  required
                  style={{position: 'absolute', left: '50px', visibility: 'hidden'}}
                />
                <div style={formData.agreeToTerms ? {...checkBoxDivStyle, left: '-7px', top: '-7px'} : checkBoxDivStyle}></div>
              </div>
              I agree to the <Link to="/terms" style={linkStyle}>Terms of Service</Link> and <Link to="/privacy" style={linkStyle}>Privacy Policy</Link>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={isLoading ? { ...buttonStyle, opacity: 0.7 } : buttonStyle}
          >
            {isLoading ? t('creating_account') : t('create_account')}
          </button>
        </form>
        )}

        {registrationStage === 'verify' && successMessage && (
        <form onSubmit={handleVerifyCode} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Verification Code</label>
            <input
              type="text"
              name="verificationCode"
              placeholder="Enter 6-digit code from email"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              maxLength="6"
              style={{...inputStyle, fontSize: '1.2rem', letterSpacing: '0.2rem', textAlign: 'center'}}
            />
            <p style={{fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '0.5rem 0 0 0'}}>
              Check your email for the 6-digit verification code
            </p>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || verificationCode.length !== 6}
            style={isLoading || verificationCode.length !== 6 ? { ...buttonStyle, opacity: 0.5 } : buttonStyle}
          >
            {isLoading ? 'Verifying...' : 'Verify and Create Account'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading || resendCooldown > 0}
            style={{
              marginTop: '1rem',
              display: 'block',
              margin: '0.75rem auto 0',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              background: resendCooldown > 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)',
              color: resendCooldown > 0 ? 'rgba(255, 255, 255, 0.5)' : '#fff',
              borderRadius: '999px',
              padding: '0.75rem 1.25rem',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              transition: 'all 0.3s ease'
            }}
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
            style={{
              marginTop: '1rem',
              display: 'block',
              margin: '0.75rem auto 0',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#fff',
              borderRadius: '999px',
              padding: '0.75rem 1.25rem',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            Back to Registration
          </button>
        </form>
        )}

        {!successMessage && (
        <>
        <div style={dividerStyle}>
          <span style={dividerTextStyle}>{t('or_sign_up_with')}</span>
        </div>

        <div style={socialButtonsStyle}>
          <button style={socialButtonStyle} onClick={() => handleOAuthLogin('google')}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '18px', height: '18px', marginRight: '8px'}} />
            {t('google')}
          </button>
        </div>

        <div style={footerStyle}>
          <span>{t('already_have_account')} </span>
          <Link to="/login" style={linkStyle}>{t('sign_in_link')}</Link>
          {successMessage ? (
            <button type="button" onClick={() => navigate('/login')} style={postRegisterButtonStyle}>
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
