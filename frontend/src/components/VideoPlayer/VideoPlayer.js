import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, createRippleEffect } from '../../utils/helpers';
import { fixImagePath, cleanHlsUrl } from '../../utils/api';
import {
  updateEpisodeProgress,
  getEpisodeProgressPercentage,
  isEpisodeWatched,
  isEpisodeInProgress
} from '../../utils/watchHistory';

import '../../styles/videoPlayer.css';
import '../../styles/videoPlayer-episodesSelector.css';

const VideoPlayer = ({ episode, onClose, animeId, allEpisodes = [] }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(null);
  const [isHlsLoaded, setIsHlsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [bufferedPercentage, setBufferedPercentage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isProgressActive, setIsProgressActive] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showEpisodesPanel, setShowEpisodesPanel] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(episode);
  const [nextEpisode, setNextEpisode] = useState(null);
  const [showNextEpisodeNotification, setShowNextEpisodeNotification] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  const savedTimeRef = useRef(null);
  const progressSaveIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeSliderRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const volumePopupTimeoutRef = useRef(null);
  const lastPauseTimeRef = useRef(0);
  const nextEpisodeTimeoutRef = useRef(null);

  const sortedEpisodes = [...(allEpisodes || [])].sort((a, b) => a.ordinal - b.ordinal);

  useEffect(() => {
    if (!currentEpisode || !sortedEpisodes.length) return;

    const currentEpisodeIndex = sortedEpisodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentEpisodeIndex !== -1 && currentEpisodeIndex < sortedEpisodes.length - 1) {
      setNextEpisode(sortedEpisodes[currentEpisodeIndex + 1]);
    } else {
      setNextEpisode(null);
    }
  }, [currentEpisode, sortedEpisodes]);

  useEffect(() => {
    if (episode && episode.id !== currentEpisode?.id) {
      setCurrentEpisode(episode);
      savedTimeRef.current = null;
    }
  }, [episode]);

  const getHlsUrls = () => {
    if (!currentEpisode) return {};

    return {
      '480p': currentEpisode.hls_480 ? cleanHlsUrl(fixImagePath(currentEpisode.hls_480)) : null,
      '720p': currentEpisode.hls_720 ? cleanHlsUrl(fixImagePath(currentEpisode.hls_720)) : null,
      '1080p': currentEpisode.hls_1080 ? cleanHlsUrl(fixImagePath(currentEpisode.hls_1080)) : null,
    };
  };

  const getDefaultQuality = () => {
    const hlsUrls = getHlsUrls();
    if (hlsUrls['1080p']) return '1080p';
    if (hlsUrls['720p']) return '720p';
    if (hlsUrls['480p']) return '480p';
    return null;
  };

  useEffect(() => {
    if (animeId && currentEpisode?.id) {
      const savedProgress = getEpisodeProgressPercentage(animeId, currentEpisode.id);
      if (savedProgress > 0 && savedProgress < 90) {
        savedTimeRef.current = savedProgress;
      }
    }
  }, [animeId, currentEpisode]);

  useEffect(() => {
    if (!currentQuality) {
      setCurrentQuality(getDefaultQuality());
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (playerRef.current && !playerRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (!isHlsLoaded && !window.Hls) {
      setIsLoading(true);
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.async = true;

      script.onload = () => {
        setIsHlsLoaded(true);
        setIsLoading(false);
      };

      script.onerror = () => {
        setError('Не удалось загрузить HLS плеер');
        setIsLoading(false);
      };

      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } else if (window.Hls) {
      setIsHlsLoaded(true);
      setIsLoading(false);
    }
  }, []);

  const getCurrentUrl = () => {
    const hlsUrls = getHlsUrls();
    if (currentQuality && hlsUrls[currentQuality]) {
      return hlsUrls[currentQuality];
    }
    return hlsUrls[getDefaultQuality()];
  };

  useEffect(() => {
    if (!isHlsLoaded || !currentEpisode || !currentQuality) return;

    const videoElement = videoRef.current;
    if (!videoElement) return;

    setIsLoading(true);
    const currentUrl = getCurrentUrl();

    if (!currentUrl) {
      setError('Источник видео недоступен');
      setIsLoading(false);
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const oldTime = videoElement.currentTime;

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hls.loadSource(currentUrl);
      hls.attachMedia(videoElement);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);

        // If we have a saved position, try to seek to it
        if (savedTimeRef.current !== null && videoElement.duration) {
          const targetTime = (savedTimeRef.current / 100) * videoElement.duration;
          if (targetTime > 0 && targetTime < videoElement.duration - 10) {
            videoElement.currentTime = targetTime;
            savedTimeRef.current = null;
          }
        }

        videoElement.play().catch(error => {
          console.error('Error playing video:', error);
        });
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError('Ошибка воспроизведения видео');
              setIsLoading(false);
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = currentUrl;
      videoElement.addEventListener('loadedmetadata', () => {
        setIsLoading(false);

        if (savedTimeRef.current !== null && videoElement.duration) {
          const targetTime = (savedTimeRef.current / 100) * videoElement.duration;
          if (targetTime > 0 && targetTime < videoElement.duration - 10) {
            videoElement.currentTime = targetTime;
            savedTimeRef.current = null;
          }
        }

        videoElement.play().catch(error => {
          console.error('Error playing video:', error);
          setError('Ошибка воспроизведения видео');
        });
      });

      videoElement.addEventListener('error', () => {
        setError('Ошибка воспроизведения видео');
        setIsLoading(false);
      });
    } else {
      setError('HLS не поддерживается в этом браузере');
      setIsLoading(false);
    }

    setupProgressTracking();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      clearProgressTrackingInterval();
    };
  }, [currentEpisode, currentQuality, isHlsLoaded]);

  const setupProgressTracking = () => {
    if (progressSaveIntervalRef.current) {
      clearInterval(progressSaveIntervalRef.current);
    }

    progressSaveIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && video.duration && animeId && currentEpisode?.id) {
        const progressPercent = Math.floor((video.currentTime / video.duration) * 100);

        if (progressPercent >= 5 && progressPercent < 95) {
          updateEpisodeProgress(animeId, currentEpisode.id, progressPercent, false);
        }
        else if (progressPercent >= 95) {
          updateEpisodeProgress(animeId, currentEpisode.id, 100, true);
        }
      }
    }, 5000);
  };

  const clearProgressTrackingInterval = () => {
    if (progressSaveIntervalRef.current) {
      clearInterval(progressSaveIntervalRef.current);
      progressSaveIntervalRef.current = null;
    }

    const video = videoRef.current;
    if (video && video.duration && animeId && currentEpisode?.id) {
      const progressPercent = Math.floor((video.currentTime / video.duration) * 100);
      if (progressPercent >= 5 && progressPercent < 95) {
        updateEpisodeProgress(animeId, currentEpisode.id, progressPercent, false);
      } else if (progressPercent >= 95) {
        updateEpisodeProgress(animeId, currentEpisode.id, 100, true);
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      if (nextEpisode && video.duration && video.currentTime > video.duration * 0.85) {
        setShowNextEpisodeNotification(true);
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      lastPauseTimeRef.current = video.currentTime;
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercentage = (bufferedEnd / video.duration) * 100;
        setBufferedPercentage(bufferedPercentage);
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      if (animeId && currentEpisode?.id) {
        updateEpisodeProgress(animeId, currentEpisode.id, 100, true);

        if (autoplayEnabled && nextEpisode) {
          clearTimeout(nextEpisodeTimeoutRef.current);
          nextEpisodeTimeoutRef.current = setTimeout(() => {
            playNextEpisode();
          }, 1500);
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [animeId, currentEpisode, nextEpisode, autoplayEnabled]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    displayVolumePopup();
  };

  const handleVolumeChange = (e) => {
    const rect = volumeSliderRef.current.getBoundingClientRect();
    const pos = 1 - ((e.clientY - rect.top) / volumeSliderRef.current.offsetHeight);
    const newVolume = Math.max(0, Math.min(1, pos));

    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      video.muted = newVolume === 0;
    }

    displayVolumePopup();
  };

  const displayVolumePopup = () => {
    setShowVolumePopup(true);
    clearTimeout(volumePopupTimeoutRef.current);

    volumePopupTimeoutRef.current = setTimeout(() => {
      setShowVolumePopup(false);
    }, 1500);
  };

  const seekTo = (e) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;

    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / progressBar.offsetWidth;
    video.currentTime = pos * video.duration;
    createRippleEffect(e, progressBar);

    setIsProgressActive(true);
    setTimeout(() => {
      setIsProgressActive(false);
    }, 1000);
  };

  const handleProgressHover = (e) => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / progressBar.offsetWidth;
    const time = pos * duration;

    setHoverTime(formatTime(time));
    setHoverPosition(e.clientX - rect.left);
  };

  const resetProgressHover = () => {
    setHoverTime(null);
  };

  const toggleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;

    if (!document.fullscreenElement) {
      player.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
      document.exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const handleQualityChange = (quality) => {
    if (quality === currentQuality) return;

    if (videoRef.current) {
      savedTimeRef.current = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    }

    setCurrentQuality(quality);
    setShowQualityMenu(false);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);

    clearTimeout(controlsTimeoutRef.current);

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const toggleKeyboardShortcuts = () => {
    setShowKeyboardShortcuts(!showKeyboardShortcuts);
  };

  const playNextEpisode = () => {
    if (!nextEpisode) return;

    setCurrentEpisode(nextEpisode);
    setShowNextEpisodeNotification(false);

    const nextEpisodeIndex = sortedEpisodes.findIndex(ep => ep.id === nextEpisode.id);
    if (nextEpisodeIndex !== -1 && nextEpisodeIndex < sortedEpisodes.length - 1) {
      setNextEpisode(sortedEpisodes[nextEpisodeIndex + 1]);
    } else {
      setNextEpisode(null);
    }

    clearTimeout(nextEpisodeTimeoutRef.current);
  };

  const switchToEpisode = (episode) => {
    setCurrentEpisode(episode);
    setShowEpisodesPanel(false);
    clearTimeout(nextEpisodeTimeoutRef.current);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showQualityMenu && !e.target.closest('.anilibria-player-quality-menu')) {
        setShowQualityMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQualityMenu]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoRef.current.currentTime -= 10;
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoRef.current.currentTime += 10;
          break;
        case 'ArrowUp':
          e.preventDefault();
          videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
          displayVolumePopup();
          break;
        case 'ArrowDown':
          e.preventDefault();
          videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
          displayVolumePopup();
          break;
        case '?':
          e.preventDefault();
          toggleKeyboardShortcuts();
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          setShowEpisodesPanel(!showEpisodesPanel);
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          if (nextEpisode) {
            playNextEpisode();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextEpisode, showEpisodesPanel]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(controlsTimeoutRef.current);
      clearTimeout(volumePopupTimeoutRef.current);
      clearTimeout(nextEpisodeTimeoutRef.current);
      clearProgressTrackingInterval();

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    clearProgressTrackingInterval();

    onClose();
  };

  if (!currentEpisode) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const renderQualitySelector = () => {
    const hlsUrls = getHlsUrls();
    const availableQualities = [];

    if (hlsUrls['1080p']) availableQualities.push('1080p');
    if (hlsUrls['720p']) availableQualities.push('720p');
    if (hlsUrls['480p']) availableQualities.push('480p');

    if (availableQualities.length === 0) return null;

    const qualityLabel = currentQuality || 'auto';

    return (
      <div className="anilibria-player-quality-menu">
        <motion.button
          className="anilibria-player-quality-button"
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {qualityLabel}
          <span className={`anilibria-player-quality-icon ${showQualityMenu ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </motion.button>

        <AnimatePresence>
          {showQualityMenu && (
            <motion.div
              className="anilibria-player-quality-dropdown"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              {availableQualities.map(quality => (
                <div
                  key={quality}
                  className={`anilibria-player-quality-option ${currentQuality === quality ? 'active' : ''}`}
                  onClick={() => handleQualityChange(quality)}
                >
                  {quality}
                  {currentQuality === quality && (
                    <span className="quality-check">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderEpisodesButton = () => {
    if (!sortedEpisodes || sortedEpisodes.length <= 1) return null;

    return (
      <motion.button
        className={`anilibria-player-episodes-button ${showControls ? 'visible' : ''}`}
        onClick={() => setShowEpisodesPanel(!showEpisodesPanel)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
    );
  };

  const renderEpisodesPanel = () => {
    if (!sortedEpisodes || sortedEpisodes.length <= 1) return null;

    return (
      <div className={`anilibria-player-episodes-panel ${showEpisodesPanel ? 'visible' : ''}`}>
        <div className="anilibria-player-episodes-header">
          <div className="anilibria-player-episodes-title">Список эпизодов</div>
          <button
            className="anilibria-player-episodes-close"
            onClick={() => setShowEpisodesPanel(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="anilibria-player-episodes-list">
          {sortedEpisodes.map(ep => {
            const isActive = currentEpisode.id === ep.id;
            const isWatched = isEpisodeWatched(animeId, ep.id);
            const isInProgress = isEpisodeInProgress(animeId, ep.id);

            return (
              <div
                key={ep.id}
                className={`anilibria-player-episode-item ${isActive ? 'active' : ''}`}
                onClick={() => switchToEpisode(ep)}
              >
                <div className="anilibria-player-episode-number">{ep.ordinal}</div>
                <div className="anilibria-player-episode-info">
                  <div className="anilibria-player-episode-name">
                    {ep.name || `Эпизод ${ep.ordinal}`}
                  </div>
                  <div className="anilibria-player-episode-meta">
                    {ep.duration && (
                      <div className="anilibria-player-episode-duration">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {Math.floor(ep.duration / 60)}:{(ep.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                    {isWatched ? (
                      <div className="anilibria-player-episode-status watched">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Просмотрено
                      </div>
                    ) : isInProgress ? (
                      <div className="anilibria-player-episode-status in-progress">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15.9998 12.0005H12.0005M12.0005 12.0005H8.00134M12.0005 12.0005V8.00134M12.0005 12.0005V15.9998M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        В процессе
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="anilibria-player-autoplay-toggle">
          <span className="anilibria-player-autoplay-label">Автовоспроизведение</span>
          <label className="anilibria-player-autoplay-switch">
            <input
              type="checkbox"
              checked={autoplayEnabled}
              onChange={() => setAutoplayEnabled(!autoplayEnabled)}
            />
            <span className="anilibria-player-autoplay-slider"></span>
          </label>
        </div>
      </div>
    );
  };

  const renderNextEpisodeNotification = () => {
    if (!nextEpisode || !showNextEpisodeNotification) return null;

    return (
      <div className="anilibria-player-next-episode visible">
        <div className="anilibria-player-next-info">
          <div className="anilibria-player-next-title">Следующий эпизод:</div>
          <div className="anilibria-player-next-name">
            {nextEpisode.name || `Эпизод ${nextEpisode.ordinal}`}
          </div>
        </div>
        <button
          className="anilibria-player-next-button"
          onClick={playNextEpisode}
        >
          Смотреть
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <motion.div
      className="anilibria-player-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="anilibria-player"
        ref={playerRef}
        onMouseMove={() => showControlsTemporarily()}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          playsInline
          className={`anilibria-player-video ${isLoading ? 'hidden' : ''}`}
        />

        {isLoading && (
          <div className="anilibria-player-spinner">
            <div className="spinner-inner"></div>
          </div>
        )}

        <motion.button
          className={`anilibria-player-big-play-button ${!isPlaying ? 'visible' : ''}`}
          onClick={togglePlay}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </motion.button>

        {renderEpisodesButton()}
        {renderEpisodesPanel()}
        {renderNextEpisodeNotification()}

        <div className={`anilibria-player-top-gradient ${showControls ? 'visible' : ''}`}></div>
        <div className={`anilibria-player-video-title ${showControls ? 'visible' : ''}`}>
          {currentEpisode.name || `Эпизод ${currentEpisode.ordinal}`}
        </div>

        {showKeyboardShortcuts && (
          <motion.div
            className="anilibria-player-keyboard-shortcuts visible"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3>Горячие клавиши</h3>
            <div className="anilibria-player-shortcut-grid">
              <div className="anilibria-player-key">Space</div>
              <div>Воспроизведение / Пауза</div>
              <div className="anilibria-player-key">K</div>
              <div>Воспроизведение / Пауза</div>
              <div className="anilibria-player-key">M</div>
              <div>Выключить / Включить звук</div>
              <div className="anilibria-player-key">F</div>
              <div>Полноэкранный режим</div>
              <div className="anilibria-player-key">E</div>
              <div>Список эпизодов</div>
              <div className="anilibria-player-key">N</div>
              <div>Следующий эпизод</div>
              <div className="anilibria-player-key">←</div>
              <div>Перемотка -10с</div>
              <div className="anilibria-player-key">→</div>
              <div>Перемотка +10с</div>
              <div className="anilibria-player-key">↑</div>
              <div>Громкость +10%</div>
              <div className="anilibria-player-key">↓</div>
              <div>Громкость -10%</div>
              <div className="anilibria-player-key">?</div>
              <div>Показать/Скрыть это меню</div>
              <div className="anilibria-player-key">Esc</div>
              <div>Закрыть плеер</div>
            </div>
          </motion.div>
        )}

        <motion.div
          className={`anilibria-player-control-container ${showControls ? 'active' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="anilibria-player-controls-wrapper">
            <motion.button
              className="anilibria-player-control-button"
              onClick={togglePlay}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg viewBox="0 0 24 24">
                {isPlaying ? (
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </motion.button>

            <div className="anilibria-player-volume-container">
              <motion.button
                className="anilibria-player-control-button"
                onClick={toggleMute}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg viewBox="0 0 24 24">
                  {isMuted || volume === 0 ? (
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  ) : volume < 0.5 ? (
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  ) : (
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  )}
                </svg>
              </motion.button>

              <div className="anilibria-player-volume-slider-container">
                <div
                  className="anilibria-player-volume-slider"
                  ref={volumeSliderRef}
                  onClick={handleVolumeChange}
                  onMouseMove={(e) => e.buttons === 1 && handleVolumeChange(e)}
                >
                  <div
                    className="anilibria-player-volume-level"
                    style={{ height: `${volume * 100}%` }}
                  ></div>
                </div>
                <AnimatePresence>
                  {showVolumePopup && (
                    <motion.div
                      className="anilibria-player-volume-popup active"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      {Math.round(volume * 100)}%
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div
              className="anilibria-player-progress-container"
              onMouseMove={handleProgressHover}
              onMouseLeave={resetProgressHover}
            >
              <div
                className={`anilibria-player-progress-bar ${isProgressActive ? 'active' : ''}`}
                ref={progressBarRef}
                onClick={seekTo}
              >
                <div
                  className="anilibria-player-buffer-bar"
                  style={{ width: `${bufferedPercentage}%` }}
                ></div>
                <div
                  className="anilibria-player-progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
                <div
                  className="anilibria-player-progress-thumb"
                  style={{ left: `${progress}%` }}
                ></div>

                <AnimatePresence>
                  {hoverTime && (
                    <motion.div
                      className="anilibria-player-progress-hover-time"
                      style={{ left: `${hoverPosition}px` }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      {hoverTime}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="anilibria-player-time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {!error && !isLoading && renderQualitySelector()}

            <motion.button
              className="anilibria-player-control-button"
              onClick={togglePictureInPicture}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.9 2 1.9h18c1.1 0 2-.9 2-1.9V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z" />
              </svg>
            </motion.button>

            <motion.button
              className="anilibria-player-control-button"
              onClick={toggleFullscreen}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                ) : (
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                )}
              </svg>
            </motion.button>

            <motion.button
              className="anilibria-player-control-button close-button"
              onClick={handleClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {error && (
        <motion.div
          className="anilibria-player-error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="anilibria-player-error-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p>{error}</p>
          <motion.button
            onClick={handleClose}
            className="button primary-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Закрыть
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoPlayer;