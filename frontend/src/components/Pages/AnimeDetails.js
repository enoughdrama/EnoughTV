import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EpisodeItem from '../EpisodeList/EpisodeItem';
import { fetchAPI, fixImagePath } from '../../utils/api';
import { updateEpisodeProgress } from '../../utils/watchHistory';
import '../../styles/animeDetails.css';

const AnimeDetails = ({ animeId, onWatchEpisode, onAnimeClick }) => {
  const [anime, setAnime] = useState(null);
  const [franchiseData, setFranchiseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [franchiseLoading, setFranchiseLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      setLoading(true);
      try {
        const data = await fetchAPI(`/anime/releases/${animeId}`);
        if (data) {
          setAnime(data);
          if (data.episodes && data.episodes.length > 0) {
            setSelectedEpisode(data.episodes[0]);
          }

          fetchFranchiseData(data.id);
        } else {
          setError('Аниме не найдено');
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    if (animeId) {
      fetchAnimeDetails();
    }
  }, [animeId]);

  const fetchFranchiseData = async (releaseId) => {
    setFranchiseLoading(true);
    try {
      const data = await fetchAPI(`/anime/franchises/release/${releaseId}`);
      if (data && data.length > 0) {
        setFranchiseData(data);
      }
    } catch (err) {
      console.error('Failed to load franchise data:', err);
    } finally {
      setFranchiseLoading(false);
    }
  };

  const handleWatchEpisode = (episode) => {
    updateEpisodeProgress(animeId, episode.id, 1, false);
    setSelectedEpisode(episode);
    onWatchEpisode(episode, anime.episodes);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';

    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = '';
    if (days > 0) result += `${days} ${days === 1 ? 'день' : 'дней'} `;
    if (hours > 0) result += `${hours} ${hours === 1 ? 'час' : 'часов'} `;
    if (minutes > 0 && days === 0) result += `${minutes} ${minutes === 1 ? 'минута' : 'минут'}`;

    return result.trim();
  };

  if (loading) {
    return (
      <div className="anime-details-skeleton">
        <div className="poster-skeleton"></div>
        <div className="content-skeleton">
          <div className="title-skeleton"></div>
          <div className="meta-skeleton"></div>
          <div className="desc-skeleton"></div>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p>{error || 'Аниме не найдено'}</p>
        <motion.button
          className="button primary-button"
          onClick={() => window.history.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Назад
        </motion.button>
      </div>
    );
  }

  return (
    <motion.main
      className="main-container anime-details-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="anime-details-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundImage: `url(${fixImagePath(anime.poster?.src)})`
        }}
      >
        <div className="anime-details-header-content">
          <motion.div
            className="anime-poster"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <img
              src={fixImagePath(anime.poster?.optimized?.src || anime.poster?.src)}
              alt={anime.name.main}
            />

            {franchiseData && franchiseData.length > 0 && (
              <div className="anime-poster-badge">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 21L12 17L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Франшиза
              </div>
            )}
          </motion.div>
          <div className="anime-details-info">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {anime.name.main}
            </motion.h1>

            {anime.name.english && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {anime.name.english}
              </motion.h2>
            )}

            <motion.div
              className="anime-badges"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <span className="anime-badge">{anime.type.description}</span>
              <span className="anime-badge">{anime.year}</span>
              <span className="anime-badge">{anime.season.description}</span>
              {anime.is_ongoing && <span className="anime-badge highlight">Онгоинг</span>}
              {anime.age_rating && <span className="anime-badge age">{anime.age_rating.label}</span>}
            </motion.div>

            {anime.episodes && anime.episodes.length > 0 && (
              <motion.button
                className="button primary-button watch-button"
                onClick={() => handleWatchEpisode(anime.episodes[0])}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                </svg>
                Смотреть
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="content-container">
        <motion.div
          className="tabs-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="tabs">
            <motion.button
              className={`tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Информация
            </motion.button>
            <motion.button
              className={`tab ${activeTab === 'episodes' ? 'active' : ''}`}
              onClick={() => setActiveTab('episodes')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Эпизоды ({anime.episodes?.length || 0})
            </motion.button>
            {franchiseData && franchiseData.length > 0 && (
              <motion.button
                className={`tab ${activeTab === 'franchise' ? 'active' : ''}`}
                onClick={() => setActiveTab('franchise')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Франшиза
              </motion.button>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'info' ? (
            <motion.div
              className="tab-content"
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="anime-info">
                <div className="anime-description">
                  {anime.description.split('\r\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                <div className="info-section">
                  <h3>Детали</h3>
                  <ul className="detail-list">
                    <li>
                      <span className="detail-label">Тип:</span>
                      <span className="detail-value">{anime.type.description}</span>
                    </li>
                    <li>
                      <span className="detail-label">Год:</span>
                      <span className="detail-value">{anime.year}</span>
                    </li>
                    <li>
                      <span className="detail-label">Сезон:</span>
                      <span className="detail-value">{anime.season.description}</span>
                    </li>
                    {anime.episodes_total && (
                      <li>
                        <span className="detail-label">Эпизоды:</span>
                        <span className="detail-value">{anime.episodes_total}</span>
                      </li>
                    )}
                    {anime.average_duration_of_episode && (
                      <li>
                        <span className="detail-label">Длительность эпизода:</span>
                        <span className="detail-value">{anime.average_duration_of_episode} мин.</span>
                      </li>
                    )}
                    <li>
                      <span className="detail-label">Статус:</span>
                      <span className="detail-value">{anime.is_ongoing ? 'Онгоинг' : 'Завершён'}</span>
                    </li>
                    <li>
                      <span className="detail-label">Возрастной рейтинг:</span>
                      <span className="detail-value">{anime.age_rating.label}</span>
                    </li>
                    {anime.added_in_users_favorites && (
                      <li>
                        <span className="detail-label">В избранном у:</span>
                        <span className="detail-value">{anime.added_in_users_favorites.toLocaleString()} пользователей</span>
                      </li>
                    )}
                  </ul>
                </div>

                {anime.genres && anime.genres.length > 0 && (
                  <div className="info-section">
                    <h3>Жанры</h3>
                    <div className="genres-list">
                      {anime.genres.map(genre => (
                        <motion.span
                          key={genre.id}
                          className="genre"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {genre.name}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'episodes' ? (
            <motion.div
              className="tab-content"
              key="episodes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {anime.episodes && anime.episodes.length > 0 ? (
                <div className="episodes-list">
                  {anime.episodes.map((episode, index) => (
                    <EpisodeItem
                      key={episode.id}
                      episode={episode}
                      selectedEpisode={selectedEpisode}
                      onSelectEpisode={handleWatchEpisode}
                      index={index}
                      animeId={animeId}
                    />
                  ))}
                </div>
              ) : (
                <div className="episodes-empty-state">
                  <div className="episodes-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 7.5V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H15.5L21 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 11V16M12 8V8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p>Нет доступных эпизодов</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="tab-content"
              key="franchise"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {franchiseData && franchiseData.length > 0 ? (
                <div className="franchise-info">
                  {franchiseData.map(franchise => (
                    <div key={franchise.id} className="franchise-section">
                      <div className="franchise-header">
                        <div className="franchise-title-container">
                          <h3 className="franchise-title">{franchise.name}</h3>
                          {franchise.name_english && (
                            <div className="franchise-subtitle">{franchise.name_english}</div>
                          )}
                        </div>
                        <div className="franchise-stats">
                          <div className="franchise-stat">
                            <div className="franchise-stat-value">{franchise.rating ? franchise.rating.toFixed(1) : 'N/A'}</div>
                            <div className="franchise-stat-label">Рейтинг</div>
                          </div>
                          <div className="franchise-stat">
                            <div className="franchise-stat-value">{franchise.total_releases || 0}</div>
                            <div className="franchise-stat-label">Релизов</div>
                          </div>
                          <div className="franchise-stat">
                            <div className="franchise-stat-value">{franchise.total_episodes || 0}</div>
                            <div className="franchise-stat-label">Эпизодов</div>
                          </div>
                        </div>
                      </div>

                      <div className="franchise-meta">
                        <div className="franchise-years">
                          <span className="franchise-year">{franchise.first_year || 'N/A'}</span>
                          <span className="franchise-year-separator">-</span>
                          <span className="franchise-year">{franchise.last_year || 'N/A'}</span>
                        </div>

                        <div className="franchise-duration">
                          Общая продолжительность: {franchise.total_duration || formatDuration(franchise.total_duration_in_seconds)}
                        </div>
                      </div>

                      {franchise.franchise_releases && franchise.franchise_releases.length > 0 && (
                        <div className="franchise-releases">
                          <h4>Релизы франшизы</h4>
                          <div className="franchise-releases-grid">
                            {franchise.franchise_releases
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map(item => (
                                <motion.div
                                  key={item.id}
                                  className={`franchise-release-card ${item.release.id === anime.id ? 'current' : ''}`}
                                  onClick={() => {
                                    if (item.release.id !== anime.id && onAnimeClick) {
                                      onAnimeClick(item.release.id);
                                    }
                                  }}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="franchise-release-poster">
                                    <img
                                      src={fixImagePath(item.release.poster?.optimized?.src || item.release.poster?.src)}
                                      alt={item.release.name.main}
                                    />
                                    {item.release.id === anime.id && (
                                      <div className="current-badge">Текущий</div>
                                    )}
                                    <div className="franchise-release-sort-badge">#{item.sort_order}</div>
                                  </div>
                                  <div className="franchise-release-info">
                                    <div className="franchise-release-title">{item.release.name.main}</div>
                                    <div className="franchise-release-meta">
                                      <span>{item.release.year}</span>
                                      <span className="dot"></span>
                                      <span>{item.release.type.description}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : franchiseLoading ? (
                <div className="franchise-loading">
                  <div className="franchise-loading-spinner"></div>
                  <p>Загрузка информации о франшизе...</p>
                </div>
              ) : (
                <div className="franchise-empty-state">
                  <div className="franchise-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 7.5V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H15.5L21 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 11V16M12 8V8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p>Информация о франшизе не найдена</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main >
  );
};

export default AnimeDetails;