import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [role, setRole] = useState(null);
  const [rawToken, setRawToken] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    const savedUser = localStorage.getItem('saas_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setTenantId(parsedUser.tenantId);
        setRole(parsedUser.role);
        setRawToken(savedToken);
        setTenantInfo({ name: parsedUser.tenantId, tenantId: parsedUser.tenantId });
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('saas_token');
        localStorage.removeItem('saas_user');
      }
    }
    setLoading(false);
  }, []);

  const setSession = (token, userData) => {
    localStorage.setItem('saas_token', token);
    localStorage.setItem('saas_user', JSON.stringify(userData));
    setUser(userData);
    setTenantId(userData.tenantId);
    setRole(userData.role);
    setRawToken(token);
    setTenantInfo({ name: userData.tenantId, tenantId: userData.tenantId });
  };

  const loginWithCredentials = async (tenantId, usernameOrEmail, password) => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          email: usernameOrEmail,
          username: usernameOrEmail,
          password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setSession(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_user');
    setUser(null);
    setTenantId(null);
    setRole(null);
    setRawToken(null);
    setTenantInfo(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      tenantId,
      role,
      claims: { tenantId, role },
      rawToken,
      tenantInfo,
      loading,
      loginWithCredentials,
      setSession,
      logout
    }}>
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
