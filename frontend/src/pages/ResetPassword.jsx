import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/reset-password', { token, password });
      setMessage(response.data?.message || 'Your password has been reset.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Choose a new password</h1>
        <p style={subtitleStyle}>Use a strong password with at least 12 characters, including upper, lower, number, and symbol.</p>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {message ? <div style={successStyle}>{message}</div> : null}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={inputStyle}
            placeholder="Enter a new password"
          />

          <label style={labelStyle}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            style={inputStyle}
            placeholder="Confirm your new password"
          />

          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? 'Resetting password...' : 'Reset password'}
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
  background: 'linear-gradient(135deg, #e0f2fe 0%, #ecfccb 100%)',
  padding: '2rem'
};

const cardStyle = {
  width: '100%',
  maxWidth: '480px',
  background: '#ffffff',
  borderRadius: '24px',
  padding: '2rem',
  boxShadow: '0 20px 50px rgba(21, 94, 117, 0.16)'
};

const titleStyle = {
  margin: 0,
  fontSize: '2rem',
  color: '#164e63'
};

const subtitleStyle = {
  marginTop: '0.75rem',
  marginBottom: '1.5rem',
  color: '#0f766e',
  lineHeight: 1.5
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const labelStyle = {
  color: '#155e75',
  fontWeight: 600
};

const inputStyle = {
  borderRadius: '14px',
  border: '1px solid #bae6fd',
  padding: '0.9rem 1rem',
  fontSize: '1rem'
};

const buttonStyle = {
  marginTop: '0.5rem',
  border: 'none',
  borderRadius: '14px',
  padding: '0.95rem 1rem',
  background: '#155e75',
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
  color: '#155e75',
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

export default ResetPassword;
