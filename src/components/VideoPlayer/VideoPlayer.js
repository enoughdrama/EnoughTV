import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, createRippleEffect } from '../../utils/helpers.js';
import { fixImagePath, cleanHlsUrl } from '../../utils/api.js';
import {
  updateEpisodeProgress,
  getEpisodeProgressPercentage,
  isEpisodeWatched,
  isEpisodeInProgress
} from '../../utils/watchHistory.js';

import '../../styles/videoPlayer.css';
import '../../styles/videoPlayer-episodesSelector.css';
import '../../styles/videoPlayer-openingSkip.css';

const VideoPlayer = ({ episode, onClose, animeId, allEpisodes = [] }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(null);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [isHlsLoaded, setIsHlsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingQuality, setLoadingQuality] = useState(false);
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
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [uiReady, setUiReady] = useState(false);
  const [hasWatchedFivePercent, setHasWatchedFivePercent] = useState(false);

  const [targetTime, setTargetTime] = useState(null);
  const [isWaitingForSeek, setIsWaitingForSeek] = useState(false);

  const [isInOpening, setIsInOpening] = useState(false);
  const [isInEnding, setIsInEnding] = useState(false);
  const [showSkipNotification, setShowSkipNotification] = useState(false);
  const [skipType, setSkipType] = useState('');
  const [autoSkipEnabled, setAutoSkipEnabled] = useState(true);
  const [skipProgress, setSkipProgress] = useState(0);
  const [skipOpState, setSkipOpState] = useState({});

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
  const timeUpdateInitializedRef = useRef(false);
  const playPromiseRef = useRef(null);
  const startTimeAppliedRef = useRef(false);
  const loadingTimeoutRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const bufferHoleRecoveryRef = useRef(false);
  const qualityChangeInProgressRef = useRef(false);
  const skipTimerRef = useRef(null);
  const skipStartTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const lastSkipCheckTimeRef = useRef(0);
  const skippedSegmentsRef = useRef(new Set());
  const seekRetryTimeoutRef = useRef(null);
  const seekRetryCountRef = useRef(0);
  const initialTimeRef = useRef(0);
  const watchedDurationRef = useRef(0);

  const isInOpeningRef = useRef(false);
  const isInEndingRef = useRef(false);
  const checkForOpeningEndingRef = useRef(() => { });
  const isSeekingRef = useRef(false);
  const previousEpisodeIdRef = useRef(null);

  const sortedEpisodes = [...(allEpisodes || [])].sort((a, b) => a.ordinal - b.ordinal);

  useEffect(() => {
    isInOpeningRef.current = isInOpening;
    console.log("isInOpening state changed:", isInOpening);
  }, [isInOpening]);

  useEffect(() => {
    isInEndingRef.current = isInEnding;
  }, [isInEnding]);

  useEffect(() => {
    if (targetTime !== null && duration > 0) {
      setCurrentTime(targetTime);
    }
  }, [targetTime, duration]);

  const retrySeek = (targetPosition) => {
    const video = videoRef.current;
    if (!video) return;

    if (seekRetryCountRef.current >= 5) {
      console.log("Too many seek retries, giving up");
      seekRetryCountRef.current = 0;
      setIsWaitingForSeek(false);
      return;
    }

    seekRetryCountRef.current++;

    try {
      console.log(`Retry seek attempt ${seekRetryCountRef.current} to ${targetPosition}`);
      video.currentTime = targetPosition;

      setTimeout(() => {
        if (isWaitingForSeek && Math.abs(video.currentTime - targetPosition) > 1) {
          retrySeek(targetPosition);
        } else {
          setIsWaitingForSeek(false);
          seekRetryCountRef.current = 0;
        }
      }, 200);
    } catch (e) {
      console.error("Error during seek retry:", e);
      setIsWaitingForSeek(false);
      seekRetryCountRef.current = 0;
    }
  };

  const resetSkipState = () => {
    console.log("Resetting skip state - current values:", {
      isInOpening,
      isInEnding,
      showSkipNotification,
      skipType
    });

    setIsInOpening(false);
    setIsInEnding(false);
    setShowSkipNotification(false);
    setSkipType('');
    setSkipProgress(0);

    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  useEffect(() => {
    checkForOpeningEndingRef.current = () => {
      const video = videoRef.current;
      if (!video || !currentEpisode) return;

      const currentSeconds = Math.floor(video.currentTime);

      if (Math.abs(currentSeconds - lastSkipCheckTimeRef.current) < 1) {
        return;
      }

      lastSkipCheckTimeRef.current = currentSeconds;

      const opening = currentEpisode.opening || {};
      const ending = currentEpisode.ending || {};

      const openingKey = `${currentEpisode.id}_opening`;
      const endingKey = `${currentEpisode.id}_ending`;
      const wasOpeningSkipped = skippedSegmentsRef.current.has(openingKey);
      const wasEndingSkipped = skippedSegmentsRef.current.has(endingKey);

      const isInOpeningRange = opening.start && opening.stop &&
        currentSeconds >= opening.start &&
        currentSeconds < opening.stop &&
        !wasOpeningSkipped;

      const isInEndingRange = ending.start && ending.stop &&
        currentSeconds >= ending.start &&
        currentSeconds < ending.stop &&
        !wasEndingSkipped;

      console.log(`Checking openings/endings: time=${currentSeconds}, isInOpening=${isInOpeningRef.current}, isInOpeningRange=${isInOpeningRange}`);

      if (isInOpeningRange) {
        if (!isInOpeningRef.current) {
          console.log("Opening detected at:", currentSeconds, opening);
          console.log("Setting isInOpening to true");
          setIsInOpening(true);
          setShowSkipNotification(true);
          setSkipType('opening');

          if (autoSkipEnabled) {
            startSkipTimer(skipOpening);
          }
        }
      }

      else if (isInEndingRange) {
        if (!isInEndingRef.current) {
          console.log("Ending detected at:", currentSeconds, ending);
          console.log("Setting isInEnding to true");
          setIsInEnding(true);
          setShowSkipNotification(true);
          setSkipType('ending');

          if (autoSkipEnabled) {
            startSkipTimer(skipEnding);
          }
        }
      }
      else if (
        (isInOpeningRef.current && !isInOpeningRange) ||
        (isInEndingRef.current && !isInEndingRange)
      ) {
        console.log("Exiting opening/ending at", currentSeconds, ", resetting state");
        resetSkipState();
      }
    };
  }, [autoSkipEnabled, currentEpisode]);

  const startSkipTimer = (skipFunction, duration = 5000) => {
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setSkipProgress(0);
    skipStartTimeRef.current = Date.now();

    const updateProgressBar = () => {
      const elapsed = Date.now() - skipStartTimeRef.current;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setSkipProgress(newProgress);

      if (newProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgressBar);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgressBar);
    skipTimerRef.current = setTimeout(() => {
      skipFunction();
    }, duration);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setUiReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
    if (currentEpisode && currentEpisode.id !== episode?.id) {
      // Handling episode change
      if (previousEpisodeIdRef.current && animeId) {
        // Save progress for previous episode if at least 5% was watched
        if (hasWatchedFivePercent) {
          const video = videoRef.current;
          if (video && video.duration) {
            const progressPercent = Math.floor((video.currentTime / video.duration) * 100);
            if (progressPercent >= 5 && progressPercent < 95) {
              updateEpisodeProgress(animeId, previousEpisodeIdRef.current, progressPercent, false);
            } else if (progressPercent >= 95) {
              updateEpisodeProgress(animeId, previousEpisodeIdRef.current, 100, true);
            }
          }
        }
      }
      
      // Reset for new episode
      setCurrentEpisode(episode);
      previousEpisodeIdRef.current = episode?.id;
      savedTimeRef.current = null;
      timeUpdateInitializedRef.current = false;
      startTimeAppliedRef.current = false;
      setIsVideoReady(false);
      setHasAttemptedPlay(false);
      setRecoveryAttempts(0);
      bufferHoleRecoveryRef.current = false;
      resetSkipState();
      skippedSegmentsRef.current = new Set();
      setHasWatchedFivePercent(false);
      initialTimeRef.current = 0;
      watchedDurationRef.current = 0;
    }
  }, [episode, hasWatchedFivePercent, animeId]);

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

  const skipOpening = () => {
    const video = videoRef.current;
    if (!video || !currentEpisode?.opening?.stop) return;

    try {
      console.log("Skipping opening to:", currentEpisode.opening.stop + 0.5);
      if (currentEpisode?.id) {
        const key = `${currentEpisode.id}_opening`;
        skippedSegmentsRef.current.add(key);
      }

      setIsInOpening(false);
      setShowSkipNotification(false);

      setTargetTime(currentEpisode.opening.stop + 0.5);
      setIsWaitingForSeek(true);
      seekRetryCountRef.current = 0;

      video.currentTime = currentEpisode.opening.stop + 0.5;

      setTimeout(() => {
        if (isWaitingForSeek) {
          retrySeek(currentEpisode.opening.stop + 0.5);
        }
      }, 200);

      setTimeout(() => {
        resetSkipState();
      }, 300);
    } catch (e) {
      console.error("Error skipping opening:", e);
      resetSkipState();
    }
  };

  const skipEnding = () => {
    const video = videoRef.current;
    if (!video || !currentEpisode?.ending?.stop) return;

    try {
      console.log("Skipping ending to:", currentEpisode.ending.stop + 0.5);
      if (currentEpisode?.id) {
        const key = `${currentEpisode.id}_ending`;
        skippedSegmentsRef.current.add(key);
      }

      setIsInEnding(false);
      setShowSkipNotification(false);

      setTargetTime(currentEpisode.ending.stop + 0.5);
      setIsWaitingForSeek(true);
      seekRetryCountRef.current = 0;

      video.currentTime = currentEpisode.ending.stop + 0.5;

      setTimeout(() => {
        if (isWaitingForSeek) {
          retrySeek(currentEpisode.ending.stop + 0.5);
        }
      }, 200);

      setTimeout(() => {
        resetSkipState();
      }, 300);
    } catch (e) {
      console.error("Error skipping ending:", e);
      resetSkipState();
    }
  };

  const continueWatching = () => {
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
    }
    resetSkipState();
  };

  const handleSeek = () => {
    isSeekingRef.current = false;
    setIsWaitingForSeek(false);

    const video = videoRef.current;
    if (!video || !currentEpisode) return;

    const currentSeconds = Math.floor(video.currentTime);
    const opening = currentEpisode.opening || {};
    const ending = currentEpisode.ending || {};

    if ((isInOpening && (currentSeconds < opening.start || currentSeconds >= opening.stop)) ||
      (isInEnding && (currentSeconds < ending.start || currentSeconds >= ending.stop))) {
      resetSkipState();
    }

    checkForOpeningEndingRef.current();
  };

  useEffect(() => {
    const hlsUrls = getHlsUrls();
    const qualities = [];

    if (hlsUrls['1080p']) qualities.push('1080p');
    if (hlsUrls['720p']) qualities.push('720p');
    if (hlsUrls['480p']) qualities.push('480p');

    setAvailableQualities(qualities);

    if (!currentQuality && qualities.length > 0) {
      setCurrentQuality(qualities[0]);
    }
  }, [currentEpisode]);

  useEffect(() => {
    if (currentEpisode?.startTime > 0) {
      savedTimeRef.current = currentEpisode.startTime;
    } else if (animeId && currentEpisode?.id) {
      const progress = getEpisodeProgressPercentage(animeId, currentEpisode.id);
      if (progress > 0 && progress < 90 && currentEpisode.duration) {
        savedTimeRef.current = Math.floor((progress / 100) * currentEpisode.duration);
      }
    }
  }, [currentEpisode, animeId]);

  const applyStartTime = () => {
    const video = videoRef.current;
    if (!video || !isVideoReady || startTimeAppliedRef.current) return;

    const startTime = savedTimeRef.current;
    if (startTime && startTime > 0 && video.duration && startTime < (video.duration - 10)) {
      try {
        setTargetTime(startTime);
        setIsWaitingForSeek(true);
        seekRetryCountRef.current = 0;

        video.currentTime = startTime;
        startTimeAppliedRef.current = true;

        setTimeout(() => {
          if (Math.abs(video.currentTime - startTime) > 1) {
            retrySeek(startTime);
          } else {
            setIsWaitingForSeek(false);
          }
        }, 200);
      } catch (e) {
        console.error("Error setting start time:", e);
        setIsWaitingForSeek(false);
      }
    } else {
      video.currentTime = 0;
      startTimeAppliedRef.current = true;
    }
  };

  const handleVideoReady = () => {
    setIsVideoReady(true);
    setIsLoading(false);
    setLoadingQuality(false);
    qualityChangeInProgressRef.current = false;
    applyStartTime();

    if (!hasAttemptedPlay) {
      attemptPlay();
    }
    
    // Store initial time when video is ready
    if (videoRef.current) {
      initialTimeRef.current = videoRef.current.currentTime;
    }
  };

  const attemptPlay = () => {
    const video = videoRef.current;
    if (!video) return;

    setHasAttemptedPlay(true);

    if (playPromiseRef.current) {
      return;
    }

    try {
      clearTimeout(loadingTimeoutRef.current);
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromiseRef.current = playPromise;

        playPromise
          .then(() => {
            setIsPlaying(true);
            playPromiseRef.current = null;
          })
          .catch(err => {
            playPromiseRef.current = null;
            if (err.name !== 'AbortError') {
              console.error('Play error:', err);
            }
          });
      }
    } catch (err) {
      console.error('Error during play attempt:', err);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => handleVideoReady();
    const handleLoadedMetadata = () => {
      if (video.duration) {
        setDuration(video.duration);
        handleVideoReady();
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleVideoReady);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleVideoReady);
    };
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
    if (!currentQuality) {
      setCurrentQuality(getDefaultQuality());
    }
  }, []);

  useEffect(() => {
    if (!isHlsLoaded || !currentEpisode || !currentQuality) return;

    const videoElement = videoRef.current;
    if (!videoElement) return;

    const wasPlaying = !videoElement.paused;
    const currentPlaybackTime = videoElement.currentTime || savedTimeRef.current || 0;

    setIsLoading(true);
    setLoadingQuality(true);
    qualityChangeInProgressRef.current = true;

    if (currentPlaybackTime) {
      savedTimeRef.current = currentPlaybackTime;
    }

    clearTimeout(loadingTimeoutRef.current);
    clearTimeout(initTimeoutRef.current);

    const currentUrl = getCurrentUrl();
    if (!currentUrl) {
      setError('Источник видео недоступен');
      setIsLoading(false);
      setLoadingQuality(false);
      qualityChangeInProgressRef.current = false;
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading && hlsRef.current) {
        console.log("Forcing HLS to start loading");
        hlsRef.current.startLoad();
      }
    }, 5000);

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 30 * 1000 * 1000, // 30MB
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 3,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 5,
        startFragPrefetch: true,
        progressive: true,
        lowLatencyMode: false,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000
      });

      hls.on(window.Hls.Events.MEDIA_ATTACHED, () => {
        console.log("HLS Media attached");
        hls.loadSource(currentUrl);
      });

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS Manifest parsed");

        if (savedTimeRef.current && savedTimeRef.current > 0) {
          try {
            setTargetTime(savedTimeRef.current);
            setIsWaitingForSeek(true);
            seekRetryCountRef.current = 0;

            videoElement.currentTime = savedTimeRef.current;

            setTimeout(() => {
              if (isWaitingForSeek) {
                retrySeek(savedTimeRef.current);
              }
            }, 200);
          } catch (e) {
            console.error("Error setting initial time:", e);
            setIsWaitingForSeek(false);
          }
        }

        setIsLoading(false);
        setLoadingQuality(false);
        qualityChangeInProgressRef.current = false;

        if (wasPlaying) {
          setTimeout(() => {
            try {
              const playPromise = videoElement.play();
              if (playPromise !== undefined) {
                playPromise.catch(err => {
                  if (err.name !== 'AbortError') {
                    console.error('Resume play error:', err);
                  }
                });
              }
            } catch (err) {
              console.error('Error resuming playback:', err);
            }
          }, 300);
        }
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data.type, data.details);

        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.log("HLS network error - trying to recover");
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.log("HLS media error - trying to recover");
              hls.recoverMediaError();
              break;
            default:
              if (recoveryAttempts < 3) {
                console.log("Fatal error - attempt:", recoveryAttempts + 1);
                setRecoveryAttempts(prev => prev + 1);
                hls.destroy();
                initPlayer();
              } else {
                console.log("Too many recovery attempts, giving up");
                hls.destroy();
                setError('Ошибка воспроизведения видео');
                setIsLoading(false);
                setLoadingQuality(false);
                qualityChangeInProgressRef.current = false;
              }
              break;
          }
        } else if (data.details === 'bufferSeekOverHole') {
          if (!bufferHoleRecoveryRef.current) {
            bufferHoleRecoveryRef.current = true;
            console.log("Buffer hole detected, applying fix");

            setTimeout(() => {
              if (videoElement && videoElement.readyState >= 2) {
                try {
                  videoElement.currentTime = Math.max(0.5, videoElement.currentTime - 0.5);
                } catch (e) {
                  console.error("Error fixing buffer hole:", e);
                }
              }
            }, 300);
          }
        }
      });

      hlsRef.current = hls;
      hls.attachMedia(videoElement);

    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = currentUrl;

      const handleNativeLoaded = () => {
        if (savedTimeRef.current && savedTimeRef.current > 0) {
          try {
            setTargetTime(savedTimeRef.current);
            setIsWaitingForSeek(true);
            seekRetryCountRef.current = 0;

            videoElement.currentTime = savedTimeRef.current;

            setTimeout(() => {
              if (isWaitingForSeek) {
                retrySeek(savedTimeRef.current);
              }
            }, 200);
          } catch (e) {
            console.error("Error setting time on native HLS:", e);
            setIsWaitingForSeek(false);
          }
        }

        setIsLoading(false);
        setLoadingQuality(false);
        qualityChangeInProgressRef.current = false;

        if (wasPlaying) {
          try {
            videoElement.play();
          } catch (e) {
            console.error("Error playing native HLS:", e);
          }
        }

        videoElement.removeEventListener('loadedmetadata', handleNativeLoaded);
      };

      videoElement.addEventListener('loadedmetadata', handleNativeLoaded);

      videoElement.addEventListener('error', (e) => {
        console.error("Native HLS error:", e);
        setError('Ошибка воспроизведения видео');
        setIsLoading(false);
        setLoadingQuality(false);
        qualityChangeInProgressRef.current = false;
      });
    } else {
      setError('HLS не поддерживается в этом браузере');
      setIsLoading(false);
      setLoadingQuality(false);
      qualityChangeInProgressRef.current = false;
    }

    setupProgressTracking();

    return () => {
      clearTimeout(loadingTimeoutRef.current);
      clearTimeout(initTimeoutRef.current);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      clearProgressTrackingInterval();
    };
  }, [currentEpisode, currentQuality, isHlsLoaded]);

  const initPlayer = () => {
    console.log("Initializing player after recovery attempt");
    const videoElement = videoRef.current;
    if (!videoElement || !currentQuality) return;

    const currentUrl = getCurrentUrl();
    if (!currentUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.5
      });

      hls.attachMedia(videoElement);

      hls.on(window.Hls.Events.MEDIA_ATTACHED, () => {
        console.log("Recovery: Media attached");
        hls.loadSource(currentUrl);
      });

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log("Recovery: Manifest parsed");
        setIsLoading(false);
        setLoadingQuality(false);

        if (savedTimeRef.current && savedTimeRef.current > 0) {
          try {
            setTargetTime(savedTimeRef.current);
            setIsWaitingForSeek(true);
            seekRetryCountRef.current = 0;

            videoElement.currentTime = savedTimeRef.current;

            setTimeout(() => {
              if (isWaitingForSeek) {
                retrySeek(savedTimeRef.current);
              }
            }, 200);
          } catch (e) {
            console.error("Recovery: Error setting time:", e);
            setIsWaitingForSeek(false);
          }
        }

        setTimeout(() => {
          try {
            videoElement.play()
              .catch(err => console.error("Recovery: Play error:", err));
          } catch (e) {
            console.error("Recovery: Error playing:", e);
          }
          qualityChangeInProgressRef.current = false;
        }, 300);
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        console.error("Recovery: HLS error:", data.type, data.details);

        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Recovery: Network error - restarting load");
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Recovery: Media error - attempting recovery");
              hls.recoverMediaError();
              break;
            default:
              console.log("Recovery: Fatal error - giving up");
              hls.destroy();
              setError('Не удалось восстановить воспроизведение');
              setIsLoading(false);
              setLoadingQuality(false);
              qualityChangeInProgressRef.current = false;
              break;
          }
        }
      });

      hlsRef.current = hls;
    }
  };

  const setupProgressTracking = () => {
    if (progressSaveIntervalRef.current) {
      clearInterval(progressSaveIntervalRef.current);
    }

    // Reset tracking state for the new episode
    setHasWatchedFivePercent(false);
    watchedDurationRef.current = 0;
    
    const video = videoRef.current;
    if (video) {
      initialTimeRef.current = video.currentTime || 0;
    }

    progressSaveIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.duration || !animeId || !currentEpisode?.id) return;

      // Calculate watched percentage in this session
      const currentTime = video.currentTime;
      const watchedDuration = Math.max(0, currentTime - initialTimeRef.current);
      watchedDurationRef.current = watchedDuration;
      
      const watchedPercentInSession = (watchedDuration / video.duration) * 100;
      const progressPercent = Math.floor((currentTime / video.duration) * 100);

      // Mark as having watched 5% if threshold reached
      if (watchedPercentInSession >= 5 && !hasWatchedFivePercent) {
        console.log("User has watched 5% of video, marking watched status as valid");
        setHasWatchedFivePercent(true);
      }

      // Update progress only if user has watched at least 5%
      if (hasWatchedFivePercent) {
        if (progressPercent >= 5 && progressPercent < 95) {
          updateEpisodeProgress(animeId, currentEpisode.id, progressPercent, false);
        } else if (progressPercent >= 95) {
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

    // Final progress update when leaving the player
    const video = videoRef.current;
    if (video && video.duration && animeId && currentEpisode?.id) {
      // Calculate watched percentage in this session
      const watchedDuration = watchedDurationRef.current;
      const watchedPercentInSession = (watchedDuration / video.duration) * 100;
      const progressPercent = Math.floor((video.currentTime / video.duration) * 100);

      // Update progress only if user has watched at least 5%
      if (hasWatchedFivePercent || watchedPercentInSession >= 5) {
        if (progressPercent >= 5 && progressPercent < 95) {
          updateEpisodeProgress(animeId, currentEpisode.id, progressPercent, false);
        } else if (progressPercent >= 95) {
          updateEpisodeProgress(animeId, currentEpisode.id, 100, true);
        }
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isWaitingForSeek && !isSeekingRef.current) {
        setCurrentTime(video.currentTime);
      }

      if (!timeUpdateInitializedRef.current) {
        timeUpdateInitializedRef.current = true;

        if (currentEpisode && currentEpisode.startTime > 0 &&
          Math.abs(video.currentTime - currentEpisode.startTime) > 1 &&
          video.currentTime < 5) {
          video.currentTime = currentEpisode.startTime;
        }
      }

      // Update watched duration for progress tracking
      if (initialTimeRef.current !== undefined) {
        const watchedDuration = Math.max(0, video.currentTime - initialTimeRef.current);
        watchedDurationRef.current = watchedDuration;
        
        // Check if user has crossed the 5% watch threshold
        if (video.duration) {
          const watchedPercentInSession = (watchedDuration / video.duration) * 100;
          if (watchedPercentInSession >= 5 && !hasWatchedFivePercent) {
            console.log("User has watched 5% of video, marking watched status as valid");
            setHasWatchedFivePercent(true);
          }
        }
      }

      const currentSeconds = Math.floor(video.currentTime);
      const opening = currentEpisode?.opening || {};

      if (opening.start && opening.stop &&
        currentSeconds >= opening.start && currentSeconds < opening.stop) {
        console.log(`Time update: ${currentSeconds}, isInOpening: ${isInOpeningRef.current}`);
      }

      checkForOpeningEndingRef.current();

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

    const handleSeeking = () => {
      isSeekingRef.current = true;
    };

    const handleEnded = () => {
      // When video ends, update progress to 100% only if we've watched at least 5%
      if (animeId && currentEpisode?.id) {
        if (hasWatchedFivePercent) {
          updateEpisodeProgress(animeId, currentEpisode.id, 100, true);
        }

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
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeek);

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
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeek);
    };
  }, [animeId, currentEpisode, nextEpisode, autoplayEnabled, hasWatchedFivePercent]);

  useEffect(() => {
    timeUpdateInitializedRef.current = false;
    startTimeAppliedRef.current = false;
  }, [currentEpisode]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playPromiseRef.current) {
      return;
    }

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromiseRef.current = playPromise;

        playPromise
          .then(() => {
            playPromiseRef.current = null;
          })
          .catch(err => {
            playPromiseRef.current = null;
            if (err.name !== 'AbortError') {
              console.error('Play error:', err);
            }
          });
      }
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
    const targetPosition = pos * video.duration;

    setTargetTime(targetPosition);
    setIsWaitingForSeek(true);
    isSeekingRef.current = true;
    seekRetryCountRef.current = 0;

    if (seekRetryTimeoutRef.current) {
      clearTimeout(seekRetryTimeoutRef.current);
    }

    try {
      video.currentTime = targetPosition;

      seekRetryTimeoutRef.current = setTimeout(() => {
        if (isWaitingForSeek && Math.abs(video.currentTime - targetPosition) > 1) {
          retrySeek(targetPosition);
        }
      }, 200);
    } catch (e) {
      console.error("Error during seek:", e);
      setIsWaitingForSeek(false);
    }

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

    if (qualityChangeInProgressRef.current) {
      console.log("Quality change already in progress, ignoring");
      return;
    }

    if (videoRef.current) {
      savedTimeRef.current = videoRef.current.currentTime;
      qualityChangeInProgressRef.current = true;
    }

    console.log(`Changing quality from ${currentQuality} to ${quality}`);
    setCurrentQuality(quality);
    setShowQualityMenu(false);
    setLoadingQuality(true);

    setTimeout(() => {
      if (loadingQuality) {
        console.log("Safety timeout: resetting loading state");
        setLoadingQuality(false);
        qualityChangeInProgressRef.current = false;
      }
    }, 10000);
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

  useEffect(() => {
    const topGradient = document.querySelector('.enoughtv-player-top-gradient');
    const videoTitle = document.querySelector('.enoughtv-player-video-title');

    if (topGradient && videoTitle) {
      if (showControls) {
        topGradient.classList.add('visible');
        videoTitle.classList.add('visible');
      } else {
        topGradient.classList.remove('visible');
        videoTitle.classList.remove('visible');
      }
    }
  }, [showControls]);

  const toggleKeyboardShortcuts = () => {
    setShowKeyboardShortcuts(!showKeyboardShortcuts);
  };

  const playNextEpisode = () => {
    if (!nextEpisode) return;

    // Store previous episode ID before changing
    previousEpisodeIdRef.current = currentEpisode?.id;
    
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
    // Store previous episode ID before changing
    previousEpisodeIdRef.current = currentEpisode?.id;
    
    setCurrentEpisode(episode);
    setShowEpisodesPanel(false);
    clearTimeout(nextEpisodeTimeoutRef.current);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showQualityMenu && !e.target.closest('.enoughtv-player-quality-menu')) {
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
          showControlsTemporarily();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          showControlsTemporarily();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          showControlsTemporarily();
          break;
        case 'ArrowLeft':
          e.preventDefault();

          const newTimeLeft = Math.max(0, videoRef.current.currentTime - 10);
          setTargetTime(newTimeLeft);
          setIsWaitingForSeek(true);
          isSeekingRef.current = true;
          seekRetryCountRef.current = 0;

          videoRef.current.currentTime = newTimeLeft;

          setTimeout(() => {
            if (isWaitingForSeek && Math.abs(videoRef.current.currentTime - newTimeLeft) > 1) {
              retrySeek(newTimeLeft);
            }
          }, 200);

          showControlsTemporarily();
          break;
        case 'ArrowRight':
          e.preventDefault();

          const newTimeRight = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
          setTargetTime(newTimeRight);
          setIsWaitingForSeek(true);
          isSeekingRef.current = true;
          seekRetryCountRef.current = 0;

          videoRef.current.currentTime = newTimeRight;

          setTimeout(() => {
            if (isWaitingForSeek && Math.abs(videoRef.current.currentTime - newTimeRight) > 1) {
              retrySeek(newTimeRight);
            }
          }, 200);

          showControlsTemporarily();
          break;
        case 'ArrowUp':
          e.preventDefault();
          videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
          displayVolumePopup();
          showControlsTemporarily();
          break;
        case 'ArrowDown':
          e.preventDefault();
          videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
          displayVolumePopup();
          showControlsTemporarily();
          break;
        case '?':
          e.preventDefault();
          toggleKeyboardShortcuts();
          showControlsTemporarily();
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          setShowEpisodesPanel(!showEpisodesPanel);
          showControlsTemporarily();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          if (nextEpisode) {
            playNextEpisode();
          }
          showControlsTemporarily();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          if (isInOpeningRef.current) {
            skipOpening();
          } else if (isInEndingRef.current) {
            skipEnding();
          }
          showControlsTemporarily();
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
      clearTimeout(loadingTimeoutRef.current);
      clearTimeout(initTimeoutRef.current);
      clearTimeout(seekRetryTimeoutRef.current);
      if (skipTimerRef.current) {
        clearTimeout(skipTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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

  const renderSkipNotification = () => {
    if (!showSkipNotification) return null;

    console.log(`Rendering skip notification. Type: ${skipType}, isInOpening: ${isInOpeningRef.current}, isInEnding: ${isInEndingRef.current}`);

    return (
      <div className="enoughtv-player-skip-notification visible">
        <div className="enoughtv-player-skip-info">
          <div className="enoughtv-player-skip-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="enoughtv-player-skip-text">
            <div className="enoughtv-player-skip-title">
              {skipType === 'opening' ? 'Опенинг' : 'Эндинг'}
            </div>
            <div className="enoughtv-player-skip-subtitle">
              Автопропуск через 5 секунд
            </div>
          </div>
        </div>

        <div className="enoughtv-player-skip-progress">
          <div
            className="enoughtv-player-skip-progress-fill"
            style={{ width: `${skipProgress}%` }}
          ></div>
        </div>

        <div className="enoughtv-player-skip-buttons">
          <button
            className="enoughtv-player-skip-button"
            onClick={skipType === 'opening' ? skipOpening : skipEnding}
          >
            Пропустить
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="enoughtv-player-watch-button"
            onClick={continueWatching}
          >
            Смотреть
          </button>
        </div>
      </div>
    );
  };

  const renderQualitySelector = () => {
    if (availableQualities.length === 0) return null;

    const qualityLabel = currentQuality || 'auto';

    return (
      <div className="enoughtv-player-quality-menu">
        <motion.button
          className={`enoughtv-player-quality-button ${loadingQuality ? 'loading' : ''}`}
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loadingQuality}
        >
          {loadingQuality ? (
            <div className="quality-loading-indicator">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.75V6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.127 6.87293L16.072 7.92801" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.25 12L17.75 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.127 17.127L16.072 16.072" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 19.25V17.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.873 17.127L7.928 16.072" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.75 12L6.25 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.873 6.87293L7.928 7.92801" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : qualityLabel}
          <span className={`enoughtv-player-quality-icon ${showQualityMenu ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </motion.button>

        <AnimatePresence>
          {showQualityMenu && !loadingQuality && (
            <motion.div
              className="enoughtv-player-quality-dropdown"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              {availableQualities.map(quality => (
                <div
                  key={quality}
                  className={`enoughtv-player-quality-option ${currentQuality === quality ? 'active' : ''}`}
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
        className={`enoughtv-player-episodes-button ${showControls ? 'visible' : ''}`}
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
      <div className={`enoughtv-player-episodes-panel ${showEpisodesPanel ? 'visible' : ''}`}>
        <div className="enoughtv-player-episodes-header">
          <div className="enoughtv-player-episodes-title">Список эпизодов</div>
          <button
            className="enoughtv-player-episodes-close"
            onClick={() => setShowEpisodesPanel(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="enoughtv-player-episodes-list">
          {sortedEpisodes.map(ep => {
            const isActive = currentEpisode.id === ep.id;
            const isWatched = isEpisodeWatched(animeId, ep.id);
            const isInProgress = isEpisodeInProgress(animeId, ep.id);

            return (
              <div
                key={ep.id}
                className={`enoughtv-player-episode-item ${isActive ? 'active' : ''}`}
                onClick={() => switchToEpisode(ep)}
              >
                <div className="enoughtv-player-episode-number">{ep.ordinal}</div>
                <div className="enoughtv-player-episode-info">
                  <div className="enoughtv-player-episode-name">
                    {ep.name || `Эпизод ${ep.ordinal}`}
                  </div>
                  <div className="enoughtv-player-episode-meta">
                    {ep.duration && (
                      <div className="enoughtv-player-episode-duration">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {Math.floor(ep.duration / 60)}:{(ep.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                    {isWatched ? (
                      <div className="enoughtv-player-episode-status watched">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Просмотрено
                      </div>
                    ) : isInProgress ? (
                      <div className="enoughtv-player-episode-status in-progress">
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
        <div className="enoughtv-player-autoplay-toggle">
          <span className="enoughtv-player-autoplay-label">Автовоспроизведение</span>
          <label className="enoughtv-player-autoplay-switch">
            <input
              type="checkbox"
              checked={autoplayEnabled}
              onChange={() => setAutoplayEnabled(!autoplayEnabled)}
            />
            <span className="enoughtv-player-autoplay-slider"></span>
          </label>
        </div>
        <div className="enoughtv-player-autoplay-toggle">
          <span className="enoughtv-player-autoplay-label">Автопропуск опенингов/эндингов</span>
          <label className="enoughtv-player-autoplay-switch">
            <input
              type="checkbox"
              checked={autoSkipEnabled}
              onChange={() => setAutoSkipEnabled(!autoSkipEnabled)}
            />
            <span className="enoughtv-player-autoplay-slider"></span>
          </label>
        </div>
      </div>
    );
  };

  const renderNextEpisodeNotification = () => {
    if (!nextEpisode || !showNextEpisodeNotification) return null;

    return (
      <div className="enoughtv-player-next-episode visible">
        <div className="enoughtv-player-next-info">
          <div className="enoughtv-player-next-title">Следующий эпизод:</div>
          <div className="enoughtv-player-next-name">
            {nextEpisode.name || `Эпизод ${nextEpisode.ordinal}`}
          </div>
        </div>
        <button
          className="enoughtv-player-next-button"
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

  const renderPlayerControls = () => {
    return (
      <motion.div
        className={`enoughtv-player-control-container ${showControls ? 'active' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="enoughtv-player-controls-wrapper">
          <motion.button
            className="enoughtv-player-control-button"
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

          <div className="enoughtv-player-volume-container">
            <motion.button
              className="enoughtv-player-control-button"
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

            <div className="enoughtv-player-volume-slider-container">
              <div
                className="enoughtv-player-volume-slider"
                ref={volumeSliderRef}
                onClick={handleVolumeChange}
                onMouseMove={(e) => e.buttons === 1 && handleVolumeChange(e)}
              >
                <div
                  className="enoughtv-player-volume-level"
                  style={{ height: `${volume * 100}%` }}
                ></div>
              </div>
              <AnimatePresence>
                {showVolumePopup && (
                  <motion.div
                    className="enoughtv-player-volume-popup active"
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
            className="enoughtv-player-progress-container"
            onMouseMove={handleProgressHover}
            onMouseLeave={resetProgressHover}
          >
            <div
              className={`enoughtv-player-progress-bar ${isProgressActive ? 'active' : ''}`}
              ref={progressBarRef}
              onClick={seekTo}
            >
              <div
                className="enoughtv-player-buffer-bar"
                style={{ width: `${bufferedPercentage}%` }}
              ></div>
              <div
                className="enoughtv-player-progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
              <div
                className="enoughtv-player-progress-thumb"
                style={{
                  left: `${progress}%`,
                  transform: `translate(-50%, -50%) scale(${isProgressActive || showControls ? 1 : 0})`
                }}
              ></div>
            </div>

            <AnimatePresence>
              {hoverTime && (
                <motion.div
                  className="enoughtv-player-progress-hover-time"
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

          <div className="enoughtv-player-time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="enoughtv-player-quality-wrapper">
            {renderQualitySelector()}
          </div>

          <motion.button
            className="enoughtv-player-control-button"
            onClick={togglePictureInPicture}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.9 2 1.9h18c1.1 0 2-.9 2-1.9V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z" />
            </svg>
          </motion.button>

          <motion.button
            className="enoughtv-player-control-button"
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
            className="enoughtv-player-control-button close-button"
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
    );
  };

  if (!currentEpisode) return null;

  const displayTime = isWaitingForSeek ? targetTime : currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <motion.div
      className={`enoughtv-player-container ${uiReady ? 'ui-ready' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="enoughtv-player"
        ref={playerRef}
        onMouseMove={() => showControlsTemporarily()}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === e.currentTarget || e.target.tagName === 'VIDEO') {
            togglePlay();
          }
        }}
        onDoubleClick={(e) => {
          if (e.target === e.currentTarget || e.target.tagName === 'VIDEO') {
            toggleFullscreen();
          }
        }}
      >
        <video
          ref={videoRef}
          playsInline
          className={`enoughtv-player-video ${isLoading ? 'loading' : ''}`}
        />

        {isLoading && (
          <div className="enoughtv-player-spinner">
            <div className="spinner-inner">
              <div className="spinner-circle"></div>
            </div>
          </div>
        )}

        <motion.button
          className={`enoughtv-player-big-play-button ${!isPlaying && !isLoading ? 'visible' : ''}`}
          onClick={togglePlay}
        >
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </motion.button>

        {renderEpisodesButton()}
        {renderEpisodesPanel()}
        {renderNextEpisodeNotification()}
        {renderSkipNotification()}

        <motion.div
          className={`enoughtv-player-top-gradient ${showControls ? 'visible' : ''}`}
          animate={{
            opacity: showControls ? 1 : 0,
            y: showControls ? 0 : -10
          }}
          transition={{ duration: 0.3 }}
        ></motion.div>
        <motion.div
          className={`enoughtv-player-video-title ${showControls ? 'visible' : ''}`}
          animate={{
            opacity: showControls ? 1 : 0,
            y: showControls ? 0 : -10
          }}
          transition={{ duration: 0.3 }}
        >
          {currentEpisode.name || `Эпизод ${currentEpisode.ordinal}`}
        </motion.div>

        {showKeyboardShortcuts && (
          <motion.div
            className="enoughtv-player-keyboard-shortcuts visible"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3>Горячие клавиши</h3>
            <div className="enoughtv-player-shortcut-grid">
              <div className="enoughtv-player-key">Space</div>
              <div>Воспроизведение / Пауза</div>
              <div className="enoughtv-player-key">K</div>
              <div>Воспроизведение / Пауза</div>
              <div className="enoughtv-player-key">M</div>
              <div>Выключить / Включить звук</div>
              <div className="enoughtv-player-key">F</div>
              <div>Полноэкранный режим</div>
              <div className="enoughtv-player-key">E</div>
              <div>Список эпизодов</div>
              <div className="enoughtv-player-key">N</div>
              <div>Следующий эпизод</div>
              <div className="enoughtv-player-key">S</div>
              <div>Пропустить опенинг/эндинг</div>
              <div className="enoughtv-player-key">←</div>
              <div>Перемотка -10с</div>
              <div className="enoughtv-player-key">→</div>
              <div>Перемотка +10с</div>
              <div className="enoughtv-player-key">↑</div>
              <div>Громкость +10%</div>
              <div className="enoughtv-player-key">↓</div>
              <div>Громкость -10%</div>
              <div className="enoughtv-player-key">?</div>
              <div>Показать/Скрыть это меню</div>
              <div className="enoughtv-player-key">Esc</div>
              <div>Закрыть плеер</div>
            </div>
          </motion.div>
        )}

        {renderPlayerControls()}
      </div>

      {error && (
        <motion.div
          className="enoughtv-player-error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="enoughtv-player-error-icon">
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