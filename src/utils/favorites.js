const FAVORITES_KEY = 'anilibria_favorites';

export const getFavorites = () => {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (storedFavorites) {
      return JSON.parse(storedFavorites);
    }
  } catch (error) {
    console.error('Error loading favorites from localStorage:', error);
  }
  return {};
};

export const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
};

export const toggleFavorite = (anime) => {
  const favorites = getFavorites();
  
  if (favorites[anime.id]) {
    delete favorites[anime.id];
    saveFavorites(favorites);
    return false; // Removed from favorites
  } else {
    favorites[anime.id] = {
      id: anime.id,
      addedAt: new Date().toISOString()
    };
    saveFavorites(favorites);
    return true; // Added to favorites
  }
};

export const isInFavorites = (animeId) => {
  const favorites = getFavorites();
  return !!favorites[animeId];
};

export const getAllFavoriteIds = () => {
  const favorites = getFavorites();
  return Object.keys(favorites);
};