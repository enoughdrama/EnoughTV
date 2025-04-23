const SHIKIMORI_BASE_URL = 'https://shikimori.one';
const SHIKIMORI_API_URL = 'https://shikimori.one/api';
const SHIKIMORI_CLIENT_ID = 'svlcpsQeaK8J5FqyXpoA5jzX9fh_eFIL_Vz1kHyII-c';
const SHIKIMORI_CLIENT_SECRET = 'tetxbbbXl4VU5H7WZZEoLPCjcCfHaSfvrFpFs4j-hw0';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

const AUTH_STORAGE_KEY = 'enoughtv_shikimori_auth';
const USER_STORAGE_KEY = 'enoughtv_shikimori_user';

export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: SHIKIMORI_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'user_rates'
  });

  return `${SHIKIMORI_BASE_URL}/oauth/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code) => {
  try {
    const response = await fetch(`${SHIKIMORI_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: SHIKIMORI_CLIENT_ID,
        client_secret: SHIKIMORI_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    saveAuthData(data);

    return data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  const authData = getAuthData();

  if (!authData || !authData.refresh_token) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${SHIKIMORI_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: SHIKIMORI_CLIENT_ID,
        client_secret: SHIKIMORI_CLIENT_SECRET,
        refresh_token: authData.refresh_token
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    saveAuthData({
      ...authData,
      ...data
    });

    return data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearAuthData();
    throw error;
  }
};

export const fetchCurrentUser = async () => {
  try {
    const response = await fetchWithAuth(`${SHIKIMORI_API_URL}/users/whoami`);

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json();
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const fetchUserInfo = async (userId) => {
  try {
    const response = await fetchWithAuth(`${SHIKIMORI_API_URL}/users/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};

export const fetchWithAuth = async (url, options = {}) => {
  let authData = getAuthData();

  if (!authData) {
    throw new Error('User not authenticated');
  }

  const now = Date.now();
  const expiresAt = authData.created_at * 1000 + authData.expires_in * 1000;

  if (now >= expiresAt) {
    try {
      authData = await refreshToken();
    } catch (error) {
      clearAuthData();
      throw new Error('Authentication expired, please log in again');
    }
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${authData.access_token}`,
    'User-Agent': 'EnoughTV/1.0',
    'Content-Type': 'application/json'
  };

  return fetch(url, {
    ...options,
    headers
  });
};

export const saveAuthData = (data) => {
  if (!data.created_at) {
    data.created_at = Math.floor(Date.now() / 1000);
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
};

export const getAuthData = () => {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const isAuthenticated = () => {
  return !!getAuthData();
};

export const getCurrentUser = () => {
  try {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const logout = () => {
  clearAuthData();
  window.location.reload();
};

export default {
  getAuthUrl,
  exchangeCodeForToken,
  refreshToken,
  fetchCurrentUser,
  fetchUserInfo,
  fetchWithAuth,
  isAuthenticated,
  getCurrentUser,
  logout
};
