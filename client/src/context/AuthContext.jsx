import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Create base api instance
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Actions
  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  // Setup api instance default headers on token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user profile on startup if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/auth/profile`);
        if (res.data && res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to load user profile on startup:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  // Actions
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data && res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, userData);
      if (res.data && res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async (credential) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { credential });
      if (res.data && res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Google Login failed.';
      setError(msg);
      throw new Error(msg);
    }
  };


  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const res = await axios.put(`${API_URL}/auth/profile`, profileData);
      if (res.data && res.data.success) {
        // Only update additional details, retain base user structure
        setUser(prev => ({ ...prev, ...res.data.user }));
        return res.data.user;
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update profile details.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      register,
      loginWithGoogle,
      logout,
      updateProfile,
      clearError,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { API_URL };
