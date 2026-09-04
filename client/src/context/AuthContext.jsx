import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchCurrentSession = useCallback(async () => {
    try {
      setSessionLoading(true);
      const res = await api.get('/sessions/current');
      if (res.data?.success) {
        setCurrentSession(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch current session:', err.message);
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setUnreadNotifications(res.data.unreadCount || 0);
      }
    } catch (err) {
      // ignore silent notification fetch failure
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('hostel_mess_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.user);
        fetchUnreadNotifications();
      }
    } catch (err) {
      console.error('Failed to load user session:', err.message);
      localStorage.removeItem('hostel_mess_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUnreadNotifications]);

  useEffect(() => {
    refreshUser();
    fetchCurrentSession();
  }, [refreshUser, fetchCurrentSession]);

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    if (res.data?.success) {
      localStorage.setItem('hostel_mess_token', res.data.token);
      await refreshUser();
      await fetchCurrentSession();
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data?.success) {
      localStorage.setItem('hostel_mess_token', res.data.token);
      await refreshUser();
      await fetchCurrentSession();
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('hostel_mess_token');
    setUser(null);
  };

  // Quick switch demo helper for presentation reviewers
  const demoLogin = async (role) => {
    let email = '22ad001@hostel.edu';
    let password = 'Student@123';

    if (role === 'warden') {
      email = 'warden1@hostel.edu';
      password = 'Warden@123';
    } else if (role === 'admin') {
      email = 'admin@hostel.edu';
      password = 'Admin@123';
    }

    return await login(email, password, role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        currentSession,
        sessionLoading,
        unreadNotifications,
        login,
        register,
        logout,
        refreshUser,
        refreshSession: fetchCurrentSession,
        demoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
