import { fetchWithAuth } from './shikimoriAuth';

const SHIKIMORI_API_V2 = 'https://shikimori.one/api/v2';

export const getUserAnimeRates = async (userId, status = null) => {
  try {
    let url = `${SHIKIMORI_API_V2}/user_rates?user_id=${userId}&target_type=Anime`;
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetchWithAuth(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch user rates: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user anime rates:', error);
    throw error;
  }
};

export const findUserRate = async (userId, animeId) => {
  try {
    const allRates = await getUserAnimeRates(userId);
    return allRates.find(rate => rate.target_id === animeId && rate.target_type === 'Anime') || null;
  } catch (error) {
    console.error('Error finding user rate:', error);
    throw error;
  }
};

export const createUserRate = async (userId, animeId, status = 'planned', episodes = 0, score = 0) => {
  try {
    const response = await fetchWithAuth(`${SHIKIMORI_API_V2}/user_rates`, {
      method: 'POST',
      body: JSON.stringify({
        user_rate: {
          user_id: userId,
          target_id: animeId,
          target_type: 'Anime',
          status,
          episodes,
          score
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create user rate: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating user rate:', error);
    throw error;
  }
};

export const updateUserRate = async (rateId, updateData) => {
  try {
    const response = await fetchWithAuth(`${SHIKIMORI_API_V2}/user_rates/${rateId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        user_rate: updateData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update user rate: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user rate:', error);
    throw error;
  }
};

export const incrementEpisode = async (rateId) => {
  try {
    const response = await fetchWithAuth(`${SHIKIMORI_API_V2}/user_rates/${rateId}/increment`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to increment episode: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error incrementing episode:', error);
    throw error;
  }
};

export const deleteUserRate = async (rateId) => {
  try {
    const response = await fetchWithAuth(`${SHIKIMORI_API_V2}/user_rates/${rateId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user rate: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting user rate:', error);
    throw error;
  }
};

export const getOrCreateUserRate = async (userId, animeId, defaultStatus = 'planned') => {
  try {
    const existingRate = await findUserRate(userId, animeId);

    if (existingRate) {
      return existingRate;
    }

    return await createUserRate(userId, animeId, defaultStatus);
  } catch (error) {
    console.error('Error in getOrCreateUserRate:', error);
    throw error;
  }
};

export const syncEpisodeProgress = async (userId, animeId, episodeNumber, totalEpisodes = null) => {
  try {
    const userRate = await getOrCreateUserRate(userId, animeId, 'watching');

    let newStatus = userRate.status;

    if (episodeNumber === 1 && userRate.status === 'planned') {
      newStatus = 'watching';
    } else if (totalEpisodes && episodeNumber >= totalEpisodes) {
      newStatus = 'completed';
    } else if (userRate.status !== 'watching' && userRate.status !== 'rewatching') {
      newStatus = 'watching';
    }

    return await updateUserRate(userRate.id, {
      status: newStatus,
      episodes: episodeNumber
    });
  } catch (error) {
    console.error('Error syncing episode progress:', error);
    throw error;
  }
};

export const addAnimeToList = async (userId, animeId, status = 'planned') => {
  try {
    const existingRate = await findUserRate(userId, animeId);

    if (existingRate) {
      return await updateUserRate(existingRate.id, { status });
    }

    return await createUserRate(userId, animeId, status);
  } catch (error) {
    console.error('Error adding anime to list:', error);
    throw error;
  }
};

export const getStatusDisplayName = (status) => {
  const statusMap = {
    'planned': 'Запланировано',
    'watching': 'Смотрю',
    'rewatching': 'Пересматриваю',
    'completed': 'Просмотрено',
    'on_hold': 'Отложено',
    'dropped': 'Брошено'
  };

  return statusMap[status] || status;
};