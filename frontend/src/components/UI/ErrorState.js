import React from 'react';
import { motion } from 'framer-motion';

const ErrorState = ({ error, onRetry }) => (
  <div className="error-container">
    <div className="error-icon">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <p>{error}</p>
    <motion.button 
      className="button primary-button"
      onClick={onRetry}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Попробовать снова
    </motion.button>
  </div>
);

export default ErrorState;