import React from 'react';
import { motion } from 'framer-motion';

const PageHeader = ({ title, subtitle }) => (
  <motion.div 
    className="page-header"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
  </motion.div>
);

export default PageHeader;