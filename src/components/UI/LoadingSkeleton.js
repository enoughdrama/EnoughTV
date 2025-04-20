import React from 'react';
import { motion } from 'framer-motion';

const LoadingSkeleton = ({ enhanced = false }) => {
  return (
    <motion.div 
      className={`skeleton-card ${enhanced ? 'enhanced' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="skeleton-image">
        {enhanced && (
          <div className="skeleton-badges">
            <div className="skeleton-badge"></div>
            <div className="skeleton-badge"></div>
          </div>
        )}
      </div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-meta"></div>
        {enhanced && (
          <div className="skeleton-footer">
            <div className="skeleton-action"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LoadingSkeleton;