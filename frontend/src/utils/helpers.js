export const PAGES = {
    HOME: 'HOME',
    SCHEDULE: 'SCHEDULE',
    SEARCH: 'SEARCH',
    ANIME_DETAILS: 'ANIME_DETAILS',
    VIDEO_PLAYER: 'VIDEO_PLAYER'
  };

  export const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

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