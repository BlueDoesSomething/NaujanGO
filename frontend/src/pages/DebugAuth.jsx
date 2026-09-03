import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '../api';

const DebugAuth = () => {
  const { user, isLoggedIn } = useAuth();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [apiTest, setApiTest] = useState(null);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (token) {
      // Decode token (just the payload, not verifying signature)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTokenInfo(payload);
      } catch (e) {
        console.error('Error decoding token:', e);
      }

      // Test API call
      testApi(token);
    }
  }, []);

  const testApi = async (token) => {
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/owner/dashboard/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setApiTest({ success: true, data: response.data });
    } catch (error) {
      setApiTest({
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message
      });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Authentication Debug Info</h1>
      
      <div style={{ marginBottom: '30px', padding: '15px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Auth Context</h2>
        <p><strong>Is Logged In:</strong> {isLoggedIn ? '✅ Yes' : '❌ No'}</p>
        <p><strong>User Object:</strong></p>
        <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
        <p><strong>User Role:</strong> {user?.role || 'undefined'}</p>
        <p><strong>Role Check (owner):</strong> {user?.role === 'owner' ? '✅ Match' : '❌ No match'}</p>
      </div>

      <div style={{ marginBottom: '30px', padding: '15px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Token Info (from localStorage)</h2>
        <p><strong>Token exists:</strong> {tokenInfo ? '✅ Yes' : '❌ No'}</p>
        {tokenInfo && (
          <>
            <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
            <p><strong>Token Role:</strong> {tokenInfo.role || 'undefined'}</p>
            <p><strong>Role Check (owner):</strong> {tokenInfo.role === 'owner' ? '✅ Match' : '❌ No match'}</p>
          </>
        )}
      </div>

      <div style={{ marginBottom: '30px', padding: '15px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h2>API Test (/owner/dashboard/stats)</h2>
        {apiTest ? (
          apiTest.success ? (
            <div>
              <p style={{ color: 'green' }}>✅ API call successful!</p>
              <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
                {JSON.stringify(apiTest.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <p style={{ color: 'red' }}>❌ API call failed!</p>
              <p><strong>Status:</strong> {apiTest.status}</p>
              <p><strong>Error:</strong></p>
              <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
                {JSON.stringify(apiTest.error, null, 2)}
              </pre>
            </div>
          )
        ) : (
          <p>Testing...</p>
        )}
      </div>

      <div style={{ padding: '15px', background: '#ffe0e0', borderRadius: '5px' }}>
        <h3>Quick Diagnostics</h3>
        {!isLoggedIn && <p>❌ Not logged in - login first</p>}
        {isLoggedIn && user?.role !== 'owner' && user?.role !== 'admin' && (
          <p>❌ User role is "{user?.role}" but needs to be "owner" or "admin"</p>
        )}
        {isLoggedIn && (user?.role === 'owner' || user?.role === 'admin') && (
          <p>✅ Auth context looks good!</p>
        )}
        {tokenInfo && tokenInfo.role !== 'owner' && tokenInfo.role !== 'admin' && (
          <p>❌ Token role is "{tokenInfo.role}" but needs to be "owner" or "admin"</p>
        )}
        {tokenInfo && (tokenInfo.role === 'owner' || tokenInfo.role === 'admin') && (
          <p>✅ Token looks good!</p>
        )}
      </div>
    </div>
  );
};

export default DebugAuth;
