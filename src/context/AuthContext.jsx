// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { setToken, clearToken, getToken } from '../api';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Initialise user from token presence (basic hydration)
  const [user,            setUser]            = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [pendingEmail,    setPendingEmail]    = useState(''); // email waiting for OTP

  const login = (userData, token) => {
    setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user, setUser,
      isAuthenticated,
      pendingEmail, setPendingEmail,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
