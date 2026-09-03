import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const initialIdentifier = useMemo(() => searchParams.get('identifier') || '', [searchParams]);
  const [emailOrUsername, setEmailOrUsername] = useState(initialIdentifier);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setDevResetUrl('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/forgot-password', { emailOrUsername });
      setMessage(response.data?.message || 'If the account exists, a password reset link has been sent.');
      setDevResetUrl(response.data?.devResetUrl || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to process your request right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Reset your password</h1>
        <p style={subtitleStyle}>Enter your email or username and we will send you a reset link.</p>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {message ? <div style={successStyle}>{message}</div> : null}
        {devResetUrl ? (
          <a href={devResetUrl} style={devLinkStyle}>
            Open development reset link
          </a>
        ) : null}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>Email or Username</label>
          <input
            type="text"
            value={emailOrUsername}
            onChange={(event) => setEmailOrUsername(event.target.value)}
            required
            style={inputStyle}
            placeholder="Enter your email or username"
          />

          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>

        <div style={footerStyle}>
          <Link to="/login" style={linkStyle}>Back to login</Link>
        </div>
      </div>
    </div>
  );
};

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #d9f99d 0%, #dcfce7 45%, #f0fdf4 100%)',
  padding: '2rem'
};

const cardStyle = {
  width: '100%',
  maxWidth: '480px',
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '24px',
  padding: '2rem',
  boxShadow: '0 20px 50px rgba(20, 83, 45, 0.16)'
};

const titleStyle = {
  margin: 0,
  fontSize: '2rem',
  color: '#14532d'
};

const subtitleStyle = {
  marginTop: '0.75rem',
  marginBottom: '1.5rem',
  color: '#3f6212',
  lineHeight: 1.5
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const labelStyle = {
  color: '#166534',
  fontWeight: 600
};

const inputStyle = {
  borderRadius: '14px',
  border: '1px solid #bbf7d0',
  padding: '0.9rem 1rem',
  fontSize: '1rem'
};

const buttonStyle = {
  marginTop: '0.5rem',
  border: 'none',
  borderRadius: '14px',
  padding: '0.95rem 1rem',
  background: '#166534',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const footerStyle = {
  marginTop: '1.25rem',
  textAlign: 'center'
};

const linkStyle = {
  color: '#166534',
  fontWeight: 700,
  textDecoration: 'none'
};

const errorStyle = {
  marginBottom: '1rem',
  borderRadius: '14px',
  background: '#fee2e2',
  color: '#991b1b',
  padding: '0.85rem 1rem'
};

const successStyle = {
  marginBottom: '1rem',
  borderRadius: '14px',
  background: '#dcfce7',
  color: '#166534',
  padding: '0.85rem 1rem'
};

const devLinkStyle = {
  display: 'inline-block',
  marginBottom: '1rem',
  color: '#14532d',
  fontWeight: 700
};

export default ForgotPassword;
