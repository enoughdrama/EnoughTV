import React from 'react';
import { motion } from 'framer-motion';
import { fixImagePath } from '../../utils/external/api';

const EpisodeItem = ({ episode, selectedEpisode, onSelectEpisode, index }) => {
  const isSelected = selectedEpisode && selectedEpisode.id === episode.id;

  if (episode.preview?.src) episode.preview.src = fixImagePath(episode.preview.src);

  return (
    <motion.div
      onClick={() => onSelectEpisode(episode)}
      className={`episode-item ${isSelected ? 'selected' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="episode-number">{episode.ordinal}</div>
      <div className="episode-info">
        <div className="episode-name">{episode.name || `Эпизод ${episode.ordinal}`}</div>
        {episode.duration && (
          <div className="episode-duration">
            {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>
      <div className="episode-action">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
        </svg>
      </div>
    </motion.div>
  );
};

export default EpisodeItem;