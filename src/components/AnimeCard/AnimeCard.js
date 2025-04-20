import React from 'react';
import { motion } from 'framer-motion';
import { fixImagePath } from '../../utils/api';

const AnimeCard = ({ anime, onClick, index, extraClass = '' }) => {
  const hasEpisodes = anime.episodes_total && anime.episodes_total > 0;
  
  return (
    <motion.div 
      className={`anime-card ${extraClass}`}
      onClick={() => onClick(anime.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div className="anime-card-image-container">
        <div className="anime-card-image">
          <img 
            src={fixImagePath(anime.poster?.optimized?.src || anime.poster?.src)} 
            alt={anime.name.main}
            loading="lazy"
          />
        </div>
        {anime.is_ongoing && <div className="anime-tag ongoing">Онгоинг</div>}
        {anime.season && <div className="anime-tag season">{anime.season.description}</div>}
        {hasEpisodes && <div className="anime-tag episodes">{anime.episodes_total} эп.</div>}
      </div>
      
      <div className="anime-card-play-button">
        <motion.div 
          className="play-icon"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
          </svg>
        </motion.div>
      </div>
      
      <div className="anime-card-content">
        <h3 className="anime-title">{anime.name.main}</h3>
        <div className="anime-meta">
          {anime.year && <span className="year">{anime.year}</span>}
          {anime.type && <span className="type">{anime.type.description}</span>}
          <span className="action">Смотреть</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimeCard;