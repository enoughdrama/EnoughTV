import React from 'react';
import { motion } from 'framer-motion';
import { fixImagePath } from '../../utils/external/api';
import {
  isEpisodeWatched,
  isEpisodeInProgress,
  getEpisodeProgressPercentage,
  getEpisodeWatchDate,
  formatRelativeTime
} from '../../utils/app/watchHistory';

import './styles/episode-list.css';

const EpisodeItem = ({
  episode,
  selectedEpisode,
  onSelectEpisode,
  index,
  animeId,
  isWatchedOnShikimori = false
}) => {
  const isSelected = selectedEpisode && selectedEpisode.id === episode.id;

  // Fix image path
  const thumbnailSrc = episode.preview?.src
    ? fixImagePath(episode.preview.src)
    : '/api/placeholder/320/180';

  // Get episode watch status from localStorage
  const isWatched = isEpisodeWatched(animeId, episode.id);
  const isInProgress = isEpisodeInProgress(animeId, episode.id);
  const watchProgress = getEpisodeProgressPercentage(animeId, episode.id);

  // Get the date when episode was last watched
  const watchDate = getEpisodeWatchDate(animeId, episode.id);
  const formattedWatchDate = watchDate ? formatRelativeTime(watchDate) : 'Не просмотрено';

  // Display a "NEW" tag for episodes added within the last 7 days
  // This is a placeholder since we don't have actual release dates
  const isRecentlyAdded = episode.updated_at &&
    (new Date() - new Date(episode.updated_at)) / (1000 * 60 * 60 * 24) < 7;

  const handleEpisodeClick = () => {
    // When user clicks on the episode, call the parent handler
    onSelectEpisode(episode);
  };

  // Determine if we should show "Watched on Shikimori" badge
  const hasShikimoriBadge = isWatchedOnShikimori && !isWatched && !isInProgress;

  return (
    <motion.div
      onClick={handleEpisodeClick}
      className={`episode-item ${isSelected ? 'selected' : ''} ${isWatched ? 'watched' : ''} ${isInProgress ? 'in-progress' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ '--progress-value': `${watchProgress}%` }}
    >
      <div className="episode-thumbnail">
        <img
          src={thumbnailSrc}
          alt={episode.name || `Эпизод ${episode.ordinal}`}
          loading="lazy"
        />
        <div className="episode-overlay">
          <div className="episode-play-button">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5V19L19 12L8 5Z" />
            </svg>
          </div>
        </div>
        <div className="episode-number-badge">Эпизод {episode.ordinal}</div>
        {episode.duration && (
          <div className="episode-duration-badge">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
          </div>
        )}

        {hasShikimoriBadge && (
          <div className="episode-shikimori-badge">
            <img
              src="https://shikimori.one/favicons/favicon-16x16.png"
              alt="Shikimori"
              width="12"
              height="12"
            />
            <span>Shikimori</span>
          </div>
        )}
      </div>
      <div className="episode-content">
        <div className="episode-title">{episode.name || `Эпизод ${episode.ordinal}`}</div>
        <div className="episode-info">
          <div className="episode-date">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {isWatched || isInProgress ? (
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            {isWatched ? 'Просмотрено' : isInProgress ? `Просмотрено ${watchProgress}%` : isWatchedOnShikimori ? 'Просмотрено на Shikimori' : 'Не просмотрено'}
          </div>
          {isRecentlyAdded && !isWatched && !isWatchedOnShikimori && (
            <div className="episode-status new">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Новое
            </div>
          )}
        </div>
        <div className="episode-progress">
          <div className="episode-progress-bar"></div>
        </div>
      </div>
    </motion.div>
  );
};

export default EpisodeItem;