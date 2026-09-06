// @refresh reset
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getStoredToken = () => {
    // Tokens are now stored in HttpOnly cookies (secure, inaccessible to JavaScript)
    // No need to retrieve from localStorage
    // Cookies are automatically sent with every request
    return null;
  };

  const storeToken = (tokenToStore, remember) => {
    // Tokens are now managed by the backend as HttpOnly cookies
    // This function is kept for backwards compatibility but does nothing
    // The cookie is automatically set by the backend on login
    localStorage.setItem('rememberMe', remember ? 'true' : 'false');
    // Don't store token in localStorage - it's in the HttpOnly cookie
  };

  const clearStoredToken = () => {
    // Logout is handled by backend clearing the HttpOnly cookie
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('auth_token');  // Remove any old token storage
    localStorage.removeItem('user');  // Remove any cached user data
    sessionStorage.removeItem('token');  // Remove any session tokens
    sessionStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
  };

  // Cleanup effect (cookies are automatically managed by browser and backend)
  useEffect(() => {
    // No need for manual token cleanup - HttpOnly cookies are managed automatically
    return () => {};
  }, []);



  useEffect(() => {
    // On mount, check if user is authenticated
    // HttpOnly cookie is automatically sent with this request
    // If cookie is valid → server returns user data
    // If cookie is invalid/expired → server returns 401
    const initializeAuth = async () => {
      console.log('[Auth] initializeAuth: Checking authentication...');
      try {
        const response = await api.get('/auth/profile');
        console.log('[Auth] initializeAuth: Success, setting isLoggedIn=true');
        setIsLoggedIn(true);
        setUser(response.data.user);
      } catch (error) {
        console.log('[Auth] initializeAuth: Failed (', error.response?.status, '), setting isLoggedIn=false');
        // 401 = not authenticated (cookie invalid/expired/missing)
        // Network errors = can't verify, but mark as not logged in
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        console.log('[Auth] initializeAuth: Complete, setting loading=false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (emailOrUsername, password, remember = false) => {
    try {
      const response = await api.post('/auth/login', { emailOrUsername, password });
      
      // Check for error response
      if (response.status !== 200 || !response.data.user) {
        clearStoredToken();
        return { success: false, message: response.data?.error || 'Invalid credentials' };
      }
      
      const userData = response.data.user;
      storeToken(null, remember); // Token is in HttpOnly cookie, no need to store
      setIsLoggedIn(true);
      setUser(userData);
      
      // Determine redirect based on role
      let redirectTo = '/';
      if (userData.role === 'admin') {
        redirectTo = '/admin';
      } else if (userData.role === 'owner') {
        redirectTo = '/owner';
      } else if (userData.role === 'agent') {
        redirectTo = '/admin/moderation';
      }
      
      return { success: true, redirectTo };
    } catch (error) {
      clearStoredToken();
      return {
        success: false,
        message: error.response?.data?.error || 'Login failed',
        code: error.response?.data?.code || null
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register-send-code', {
        username,
        email,
        password,
        preferred_language: 'en'
      });
      return { success: true, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Registration failed' };
    }
  };

  const loginWithOAuth = async (token, userData, remember = true) => {
    try {
      storeToken(token, remember);
      setIsLoggedIn(true);
      setUser(userData);
      return { success: true };
    } catch (error) {
      clearStoredToken();
      return { success: false, message: 'OAuth login failed' };
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to clear the HttpOnly cookie
      const logoutPromise = api.post('/auth/logout');
      await Promise.race([
        logoutPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timeout')), 5000)
        )
      ]);
    } catch (error) {
      // Don't throw - we still need to clear local state
      // Cookie may still be cleared on backend even if request fails
    } finally {
      // Completely clear all auth-related data
      clearStoredToken();
      
      // Force state update
      setIsLoggedIn(false);
      setUser(null);
      setLoading(false);
    }
  };

  const updateLanguage = async (newLang) => {
    if (isLoggedIn && user) {
      try {
        await api.put('/auth/language', { language: newLang });
        setUser(prev => ({ ...prev, language: newLang }));
      } catch (error) {
        console.error('Failed to update language preference on server', error);
      }
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Memoize the value object to prevent unnecessary re-renders
  const value = useMemo(() => ({
    isLoggedIn,
    user,
    loading,
    login,
    loginWithOAuth,
    register,
    logout,
    updateUser,
    updateLanguage
  }), [isLoggedIn, user, loading, login, loginWithOAuth, register, logout, updateLanguage]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
