import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/global/index.css';
import './styles/header.css';
import './styles/genres.css';
import './styles/episode-list.css';
import './styles/videoPlayer.css';
import './styles/videoPlayer-episodesSelector.css';
import './styles/animeDetails.css';
import './styles/franchise.css';
import './styles/favorites.css';

import { PAGES } from './utils/api';
import Header from './components/Header/Header';
import Home from './components/Pages/Home';
import Schedule from './components/Pages/Schedule';
import Search from './components/Pages/Search';
import AnimeDetails from './components/Pages/AnimeDetails';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import Franchises from './components/Pages/Franchises';
import Favorites from './components/Pages/Favorites';

const App = () => {
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);
  const [selectedAnimeId, setSelectedAnimeId] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [pageState, setPageState] = useState({});
  
  // Add a reference to track and clear the transition timer
  const transitionTimerRef = useRef(null);
  // Add a safety timer to prevent infinite loading
  const safetyTimerRef = useRef(null);

  // Cleanup timers when component unmounts
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
    };
  }, []);

  const navigateTo = useCallback((page, state = {}) => {
    // Clear any existing timers first
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
    }

    setIsPageTransitioning(true);

    transitionTimerRef.current = setTimeout(() => {
      try {
        setCurrentPage(page);
        setPageState(state);

        if (page !== PAGES.ANIME_DETAILS) {
          setSelectedAnimeId(null);
        }
        if (page !== PAGES.VIDEO_PLAYER) {
          setShowVideoPlayer(false);
        }

        window.scrollTo(0, 0);
      } catch (error) {
        console.error("Navigation error:", error);
      } finally {
        setIsPageTransitioning(false);
        transitionTimerRef.current = null;
      }
    }, 300);

    safetyTimerRef.current = setTimeout(() => {
      if (isPageTransitioning) {
        console.warn("Safety timer triggered - forcing exit from transition state");
        setIsPageTransitioning(false);
      }
      safetyTimerRef.current = null;
    }, 2000);
  }, [isPageTransitioning]);

  const handleAnimeClick = useCallback((animeId) => {
    setSelectedAnimeId(animeId);
    navigateTo(PAGES.ANIME_DETAILS);
  }, [navigateTo]);

  const handleWatchEpisode = useCallback((episode, episodes = []) => {
    setCurrentEpisode(episode);
    setAllEpisodes(episodes);
    setShowVideoPlayer(true);
  }, []);

  const closeVideoPlayer = useCallback(() => {
    setShowVideoPlayer(false);
  }, []);

  const renderContent = () => {
    switch (currentPage) {
      case PAGES.SCHEDULE:
        return <Schedule onAnimeClick={handleAnimeClick} />;
      case PAGES.SEARCH:
        return <Search onAnimeClick={handleAnimeClick} />;
      case PAGES.ANIME_DETAILS:
        return <AnimeDetails
          animeId={selectedAnimeId}
          onWatchEpisode={handleWatchEpisode}
          onAnimeClick={handleAnimeClick}
        />;
      case PAGES.FRANCHISES:
        return <Franchises 
          onAnimeClick={handleAnimeClick} 
          location={{ state: pageState }}
        />;
      case PAGES.FAVORITES:
        return <Favorites onAnimeClick={handleAnimeClick} />;
      case PAGES.HOME:
      default:
        return <Home 
          onAnimeClick={handleAnimeClick} 
          navigateTo={navigateTo}
        />;
    }
  };

  return (
    <div className="app dark-mode">
      <Header
        currentPage={currentPage}
        navigateTo={navigateTo}
      />

      <AnimatePresence mode="wait">
        {isPageTransitioning ? (
          <motion.div
            className="page-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="transition"
          >
            <div className="page-transition-spinner">
              <div className="spinner-inner"></div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVideoPlayer && (
          <VideoPlayer
            episode={currentEpisode}
            onClose={closeVideoPlayer}
            animeId={selectedAnimeId}
            allEpisodes={allEpisodes}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default App;