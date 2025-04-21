import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { fetchUserInfo, logout, fetchCurrentUser } from '../../utils/shikimoriAuth';
import { getUserAnimeRates, getStatusDisplayName } from '../../utils/shikimoriRates';
import Login from '../Auth/Login';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { fetchAPI } from '../../utils/api';

const formatDate = (dateString) => {
  if (!dateString) return 'Неизвестно';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Неизвестно';

    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Неизвестно';
  }
};

const getSafeStats = (userDetails) => {
  const defaultStats = {
    completed: 0,
    planned: 0,
    watching: 0,
    on_hold: 0,
    dropped: 0,
    rewatching: 0
  };

  if (!userDetails) return defaultStats;
  if (!userDetails.stats) return defaultStats;
  if (!userDetails.stats.full_statuses) return defaultStats;
  if (!userDetails.stats.full_statuses.anime) return defaultStats;

  const animeStats = userDetails.stats.full_statuses.anime;

  return {
    completed: animeStats.find(stat => stat.name === "completed")?.size || 0,
    planned: animeStats.find(stat => stat.name === "planned")?.size || 0,
    watching: animeStats.find(stat => stat.name === "watching")?.size || 0,
    rewatching: animeStats.find(stat => stat.name === "rewatching")?.size || 0,
    on_hold: animeStats.find(stat => stat.name === "on_hold")?.size || 0,
    dropped: animeStats.find(stat => stat.name === "dropped")?.size || 0
  };
};

const getScoreStats = (userDetails) => {
  if (!userDetails?.stats?.scores?.anime) return [];

  return userDetails.stats.scores.anime
    .filter(item => item.value > 0)
    .sort((a, b) => parseInt(a.name) - parseInt(b.name))
    .map(item => ({
      name: item.name,
      value: item.value
    }));
};

const getTypeStats = (userDetails) => {
  if (!userDetails?.stats?.types?.anime) return [];

  return userDetails.stats.types.anime
    .filter(item => item.value > 0)
    .map(item => ({
      name: item.name,
      value: item.value
    }));
};

const SCORE_COLORS = [
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

const TYPE_COLORS = [
  '#4c8dc3', // Сериал
  '#75b366', // Фильм
  '#c2b135', // OVA
  '#e0a135', // ONA
  '#ed8934', // Спешл
  '#e97234', // TV Спешл
  '#e35a37', // Клип
  '#d84939'  // Проморолик
];

const STATUS_COLORS = {
  completed: '#75b366',
  watching: '#4c8dc3',
  planned: '#9e85c1',
  on_hold: '#e0a135',
  dropped: '#c13a3a',
  rewatching: '#4c8dc3'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p>{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

const Profile = ({ onAnimeClick, navigateTo }) => {
  const { currentUser, isAuthenticated, isLoading, setCurrentUser } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Shikimori anime list state
  const [userRates, setUserRates] = useState([]);
  const [activeStatus, setActiveStatus] = useState('watching');
  const [loadingList, setLoadingList] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoadingId, setSearchLoadingId] = useState(null);

  // Settings state
  const [settings, setSettings] = useState({
    syncHistory: false,
    publishActivity: false,
    showRatings: true,
    notifications: false
  });

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchUserDetails(currentUser.id);
      loadSettings();
    }
  }, [isAuthenticated, currentUser, retryCount]);

  useEffect(() => {
    if (isAuthenticated && currentUser && activeTab === 'anime-list') {
      fetchUserRates();
    }
  }, [isAuthenticated, currentUser, activeTab, activeStatus]);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('anilibria_shikimori_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('anilibria_shikimori_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      const hasChanges = Object.keys(settings).some(key => settings[key] !== parsedSettings[key]);
      setSettingsChanged(hasChanges);
    } else {
      const hasChanges = settings.syncHistory || settings.publishActivity ||
        !settings.showRatings || settings.notifications;
      setSettingsChanged(hasChanges);
    }
  }, [settings]);

  const fetchUserDetails = async (userId) => {
    setLoadingDetails(true);
    setError(null);

    try {
      const details = await fetchUserInfo(userId);

      if (!details) {
        throw new Error('Не удалось получить данные пользователя');
      }

      setUserDetails(details);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Не удалось загрузить детали профиля. Ошибка: ' + (err.message || 'неизвестная ошибка'));
    } finally {
      setLoadingDetails(false);
    }
  };

  // Improve the fetchUserRates function to handle batch processing

  const fetchUserRates = async () => {
    if (!isAuthenticated || !currentUser) return;

    setLoadingList(true);

    try {
      // 1. Get all user rates for the selected status
      const rates = await getUserAnimeRates(currentUser.id, activeStatus);
      console.log(`Fetched ${rates.length} anime entries with status: ${activeStatus}`);

      if (rates.length === 0) {
        setUserRates([]);
        return;
      }

      // 2. Extract anime IDs and create a cache map using target_id as keys
      const animeIds = rates.map(rate => rate.target_id);
      const ratesMap = {};
      rates.forEach(rate => {
        ratesMap[rate.target_id] = rate;
      });

      // 3. Check if we have any cached anime data
      const animeCache = JSON.parse(localStorage.getItem('anilibria_shikimori_anime_cache') || '{}');
      const cachedIds = Object.keys(animeCache).map(Number);

      // 4. Filter out IDs that are already cached and not expired (cache for 1 day)
      const oneDayAgo = Date.now() - 86400000; // 24 hours in milliseconds
      const neededIds = animeIds.filter(id => {
        const cachedAnime = animeCache[id];
        return !cachedAnime || !cachedAnime.timestamp || cachedAnime.timestamp < oneDayAgo;
      });

      console.log(`${animeIds.length} total anime, ${animeIds.length - neededIds.length} from cache, ${neededIds.length} need fetching`);

      // 5. Prepare the result array
      let processedRates = [];

      // 6. Process in batches to avoid rate limiting
      if (neededIds.length > 0) {
        const BATCH_SIZE = 10; // Process 10 anime at a time
        const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

        // Split IDs into batches
        const batches = [];
        for (let i = 0; i < neededIds.length; i += BATCH_SIZE) {
          batches.push(neededIds.slice(i, i + BATCH_SIZE));
        }

        console.log(`Processing ${batches.length} batches with ${BATCH_SIZE} anime per batch`);

        // Process each batch sequentially with delays
        for (let i = 0; i < batches.length; i++) {
          const batchIds = batches[i];

          // Process current batch
          const batchPromises = batchIds.map(async (animeId) => {
            try {
              const response = await fetch(`https://shikimori.one/api/animes/${animeId}`);
              if (!response.ok) throw new Error(`Error fetching anime: ${response.status}`);

              const anime = await response.json();

              // Update cache
              animeCache[animeId] = {
                data: anime,
                timestamp: Date.now()
              };

              return {
                id: ratesMap[animeId].id,
                target_id: animeId,
                score: ratesMap[animeId].score,
                status: ratesMap[animeId].status,
                episodes: ratesMap[animeId].episodes,
                anime: {
                  id: anime.id,
                  name: anime.russian || anime.name,
                  name_eng: anime.name,
                  image: anime.image?.original ? `https://shikimori.one${anime.image.original}` : null,
                  episodes: anime.episodes,
                  episodes_aired: anime.episodes_aired,
                  kind: anime.kind,
                  status: anime.status,
                  aired_on: anime.aired_on,
                  released_on: anime.released_on
                }
              };
            } catch (error) {
              console.error(`Failed to fetch anime ${animeId}:`, error);
              return null;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          processedRates = [...processedRates, ...batchResults.filter(item => item !== null)];

          // Save cache after each batch
          localStorage.setItem('anilibria_shikimori_anime_cache', JSON.stringify(animeCache));

          // Add delay between batches (but not after the last batch)
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
          }
        }
      }

      // 7. Add items from cache
      for (const animeId of animeIds) {
        if (animeCache[animeId] && !processedRates.some(rate => rate.target_id === animeId)) {
          const anime = animeCache[animeId].data;
          processedRates.push({
            id: ratesMap[animeId].id,
            target_id: animeId,
            score: ratesMap[animeId].score,
            status: ratesMap[animeId].status,
            episodes: ratesMap[animeId].episodes,
            anime: {
              id: anime.id,
              name: anime.russian || anime.name,
              name_eng: anime.name,
              image: anime.image?.original ? `https://shikimori.one${anime.image.original}` : null,
              episodes: anime.episodes,
              episodes_aired: anime.episodes_aired,
              kind: anime.kind,
              status: anime.status,
              aired_on: anime.aired_on,
              released_on: anime.released_on
            }
          });
        }
      }

      // 8. Sort the results by name
      processedRates.sort((a, b) => a.anime.name.localeCompare(b.anime.name));

      setUserRates(processedRates);
    } catch (error) {
      console.error('Failed to fetch user rates:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const clearAnimeCache = () => {
    try {
      localStorage.removeItem('anilibria_shikimori_anime_cache');
      alert('Кэш аниме успешно очищен. Данные будут загружены заново.');
      setRetryCount(count => count + 1);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Ошибка при очистке кэша.');
    }
  };

  /**
   * Returns total count of cached anime entries
   */
  const getCacheInfo = () => {
    try {
      const animeCache = JSON.parse(localStorage.getItem('anilibria_shikimori_anime_cache') || '{}');
      const count = Object.keys(animeCache).length;
      const size = JSON.stringify(animeCache).length / 1024; // Size in KB

      return {
        count,
        size: size.toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return { count: 0, size: 0 };
    }
  };

  // This is how handleAnimeSearch should be implemented
  const handleAnimeSearch = async (title, rateId) => {
    setSearchLoadingId(rateId);
    setIsSearching(true);

    try {
      console.log(`Searching for anime with title: ${title}`);

      const results = await fetchAPI(`/app/search/releases?query=${encodeURIComponent(title)}`);
      console.log('Search results:', results);

      if (results && Array.isArray(results) && results.length > 0) {
        // Get the first result's ID (release ID)
        const animeId = results[0].id;

        if (animeId) {
          console.log(`Found anime with ID: ${animeId}, navigating to details`);

          // This is the important part - using onAnimeClick correctly
          onAnimeClick(animeId);
        } else {
          console.error('Found result but ID is missing', results[0]);
          alert(`Найден результат, но ID отсутствует. Пожалуйста, попробуйте поискать вручную.`);
        }
      } else {
        console.log(`No anime found with title: ${title}`);
        alert(`Аниме "${title}" не найдено на сайте. Попробуйте поискать вручную.`);
      }
    } catch (error) {
      console.error('Failed to search anime:', error);
      alert('Произошла ошибка при поиске. Пожалуйста, попробуйте позже.');
    } finally {
      setIsSearching(false);
      setSearchLoadingId(null);
    }
  };

  const handleSyncProfile = async () => {
    setSyncLoading(true);
    setError(null);

    try {
      const updatedUser = await fetchCurrentUser();

      if (!updatedUser) {
        throw new Error('Failed to fetch user data');
      }

      setCurrentUser(updatedUser);

      if (updatedUser.id) {
        setRetryCount(count => count + 1);
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
      setError('Не удалось синхронизировать профиль: ' + (err.message || 'неизвестная ошибка'));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      logout();
    }
  };

  const handleSettingChange = (setting) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('anilibria_shikimori_settings', JSON.stringify(settings));

      setShowSaveConfirmation(true);
      setTimeout(() => {
        setShowSaveConfirmation(false);
      }, 2000);

      setSettingsChanged(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const resetSettings = () => {
    const defaultSettings = {
      syncHistory: false,
      publishActivity: false,
      showRatings: true,
      notifications: false
    };

    setSettings(defaultSettings);
  };

  const stats = getSafeStats(userDetails);
  const scoreStats = getScoreStats(userDetails);
  const typeStats = getTypeStats(userDetails);

  const pieData = [
    { name: 'Просмотрено', value: stats.completed, color: STATUS_COLORS.completed },
    { name: 'Смотрю', value: stats.watching, color: STATUS_COLORS.watching },
    { name: 'Запланировано', value: stats.planned, color: STATUS_COLORS.planned },
    { name: 'Отложено', value: stats.on_hold, color: STATUS_COLORS.on_hold },
    { name: 'Брошено', value: stats.dropped, color: STATUS_COLORS.dropped },
    { name: 'Пересматриваю', value: stats.rewatching, color: STATUS_COLORS.rewatching }
  ].filter(item => item.value > 0);

  const getTotalAnimeCount = () => {
    if (!userDetails?.stats?.full_statuses?.anime) return 0;

    return userDetails.stats.full_statuses.anime.reduce((total, status) => total + status.size, 0);
  };

  if (isLoading) {
    return (
      <motion.main
        className="main-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="content-container">
          <div className="auth-loading">
            <div className="auth-loading-spinner"></div>
            <h2>Загрузка профиля...</h2>
          </div>
        </div>
      </motion.main>
    );
  }

  if (!isAuthenticated) {
    return (
      <motion.main
        className="main-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Профиль</h1>
          <p>Авторизуйтесь для доступа к профилю</p>
        </motion.div>

        <div className="content-container">
          <Login />
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main
      className="main-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Профиль</h1>
        <p>Ваш профиль и статистика просмотров</p>
      </motion.div>

      <div className="content-container profile-container">
        <AnimatePresence mode="wait">
          {loadingDetails ? (
            <motion.div
              key="loading"
              className="auth-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="auth-loading-spinner"></div>
              <h2>Загрузка данных профиля...</h2>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="error-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p>{error}</p>
              <motion.button
                className="button primary-button"
                onClick={() => fetchUserDetails(currentUser.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Попробовать снова
              </motion.button>
            </motion.div>
          ) : userDetails ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="profile-header business-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="profile-avatar">
                  <img
                    src={userDetails.avatar || 'https://shikimori.one/favicons/favicon-96x96.png'}
                    alt={userDetails.nickname || 'Аватар'}
                    onError={(e) => {
                      e.target.src = 'https://shikimori.one/favicons/favicon-96x96.png';
                    }}
                  />
                </div>
                <div className="profile-info">
                  <h2 className="profile-username">{userDetails.nickname || 'Пользователь Shikimori'}</h2>
                  {userDetails.name && <div className="profile-nickname">{userDetails.name}</div>}
                  <div className="profile-meta-info">
                    <div className="profile-meta-item">
                      <span className="meta-label">ID:</span>
                      <span className="meta-value">{userDetails.id}</span>
                    </div>
                    <div className="profile-meta-item">
                      <span className="meta-label">Последний вход:</span>
                      <span className="meta-value">{userDetails.last_online}</span>
                    </div>
                    <div className="profile-meta-item">
                      <span className="meta-label">Аниме в списке:</span>
                      <span className="meta-value">{getTotalAnimeCount()}</span>
                    </div>
                  </div>
                  <div className="profile-buttons">
                    <motion.button
                      className="sync-button"
                      onClick={handleSyncProfile}
                      disabled={syncLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {syncLoading ? (
                        <>
                          <span className="loading-spinner-small"></span>
                          Синхронизация...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Синхронизировать
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      className="edit-button"
                      onClick={() => window.open(`https://shikimori.one/${userDetails.nickname}/edit/account`, '_blank')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Изменить на Shikimori
                    </motion.button>
                    <motion.button
                      className="logout-button"
                      onClick={handleLogout}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Выйти
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              <div className="profile-tabs">
                <button
                  className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Обзор
                </button>
                <button
                  className={`profile-tab ${activeTab === 'anime-list' ? 'active' : ''}`}
                  onClick={() => setActiveTab('anime-list')}
                >
                  Мой список аниме
                </button>
                <button
                  className={`profile-tab ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  Статистика
                </button>
                <button
                  className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  Настройки
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="profile-sections"
                  >
                    <div className="profile-section business-section">
                      <div className="profile-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15v3m-3-3v3m6-3v3M6 3v7m12-7v7M6 10h12M6 10a5 5 0 015 5M18 10a5 5 0 01-5 5m0 0a5 5 0 01-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Сводная информация
                      </div>

                      <div className="profile-info-items">
                        <p>
                          <span>ID пользователя</span>
                          <span>{userDetails.id || 'Неизвестно'}</span>
                        </p>
                        <p>
                          <span>Профиль на Shikimori</span>
                          <a href={`https://shikimori.one/${userDetails.nickname}`} target="_blank" rel="noreferrer">{userDetails.nickname}</a>
                        </p>
                        <p>
                          <span>Последняя активность</span>
                          <span>{userDetails.last_online_at ? formatDate(userDetails.last_online_at) : (userDetails.last_online || 'Неизвестно')}</span>
                        </p>
                        <p>
                          <span>Пол</span>
                          <span>{userDetails.sex === 'female' ? 'Женский' : userDetails.sex === 'male' ? 'Мужской' : 'Не указан'}</span>
                        </p>
                        <p>
                          <span>Возраст</span>
                          <span>{userDetails.full_years ? `${userDetails.full_years} лет` : 'Не указан'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="profile-section business-section">
                      <div className="profile-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Статистика просмотров
                      </div>

                      <div className="business-status-summary">
                        <div className="business-status-cards">
                          <div className="business-status-card" style={{ borderColor: STATUS_COLORS.completed }}>
                            <div className="status-card-value">{stats.completed}</div>
                            <div className="status-card-label">Просмотрено</div>
                          </div>
                          <div className="business-status-card" style={{ borderColor: STATUS_COLORS.watching }}>
                            <div className="status-card-value">{stats.watching}</div>
                            <div className="status-card-label">Смотрю</div>
                          </div>
                          <div className="business-status-card" style={{ borderColor: STATUS_COLORS.planned }}>
                            <div className="status-card-value">{stats.planned}</div>
                            <div className="status-card-label">Запланировано</div>
                          </div>
                          <div className="business-status-card" style={{ borderColor: STATUS_COLORS.on_hold }}>
                            <div className="status-card-value">{stats.on_hold}</div>
                            <div className="status-card-label">Отложено</div>
                          </div>
                          <div className="business-status-card" style={{ borderColor: STATUS_COLORS.dropped }}>
                            <div className="status-card-value">{stats.dropped}</div>
                            <div className="status-card-label">Брошено</div>
                          </div>
                        </div>

                        <div className="business-chart-container">
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'anime-list' && (
                  <motion.div
                    key="anime-list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="profile-sections"
                  >
                    <div className="profile-section business-section">
                      <div className="profile-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Мой список аниме с Shikimori</span>
                      </div>

                      <div className="anime-list-tabs">
                        {['watching', 'completed', 'planned', 'on_hold', 'dropped'].map((status) => (
                          <button
                            key={status}
                            className={`anime-list-tab ${activeStatus === status ? 'active' : ''}`}
                            onClick={() => setActiveStatus(status)}
                          >
                            {getStatusDisplayName(status)}
                          </button>
                        ))}
                      </div>

                      <div className="anime-list-container">
                        {loadingList ? (
                          <div className="anime-list-loading">
                            <div className="auth-loading-spinner"></div>
                            <p>Загрузка списка аниме...</p>
                          </div>
                        ) : userRates.length > 0 ? (
                          <div className="anime-list">
                            <table className="anime-list-table">
                              <thead>
                                <tr>
                                  <th>Постер</th>
                                  <th>Название</th>
                                  <th>Тип</th>
                                  <th>Эпизоды</th>
                                  <th>Оценка</th>
                                  <th>Действия</th>
                                </tr>
                              </thead>
                              <tbody>
                                {userRates.map((rate) => (
                                  <tr key={rate.id} className="anime-list-item">
                                    <td className="anime-list-poster">
                                      <img
                                        src={rate.anime.image || 'https://shikimori.one/favicons/favicon-96x96.png'}
                                        alt={rate.anime.name}
                                        onError={(e) => {
                                          e.target.src = 'https://shikimori.one/favicons/favicon-96x96.png';
                                        }}
                                      />
                                    </td>
                                    <td className="anime-list-title">
                                      <div className="anime-title">{rate.anime.name}</div>
                                      <div className="anime-title-eng">{rate.anime.name_eng}</div>
                                    </td>
                                    <td className="anime-list-type">{rate.anime.kind.toUpperCase()}</td>
                                    <td className="anime-list-episodes">
                                      {rate.episodes} / {rate.anime.episodes || '?'}
                                    </td>
                                    <td className="anime-list-score">
                                      {rate.score > 0 ? (
                                        <div className="score-value" style={{ color: SCORE_COLORS[rate.score - 1] }}>
                                          {rate.score}
                                        </div>
                                      ) : (
                                        <div className="score-value">—</div>
                                      )}
                                    </td>
                                    <td className="anime-list-actions">
                                      <button
                                        className="anime-list-search-button"
                                        onClick={() => handleAnimeSearch(rate.anime.name, rate.id)}
                                        disabled={isSearching || searchLoadingId === rate.id}
                                      >
                                        {isSearching && searchLoadingId === rate.id ? (
                                          <span className="loading-spinner-small"></span>
                                        ) : (
                                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                                          width="512.000000pt" color="#fff" height="512.000000pt" viewBox="0 0 512.000000 512.000000"
                                          preserveAspectRatio="xMidYMid meet">

                                          <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                                            fill="#fff" stroke="none">
                                            <path d="M1001 4464 c-169 -45 -301 -180 -346 -351 -23 -86 -23 -3020 0 -3106
                                          46 -178 193 -320 367 -356 36 -8 273 -11 745 -9 681 3 692 3 719 24 53 39 69
                                          71 69 134 0 63 -16 95 -69 134 -27 21 -40 21 -726 26 -686 5 -699 5 -726 26
                                          -15 11 -37 33 -48 48 -21 27 -21 36 -24 937 l-2 909 1599 0 1600 0 3 -269 c3
                                          -254 4 -271 24 -297 39 -53 71 -69 134 -69 63 0 95 16 134 69 21 27 21 37 24
                                          879 2 587 -1 868 -9 905 -36 174 -178 321 -356 367 -85 22 -3030 21 -3112 -1z
                                          m3085 -330 c15 -11 37 -33 48 -48 20 -27 21 -41 24 -457 l3 -429 -1601 0
                                          -1600 0 0 414 c0 270 4 425 11 443 14 37 47 73 84 89 25 11 293 13 1517 11
                                          1484 -2 1487 -2 1514 -23z"/>
                                            <path d="M1375 3826 c-101 -44 -125 -178 -46 -257 112 -113 296 -12 267 146
                                          -18 94 -131 151 -221 111z"/>
                                            <path d="M1855 3826 c-101 -44 -125 -178 -46 -257 112 -113 296 -12 267 146
                                          -18 94 -131 151 -221 111z"/>
                                            <path d="M2335 3826 c-101 -44 -125 -178 -46 -257 112 -113 296 -12 267 146
                                          -18 94 -131 151 -221 111z"/>
                                            <path d="M3802 1910 c-45 -10 -100 -65 -113 -112 -20 -77 -7 -102 124 -235
                                          l120 -122 -469 -3 c-452 -3 -470 -4 -504 -24 -52 -30 -82 -88 -77 -147 5 -54
                                          27 -91 77 -125 l33 -22 470 0 471 0 -111 -112 c-60 -62 -116 -124 -123 -137
                                          -20 -39 -15 -115 10 -157 25 -39 86 -73 133 -74 62 0 102 31 341 268 131 130
                                          251 257 267 281 31 48 37 98 18 148 -12 31 -510 537 -549 557 -36 19 -80 24
                                          -118 16z"/>
                                          </g>
                                        </svg>                                          
                                        )}
                                        Перейти
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="empty-anime-list">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>В списке "{getStatusDisplayName(activeStatus)}" нет аниме</p>
                            <p className="empty-list-hint">Добавьте аниме в этот список на Shikimori или выберите другой статус</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'stats' && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="profile-sections"
                  >
                    <div className="profile-section business-section">
                      <div className="profile-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Распределение оценок
                      </div>

                      <div className="score-chart">
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={scoreStats}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" name="Количество">
                              {scoreStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={SCORE_COLORS[parseInt(entry.name) - 1] || '#8884d8'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="business-stats-summary">
                        <div className="business-stat-item">
                          <div className="business-stat-value">
                            {scoreStats.reduce((sum, item) => sum + item.value, 0)}
                          </div>
                          <div className="business-stat-label">Всего оценок</div>
                        </div>
                        <div className="business-stat-item">
                          <div className="business-stat-value">
                            {scoreStats.length > 0
                              ? (scoreStats.reduce((sum, item) => sum + (parseInt(item.name) * item.value), 0) /
                                scoreStats.reduce((sum, item) => sum + item.value, 0)).toFixed(2)
                              : '—'}
                          </div>
                          <div className="business-stat-label">Средняя оценка</div>
                        </div>
                        <div className="business-stat-item">
                          <div className="business-stat-value">
                            {scoreStats.length > 0
                              ? scoreStats.reduce((max, item) => item.value > max.value ? item : max, { value: 0 }).name
                              : '—'}
                          </div>
                          <div className="business-stat-label">Наиболее частая</div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section business-section">
                      <div className="profile-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Типы аниме
                      </div>

                      <div className="type-chart">
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={typeStats}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                            layout="vertical"
                          >
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip />
                            <Bar dataKey="value" name="Количество">
                              {typeStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="profile-sections"
                  >
                    <div className="profile-section business-section">
                      <div className="settings-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <h3>Интеграция с приложением</h3>
                      </div>

                      <div className="profile-settings">
                        <div className="setting-item">
                          <div className="setting-label">Синхронизировать историю просмотров</div>
                          <div className="setting-description">
                            Автоматически обновлять список аниме на Shikimori при просмотре через наше приложение
                          </div>
                          <div className="setting-control">
                            <input
                              type="checkbox"
                              id="sync-history"
                              checked={settings.syncHistory}
                              onChange={() => handleSettingChange('syncHistory')}
                            />
                            <label htmlFor="sync-history"></label>
                            <span className="checkbox-text">
                              {settings.syncHistory ? 'Включено' : 'Выключено'}
                            </span>
                          </div>
                        </div>

                        <div className="setting-item">
                          <div className="setting-label">Публиковать активность на Shikimori</div>
                          <div className="setting-description">
                            Добавлять записи о просмотре в ленту активности на Shikimori
                          </div>
                          <div className="setting-control">
                            <input
                              type="checkbox"
                              id="publish-activity"
                              checked={settings.publishActivity}
                              onChange={() => handleSettingChange('publishActivity')}
                            />
                            <label htmlFor="publish-activity"></label>
                            <span className="checkbox-text">
                              {settings.publishActivity ? 'Включено' : 'Выключено'}
                            </span>
                          </div>
                        </div>

                        <div className="setting-item">
                          <div className="setting-label">Показывать оценки из Shikimori</div>
                          <div className="setting-description">
                            Отображать оценки и статус аниме из вашего списка на Shikimori
                          </div>
                          <div className="setting-control">
                            <input
                              type="checkbox"
                              id="show-ratings"
                              checked={settings.showRatings}
                              onChange={() => handleSettingChange('showRatings')}
                            />
                            <label htmlFor="show-ratings"></label>
                            <span className="checkbox-text">
                              {settings.showRatings ? 'Включено' : 'Выключено'}
                            </span>
                          </div>
                        </div>

                        <div className="setting-item">
                          <div className="setting-label">Уведомления</div>
                          <div className="setting-description">
                            Получать уведомления о новых сериях отслеживаемых аниме
                          </div>
                          <div className="setting-control">
                            <input
                              type="checkbox"
                              id="notifications"
                              checked={settings.notifications}
                              onChange={() => handleSettingChange('notifications')}
                            />
                            <label htmlFor="notifications"></label>
                            <span className="checkbox-text">
                              {settings.notifications ? 'Включено' : 'Выключено'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="settings-buttons">
                        <motion.button
                          className="settings-save-button"
                          onClick={saveSettings}
                          disabled={!settingsChanged}
                          whileHover={settingsChanged ? { scale: 1.02 } : {}}
                          whileTap={settingsChanged ? { scale: 0.98 } : {}}
                        >
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Сохранить настройки
                        </motion.button>

                        <motion.button
                          className="settings-save-button settings-reset-button"
                          onClick={resetSettings}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 12a9 9 0 0116.9-4M3 12a9 9 0 009 9c2.388 0 4.59-.743 6.4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M17 8h4V4M21 12v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Сбросить
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSaveConfirmation && (
          <motion.div
            className="settings-save-feedback"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p>Настройки успешно сохранены</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
};

export default Profile;