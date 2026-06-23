// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import {
  authApi,
  setToken,
  clearToken,
  getToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
} from '../api';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Initialise user from token presence (basic hydration)
  const [user,            setUser]            = useState(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [pendingEmail,    setPendingEmail]    = useState(''); // email waiting for OTP
  const [authLoading,     setAuthLoading]     = useState(!!getToken() && !getStoredUser());

  useEffect(() => {
    if (!getToken()) {
      setAuthLoading(false);
      return;
    }

    let alive = true;
    authApi.me()
      .then(data => {
        if (!alive) return;
        if (data?.user) {
          setStoredUser(data.user);
          setUser(data.user);
          setIsAuthenticated(true);
        }
      })
      .catch((err) => {
        if (!alive) return;
        // Keep the local session during transient backend/cold-start failures.
        // Only explicit 401/403 responses should force a logout.
        if (err?.status === 401 || err?.status === 403) {
          clearToken();
          clearStoredUser();
          setUser(null);
          setIsAuthenticated(false);
          return;
        }
        setIsAuthenticated(!!getToken());
      })
      .finally(() => {
        if (alive) setAuthLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const login = (userData, token) => {
    setToken(token);
    setStoredUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearToken();
    clearStoredUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user, setUser,
      isAuthenticated,
      authLoading,
      pendingEmail, setPendingEmail,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
