import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithOAuth } = useAuth();
  const [status, setStatus] = useState('Processing login...');
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    const handleCallback = async () => {
      const provider = searchParams.get('provider');
      const error = searchParams.get('error');
      const token = searchParams.get('token');

      if (error) {
        console.error('OAuth error:', error);
        setStatus('Authentication failed. Redirecting...');
        setTimeout(() => navigate('/login?error=oauth_failed'), 2000);
        return;
      }

      if (!provider) {
        console.error('Missing OAuth parameters');
        setStatus('Invalid authentication data. Redirecting...');
        setTimeout(() => navigate('/login?error=missing_params'), 2000);
        return;
      }

      try {
        let userData;

        if (token && provider) {
          // Production: backend and frontend are different *.up.railway.app sites,
          // so the HttpOnly cookie set by the callback can't reach this origin.
          // Exchange the token on THIS origin so /oauth-login sets the cookie here.
          const res = await api.post('/auth/oauth-login', { token, provider });
          userData = res.data.user;
        } else {
          // Dev / same-host setups already have the cookie; read the profile.
          const response = await api.get('/auth/profile');
          userData = response.data.user;
        }

        const result = await loginWithOAuth(null, userData, true);
        
        if (result.success) {
          console.log('OAuth login successful!');
          setStatus('Login successful! Redirecting...');
          
          // Wait a bit to ensure state is updated, then redirect
          await new Promise(resolve => setTimeout(resolve, 500));
          navigate('/', { replace: true });
        } else {
          throw new Error(result.message || 'Login failed');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('Login failed. Redirecting...');
        setTimeout(() => navigate('/login?error=callback_failed'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithOAuth]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '400px'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          🔐
        </div>
        <div style={{
          fontSize: '1.25rem',
          color: '#333',
          fontWeight: '500'
        }}>
          {status}
        </div>
        <div style={{
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          Please wait...
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
