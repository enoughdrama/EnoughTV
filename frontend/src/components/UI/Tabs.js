import React from 'react';
import { motion } from 'framer-motion';

const Tabs = ({ tabs, activeTab, onChange }) => (
  <motion.div 
    className="tabs-container"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
  >
    <div className="tabs">
      {tabs.map((tab) => (
        <motion.button 
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`} 
          onClick={() => onChange(tab.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {tab.label}
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default Tabs;