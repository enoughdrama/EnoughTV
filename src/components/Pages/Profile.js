import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { fetchUserInfo, logout, fetchCurrentUser, fetchWithAuth } from '../../utils/shikimoriAuth';
import { getUserAnimeRates, getStatusDisplayName } from '../../utils/shikimoriRates';
import Login from '../Auth/Login';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { fetchAPI } from '../../utils/api';
import '../../styles/profile.css';

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

const STATUS_ICONS = {
  completed: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  watching: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  rewatching: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  planned: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  on_hold: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  dropped: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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

const LoadingSkeleton = ({ type }) => {
  if (type === "card") {
    return (
      <div className="profile-section" style={{ height: "200px" }}>
        <div className="skeleton" style={{ height: "100%" }}></div>
      </div>
    );
  }

  if (type === "stats") {
    return (
      <div className="stats-cards">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="stat-card skeleton-card">
            <div className="skeleton" style={{ height: "40px", width: "60px", marginBottom: "10px" }}></div>
            <div className="skeleton" style={{ height: "10px", width: "80%" }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="anime-list-table-container">
        <div className="skeleton" style={{ height: "300px" }}></div>
      </div>
    );
  }

  if (type === "avatar") {
    return (
      <div className="profile-avatar skeleton-avatar">
        <div className="skeleton" style={{ height: "100%", borderRadius: "20px" }}></div>
      </div>
    );
  }

  return (
    <div className="skeleton" style={{ height: "100px", width: "100%", borderRadius: "10px" }}></div>
  );
};

const TabSlider = ({ activeTab, tabs }) => {
  const tabRefs = useRef({});
  const [sliderStyle, setSliderStyle] = useState({
    width: 0,
    transform: 'translateX(0px)'
  });

  useEffect(() => {
    updateSliderPosition();

    window.addEventListener('resize', updateSliderPosition);
    return () => window.removeEventListener('resize', updateSliderPosition);
  }, [activeTab]);

  const updateSliderPosition = () => {
    if (tabRefs.current[activeTab]) {
      const tabElement = tabRefs.current[activeTab];
      const rect = tabElement.getBoundingClientRect();

      setSliderStyle({
        width: rect.width,
        transform: `translateX(${tabElement.offsetLeft}px)`
      });
    }
  };

  return (
    <div className="profile-tabs-container">
      <div className="profile-tabs">
        <div
          className="profile-tab-slider"
          style={sliderStyle}
        ></div>

        {tabs.map(tab => (
          <button
            key={tab.id}
            ref={el => tabRefs.current[tab.id] = el}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={tab.onClick}
          >
            <span className="profile-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const AnimeGridCard = ({ anime, onSearch, isSearching, searchId }) => {
  return (
    <div className="anime-grid-card">
      <div className="anime-grid-poster">
        <img
          src={anime.anime.image || 'https://shikimori.one/favicons/favicon-96x96.png'}
          alt={anime.anime.name}
          onError={(e) => {
            e.target.src = 'https://shikimori.one/favicons/favicon-96x96.png';
          }}
        />
        <div className="anime-grid-overlay"></div>
      </div>
      <div className="anime-grid-content">
        <h4 className="anime-grid-title">{anime.anime.name}</h4>
        <div className="anime-grid-meta">
          <span className="anime-grid-type">{anime.anime.kind?.toUpperCase() || 'N/A'}</span>
          <span>{anime.anime.aired_on?.split('-')[0] || 'N/A'}</span>
        </div>
        <div className="anime-grid-progress">
          <span className="anime-grid-episodes">
            {anime.episodes} / {anime.anime.episodes || '?'}
          </span>
          {anime.score > 0 && (
            <div className="anime-grid-score" style={{ color: SCORE_COLORS[anime.score - 1] }}>
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              {anime.score}
            </div>
          )}
        </div>
      </div>
      <div className="anime-grid-actions">
        <motion.button
          className="anime-grid-button"
          onClick={() => onSearch(anime.anime.name, anime.id)}
          disabled={isSearching}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSearching && searchId === anime.id ? (
            <span className="loading-spinner-small"></span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Смотреть
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

const EmptyState = ({ icon, title, message }) => (
  <motion.div
    className="anime-list-empty"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="anime-list-empty-icon">{icon}</div>
    <p className="anime-list-empty-text">{title}</p>
    <p className="anime-list-empty-hint">{message}</p>
  </motion.div>
);

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
  const [listView, setListView] = useState('grid');

  const [userRates, setUserRates] = useState([]);
  const [activeStatus, setActiveStatus] = useState('watching');
  const [loadingList, setLoadingList] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoadingId, setSearchLoadingId] = useState(null);
  const [animeCache, setAnimeCache] = useState({});

  const [pageLoaded, setPageLoaded] = useState(false);

  const [statusCounts, setStatusCounts] = useState({
    watching: 0,
    completed: 0,
    planned: 0,
    on_hold: 0,
    dropped: 0,
    rewatching: 0
  });

  const [settings, setSettings] = useState({
    syncHistory: false,
    publishActivity: false,
    showRatings: true,
    notifications: false
  });

  const tabs = [
    {
      id: 'overview',
      label: 'Обзор',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => setActiveTab('overview')
    },
    {
      id: 'anime-list',
      label: 'Мой список',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => setActiveTab('anime-list')
    },
    {
      id: 'stats',
      label: 'Статистика',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => setActiveTab('stats')
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => setActiveTab('settings')
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchUserDetails(currentUser.id);
      loadSettings();
      loadAnimeCache();
    }
  }, [isAuthenticated, currentUser, retryCount]);

  useEffect(() => {
    if (isAuthenticated && currentUser && activeTab === 'anime-list') {
      fetchUserRates();
    }
  }, [isAuthenticated, currentUser, activeTab, activeStatus]);

  useEffect(() => {
    if (userDetails?.stats?.full_statuses?.anime) {
      const animeCounts = {};
      userDetails.stats.full_statuses.anime.forEach(status => {
        animeCounts[status.name] = status.size;
      });

      setStatusCounts({
        watching: animeCounts.watching || 0,
        completed: animeCounts.completed || 0,
        planned: animeCounts.planned || 0,
        on_hold: animeCounts.on_hold || 0,
        dropped: animeCounts.dropped || 0,
        rewatching: animeCounts.rewatching || 0
      });
    }
  }, [userDetails]);

  const loadAnimeCache = useCallback(() => {
    try {
      const cache = JSON.parse(localStorage.getItem('enoughtv_shikimori_anime_cache') || '{}');
      setAnimeCache(cache);
    } catch (error) {
      console.error('Failed to load anime cache:', error);
      setAnimeCache({});
    }
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('enoughtv_shikimori_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('enoughtv_shikimori_settings');
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

  const fetchUserRates = async () => {
    if (!isAuthenticated || !currentUser) return;

    setLoadingList(true);

    try {
      const rates = await getUserAnimeRates(currentUser.id, activeStatus);

      if (rates.length === 0) {
        setUserRates([]);
        setLoadingList(false);
        return;
      }

      const animeIds = rates.map(rate => rate.target_id);

      const ratesMap = {};
      rates.forEach(rate => {
        ratesMap[rate.target_id] = rate;
      });

      let cachedRates = [];
      let animeToFetch = [];

      const oneDayAgo = Date.now() - 86400000;

      animeIds.forEach(id => {
        if (animeCache[id] && animeCache[id].timestamp > oneDayAgo) {
          cachedRates.push({
            id: ratesMap[id].id,
            target_id: id,
            score: ratesMap[id].score,
            status: ratesMap[id].status,
            episodes: ratesMap[id].episodes,
            anime: animeCache[id].data
          });
        } else {
          animeToFetch.push(id);
        }
      });

      if (animeToFetch.length > 0) {
        const fetchedAnimeData = await fetchBulkAnimeData(animeToFetch);

        const fetchedRates = animeToFetch.map(id => {
          const animeData = fetchedAnimeData[id];
          if (!animeData) return null;

          return {
            id: ratesMap[id].id,
            target_id: id,
            score: ratesMap[id].score,
            status: ratesMap[id].status,
            episodes: ratesMap[id].episodes,
            anime: {
              id: animeData.id,
              name: animeData.russian || animeData.name,
              name_eng: animeData.name,
              image: animeData.image?.original ? `https://shikimori.one${animeData.image.original}` : null,
              episodes: animeData.episodes,
              episodes_aired: animeData.episodes_aired,
              kind: animeData.kind,
              status: animeData.status,
              aired_on: animeData.aired_on,
              released_on: animeData.released_on
            }
          };
        }).filter(rate => rate !== null);

        const newCache = { ...animeCache };
        fetchedRates.forEach(rate => {
          newCache[rate.target_id] = {
            data: rate.anime,
            timestamp: Date.now()
          };
        });

        localStorage.setItem('enoughtv_shikimori_anime_cache', JSON.stringify(newCache));
        setAnimeCache(newCache);

        const combinedRates = [...cachedRates, ...fetchedRates];

        combinedRates.sort((a, b) =>
          (a.anime.name || a.anime.russian || '').localeCompare(b.anime.name || b.anime.russian || '')
        );

        setUserRates(combinedRates);
      } else {
        cachedRates.sort((a, b) =>
          (a.anime.name || a.anime.russian || '').localeCompare(b.anime.name || b.anime.russian || '')
        );

        setUserRates(cachedRates);
      }
    } catch (error) {
      console.error('Failed to fetch user rates:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchBulkAnimeData = async (animeIds) => {
    if (!animeIds || animeIds.length === 0) return {};

    try {
      const BATCH_SIZE = 50;
      const results = {};

      for (let i = 0; i < animeIds.length; i += BATCH_SIZE) {
        const batchIds = animeIds.slice(i, i + BATCH_SIZE);
        const idsParam = batchIds.join(',');

        const url = `https://shikimori.one/api/animes?ids=${idsParam}&limit=${BATCH_SIZE}`;
        const response = await fetchWithAuth(url);

        if (!response.ok) {
          throw new Error(`Error fetching anime batch: ${response.status}`);
        }

        const animeList = await response.json();

        animeList.forEach(anime => {
          results[anime.id] = anime;
        });

        if (i + BATCH_SIZE < animeIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to fetch bulk anime data:', error);
      return {};
    }
  };

  const clearAnimeCache = () => {
    try {
      localStorage.removeItem('enoughtv_shikimori_anime_cache');
      setAnimeCache({});
      alert('Кэш аниме успешно очищен. Данные будут загружены заново.');
      setRetryCount(count => count + 1);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Ошибка при очистке кэша.');
    }
  };

  const getCacheInfo = () => {
    try {
      const count = Object.keys(animeCache).length;
      const size = JSON.stringify(animeCache).length / 1024;

      return {
        count,
        size: size.toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return { count: 0, size: 0 };
    }
  };

  const handleAnimeSearch = async (title, rateId) => {
    setSearchLoadingId(rateId);
    setIsSearching(true);

    try {
      const results = await fetchAPI(`/app/search/releases?query=${encodeURIComponent(title)}`);

      if (results && Array.isArray(results) && results.length > 0) {
        const animeId = results[0].id;

        if (animeId) {
          onAnimeClick(animeId);
        } else {
          alert(`Найден результат, но ID отсутствует. Пожалуйста, попробуйте поискать вручную.`);
        }
      } else {
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
      localStorage.setItem('enoughtv_shikimori_settings', JSON.stringify(settings));

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
        <div className="profile-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="auth-loading"
          >
            <div className="auth-loading-spinner"></div>
            <h2>Загрузка профиля...</h2>
          </motion.div>
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
      <div className="profile-container">
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
                className="profile-action-button primary"
                onClick={() => fetchUserDetails(currentUser.id)}
                whileHover={{ y: -3 }}
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
                className="profile-header-wrapper"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="profile-header">
                  <div className="profile-header-overlay"></div>
                  <div className="profile-header-content">
                    <div className="profile-avatar-wrapper">
                      <motion.div
                        className="profile-avatar"
                        whileHover={{ y: -5, boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4)" }}
                      >
                        <img
                          src={userDetails.avatar || 'https://shikimori.one/favicons/favicon-96x96.png'}
                          alt={userDetails.nickname || 'Аватар'}
                          onError={(e) => {
                            e.target.src = 'https://shikimori.one/favicons/favicon-96x96.png';
                          }}
                        />
                      </motion.div>
                      <motion.div
                        className="profile-avatar-badge"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    </div>

                    <div className="profile-user-info">
                      <motion.h2
                        className="profile-username"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        {userDetails.nickname || 'Пользователь Shikimori'}
                      </motion.h2>

                      {userDetails.name && (
                        <motion.div
                          className="profile-nickname"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          {userDetails.name}
                        </motion.div>
                      )}

                      <motion.div
                        className="profile-meta"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                      >
                        <div className="profile-meta-item">
                          <div className="profile-meta-value">{getTotalAnimeCount()}</div>
                          <div className="profile-meta-label">Аниме</div>
                        </div>

                        <div className="profile-meta-item">
                          <div className="profile-meta-value">
                            {userDetails.stats?.scores?.anime
                              .reduce((sum, score) => sum + score.value, 0) || 0}
                          </div>
                          <div className="profile-meta-label">Оценки</div>
                        </div>

                        <div className="profile-meta-item">
                          <div className="profile-meta-value">
                            {userDetails.stats?.scores?.anime.length > 0
                              ? (userDetails.stats?.scores?.anime
                                .reduce((sum, score) => sum + (parseInt(score.name) * score.value), 0) /
                                userDetails.stats?.scores?.anime
                                  .reduce((sum, score) => sum + score.value, 0)).toFixed(1)
                              : '–'}
                          </div>
                          <div className="profile-meta-label">Ср. оценка</div>
                        </div>
                      </motion.div>

                      <motion.div
                        className="profile-actions"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <motion.button
                          className="profile-action-button primary"
                          onClick={handleSyncProfile}
                          disabled={syncLoading}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {syncLoading ? (
                            <>
                              <span className="loading-spinner"></span>
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
                          className="profile-action-button secondary"
                          onClick={() => window.open(`https://shikimori.one/${userDetails.nickname}/edit/account`, '_blank')}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Изменить на Shikimori
                        </motion.button>

                        <motion.button
                          className="profile-action-button danger"
                          onClick={handleLogout}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Выйти
                        </motion.button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <TabSlider activeTab={activeTab} tabs={tabs} />
              </motion.div>

              <div className="profile-tab-content">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="stats-cards"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <motion.div
                          className="stat-card completed"
                          whileHover={{ y: -5, scale: 1.03 }}
                        >
                          <div className="stat-card-value">{stats.completed}</div>
                          <div className="stat-card-label">Просмотрено</div>
                        </motion.div>

                        <motion.div
                          className="stat-card watching"
                          whileHover={{ y: -5, scale: 1.03 }}
                        >
                          <div className="stat-card-value">{stats.watching}</div>
                          <div className="stat-card-label">Смотрю</div>
                        </motion.div>

                        <motion.div
                          className="stat-card planned"
                          whileHover={{ y: -5, scale: 1.03 }}
                        >
                          <div className="stat-card-value">{stats.planned}</div>
                          <div className="stat-card-label">Запланировано</div>
                        </motion.div>

                        <motion.div
                          className="stat-card on-hold"
                          whileHover={{ y: -5, scale: 1.03 }}
                        >
                          <div className="stat-card-value">{stats.on_hold}</div>
                          <div className="stat-card-label">Отложено</div>
                        </motion.div>

                        <motion.div
                          className="stat-card dropped"
                          whileHover={{ y: -5, scale: 1.03 }}
                        >
                          <div className="stat-card-value">{stats.dropped}</div>
                          <div className="stat-card-label">Брошено</div>
                        </motion.div>

                        <motion.div
                          className="stat-card rewatching"
                          whileHover={{ y: -5, scale: 1.03 }}
                        >
                          <div className="stat-card-value">{stats.rewatching}</div>
                          <div className="stat-card-label">Пересматриваю</div>
                        </motion.div>
                      </motion.div>

                      <motion.div
                        className="profile-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <div className="profile-section-header">
                          <h3 className="profile-section-title">
                            <div className="profile-section-title-icon">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 15v3m-3-3v3m6-3v3M6 3v7m12-7v7M6 10h12M6 10a5 5 0 015 5M18 10a5 5 0 01-5 5m0 0a5 5 0 01-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            Информация о пользователе
                          </h3>
                        </div>

                        <div className="profile-section-content">
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
                      </motion.div>

                      <motion.div
                        className="profile-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        <div className="profile-section-header">
                          <h3 className="profile-section-title">
                            <div className="profile-section-title-icon">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            Распределение статусов
                          </h3>
                        </div>

                        <div className="profile-section-content">
                          {pieData.length > 0 ? (
                            <div className="chart-container">
                              <div className="chart-inner">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={pieData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      outerRadius={120}
                                      innerRadius={60}
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
                          ) : (
                            <div className="empty-chart-message">
                              <p>Нет данных для отображения</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'anime-list' && (
                    <motion.div
                      key="anime-list"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="anime-list-container">
                        <div className="anime-list-header">
                          <h3 className="anime-list-title">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                              <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Мой список аниме с Shikimori
                          </h3>

                          <div className="profile-section-actions">
                            <motion.button
                              className={`profile-action-button secondary ${listView === 'grid' ? 'active' : ''}`}
                              onClick={() => setListView('grid')}
                              whileHover={{ y: -2 }}
                              style={{ padding: '6px 12px' }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </motion.button>

                            <motion.button
                              className={`profile-action-button secondary ${listView === 'table' ? 'active' : ''}`}
                              onClick={() => setListView('table')}
                              whileHover={{ y: -2 }}
                              style={{ padding: '6px 12px' }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 10h18M3 14h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </motion.button>
                          </div>
                        </div>

                        <div className="anime-list-tabs">
                          {[
                            { id: 'watching', label: 'Смотрю', count: statusCounts.watching, icon: STATUS_ICONS.watching },
                            { id: 'completed', label: 'Просмотрено', count: statusCounts.completed, icon: STATUS_ICONS.completed },
                            { id: 'planned', label: 'Запланировано', count: statusCounts.planned, icon: STATUS_ICONS.planned },
                            { id: 'on_hold', label: 'Отложено', count: statusCounts.on_hold, icon: STATUS_ICONS.on_hold },
                            { id: 'dropped', label: 'Брошено', count: statusCounts.dropped, icon: STATUS_ICONS.dropped },
                            { id: 'rewatching', label: 'Пересматриваю', count: statusCounts.rewatching, icon: STATUS_ICONS.rewatching }
                          ].map(status => (
                            <motion.button
                              key={status.id}
                              className={`anime-list-tab ${activeStatus === status.id ? 'active' : ''}`}
                              data-status={status.id}
                              onClick={() => setActiveStatus(status.id)}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                            >
                              {status.icon}
                              {status.label}
                              <span className="anime-list-tab-count">{status.count}</span>
                            </motion.button>
                          ))}
                        </div>

                        <div className="anime-list-content">
                          {loadingList ? (
                            <LoadingSkeleton type={listView === 'grid' ? 'stats' : 'table'} />
                          ) : userRates.length > 0 ? (
                            listView === 'grid' ? (
                              <div className="anime-list-grid">
                                {userRates.map((rate, index) => (
                                  <motion.div
                                    key={rate.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.03 }}
                                  >
                                    <AnimeGridCard
                                      anime={rate}
                                      onSearch={handleAnimeSearch}
                                      isSearching={isSearching}
                                      searchId={searchLoadingId}
                                    />
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="anime-list-table-container">
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
                                    {userRates.map((rate, index) => (
                                      <motion.tr
                                        key={rate.id}
                                        className="anime-list-item"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.03 }}
                                      >
                                        <td className="anime-table-poster">
                                          <img
                                            src={rate.anime.image || 'https://shikimori.one/favicons/favicon-96x96.png'}
                                            alt={rate.anime.name}
                                            onError={(e) => {
                                              e.target.src = 'https://shikimori.one/favicons/favicon-96x96.png';
                                            }}
                                          />
                                        </td>
                                        <td className="anime-table-title">
                                          <div className="anime-title-main">{rate.anime.name}</div>
                                          <div className="anime-title-secondary">{rate.anime.name_eng}</div>
                                        </td>
                                        <td className="anime-table-type">{rate.anime.kind?.toUpperCase() || 'N/A'}</td>
                                        <td className="anime-table-episodes">
                                          {rate.episodes} / {rate.anime.episodes || '?'}
                                        </td>
                                        <td className="anime-table-score">
                                          {rate.score > 0 ? (
                                            <div className="anime-score-value" style={{ color: SCORE_COLORS[rate.score - 1] }}>
                                              {rate.score}
                                            </div>
                                          ) : (
                                            <div className="anime-score-value">—</div>
                                          )}
                                        </td>
                                        <td className="anime-table-actions">
                                          <motion.button
                                            className="anime-action-button"
                                            onClick={() => handleAnimeSearch(rate.anime.name, rate.id)}
                                            disabled={isSearching || searchLoadingId === rate.id}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            {isSearching && searchLoadingId === rate.id ? (
                                              <span className="loading-spinner-small"></span>
                                            ) : (
                                              <>
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Смотреть
                                              </>
                                            )}
                                          </motion.button>
                                        </td>
                                      </motion.tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )
                          ) : (
                            <EmptyState
                              icon={
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              }
                              title={`В списке "${getStatusDisplayName(activeStatus)}" нет аниме`}
                              message="Добавьте аниме в этот список на Shikimori или выберите другой статус"
                            />
                          )}
                        </div>

                        <motion.div
                          className="cache-info-container"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <div className="cache-info-content">
                            <div>
                              <h4 className="cache-info-title">Кэш аниме: {getCacheInfo().count} записей ({getCacheInfo().size} KB)</h4>
                              <p className="cache-info-description">Кэш ускоряет загрузку страницы и уменьшает нагрузку на API Shikimori</p>
                            </div>
                            <motion.button
                              onClick={clearAnimeCache}
                              whileHover={{ y: -3 }}
                              whileTap={{ scale: 0.95 }}
                              className="profile-action-button secondary cache-clear-button"
                            >
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Очистить кэш
                            </motion.button>
                          </div>
                        </motion.div>
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
                    >
                      <motion.div
                        className="profile-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <div className="profile-section-header">
                          <h3 className="profile-section-title">
                            <div className="profile-section-title-icon">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            Распределение оценок
                          </h3>
                        </div>

                        <div className="profile-section-content">
                          {scoreStats.length > 0 ? (
                            <div className="chart-container">
                              <div className="chart-inner">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={scoreStats}
                                    margin={{
                                      top: 20,
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
                            </div>
                          ) : (
                            <div className="empty-chart-message">
                              <p>Нет данных для отображения</p>
                            </div>
                          )}

                          <div className="stats-cards stats-summary">
                            <motion.div
                              className="stat-card summary-card"
                              whileHover={{ y: -5, scale: 1.03 }}
                            >
                              <div className="stat-card-value">
                                {scoreStats.reduce((sum, item) => sum + item.value, 0)}
                              </div>
                              <div className="stat-card-label">Всего оценок</div>
                            </motion.div>

                            <motion.div
                              className="stat-card summary-card"
                              whileHover={{ y: -5, scale: 1.03 }}
                            >
                              <div className="stat-card-value">
                                {scoreStats.length > 0
                                  ? (scoreStats.reduce((sum, item) => sum + (parseInt(item.name) * item.value), 0) /
                                    scoreStats.reduce((sum, item) => sum + item.value, 0)).toFixed(2)
                                  : '—'}
                              </div>
                              <div className="stat-card-label">Средняя оценка</div>
                            </motion.div>

                            <motion.div
                              className="stat-card summary-card"
                              whileHover={{ y: -5, scale: 1.03 }}
                            >
                              <div className="stat-card-value">
                                {scoreStats.length > 0
                                  ? scoreStats.reduce((max, item) => item.value > max.value ? item : max, { value: 0 }).name
                                  : '—'}
                              </div>
                              <div className="stat-card-label">Наиболее частая</div>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        className="profile-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <div className="profile-section-header">
                          <h3 className="profile-section-title">
                            <div className="profile-section-title-icon">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            Типы аниме
                          </h3>
                        </div>

                        <div className="profile-section-content">
                          {typeStats.length > 0 ? (
                            <div className="chart-container">
                              <div className="chart-inner">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={typeStats}
                                    margin={{
                                      top: 20,
                                      right: 30,
                                      left: 100,
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
                          ) : (
                            <div className="empty-chart-message">
                              <p>Нет данных для отображения</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="profile-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <div className="profile-section-header">
                          <h3 className="profile-section-title">
                            <div className="profile-section-title-icon">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            Настройки интеграции
                          </h3>
                        </div>

                        <div className="profile-section-content">
                          <div className="settings-section">
                            <div className="settings-option">
                              <div className="settings-option-header">
                                <h4 className="settings-option-title">Синхронизировать историю просмотров</h4>
                                <label className="settings-toggle">
                                  <input
                                    type="checkbox"
                                    checked={settings.syncHistory}
                                    onChange={() => handleSettingChange('syncHistory')}
                                  />
                                  <span className="settings-toggle-slider"></span>
                                </label>
                              </div>
                              <p className="settings-option-description">
                                Автоматически обновлять список аниме на Shikimori при просмотре через наше приложение
                              </p>
                            </div>

                            <div className="settings-option">
                              <div className="settings-option-header">
                                <h4 className="settings-option-title">Публиковать активность на Shikimori</h4>
                                <label className="settings-toggle">
                                  <input
                                    type="checkbox"
                                    checked={settings.publishActivity}
                                    onChange={() => handleSettingChange('publishActivity')}
                                  />
                                  <span className="settings-toggle-slider"></span>
                                </label>
                              </div>
                              <p className="settings-option-description">
                                Добавлять записи о просмотре в ленту активности на Shikimori
                              </p>
                            </div>

                            <div className="settings-option">
                              <div className="settings-option-header">
                                <h4 className="settings-option-title">Показывать оценки из Shikimori</h4>
                                <label className="settings-toggle">
                                  <input
                                    type="checkbox"
                                    checked={settings.showRatings}
                                    onChange={() => handleSettingChange('showRatings')}
                                  />
                                  <span className="settings-toggle-slider"></span>
                                </label>
                              </div>
                              <p className="settings-option-description">
                                Отображать оценки и статус аниме из вашего списка на Shikimori
                              </p>
                            </div>

                            <div className="settings-option">
                              <div className="settings-option-header">
                                <h4 className="settings-option-title">Уведомления</h4>
                                <label className="settings-toggle">
                                  <input
                                    type="checkbox"
                                    checked={settings.notifications}
                                    onChange={() => handleSettingChange('notifications')}
                                  />
                                  <span className="settings-toggle-slider"></span>
                                </label>
                              </div>
                              <p className="settings-option-description">
                                Получать уведомления о новых сериях отслеживаемых аниме
                              </p>
                            </div>
                          </div>

                          <div className="settings-buttons">
                            <motion.button
                              className={`settings-button primary ${!settingsChanged ? 'disabled' : ''}`}
                              onClick={saveSettings}
                              disabled={!settingsChanged}
                              whileHover={settingsChanged ? { y: -3 } : {}}
                              whileTap={settingsChanged ? { scale: 0.98 } : {}}
                            >
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Сохранить настройки
                            </motion.button>

                            <motion.button
                              className="settings-button secondary"
                              onClick={resetSettings}
                              whileHover={{ y: -3 }}
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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