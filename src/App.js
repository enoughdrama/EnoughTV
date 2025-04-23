import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import './styles/global/index.css';
import './styles/perfs/shikimori-integration.css';

import { PAGES } from './utils/external/api';
import { AuthProvider } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import Header from './components/Header/Header';
import Breadcrumbs from './components/Breadcrumbs/Breadcrumbs';
import Home from './components/Pages/Home';
import Schedule from './components/Pages/Schedule';
import Search from './components/Pages/Search';
import AnimeDetails from './components/Pages/AnimeDetails';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import Franchises from './components/Pages/Franchises';
import Favorites from './components/Pages/Favorites';
import Profile from './components/Pages/Profile';
import AuthCallback from './components/Auth/AuthCallback';

const App = () => {
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);
  const [selectedAnimeId, setSelectedAnimeId] = useState(null);
  const [selectedAnimeName, setSelectedAnimeName] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [pageState, setPageState] = useState({});
  const [pageHistory, setPageHistory] = useState([]);

  const transitionTimerRef = useRef(null);
  const safetyTimerRef = useRef(null);

  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname === '/auth/callback') {
      setCurrentPage('AUTH_CALLBACK');
    }
  }, []);

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
    setIsPageTransitioning(true);
    
    // Keep track of page history for breadcrumbs
    if (currentPage !== page) {
      // Don't track navigation to the same page
      if (page !== PAGES.HOME) {
        // Only keep last 5 pages in history to avoid memory issues
        setPageHistory(prev => {
          const newHistory = [...prev];
          newHistory.push({ page: currentPage, state: pageState });
          return newHistory.slice(-5);
        });
      }
    }

    transitionTimerRef.current = setTimeout(() => {
      try {
        setCurrentPage(page);
        setPageState(state);

        if (page !== PAGES.ANIME_DETAILS) {
          setSelectedAnimeId(null);
          setSelectedAnimeName(null);
        }
        if (page !== PAGES.VIDEO_PLAYER) {
          setShowVideoPlayer(false);
        }

        window.scrollTo(0, 0);
        setIsPageTransitioning(false);
      } catch (error) {
        console.error("Navigation error:", error);
        setIsPageTransitioning(false);
      }
    }, 300);
  }, [currentPage, pageState]);

  const handleAnimeClick = useCallback((animeId, animeName) => {
    setSelectedAnimeId(animeId);
    setSelectedAnimeName(animeName);
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
          setSelectedAnimeName={setSelectedAnimeName}
        />;
      case PAGES.FRANCHISES:
        return <Franchises
          onAnimeClick={handleAnimeClick}
          location={{ state: pageState }}
        />;
      case PAGES.FAVORITES:
        return <Favorites onAnimeClick={handleAnimeClick} />;
      case PAGES.PROFILE:
        return <Profile
          onAnimeClick={handleAnimeClick}
          navigateTo={navigateTo}
        />;
      case 'AUTH_CALLBACK':
        return <AuthCallback navigateTo={navigateTo} PAGES={PAGES} />;
      case PAGES.HOME:
      default:
        return <Home
          onAnimeClick={handleAnimeClick}
          navigateTo={navigateTo}
        />;
    }
  };

  return (
    <AuthProvider>
      <NavigationProvider>
        <div className="app dark-mode">
        {currentPage !== 'AUTH_CALLBACK' && (
          <Header
            currentPage={currentPage}
            navigateTo={navigateTo}
          />
        )}

        {currentPage !== 'AUTH_CALLBACK' && (
          <Breadcrumbs 
            currentPage={currentPage}
            pageHistory={pageHistory}
            navigateTo={navigateTo}
            selectedAnimeId={selectedAnimeId}
            selectedAnimeName={selectedAnimeName}
          />
        )}

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
      </NavigationProvider>
    </AuthProvider>
  );
};

export default App;