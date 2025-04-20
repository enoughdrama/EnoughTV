// src/utils/helpers.js

/**
 * Constants for page navigation
 */
export const PAGES = {
  HOME: 'HOME',
  SCHEDULE: 'SCHEDULE',
  SEARCH: 'SEARCH',
  ANIME_DETAILS: 'ANIME_DETAILS',
  VIDEO_PLAYER: 'VIDEO_PLAYER'
};

/**
 * Formats time in seconds to MM:SS format
 * @param {number} timeInSeconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return '0:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

/**
 * Creates ripple effect for interactive elements
 * @param {Event} e - Click event
 * @param {HTMLElement} element - Element to apply ripple to
 * @param {string} rippleClass - Class name for the ripple element
 */
export const createRippleEffect = (e, element, rippleClass = 'ripple-effect') => {
  const ripple = document.createElement('div');
  ripple.className = rippleClass;
  
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  ripple.style.width = ripple.style.height = `${size}px`;
  
  if (element.classList.contains('control-button') || element.classList.contains('icon-button')) {
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.marginLeft = `${-size/2}px`;
    ripple.style.marginTop = `${-size/2}px`;
  } else {
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    ripple.style.marginLeft = `${-size/2}px`;
    ripple.style.marginTop = `${-size/2}px`;
  }
  
  element.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
};

/**
 * Loads a script dynamically
 * @param {string} src - Script source URL
 * @returns {Promise} - Promise resolving when script is loaded
 */
export const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.body.appendChild(script);
  });
};

/**
 * Checks whether dark mode should be enabled by default
 * @returns {boolean} - Whether dark mode should be enabled
 */
export const shouldEnableDarkMode = () => {
  const savedMode = localStorage.getItem('darkMode');
  
  if (savedMode !== null) {
    return savedMode === 'true';
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export default {
  PAGES,
  formatTime,
  createRippleEffect,
  loadScript,
  shouldEnableDarkMode
};