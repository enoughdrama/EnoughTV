import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimeGrid from '../AnimeCard/AnimeGrid';
import AnimeCard from '../AnimeCard/AnimeCard';
import { fetchAPI, fixImagePath, fetchRandomFranchises, PAGES } from '../../utils/api';
import { getRecentlyWatchedAnime, formatRelativeTime } from '../../utils/watchHistory';
import '../../styles/genres.css';
import '../../styles/franchise.css';
import '../../styles/home.css';
import '../../styles/animeCard.css';

const Home = ({ onAnimeClick, navigateTo }) => {
  // Data states
  const [latestAnime, setLatestAnime] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [comingSoonAnime, setComingSoonAnime] = useState([]);
  const [continueWatchingAnime, setContinueWatchingAnime] = useState([]);
  const [heroAnimeList, setHeroAnimeList] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [franchises, setFranchises] = useState([]);
  const [genres, setGenres] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreAnime, setGenreAnime] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewAnime, setPreviewAnime] = useState(null);
  const [genrePage, setGenrePage] = useState(1);
  const [totalGenrePages, setTotalGenrePages] = useState(1);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [loadingGenreAnime, setLoadingGenreAnime] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [loadingFranchises, setLoadingFranchises] = useState(true);
  
  // Refs
  const heroIntervalRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const genreScrollRef = useRef(null);
  const sectionsRef = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch latest anime
        const latest = await fetchAPI('/anime/releases/latest?limit=20');
        if (latest && latest.length > 0) {
          setLatestAnime(latest);
  
          // Set hero anime from top 5 latest
          setHeroAnimeList(latest.slice(0, 5));
  
          // Sort by popularity for popular section
          const sorted = [...latest].sort((a, b) =>
            b.added_in_users_favorites - a.added_in_users_favorites
          ).slice(0, 10);
          setPopularAnime(sorted);
  
          // Use slice for trending section
          setTrendingAnime(latest.slice(5, 15));
  
          // Use slice for coming soon
          setComingSoonAnime(latest.slice(10, 16));
        }
        
        // Fetch franchises
        const randomFranchises = await fetchRandomFranchises(4);
        if (randomFranchises) {
          setFranchises(randomFranchises);
        }
        setLoadingFranchises(false);
  
        // Get continue watching from localStorage with full anime details
        const watchHistory = await getRecentlyWatchedAnime(6);
        setContinueWatchingAnime(watchHistory);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true);
      try {
        // Fetch all genres
        const allGenresData = await fetchAPI('/anime/genres');
        if (allGenresData && allGenresData.length > 0) {
          // Sort genres by total releases
          const sortedGenres = [...allGenresData].sort((a, b) =>
            b.total_releases - a.total_releases
          );
          setAllGenres(sortedGenres);

          // Show only the top genres initially
          setGenres(sortedGenres.slice(0, showAllGenres ? sortedGenres.length : 12));
        }
      } catch (err) {
        console.error("Failed to load genres:", err);
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, [showAllGenres]);

  // Hero section auto-rotation
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

  // Clear preview timeout on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  // Function to fetch anime by genre
  const fetchAnimeByGenre = async (genreId, page = 1) => {
    if (!genreId) return;

    setLoadingGenreAnime(true);
    try {
      const data = await fetchAPI(`/anime/genres/${genreId}/releases?page=${page}&limit=10`);
      if (data && data.data) {
        setGenreAnime(data.data);
        setTotalGenrePages(data.meta?.pagination?.total_pages || 1);
      }
    } catch (err) {
      console.error("Failed to load anime by genre:", err);
    } finally {
      setLoadingGenreAnime(false);
    }
  };

  // Handle genre selection
  const handleGenreSelect = (genre) => {
    if (selectedGenre?.id === genre.id) {
      setSelectedGenre(null);
      setGenreAnime([]);
    } else {
      setSelectedGenre(genre);
      setGenrePage(1);
      fetchAnimeByGenre(genre.id, 1);

      // Scroll to genre results if not in view
      setTimeout(() => {
        if (genreScrollRef.current) {
          genreScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  };

  // Handle genre pagination
  const handleGenrePagination = (newPage) => {
    if (newPage < 1 || newPage > totalGenrePages) return;
    setGenrePage(newPage);
    fetchAnimeByGenre(selectedGenre.id, newPage);
  };

  // Toggle all genres display
  const toggleAllGenres = () => {
    setShowAllGenres(!showAllGenres);
  };

  // Navigate to franchises page with selected franchise
  const navigateToFranchises = (franchiseId) => {
    if (navigateTo) {
      navigateTo(PAGES.FRANCHISES, { selectedFranchiseId: franchiseId });
    }
  };

  // Handle preview hover for anime card
  const handlePreviewHover = (anime) => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      setPreviewAnime(anime);
      setShowPreview(true);
    }, 800); // Show preview after 800ms hover
  };

  // Handle preview leave for anime card
  const handlePreviewLeave = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 300); // Hide preview after 300ms
  };

  // Change active section (for navigation)
  const handleSectionChange = (section) => {
    setActiveSection(section);
    
    // Scroll to that section
    if (sectionsRef.current[section]) {
      sectionsRef.current[section].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Navigate to hero anime details
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
            transition={{ duration: 0.7 }}
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
                  whileHover={{ scale: 1.05 }}
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        {/* Continue Watching Section - Only show if items exist */}
        {continueWatchingAnime.length > 0 && (
          <section 
            className="section continue-watching-section" 
            ref={el => sectionsRef.current['continue'] = el}
          >
            <div className="section-header-with-action">
              <motion.h2
                className="section-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                Продолжить просмотр
              </motion.h2>
              
              <motion.button
                className="section-action-button"
                onClick={() => navigateTo(PAGES.HISTORY)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
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
                    </div>
                  </div>
                  <div className="continue-watching-title">
                    {item.name?.main || item.id}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Trending Section (Carousel) */}
        <section 
          className="section trending-section" 
          ref={el => sectionsRef.current['trending'] = el}
        >
          <div className="section-header-with-action">
            <motion.h2
              className="section-title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
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
                    onClick={() => onAnimeClick(anime.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ 
                      y: -15, 
                      scale: 1.05, 
                      transition: { duration: 0.2 } 
                    }}
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
        </section>

        {/* Featured Franchises */}
        {franchises.length > 0 && (
          <section 
            className="section" 
            ref={el => sectionsRef.current['franchises'] = el}
          >
            <div className="section-header-with-action">
              <motion.h2
                className="section-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                Популярные франшизы
              </motion.h2>
              
              <motion.button
                className="section-action-button"
                onClick={() => navigateToFranchises()}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Все франшизы
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </div>
            
            <div className="featured-franchises franchises">
              {loadingFranchises ? (
                <>
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="franchise-card-skeleton">
                      <div className="franchise-card-image-skeleton"></div>
                      <div className="franchise-card-content-skeleton">
                        <div className="franchise-card-title-skeleton"></div>
                        <div className="franchise-card-meta-skeleton"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {franchises.map((franchise, index) => (
                    <motion.div
                      key={franchise.id}
                      className="featured-franchise-card franchise-card"
                      onClick={() => navigateToFranchises(franchise.id)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <div className="featured-franchise-image">
                        <img
                          src={fixImagePath(franchise.image?.optimized?.preview || franchise.image?.preview)}
                          alt={franchise.name}
                          loading="lazy"
                        />
                        <div className="featured-franchise-overlay">
                          <div className="featured-franchise-info">
                            <div className="featured-franchise-stat">
                              <span className="featured-franchise-stat-value">{franchise.total_releases}</span>
                              <span className="featured-franchise-stat-label">релизов</span>
                            </div>
                            <div className="featured-franchise-stat">
                              <span className="featured-franchise-stat-value">{franchise.total_episodes}</span>
                              <span className="featured-franchise-stat-label">эпизодов</span>
                            </div>
                          </div>
                        </div>
                        <div className="featured-franchise-badge">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 21L12 17L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Франшиза
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
                </>
              )}
            </div>
          </section>
        )}

        {/* Genres Section */}
        <section 
          className="section" 
          ref={el => sectionsRef.current['genres'] = el}
        >
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Жанры
          </motion.h2>

          {loadingGenres ? (
            <div className="genres-loading-skeleton">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="genre-skeleton-item">
                  <div className="genre-skeleton-image"></div>
                  <div className="genre-skeleton-name"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="genres-container genres">
              <div className="genres-list genres-list">
                {genres.map((genre, index) => (
                  <motion.div
                    key={genre.id}
                    className={`genre-card genre-card ${selectedGenre?.id === genre.id ? 'active' : ''}`}
                    onClick={() => handleGenreSelect(genre)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="genre-image">
                      <img
                        src={fixImagePath(genre.image?.optimized?.preview) || '/api/placeholder/160/100'}
                        alt={genre.name}
                        loading="lazy"
                      />
                      <div className="genre-overlay"></div>
                    </div>
                    <div className="genre-name">{genre.name}</div>
                    <div className="genre-count">{genre.total_releases} релизов</div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className="see-all-genres see-all"
                onClick={toggleAllGenres}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {showAllGenres ? 'Скрыть' : 'Показать все жанры'}
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {showAllGenres ? (
                    <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M5 15l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </motion.button>
            </div>
          )}

          {/* Anime by selected genre */}
          {selectedGenre && (
            <div className="genre-anime-container" ref={genreScrollRef}>
              <motion.h3
                className="genre-anime-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {selectedGenre.name} <span className="genre-anime-count">({selectedGenre.total_releases})</span>
              </motion.h3>

              {loadingGenreAnime ? (
                <div className="anime-grid grid">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-image"></div>
                      <div className="skeleton-content">
                        <div className="skeleton-title"></div>
                        <div className="skeleton-meta"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="anime-grid grid">
                    {genreAnime.map((anime, index) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        onClick={onAnimeClick}
                        index={index}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalGenrePages > 1 && (
                    <div className="pagination pagination">
                      <motion.button
                        className="pagination-button"
                        onClick={() => handleGenrePagination(genrePage - 1)}
                        disabled={genrePage === 1}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.button>

                      <span className="pagination-info">
                        Страница {genrePage} из {totalGenrePages}
                      </span>

                      <motion.button
                        className="pagination-button"
                        onClick={() => handleGenrePagination(genrePage + 1)}
                        disabled={genrePage === totalGenrePages}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </motion.main>
  );
};

export default Home;