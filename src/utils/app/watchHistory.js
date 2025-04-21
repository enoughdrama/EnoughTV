// src/utils/app/watchHistory.js

/**
 * Utility for managing anime watch history in localStorage
 */
import { fetchAPI } from '../external/api';

const WATCH_HISTORY_KEY = 'enoughtv_watch_history';

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
 * Get the ID of the last episode watched for an anime
 * @param {string|number} animeId - Anime ID
 * @returns {string|null} ID of the last watched episode or null
 */
export const getLastWatchedEpisodeId = (animeId) => {
    const history = getWatchHistory();
    const animeHistory = history[animeId];
    
    if (!animeHistory || !animeHistory.episodes || Object.keys(animeHistory.episodes).length === 0) {
        return null;
    }
    
    // Find the most recently watched episode
    return Object.entries(animeHistory.episodes)
        .sort((a, b) => new Date(b[1].lastWatched) - new Date(a[1].lastWatched))
        [0][0]; // Return the episode ID
};

/**
 * Get recently watched anime list with full details by fetching from API
 * @param {number} [limit=10] - Maximum number of results
 * @returns {Promise<Array>} Promise resolving to list of recently watched anime with complete details
 */
export const getRecentlyWatchedAnime = async (limit = 10) => {
    const history = getWatchHistory();
    
    // Get basic history data sorted by last watched date
    const recentlyWatched = Object.entries(history)
        .map(([animeId, animeData]) => ({
            id: animeId,
            lastWatched: animeData.lastWatched,
            episodes: animeData.episodes
        }))
        .filter(anime => anime.lastWatched)
        .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched))
        .slice(0, limit);
    
    // Fetch full anime details for each history item
    const animeWithDetails = [];
    
    for (const item of recentlyWatched) {
        try {
            // Get the last episode ID
            const lastEpisodeId = getLastWatchedEpisodeId(item.id);
            
            // Fetch anime details from API
            const animeData = await fetchAPI(`/anime/releases/${item.id}`);
            
            if (animeData) {
                // Add watch history data to anime details
                animeWithDetails.push({
                    ...animeData,
                    lastWatched: item.lastWatched,
                    lastEpisode: lastEpisodeId,
                    progress: item.episodes?.[lastEpisodeId]?.progress || 0
                });
            }
        } catch (error) {
            console.error(`Failed to fetch details for anime ID ${item.id}:`, error);
        }
    }
    
    return animeWithDetails;
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

/**
 * Calculate time in seconds based on percentage of a given duration
 * @param {number} progressPercent - Progress percentage (0-100)
 * @param {number} duration - Total duration in seconds
 * @returns {number} Time in seconds
 */
export const calculateTimeFromProgress = (progressPercent, duration) => {
    if (!duration) return 0;
    return Math.floor((progressPercent / 100) * duration);
};

/**
 * Find the last watched or in-progress episode of an anime
 * @param {string|number} animeId - Anime ID
 * @param {Array} episodes - Array of episode objects
 * @returns {Object|null} Object containing episode info and resume data, or null if no history
 */
export const findLastWatchedEpisode = (animeId, episodes) => {
    if (!episodes || episodes.length === 0) return null;
    
    const history = getWatchHistory();
    if (!history[animeId] || !history[animeId].episodes) return null;
    
    // Sort episodes by ordinal number
    const sortedEpisodes = [...episodes].sort((a, b) => a.ordinal - b.ordinal);
    
    // First look for in-progress episodes (not completed)
    let inProgressEpisodes = [];
    
    for (const episode of sortedEpisodes) {
        const progress = history[animeId].episodes[episode.id];
        if (progress && progress.progress > 0 && progress.progress < 90 && !progress.completed) {
            inProgressEpisodes.push({
                episode: episode,
                progress: progress.progress,
                lastWatched: progress.lastWatched
            });
        }
    }
    
    // If we have in-progress episodes, return the most recently watched one
    if (inProgressEpisodes.length > 0) {
        // Sort by last watched date (newest first)
        inProgressEpisodes.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
        
        const mostRecent = inProgressEpisodes[0];
        const timeInSeconds = calculateTimeFromProgress(mostRecent.progress, mostRecent.episode.duration);
        
        return {
            episode: mostRecent.episode,
            progress: mostRecent.progress,
            time: timeInSeconds,
            isNext: false
        };
    }
    
    // If no in-progress episodes, find the next unwatched episode after the latest watched
    let lastWatchedIndex = -1;
    
    for (let i = 0; i < sortedEpisodes.length; i++) {
        const episode = sortedEpisodes[i];
        const progress = history[animeId].episodes[episode.id];
        
        if (progress && progress.completed) {
            lastWatchedIndex = i;
        } else {
            // Found first unwatched episode
            break;
        }
    }
    
    // If found a completed episode and there's a next one
    if (lastWatchedIndex !== -1 && lastWatchedIndex < sortedEpisodes.length - 1) {
        const nextEpisode = sortedEpisodes[lastWatchedIndex + 1];
        
        return {
            episode: nextEpisode,
            progress: 0,
            time: 0,
            isNext: true
        };
    }
    
    return null;
};

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatTimeMMSS = (seconds) => {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default {
    getEpisodeProgress,
    isEpisodeWatched,
    isEpisodeInProgress,
    getEpisodeProgressPercentage,
    updateEpisodeProgress,
    markEpisodeAsWatched,
    getRecentlyWatchedAnime,
    formatRelativeTime,
    findLastWatchedEpisode,
    formatTimeMMSS,
    calculateTimeFromProgress
};