import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please open the link from your email.');
        return;
      }

      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data?.message || 'Your email has been verified.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Unable to verify your email.');
      }
    };

    verify();
  }, [token]);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Email verification</h1>
        <div style={status === 'success' ? successStyle : status === 'error' ? errorStyle : pendingStyle}>
          {message}
        </div>
        <div style={footerStyle}>
          <Link to="/login" style={linkStyle}>Go to login</Link>
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
  background: 'linear-gradient(135deg, #fef9c3 0%, #dcfce7 100%)',
  padding: '2rem'
};

const cardStyle = {
  width: '100%',
  maxWidth: '520px',
  background: '#ffffff',
  borderRadius: '24px',
  padding: '2rem',
  boxShadow: '0 20px 50px rgba(113, 63, 18, 0.14)',
  textAlign: 'center'
};

const titleStyle = {
  margin: 0,
  marginBottom: '1.25rem',
  fontSize: '2rem',
  color: '#854d0e'
};

const baseNoticeStyle = {
  borderRadius: '16px',
  padding: '1rem 1.25rem',
  lineHeight: 1.6
};

const pendingStyle = {
  ...baseNoticeStyle,
  background: '#fef3c7',
  color: '#92400e'
};

const successStyle = {
  ...baseNoticeStyle,
  background: '#dcfce7',
  color: '#166534'
};

const errorStyle = {
  ...baseNoticeStyle,
  background: '#fee2e2',
  color: '#991b1b'
};

const footerStyle = {
  marginTop: '1.25rem'
};

const linkStyle = {
  color: '#854d0e',
  fontWeight: 700,
  textDecoration: 'none'
};

export default VerifyEmail;
