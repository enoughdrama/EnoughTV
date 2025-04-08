// src/utils/watchHistory.js

/**
 * Utility for managing anime watch history in localStorage
 */

const WATCH_HISTORY_KEY = 'anilibria_watch_history';

/**
 * Initialize watch history from localStorage or create if not exists
 * @returns {Object} Watch history object
 */
const getWatchHistory = () => {
    try {
        const storedHistory = localStorage.getItem(WATCH_HISTORY_KEY);
        if (storedHistory) {
            return JSON.parse(storedHistory);
        }
    } catch (error) {
        console.error('Error loading watch history from localStorage:', error);
    }

    return {};
};

/**
 * Save watch history to localStorage
 * @param {Object} history - Watch history object
 */
const saveWatchHistory = (history) => {
    try {
        localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving watch history to localStorage:', error);
    }
};

/**
 * Get episode watch progress
 * @param {string|number} animeId - Anime ID
 * @param {string|number} episodeId - Episode ID
 * @returns {Object|null} Episode watch data or null if not found
 */
export const getEpisodeProgress = (animeId, episodeId) => {
    const history = getWatchHistory();
    return history[animeId]?.episodes?.[episodeId] || null;
};

/**
 * Check if episode is watched
 * @param {string|number} animeId - Anime ID
 * @param {string|number} episodeId - Episode ID
 * @returns {boolean} True if episode is fully watched
 */
export const isEpisodeWatched = (animeId, episodeId) => {
    const progress = getEpisodeProgress(animeId, episodeId);
    return progress?.completed === true;
};

/**
 * Check if episode is in progress
 * @param {string|number} animeId - Anime ID
 * @param {string|number} episodeId - Episode ID
 * @returns {boolean} True if episode is partially watched
 */
export const isEpisodeInProgress = (animeId, episodeId) => {
    const progress = getEpisodeProgress(animeId, episodeId);
    return progress?.completed === false && progress?.progress > 0;
};

/**
 * Get episode progress percentage
 * @param {string|number} animeId - Anime ID
 * @param {string|number} episodeId - Episode ID
 * @returns {number} Progress percentage (0-100) or 0 if not found
 */
export const getEpisodeProgressPercentage = (animeId, episodeId) => {
    const progress = getEpisodeProgress(animeId, episodeId);
    return progress?.progress || 0;
};

/**
 * Get episode watch date
 * @param {string|number} animeId - Anime ID
 * @param {string|number} episodeId - Episode ID
 * @returns {string|null} Date string or null if not found
 */
export const getEpisodeWatchDate = (animeId, episodeId) => {
    const progress = getEpisodeProgress(animeId, episodeId);
    return progress?.lastWatched || null;
};

/**
 * Update episode watch progress
 * @param {string|number} animeId - Anime ID
 * @param {string|number} episodeId - Episode ID
 * @param {number} progressPercent - Watch progress percentage (0-100)
 * @param {boolean} [completed=false] - Whether episode is completely watched
 */
export const updateEpisodeProgress = (animeId, episodeId, progressPercent, completed = false) => {
    const history = getWatchHistory();

    // Initialize anime in history if not exists
    if (!history[animeId]) {
        history[animeId] = {
            id: animeId,
            episodes: {}
        };
    }

    // Initialize or update episode progress
    history[animeId].episodes[episodeId] = {
        progress: progressPercent,
        completed: completed || progressPercent >= 90, // Auto-mark as completed if progress >= 90%
        lastWatched: new Date().toISOString()
    };

    // Update last watched anime
    history[animeId].lastWatched = new Date().toISOString();

    saveWatchHistory(history);
};

/**
 * Mark episode as watched
 * @param {string|number} animeId - Anime ID
 * @param {string|number} episodeId - Episode ID
 */
export const markEpisodeAsWatched = (animeId, episodeId) => {
    updateEpisodeProgress(animeId, episodeId, 100, true);
};

/**
 * Get recently watched anime list
 * @param {number} [limit=10] - Maximum number of results
 * @returns {Array} List of recently watched anime with their IDs and dates
 */
export const getRecentlyWatchedAnime = (limit = 10) => {
    const history = getWatchHistory();

    return Object.values(history)
        .filter(anime => anime.lastWatched)
        .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched))
        .slice(0, limit);
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
        return date.toLocaleDateString('ru-RU');
    } else if (diffDay > 0) {
        return `${diffDay} ${pluralize(diffDay, 'день', 'дня', 'дней')} назад`;
    } else if (diffHour > 0) {
        return `${diffHour} ${pluralize(diffHour, 'час', 'часа', 'часов')} назад`;
    } else if (diffMin > 0) {
        return `${diffMin} ${pluralize(diffMin, 'минуту', 'минуты', 'минут')} назад`;
    } else {
        return 'Только что';
    }
};

/**
 * Helper for correct Russian pluralization
 */
const pluralize = (count, form1, form2, form5) => {
    const remainder10 = count % 10;
    const remainder100 = count % 100;

    if (remainder10 === 1 && remainder100 !== 11) {
        return form1;
    } else if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 10 || remainder100 >= 20)) {
        return form2;
    } else {
        return form5;
    }
};

export default {
    getEpisodeProgress,
    isEpisodeWatched,
    isEpisodeInProgress,
    getEpisodeProgressPercentage,
    updateEpisodeProgress,
    markEpisodeAsWatched,
    getRecentlyWatchedAnime,
    formatRelativeTime
};