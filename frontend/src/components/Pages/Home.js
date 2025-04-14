import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimeGrid from '../AnimeCard/AnimeGrid';
import { fetchAPI, fixImagePath, fetchRandomFranchises, PAGES } from '../../utils/api';
import '../../styles/genres.css';
import '../../styles/franchise.css';

const Home = ({ onAnimeClick, navigateTo }) => {
  const [latestAnime, setLatestAnime] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heroAnime, setHeroAnime] = useState(null);

  const [genres, setGenres] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreAnime, setGenreAnime] = useState([]);
  const [genrePage, setGenrePage] = useState(1);
  const [totalGenrePages, setTotalGenrePages] = useState(1);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [loadingGenreAnime, setLoadingGenreAnime] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);

  const [franchises, setFranchises] = useState([]);
  const [loadingFranchises, setLoadingFranchises] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const latest = await fetchAPI('/anime/releases/latest?limit=15');
        if (latest && latest.length > 0) {
          setLatestAnime(latest);

          const sorted = [...latest].sort((a, b) =>
            b.added_in_users_favorites - a.added_in_users_favorites
          ).slice(0, 10);
          setPopularAnime(sorted);

          setHeroAnime(latest[0]);
        }

        const randomFranchises = await fetchRandomFranchises(4);
        if (randomFranchises) {
          setFranchises(randomFranchises);
        }
        setLoadingFranchises(false);
      } catch (err) {
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true);
      try {
        const allGenresData = await fetchAPI('/anime/genres');
        if (allGenresData && allGenresData.length > 0) {
          const sortedGenres = [...allGenresData].sort((a, b) =>
            b.total_releases - a.total_releases
          );
          setAllGenres(sortedGenres);

          setGenres(sortedGenres.slice(0, showAllGenres ? sortedGenres.length : 10));
        }
      } catch (err) {
        console.error("Failed to load genres:", err);
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, [showAllGenres]);

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

  const handleGenreSelect = (genre) => {
    if (selectedGenre?.id === genre.id) {
      setSelectedGenre(null);
      setGenreAnime([]);
    } else {
      setSelectedGenre(genre);
      setGenrePage(1);
      fetchAnimeByGenre(genre.id, 1);
    }
  };

  const handleGenrePagination = (newPage) => {
    if (newPage < 1 || newPage > totalGenrePages) return;
    setGenrePage(newPage);
    fetchAnimeByGenre(selectedGenre.id, newPage);
  };

  const toggleAllGenres = () => {
    setShowAllGenres(!showAllGenres);
  };

  const goToFranchises = () => {
    if (navigateTo) {
      navigateTo(PAGES.FRANCHISES);
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
      {heroAnime && !loading ? (
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="hero-background" style={{
            backgroundImage: `url(${fixImagePath(heroAnime.poster?.src)})`
          }}></div>
          <div className="hero-content">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {heroAnime.name.main}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {heroAnime.description.split('\r\n')[0].slice(0, 120)}...
            </motion.p>
            <motion.button
              className="button primary-button hero-button"
              onClick={() => onAnimeClick(heroAnime.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
              </svg>
              Смотреть
            </motion.button>
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

      <div className="content-container">
        {/* Featured Franchises */}
        {franchises.length > 0 && (
          <section className="section">
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
                onClick={goToFranchises}
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

            <div className="featured-franchises">
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
                      className="featured-franchise-card"
                      onClick={() => {
                        if (navigateTo) {
                          navigateTo(PAGES.FRANCHISES);
                        }
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ y: -10, transition: { duration: 0.2 } }}
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
        <section className="section">
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
            <div className="genres-container">
              <div className="genres-list">
                {genres.map((genre, index) => (
                  <motion.div
                    key={genre.id}
                    className={`genre-card ${selectedGenre?.id === genre.id ? 'active' : ''}`}
                    onClick={() => handleGenreSelect(genre)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="genre-image">
                      <img
                        src={fixImagePath(genre.image?.optimized?.preview)}
                        alt={genre.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="genre-name">{genre.name}</div>
                    <div className="genre-count">{genre.total_releases} релизов</div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className="see-all-genres"
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
            <div className="genre-anime-container">
              <motion.h3
                className="genre-anime-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {selectedGenre.name} <span className="genre-anime-count">({selectedGenre.total_releases})</span>
              </motion.h3>

              {loadingGenreAnime ? (
                <div className="anime-grid">
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
                  <AnimeGrid
                    animeList={genreAnime}
                    onAnimeClick={onAnimeClick}
                    emptyMessage={`Нет релизов в категории «${selectedGenre.name}»`}
                  />

                  {/* Pagination */}
                  {totalGenrePages > 1 && (
                    <div className="pagination">
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

        <AnimeGrid
          animeList={latestAnime}
          title="Последние релизы"
          onAnimeClick={onAnimeClick}
          loading={loading}
        />

        <AnimeGrid
          animeList={popularAnime}
          title="Популярное"
          onAnimeClick={onAnimeClick}
          loading={loading}
        />
      </div>
    </motion.main>
  );
};

export default Home;