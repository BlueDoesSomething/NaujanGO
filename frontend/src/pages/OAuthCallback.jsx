import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');
      const userStr = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        setStatus('Authentication failed. Redirecting...');
        setTimeout(() => navigate('/login?error=oauth_failed'), 2000);
        return;
      }

      if (!token || !provider) {
        console.error('Missing OAuth parameters');
        setStatus('Invalid authentication data. Redirecting...');
        setTimeout(() => navigate('/login?error=missing_params'), 2000);
        return;
      }

      try {
        // Parse user data
        const user = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;
        
        if (!user) {
          throw new Error('User data is missing');
        }

        console.log('OAuth login - Token:', token.substring(0, 20) + '...');
        console.log('OAuth login - User:', user);

        // Use AuthContext to properly log in the user
        const result = await loginWithOAuth(token, user, true);
        
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
