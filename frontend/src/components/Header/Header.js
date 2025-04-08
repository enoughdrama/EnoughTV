import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PAGES } from '../../utils/api';

const Header = ({ currentPage, navigateTo }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: PAGES.HOME, label: 'Главная' },
    { id: PAGES.SCHEDULE, label: 'Расписание' },
    { id: PAGES.FRANCHISES, label: 'Франшизы' },
    { id: PAGES.SEARCH, label: 'Поиск' }
  ];

  const headerVariants = {
    initial: { backgroundColor: 'rgba(203, 98, 149, 1)' },
    scrolled: { 
      backgroundColor: 'rgba(20, 20, 20, 0.95)'
    }
  };

  return (
    <header className="header-container">
      <motion.div 
        className={`header-main ${isScrolled ? 'scrolled' : ''}`}
        variants={headerVariants}
        animate={isScrolled ? 'scrolled' : 'initial'}
        transition={{ duration: 0.3 }}
      >
        <div className="header-content">
          <motion.div 
            className="header-logo"
            onClick={() => navigateTo(PAGES.HOME)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8V4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 16V20H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 4H20V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 20H20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 10L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15L12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">EnoughTV</span>
          </motion.div>

          <nav className="header-nav">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => navigateTo(item.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="nav-label">{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>
    </header>
  );
};

export default Header;