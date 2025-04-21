import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { exchangeCodeForToken, fetchCurrentUser } from '../../utils/shikimoriAuth';
import { useAuth } from '../../context/AuthContext';
import '../../styles/profile.css';

const AuthCallback = ({ navigateTo, PAGES }) => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const { setCurrentUser, setIsAuthenticated } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code provided');
        }
        
        setStatus('exchanging');
        await exchangeCodeForToken(code);
        
        setStatus('fetching_user');
        const userData = await fetchCurrentUser();
        
        setCurrentUser(userData);
        setIsAuthenticated(true);
        
        setStatus('success');
        
        setTimeout(() => {
          navigateTo(PAGES.PROFILE);
        }, 2000);
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };
    
    handleAuth();
  }, [navigateTo, PAGES, setCurrentUser, setIsAuthenticated]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
      case 'exchanging':
      case 'fetching_user':
        return (
          <div className="auth-loading">
            <div className="auth-loading-spinner"></div>
            <h2>Авторизация через Shikimori...</h2>
            <p>Пожалуйста, подождите</p>
          </div>
        );
      
      case 'success':
        return (
          <div className="auth-callback">
            <motion.div
              className="success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <h2>Авторизация успешна!</h2>
            <p>Перенаправление в профиль...</p>
          </div>
        );
      
      case 'error':
        return (
          <div className="auth-callback">
            <motion.div
              className="error-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <h2>Ошибка авторизации</h2>
            <p>{error || 'Произошла неизвестная ошибка'}</p>
            <motion.button 
              className="button primary-button"
              onClick={() => navigateTo(PAGES.PROFILE)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Вернуться назад
            </motion.button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.main
      className="main-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="content-container">
        {renderContent()}
      </div>
    </motion.main>
  );
};

export default AuthCallback;