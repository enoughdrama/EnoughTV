import React from 'react';
import { motion } from 'framer-motion';
import { fixImagePath } from '../../utils/api';

const AnimeCard = ({ anime, onClick, index }) => {
  const hasEpisodes = anime.episodes_total && anime.episodes_total > 0;
  
  return (
    <motion.div 
      className="anime-card"
      onClick={() => onClick(anime.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ 
        y: -10, 
        transition: { duration: 0.2 } 
      }}
    >
      <div className="anime-card-image-container">
        <div className="anime-card-image">
          <img 
            src={fixImagePath(anime.poster?.optimized?.src || anime.poster?.src)} 
            alt={anime.name.main}
            loading="lazy"
          />
        </div>
        <div className="anime-card-overlay">
          <motion.div 
            className="anime-card-play"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
            </svg>
          </motion.div>
        </div>
        {anime.is_ongoing && <div className="anime-badge ongoing">Онгоинг</div>}
        {hasEpisodes && <div className="anime-badge episodes">{anime.episodes_total} эп.</div>}
      </div>
      <div className="anime-card-content">
        <h3 className="anime-title">{anime.name.main}</h3>
        <div className="anime-meta">
          <span>{anime.year}</span>
          <span className="dot"></span>
          <span>{anime.type.description}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimeCard;