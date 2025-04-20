import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimeGrid from '../AnimeCard/AnimeGrid';
import { fetchAPI } from '../../utils/api';

const Search = ({ onAnimeClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    try {
      const data = await fetchAPI(`/app/search/releases?query=${encodeURIComponent(query)}`);
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const focusVariants = {
    focused: {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.9), 0 4px 6px -2px rgba(0, 0, 0, 0.9), 0 0 0 3px rgba(99, 102, 241, 0.3)',
      transition: { duration: 0.2 }
    },
    unfocused: {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.9), 0 2px 4px -1px rgba(0, 0, 0, 0.9)',
      transition: { duration: 0.2 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.main 
      className="main-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="content-container">
        <motion.div 
          className="search-page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Поиск аниме</h1>
          <p>Найдите любимое аниме по названию</p>
        </motion.div>
        
        <motion.form 
          onSubmit={handleSearch} 
          className="search-form"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="search-input-container"
            variants={itemVariants}
          >
            <motion.div 
              className="search-input-wrapper"
              variants={focusVariants}
              animate={isFocused ? "focused" : "unfocused"}
            >
              <div className="search-icon">
                <motion.svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ scale: 1 }}
                  animate={{ scale: isSearching ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: isSearching ? Infinity : 0, duration: 1 }}
                >
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Введите название аниме..."
                className="search-input"
              />
              <AnimatePresence>
                {query && (
                  <motion.button 
                    type="button" 
                    className="clear-input" 
                    onClick={() => {
                      setQuery('');
                      searchInputRef.current.focus();
                    }}
                    aria-label="Очистить поиск"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
          <motion.button 
            type="submit" 
            className="button primary-button search-button" 
            disabled={isSearching || !query.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={itemVariants}
          >
            {isSearching ? (
              <span className="search-spinner"></span>
            ) : (
              'Найти'
            )}
          </motion.button>
        </motion.form>
        
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div 
              className="search-results-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="loading"
            >
              <div className="search-status">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Ищем аниме по запросу <span className="search-query">"{query}"</span>
                </motion.p>
              </div>
              <div className="anime-grid skeleton-grid">
                {[...Array(8)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="skeleton-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-meta"></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {results.length > 0 ? (
                <motion.div
                  className="search-results-container"
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="search-status">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Найдено <span className="results-count">{results.length}</span> результатов по запросу <span className="search-query">"{query}"</span>
                    </motion.p>
                  </div>
                  <AnimeGrid animeList={results} onAnimeClick={onAnimeClick} />
                </motion.div>
              ) : (
                hasSearched && (
                  <motion.div 
                    className="empty-state search-empty-state"
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div 
                      className="empty-state-icon"
                      whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                    <h2>По запросу "{query}" ничего не найдено</h2>
                    <p className="empty-state-hint">Попробуйте изменить запрос или поискать другое аниме</p>
                    <motion.button 
                      className="button secondary-button retry-button"
                      onClick={() => {
                        setQuery('');
                        searchInputRef.current.focus();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Новый поиск
                    </motion.button>
                  </motion.div>
                )
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
};

export default Search;