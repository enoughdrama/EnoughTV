import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAPI, fixImagePath, fetchRandomFranchises, PAGES } from '../../utils/external/api';
import { getRecentlyWatchedAnime, formatRelativeTime } from '../../utils/app/watchHistory';

import './styles/extra/genres.css';
import './styles/franchise.css';
import './styles/home.css';

const Home = ({ onAnimeClick, navigateTo }) => {
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [continueWatchingAnime, setContinueWatchingAnime] = useState([]);
  const [heroAnimeList, setHeroAnimeList] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [franchises, setFranchises] = useState([]);
  const [previewAnime, setPreviewAnime] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const heroIntervalRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const sectionsRef = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [latestData, randomFranchises, watchHistory] = await Promise.allSettled([
          fetchAPI('/anime/releases/latest?limit=30'),
          fetchRandomFranchises(4),
          getRecentlyWatchedAnime(6)
        ]);

        if (latestData.status === 'fulfilled' && latestData.value?.length > 0) {
          setHeroAnimeList(latestData.value.slice(0, 5));
          setTrendingAnime(latestData.value.slice(0, 30));
        }

        if (randomFranchises.status === 'fulfilled' && randomFranchises.value) {
          setFranchises(randomFranchises.value);
        }

        if (watchHistory.status === 'fulfilled') {
          setContinueWatchingAnime(watchHistory.value);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (heroAnimeList.length > 1) {
      heroIntervalRef.current = setInterval(() => {
        setCurrentHeroIndex((prevIndex) =>
          prevIndex === heroAnimeList.length - 1 ? 0 : prevIndex + 1
        );
      }, 8000);
    }

    return () => {
      if (heroIntervalRef.current) {
        clearInterval(heroIntervalRef.current);
      }
    };
  }, [heroAnimeList]);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  const navigateToFranchises = (franchiseId) => {
    if (navigateTo) {
      navigateTo(PAGES.FRANCHISES, { selectedFranchiseId: franchiseId });
    }
  };

  const handlePreviewHover = (anime) => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = setTimeout(() => {
      setPreviewAnime(anime);
    }, 600);
  };

  const handlePreviewLeave = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = setTimeout(() => {
      setPreviewAnime(null);
    }, 300);
  };

  const goToHeroAnime = () => {
    if (heroAnimeList.length > 0 && heroAnimeList[currentHeroIndex]) {
      onAnimeClick(heroAnimeList[currentHeroIndex].id);
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p>{error}</p>
        <motion.button
          className="button primary-button"
          onClick={() => window.location.reload()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Попробовать снова
        </motion.button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.main
      className="main-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced Hero Section */}
      <AnimatePresence mode="wait">
        {!loading && heroAnimeList.length > 0 ? (
          <motion.div
            key={`hero-${currentHeroIndex}`}
            className="hero-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              backgroundImage: `url(${fixImagePath(heroAnimeList[currentHeroIndex]?.poster?.src)})`
            }}
          >
            <div className="hero-background-overlay"></div>
            <div className="hero-content">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hero-title"
              >
                {heroAnimeList[currentHeroIndex]?.name.main}
              </motion.h1>
              <motion.div
                className="hero-badges"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <span className="hero-badge">{heroAnimeList[currentHeroIndex]?.type.description}</span>
                <span className="hero-badge">{heroAnimeList[currentHeroIndex]?.year}</span>
                {heroAnimeList[currentHeroIndex]?.is_ongoing &&
                  <span className="hero-badge ongoing">Онгоинг</span>
                }
                {heroAnimeList[currentHeroIndex]?.rating &&
                  <span className="hero-badge rating">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {heroAnimeList[currentHeroIndex]?.rating.toFixed(1)}
                  </span>
                }
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="hero-description"
              >
                {heroAnimeList[currentHeroIndex]?.description?.split('\r\n')[0]?.slice(0, 180)}...
              </motion.p>
              <motion.div
                className="hero-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <motion.button
                  className="button primary-button hero-button"
                  onClick={goToHeroAnime}
                  whileHover={{ boxShadow: "0 8px 30px rgba(99, 102, 241, 0.6)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                  </svg>
                  Смотреть
                </motion.button>
                <motion.button
                  className="button secondary-button hero-button info-button"
                  onClick={goToHeroAnime}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Подробнее
                </motion.button>
              </motion.div>
            </div>

            {/* Hero Carousel Navigation */}
            <div className="hero-carousel-nav">
              {heroAnimeList.map((_, index) => (
                <motion.button
                  key={index}
                  className={`hero-nav-dot ${index === currentHeroIndex ? 'active' : ''}`}
                  onClick={() => setCurrentHeroIndex(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                ></motion.button>
              ))}
            </div>
          </motion.div>
        ) : loading ? (
          <div className="hero-section-skeleton">
            <div className="hero-content-skeleton">
              <div className="hero-title-skeleton"></div>
              <div className="hero-desc-skeleton"></div>
              <div className="hero-button-skeleton"></div>
            </div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="content-container">
        <div className="home-content-split">
          <div className="home-content-main">
            {/* Continue Watching Section - Only show if items exist */}
            {continueWatchingAnime.length > 0 && (
              <motion.section
                className="section continue-watching-section"
                ref={el => sectionsRef.current['continue'] = el}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="section-header-with-action">
                  <motion.h2
                    className="section-title"
                    variants={itemVariants}
                  >
                    Продолжить просмотр
                  </motion.h2>

                  <motion.button
                    className="section-action-button"
                    onClick={() => navigateTo(PAGES.HISTORY)}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    История просмотров
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.button>
                </div>

                <div className="continue-watching-grid">
                  {continueWatchingAnime.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="continue-watching-card"
                      onClick={() => onAnimeClick(item.id)}
                      onMouseEnter={() => handlePreviewHover(item)}
                      onMouseLeave={handlePreviewLeave}
                      variants={itemVariants}
                      whileHover={{ y: -10, transition: { duration: 0.2 } }}
                    >
                      <div className="continue-watching-image">
                        <img
                          src={fixImagePath(item.poster?.optimized?.src || item.poster?.src)}
                          alt={item.name?.main || "Anime poster"}
                          loading="lazy"
                        />
                        <div className="continue-watching-overlay">
                          <div className="continue-watching-progress">
                            <div
                              className="continue-watching-progress-bar"
                              style={{ width: `${item.episodes?.[item.lastEpisode]?.progress || 0}%` }}
                            ></div>
                          </div>
                          <div className="continue-watching-play">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                            </svg>
                          </div>
                        </div>

                        <div className="continue-watching-info">
                          <span className="continue-watching-time">{formatRelativeTime(item.lastWatched)}</span>
                          <span className="continue-watching-ep">Эп. {item.lastEpisode}</span>
                        </div>
                      </div>
                      <div className="continue-watching-title">
                        {item.name?.main || item.id}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Trending Section */}
            <motion.section
              className="section trending-section"
              ref={el => sectionsRef.current['trending'] = el}
              variants={containerVariants}
              initial="visible"
              animate="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="section-header-with-action">
                <motion.h2
                  className="section-title"
                  variants={itemVariants}
                >
                  Популярно сейчас
                </motion.h2>
              </div>

              <div className="trending-carousel">
                {loading ? (
                  <div className="trending-carousel-skeleton">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="trending-skeleton-item">
                        <div className="trending-skeleton-image"></div>
                        <div className="trending-skeleton-title"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="trending-carousel-items">
                    {trendingAnime.map((anime, index) => (
                      <motion.div
                        key={anime.id}
                        className="trending-carousel-item"
                        onMouseEnter={() => handlePreviewHover(anime)}
                        onMouseLeave={handlePreviewLeave}
                        onClick={() => onAnimeClick(
                          anime.id,
                          anime.name?.main || 'Аниме'
                        )}
                        variants={itemVariants}
                      >
                        <div className="trending-item-rank">{index + 1}</div>
                        <div className="trending-item-image">
                          <img
                            src={fixImagePath(anime.poster?.optimized?.src || anime.poster?.src)}
                            alt={anime.name.main}
                            loading="lazy"
                          />
                          <div className="trending-item-overlay">
                            <div className="trending-item-play">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="trending-item-info">
                          <div className="trending-item-title">{anime.name.main}</div>
                          <div className="trending-item-meta">
                            {anime.year} • {anime.type.description}
                            <div className="trending-item-rating">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {anime.rating?.toFixed(1) || '??'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          <div className="home-content-side">
            <div className="sidebar-franchises">
              <h3 className="sidebar-title">Популярные франшизы</h3>
              <div className="sidebar-franchises-list">
                {franchises.slice(0, 2).map((franchise, i) => (
                  <motion.div
                    key={franchise.id}
                    className="featured-franchise-card"
                    onClick={() => navigateToFranchises(franchise.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <div className="featured-franchise-image">
                      <img
                        src={fixImagePath(franchise.image?.optimized?.preview || franchise.image?.preview)}
                        alt={franchise.name}
                        loading="lazy"
                      />
                      <div className="featured-franchise-badge">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 21L12 17L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    <div className="featured-franchise-content">
                      <h3 className="featured-franchise-title">{franchise.name}</h3>
                      <div className="featured-franchise-meta">
                        <div className="featured-franchise-years">
                          <span>{franchise.first_year}</span>
                          <span className="dot"></span>
                          <span>{franchise.last_year}</span>
                        </div>
                        <div className="featured-franchise-rating">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {franchise.rating?.toFixed(1) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anime Preview Popup */}
      <AnimatePresence>
        {previewAnime && (
          <motion.div
            className="anime-preview-popup"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            onMouseEnter={() => handlePreviewHover(previewAnime)}
            onMouseLeave={handlePreviewLeave}
          >
            <div className="preview-image">
              <img
                src={fixImagePath(previewAnime.poster?.optimized?.src || previewAnime.poster?.src)}
                alt={previewAnime.name?.main}
              />
              <div className="preview-overlay">
                <div className="preview-play-button">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="preview-content">
              <h3 className="preview-title">{previewAnime.name?.main}</h3>
              <div className="preview-badges">
                <span className="preview-badge">{previewAnime.type?.description}</span>
                <span className="preview-badge">{previewAnime.year}</span>
                {previewAnime.is_ongoing && (
                  <span className="preview-badge ongoing">Онгоинг</span>
                )}
                {previewAnime.rating && (
                  <span className="preview-badge rating">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {previewAnime.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="preview-description">
                {previewAnime.description?.split('\r\n')[0]?.slice(0, 120)}...
              </p>
              <div className="preview-actions">
                <div className="preview-button primary" onClick={() => onAnimeClick(previewAnime.id)}>
                  Смотреть
                </div>
                <div className="preview-button secondary" onClick={() => onAnimeClick(previewAnime.id)}>
                  Подробнее
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
};

export default Home;