import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  getAuthData, 
  getCurrentUser, 
  fetchCurrentUser, 
  isAuthenticated as checkAuthentication,
  refreshToken
} from '../utils/external/shikimori/shikimoriAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuthentication());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const validateAuth = async () => {
      setIsLoading(true);
      
      try {
        if (checkAuthentication()) {
          const authData = getAuthData();
          const now = Date.now();
          const expiresAt = authData.created_at * 1000 + authData.expires_in * 1000;
          
          if (now >= expiresAt - 300000) {
            await refreshToken();
          }
          
          if (!currentUser) {
            const userData = await fetchCurrentUser();
            setCurrentUser(userData);
          }
          
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Authentication validation error:', err);
        setError('Failed to validate authentication');
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateAuth();
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};