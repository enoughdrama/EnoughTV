import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon, message, hint }) => (
  <motion.div
    className="empty-state"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="empty-state-icon">
      {icon || (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 7.5V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H15.5L21 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11V16M12 8V8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
    <p>{message || "Ничего не найдено"}</p>
    {hint && <p className="empty-state-hint">{hint}</p>}
  </motion.div>
);

export default EmptyState;
