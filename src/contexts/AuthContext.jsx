import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('fashionUser');
    const storedToken = localStorage.getItem('fashionToken');
    
    // Robust check for null or invalid strings
    const isValidToken = storedToken && storedToken !== 'null' && storedToken !== 'undefined';
    const isValidUser = storedUser && storedUser !== 'null' && storedUser !== 'undefined';
    
    if (isValidUser && isValidToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Auth initialization failed", e);
        localStorage.removeItem('fashionUser');
        localStorage.removeItem('fashionToken');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('fashionUser', JSON.stringify(userData));
    localStorage.setItem('fashionToken', tokenData);
    
    if (userData.role === 'admin' || userData.is_admin) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fashionUser');
    localStorage.removeItem('fashionToken');
    navigate('/login');
  };

  const refreshProfile = async () => {
    try {
      const response = await authService.getProfile();
      // Backend returns { user: { ... } } for the /profile route
      const userData = response.data.user || response.data;
      setUser(userData);
      localStorage.setItem('fashionUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
