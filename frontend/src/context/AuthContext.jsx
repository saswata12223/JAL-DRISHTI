import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // We are using /api/v1/auth as the prefix
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/v1/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        await checkAuth();
        return { success: true };
      }
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error occurred. Please try again.' };
    }
  };

  const register = async (fullName, email, password, confirmPassword) => {
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          full_name: fullName, 
          email, 
          password,
          confirm_password: confirmPassword
        })
      });
      
      if (response.ok) {
        return { success: true };
      }
      let errorMsg = 'Registration failed';
      try {
        const errorData = await response.json();
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail[0]?.msg || errorMsg;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        }
      } catch (e) {}
      return { success: false, error: errorMsg };
    } catch (error) {
      return { success: false, error: 'Network error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
