const WATCH_HISTORY_KEY = 'anilibria_watch_history';

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

const saveWatchHistory = (history) => {
    try {
        localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving watch history to localStorage:', error);
    }
};

export const getEpisodeProgress = (animeId, episodeId) => {
    const history = getWatchHistory();
    return history[animeId]?.episodes?.[episodeId] || null;
};

export const isEpisodeWatched = (animeId, episodeId) => {
    const progress = getEpisodeProgress(animeId, episodeId);
    return progress?.completed === true;
};

export const isEpisodeInProgress = (animeId, episodeId) => {
    const progress = getEpisodeProgress(animeId, episodeId);
    return progress?.completed === false && progress?.progress > 0;
};

export const getEpisodeProgressPercentage = (animeId, episodeId) => {
    const progress = getEpisodeProgress(animeId, episodeId);
    return progress?.progress || 0;
};

export const getEpisodeWatchDate = (animeId, episodeId) => {
    const progress = getEpisodeProgress(animeId, episodeId);
    return progress?.lastWatched || null;
};

export const updateEpisodeProgress = (animeId, episodeId, progressPercent, completed = false) => {
    const history = getWatchHistory();

    if (!history[animeId]) {
        history[animeId] = {
            id: animeId,
            episodes: {}
        };
    }

    history[animeId].episodes[episodeId] = {
        progress: progressPercent,
        completed: completed || progressPercent >= 90,
        lastWatched: new Date().toISOString()
    };

    history[animeId].lastWatched = new Date().toISOString();

    saveWatchHistory(history);
};

export const markEpisodeAsWatched = (animeId, episodeId) => {
    updateEpisodeProgress(animeId, episodeId, 100, true);
};

export const getRecentlyWatchedAnime = (limit = 10) => {
    const history = getWatchHistory();

    return Object.values(history)
        .filter(anime => anime.lastWatched)
        .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched))
        .slice(0, limit);
};

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