import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PAGES } from '../../utils/external/api';
import { getRecentlyWatchedAnime } from '../../utils/app/watchHistory';
import { useAuth } from '../../context/AuthContext'

import './styles/header.css';

const Header = ({ currentPage, navigateTo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasContinueWatching, setHasContinueWatching] = useState(false);
  const searchInputRef = useRef(null);
  const headerRef = useRef(null);
  const { isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchExpanded(false);
    setSearchQuery('');
  }, [currentPage]);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    const watchHistory = getRecentlyWatchedAnime(1);
    setHasContinueWatching(watchHistory.length > 0);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo(PAGES.SEARCH, { initialQuery: searchQuery });
      setIsSearchExpanded(false);
    }
  };

  const navItems = [
    { id: PAGES.HOME, label: 'Главная', icon: 'home' },
    ...(hasContinueWatching ? [{ id: 'continue', label: 'Продолжить', icon: 'play', action: () => navigateTo(PAGES.HOME, { section: 'continue' }) }] : []),
    { id: PAGES.SCHEDULE, label: 'Расписание', icon: 'calendar' },
    { id: PAGES.FRANCHISES, label: 'Франшизы', icon: 'collection' },
    { id: PAGES.FAVORITES, label: 'Избранное', icon: 'star' },
    { id: PAGES.SEARCH, label: 'Поиск', icon: 'search', mobileOnly: false }
  ];

  const getIconSvg = (icon) => {
    const icons = {
      home: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      calendar: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      collection: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      star: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      search: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      menu: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      close: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      play: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      user: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    };
    
    return icons[icon] || null;
  };

  const headerVariants = {
    initial: {
      backgroundColor: 'rgba(0, 0, 0, 0)',
      boxShadow: '0 0 0 rgba(0, 0, 0, 0)'
    },
    scrolled: {
      backgroundColor: 'rgba(10, 10, 15, 0.95)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    }
  };

  const mobileMenuVariants = {
    closed: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    open: {
      height: 'auto',
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const mobileMenuItemVariants = {
    closed: { y: -20, opacity: 0 },
    open: { y: 0, opacity: 1 }
  };

  const searchVariants = {
    closed: {
      width: '40px',
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    open: {
      width: '260px',
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  return (
    <header className="header-container" ref={headerRef}>
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
                <path d="M4 8V4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16V20H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 4H20V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 20H20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 10L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15L12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="logo-text">EnoughTV</span>
          </motion.div>

          <nav className="header-nav">
            {navItems.filter(item => !item.mobileOnly).map((item) => (
              <motion.button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={item.action || (() => navigateTo(item.id))}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={item.label}
              >
                <span className="nav-icon">{getIconSvg(item.icon)}</span>
                <span className="nav-label">{item.label}</span>
                {currentPage === item.id && (
                  <motion.div
                    className="nav-item-indicator"
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          <div className="header-actions">
            <motion.button
              className="profile-button active"
              onClick={() => navigateTo(PAGES.PROFILE)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Профиль"
            >
              {isAuthenticated && currentUser ? (
                <div className="user-avatar">
                  <img
                    src={currentUser.avatar || "https://shikimori.one/favicons/favicon-32x32.png"}
                    alt={currentUser.nickname || "Профиль пользователя"}
                  />
                </div>
              ) : (
                <span className="profile-icon">{getIconSvg('user')}</span>
              )}
            </motion.button>

            <motion.button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isMobileMenuOpen}
            >
              {getIconSvg(isMobileMenuOpen ? 'close' : 'menu')}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            role="menu"
          >
            {[...navItems, { id: PAGES.PROFILE, label: 'Профиль', icon: 'user' }].map((item) => (
              <motion.button
                key={item.id}
                className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={item.action || (() => navigateTo(item.id))}
                variants={mobileMenuItemVariants}
                whileTap={{ scale: 0.95 }}
                role="menuitem"
                aria-label={item.label}
              >
                <span className="mobile-nav-icon">{getIconSvg(item.icon)}</span>
                <span className="mobile-nav-label">{item.label}</span>
                {currentPage === item.id && (
                  <motion.div className="mobile-nav-active-indicator" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;