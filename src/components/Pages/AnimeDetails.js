import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EpisodeItem from '../EpisodeList/EpisodeItem';
import { fetchAPI, fixImagePath } from '../../utils/external/api';
import {
  updateEpisodeProgress,
  getEpisodeProgressPercentage,
  findLastWatchedEpisode,
  formatTimeMMSS,
  isEpisodeWatched
} from '../../utils/app/watchHistory';
import { useAuth } from '../../context/AuthContext';
import {
  findUserRate,
  addAnimeToList,
  updateUserRate,
  getStatusDisplayName,
  syncEpisodeProgress,
  deleteUserRate
} from '../../utils/external/shikimori/shikimoriRates';
import { getOrFindShikimoriId } from '../../utils/external/shikimori/shikimoriMapping';
import { toggleFavorite, isInFavorites } from '../../utils/app/favorites';
import './styles/animeDetails.css';

const AnimeDetails = ({ animeId, onWatchEpisode, onAnimeClick }) => {
  const [anime, setAnime] = useState(null);
  const [franchiseData, setFranchiseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [franchiseLoading, setFranchiseLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [lastWatchedInfo, setLastWatchedInfo] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Shikimori integration
  const { isAuthenticated, currentUser } = useAuth();
  const [shikimoriStatus, setShikimoriStatus] = useState(null);
  const [shikimoriStatusId, setShikimoriStatusId] = useState(null);
  const [syncingShikimori, setSyncingShikimori] = useState(false);
  const [shikimoriId, setShikimoriId] = useState(null);
  const [shikimoriAnimeInfo, setShikimoriAnimeInfo] = useState(null);
  const [shikimoriEpisodes, setShikimoriEpisodes] = useState({}); // Map for episodes watched on Shikimori
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [updatingRating, setUpdatingRating] = useState(false);

  const [settings, setSettings] = useState({
    syncHistory: false,
    publishActivity: false,
    showRatings: true,
    notifications: false
  });

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('enoughtv_shikimori_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      setLoading(true);
      try {
        const data = await fetchAPI(`/anime/releases/${animeId}`);
        if (data) {
          setAnime(data);

          if (data.episodes && data.episodes.length > 0) {
            setSelectedEpisode(data.episodes[0]);

            const watchInfo = findLastWatchedEpisode(animeId, data.episodes);
            console.log('Last watched info:', watchInfo);
            setLastWatchedInfo(watchInfo);
          }

          fetchFranchiseData(data.id);

          // Check if anime is in favorites
          setIsFavorite(isInFavorites(data.id));
        } else {
          setError('Аниме не найдено');
        }
      } catch (err) {
        console.error('Error fetching anime details:', err);
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    if (animeId) {
      fetchAnimeDetails();
    }
  }, [animeId]);

  useEffect(() => {
    const fetchShikimoriId = async () => {
      if (anime) {
        try {
          const id = await getOrFindShikimoriId(anime);
          setShikimoriId(id);

          if (id && isAuthenticated && currentUser) {
            // Fetch watched episodes data from Shikimori
            fetchShikimoriAnimeInfo(id);
          }
        } catch (error) {
          console.error('Failed to get Shikimori ID:', error);
        }
      }
    };

    fetchShikimoriId();
  }, [anime, isAuthenticated, currentUser]);

  useEffect(() => {
    const checkShikimoriStatus = async () => {
      if (isAuthenticated && currentUser && anime && shikimoriId) {
        try {
          const userRate = await findUserRate(currentUser.id, shikimoriId);
          if (userRate) {
            setShikimoriStatus(userRate.status);
            setShikimoriStatusId(userRate.id);
            setSelectedRating(userRate.score || 0);
          } else {
            setShikimoriStatus(null);
            setShikimoriStatusId(null);
            setSelectedRating(0);
          }
        } catch (error) {
          console.error('Failed to check Shikimori status:', error);
        }
      }
    };

    checkShikimoriStatus();
  }, [isAuthenticated, currentUser, anime, shikimoriId]);

  const fetchShikimoriAnimeInfo = async (animeId) => {
    if (!animeId || !isAuthenticated || !currentUser) return;

    try {
      // Fetch user's watched episodes for this anime
      const response = await fetch(`https://shikimori.one/api/v2/user_rates?user_id=${currentUser.id}&target_id=${animeId}&target_type=Anime`);

      if (!response.ok) {
        throw new Error(`Failed to fetch Shikimori user rates: ${response.status}`);
      }

      const userRates = await response.json();

      if (userRates && userRates.length > 0) {
        // Get anime details to check total episodes
        const animeResponse = await fetch(`https://shikimori.one/api/animes/${animeId}`);

        if (!animeResponse.ok) {
          throw new Error(`Failed to fetch Shikimori anime info: ${animeResponse.status}`);
        }

        const animeInfo = await animeResponse.json();
        setShikimoriAnimeInfo(animeInfo);

        // Get watched episodes
        const userRate = userRates[0];
        const watchedEpisodes = userRate.episodes || 0;

        // Create a map of watched episodes
        const episodesMap = {};
        for (let i = 1; i <= watchedEpisodes; i++) {
          episodesMap[i] = true;
        }

        setShikimoriEpisodes(episodesMap);
      }
    } catch (error) {
      console.error('Failed to fetch Shikimori anime info:', error);
    }
  };

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

  const handleShikimoriStatusChange = async (newStatus) => {
    if (!isAuthenticated || !currentUser || !anime || !shikimoriId) return;

    setSyncingShikimori(true);
    try {
      if (shikimoriStatusId) {
        await updateUserRate(shikimoriStatusId, { status: newStatus });
      } else {
        const result = await addAnimeToList(currentUser.id, shikimoriId, newStatus);
        setShikimoriStatusId(result.id);
      }
      setShikimoriStatus(newStatus);

      // Refresh episodes data
      await fetchShikimoriAnimeInfo(shikimoriId);
    } catch (error) {
      console.error('Failed to update Shikimori status:', error);
      alert('Не удалось обновить статус на Shikimori. Пожалуйста, попробуйте снова позже.');
    } finally {
      setSyncingShikimori(false);
    }
  };

  const handleRemoveFromShikimori = async () => {
    if (!isAuthenticated || !currentUser || !shikimoriStatusId) return;

    if (window.confirm('Вы уверены, что хотите удалить это аниме из вашего списка Shikimori?')) {
      setSyncingShikimori(true);
      try {
        await deleteUserRate(shikimoriStatusId);
        setShikimoriStatus(null);
        setShikimoriStatusId(null);
        setSelectedRating(0);
        setShikimoriEpisodes({});
        alert('Аниме успешно удалено из списка Shikimori');
      } catch (error) {
        console.error('Failed to remove anime from Shikimori:', error);
        alert('Не удалось удалить аниме из списка Shikimori. Пожалуйста, попробуйте снова позже.');
      } finally {
        setSyncingShikimori(false);
      }
    }
  };

  const handleRatingChange = async (rating) => {
    if (!isAuthenticated || !currentUser || !shikimoriId) return;

    setUpdatingRating(true);
    try {
      if (shikimoriStatusId) {
        await updateUserRate(shikimoriStatusId, { score: rating });
        setSelectedRating(rating);
      } else {
        // If not in list yet, add with default "watching" status
        const result = await addAnimeToList(currentUser.id, shikimoriId, 'watching');
        setShikimoriStatusId(result.id);
        setShikimoriStatus('watching');

        // Then update the rating
        await updateUserRate(result.id, { score: rating });
        setSelectedRating(rating);
      }

      setShowRatingPopup(false);
    } catch (error) {
      console.error('Failed to update rating:', error);
      alert('Не удалось обновить оценку на Shikimori. Пожалуйста, попробуйте снова позже.');
    } finally {
      setUpdatingRating(false);
    }
  };

  const handleToggleFavorite = () => {
    if (anime) {
      const result = toggleFavorite(anime);
      setIsFavorite(result);
    }
  };

  const handleWatchEpisode = (episode) => {
    let startTime = 0;

    if (lastWatchedInfo && lastWatchedInfo.episode.id === episode.id && !lastWatchedInfo.isNext) {
      startTime = lastWatchedInfo.time;
      console.log(`Resuming episode ${episode.ordinal} from saved time:`, startTime);
    } else {
      const progress = getEpisodeProgressPercentage(animeId, episode.id);
      if (progress > 1 && progress < 90 && episode.duration) {
        startTime = Math.floor((progress / 100) * episode.duration);
        console.log(`Calculated start time for episode ${episode.ordinal}:`, startTime);
      } else {
        console.log(`Starting episode ${episode.ordinal} from beginning`);
        startTime = 0;
      }
    }

    const episodeWithStartTime = {
      ...episode,
      startTime: startTime
    };

    setSelectedEpisode(episode);

    onWatchEpisode(episodeWithStartTime, anime.episodes);

    const syncWithShikimori = settings?.syncHistory;
    if (syncWithShikimori && isAuthenticated && currentUser && anime && shikimoriId) {
      try {
        const progress = getEpisodeProgressPercentage(animeId, episode.id);
        if (progress >= 90 || isEpisodeWatched(animeId, episode.id)) {
          syncEpisodeProgress(
            currentUser.id,
            shikimoriId,
            episode.ordinal,
            anime.episodes_total
          );

          // Update local state for Shikimori episodes
          setTimeout(async () => {
            await fetchShikimoriAnimeInfo(shikimoriId);
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to sync with Shikimori:', error);
      }
    }
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

  // Get score color based on rating value
  const getScoreColor = (score) => {
    const colors = [
      '#c13a3a', // 1
      '#d84939', // 2
      '#e35a37', // 3
      '#e97234', // 4
      '#ed8934', // 5
      '#e0a135', // 6
      '#c2b135', // 7
      '#98b344', // 8
      '#75b366', // 9
      '#4c8dc3'  // 10
    ];

    return score > 0 && score <= 10 ? colors[score - 1] : '#6c757d';
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

  const renderDescription = () => {
    if (!anime.description) {
      return <p>Описание отсутствует</p>;
    }

    return anime.description.split('\r\n').map((paragraph, idx) => (
      <p key={idx}>{paragraph}</p>
    ));
  };

  // Check if episode is watched on Shikimori based on ordinal
  const isEpisodeWatchedOnShikimori = (episodeOrdinal) => {
    return !!shikimoriEpisodes[episodeOrdinal];
  };

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
              <motion.div
                className="watch-buttons-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {lastWatchedInfo ? (
                  <motion.button
                    className="button primary-button watch-button resume-button"
                    onClick={() => handleWatchEpisode(lastWatchedInfo.episode)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="watch-button-icon">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="resume-info">
                      <span className="resume-text">
                        {lastWatchedInfo.isNext ? 'Начать следующий' : 'Продолжить просмотр'}
                      </span>
                      <span className="resume-details">
                        {lastWatchedInfo.isNext
                          ? `Эпизод ${lastWatchedInfo.episode.ordinal}`
                          : `Эпизод ${lastWatchedInfo.episode.ordinal} • ${formatTimeMMSS(lastWatchedInfo.time)}`}
                      </span>
                    </div>
                    {!lastWatchedInfo.isNext && lastWatchedInfo.progress > 0 && (
                      <div className="progress-indicator" style={{ width: `${lastWatchedInfo.progress}%` }}></div>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    className="button primary-button watch-button"
                    onClick={() => handleWatchEpisode(anime.episodes[0])}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                    </svg>
                    Смотреть
                  </motion.button>
                )}

                {lastWatchedInfo && !lastWatchedInfo.isNext && (
                  <motion.button
                    className="button secondary-button restart-button"
                    onClick={() => handleWatchEpisode(anime.episodes[0])}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M20 20V15H19.4185M4.06189 13C4.55399 16.9463 7.92038 20 12 20C15.3574 20 18.2317 17.9318 19.4185 15M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    С начала
                  </motion.button>
                )}

                <motion.button
                  className={`button secondary-button favorite-button ${isFavorite ? 'active' : ''}`}
                  onClick={handleToggleFavorite}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: isFavorite ? 'rgba(220, 38, 38, 0.8)' : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <svg viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {isFavorite ? 'В избранном' : 'Добавить в избранное'}
                </motion.button>

                {isAuthenticated && shikimoriId && (
                  <motion.button
                    className="button secondary-button"
                    onClick={() => setShowRatingPopup(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: selectedRating > 0 ? getScoreColor(selectedRating) : undefined
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {selectedRating > 0 ? `Моя оценка: ${selectedRating}` : 'Оценить'}
                  </motion.button>
                )}
              </motion.div>
            )}

            {isAuthenticated && shikimoriId && (
              <motion.div
                className="shikimori-status-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="shikimori-status-label">
                  <img
                    src="https://shikimori.one/favicons/favicon-16x16.png"
                    alt="Shikimori"
                    className="shikimori-icon"
                  />
                  Статус на Shikimori:
                </div>
                <div className="shikimori-status-buttons">
                  {['planned', 'watching', 'rewatching', 'completed', 'on_hold', 'dropped'].map((status) => (
                    <motion.button
                      key={status}
                      className={`shikimori-status-button ${shikimoriStatus === status ? 'active' : ''}`}
                      data-status={status}
                      onClick={() => handleShikimoriStatusChange(status)}
                      disabled={syncingShikimori}
                      whileTap={{ scale: 0.95 }}
                    >
                      {getStatusDisplayName(status)}
                    </motion.button>
                  ))}
                </div>

                {shikimoriStatus && (
                  <motion.button
                    className="button secondary-button"
                    onClick={handleRemoveFromShikimori}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      marginTop: '10px',
                      backgroundColor: 'rgba(193, 58, 58, 0.2)',
                      color: '#c13a3a',
                      borderColor: 'rgba(193, 58, 58, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px'
                    }}
                    disabled={syncingShikimori}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Удалить из списка
                  </motion.button>
                )}
              </motion.div>
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
                  {renderDescription()}
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
                    {shikimoriId && (
                      <li>
                        <span className="detail-label">Shikimori ID:</span>
                        <span className="detail-value">
                          <a href={`https://shikimori.one/animes/${shikimoriId}`} target="_blank" rel="noreferrer">
                            {shikimoriId}
                          </a>
                        </span>
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
                    <div key={episode.id} style={{ position: 'relative' }}>
                      {isEpisodeWatchedOnShikimori(episode.ordinal) && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(75, 106, 160, 0.9)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <img
                            src="https://shikimori.one/favicons/favicon-16x16.png"
                            alt="Shikimori"
                            style={{ width: '12px', height: '12px' }}
                          />
                          Просмотрен
                        </div>
                      )}
                      <EpisodeItem
                        episode={episode}
                        selectedEpisode={selectedEpisode}
                        onSelectEpisode={handleWatchEpisode}
                        index={index}
                        animeId={animeId}
                      />
                    </div>
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

      {/* Rating Popup */}
      {showRatingPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowRatingPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(30, 30, 40, 0.95)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '90%',
              width: '400px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <h3
              style={{
                textAlign: 'center',
                marginTop: 0,
                marginBottom: '20px',
                fontSize: '1.25rem',
                fontWeight: 600
              }}
            >
              Оценить аниме на Shikimori
            </h3>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}
            >
              {[...Array(10)].map((_, i) => (
                <motion.button
                  key={i + 1}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedRating === i + 1 ? getScoreColor(i + 1) : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => handleRatingChange(i + 1)}
                  disabled={updatingRating}
                >
                  {i + 1}
                </motion.button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '20px',
              }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer'
                }}
                onClick={() => setShowRatingPopup(false)}
              >
                Отмена
              </motion.button>

              {selectedRating > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(193, 58, 58, 0.8)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => handleRatingChange(0)}
                  disabled={updatingRating}
                >
                  {updatingRating ? (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: 'white',
                        animation: 'spin 1s linear infinite'
                      }}
                    />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Убрать оценку
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.main>
  );
};

export default AnimeDetails;