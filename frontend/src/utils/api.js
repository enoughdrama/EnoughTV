const API_BASE_URL = 'https://anilibria.top/api/v1';
const SITE_URL = 'https://anilibria.top';

export const fixImagePath = (path?: string | null): string => {
  if (!path) return '';

  try {
    new URL(path);
    return path;
  } catch {
    if (path.startsWith('/storage')) {
      return `${SITE_URL.replace(/\/$/, '')}${path}`;
    }
    
    if (path.startsWith('/')) {
      return `${SITE_URL.replace(/\/$/, '')}${path}`;
    }
    
    return path;
  }
};

export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    return null;
  }
};

export const cleanHlsUrl = (url) => {
  if (!url) return '';
  return url.split('?')[0];
};

export const getHlsUrls = (episode) => {
  return {
    '480p': episode?.hls_480 ? cleanHlsUrl(fixImagePath(episode.hls_480)) : null,
    '720p': episode?.hls_720 ? cleanHlsUrl(fixImagePath(episode.hls_720)) : null,
    '1080p': episode?.hls_1080 ? cleanHlsUrl(fixImagePath(episode.hls_1080)) : null,
  };
};

export const getDefaultQuality = (hlsUrls) => {
  if (hlsUrls['1080p']) return '1080p';
  if (hlsUrls['720p']) return '720p';
  if (hlsUrls['480p']) return '480p';
  return null;
};

export const fetchFranchiseData = async (releaseId) => {
  if (!releaseId) return null;
  try {
    return await fetchAPI(`/anime/franchises/release/${releaseId}`);
  } catch (error) {
    console.error('Failed to fetch franchise data:', error);
    return null;
  }
};

export const fetchFranchiseDetails = async (franchiseId) => {
  if (!franchiseId) return null;
  try {
    return await fetchAPI(`/anime/franchises/${franchiseId}`);
  } catch (error) {
    console.error('Failed to fetch franchise details:', error);
    return null;
  }
};

export const fetchRandomFranchises = async (limit = 4) => {
  try {
    return await fetchAPI(`/anime/franchises/random?limit=${limit}`);
  } catch (error) {
    console.error('Failed to fetch random franchises:', error);
    return null;
  }
};

export const formatFranchiseDuration = (seconds) => {
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

export const PAGES = {
  HOME: 'HOME',
  SCHEDULE: 'SCHEDULE',
  SEARCH: 'SEARCH',
  ANIME_DETAILS: 'ANIME_DETAILS',
  VIDEO_PLAYER: 'VIDEO_PLAYER',
  FRANCHISES: 'FRANCHISES'
};