const searchCache = {};

export const searchShikimoriAnime = async (name) => {
  if (searchCache[name]) {
    return searchCache[name];
  }
  
  try {
    const response = await fetch(`https://shikimori.one/api/animes?search=${encodeURIComponent(name)}&limit=5`);
    
    if (!response.ok) {
      throw new Error(`Shikimori search failed: ${response.status}`);
    }
    
    const results = await response.json();
    searchCache[name] = results;
    return results;
  } catch (error) {
    console.error('Error searching Shikimori:', error);
    return [];
  }
};

export const findShikimoriId = async (anime) => {
  if (!anime || !anime.name) return null;
  
  if (anime.shikimori_id) return anime.shikimori_id;
  
  const searchName = anime.name.main || anime.name;
  const results = await searchShikimoriAnime(searchName);
  
  if (results.length === 0) {
    if (anime.name.english) {
      const englishResults = await searchShikimoriAnime(anime.name.english);
      if (englishResults.length > 0) {
        return findBestMatch(englishResults, anime);
      }
    }
    return null;
  }
  
  return findBestMatch(results, anime);
};

const findBestMatch = (results, anime) => {
  if (results.length === 1) {
    return results[0].id;
  }
  
  if (anime.year) {
    const yearMatch = results.find(result => result.aired_on && result.aired_on.startsWith(anime.year));
    if (yearMatch) {
      return yearMatch.id;
    }
  }
  
  if (anime.type && anime.type.code) {
    const typeMap = {
      'tv': 'tv',
      'movie': 'movie',
      'ova': 'ova',
      'ona': 'ona',
      'special': 'special'
    };
    
    const anilibriaType = anime.type.code.toLowerCase();
    const shikimoriType = typeMap[anilibriaType] || null;
    
    if (shikimoriType) {
      const typeMatch = results.find(result => result.kind === shikimoriType);
      if (typeMatch) {
        return typeMatch.id;
      }
    }
  }
  
  return results[0].id;
};

export const saveIdMapping = (anilibriaId, shikimoriId) => {
  try {
    const mappings = JSON.parse(localStorage.getItem('anilibria_shikimori_mappings') || '{}');
    mappings[anilibriaId] = shikimoriId;
    localStorage.setItem('anilibria_shikimori_mappings', JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to save ID mapping:', error);
  }
};

export const getShikimoriId = (anilibriaId) => {
  try {
    const mappings = JSON.parse(localStorage.getItem('anilibria_shikimori_mappings') || '{}');
    return mappings[anilibriaId] || null;
  } catch (error) {
    console.error('Failed to get ID mapping:', error);
    return null;
  }
};

export const getOrFindShikimoriId = async (anime) => {
  if (!anime || !anime.id) return null;
  
  const savedId = getShikimoriId(anime.id);
  if (savedId) return savedId;
  
  const shikimoriId = await findShikimoriId(anime);
  
  if (shikimoriId) {
    saveIdMapping(anime.id, shikimoriId);
  }
  
  return shikimoriId;
};

export default {
    searchShikimoriAnime,
    findShikimoriId,
    saveIdMapping,
    getShikimoriId,
    getOrFindShikimoriId
};