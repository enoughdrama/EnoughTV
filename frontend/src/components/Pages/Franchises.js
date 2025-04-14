import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchAPI, fixImagePath, fetchRandomFranchises, formatFranchiseDuration } from '../../utils/api';

const Franchises = ({ onAnimeClick }) => {
  const [franchises, setFranchises] = useState([]);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [franchiseDetails, setFranchiseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFranchises = async () => {
      setLoading(true);
      try {
        const data = await fetchAPI('/anime/franchises');
        if (data && data.length > 0) {
          const sortedFranchises = [...data].sort((a, b) =>
            b.rating - a.rating
          );
          setFranchises(sortedFranchises);
        }
      } catch (err) {
        setError('Не удалось загрузить франшизы');
      } finally {
        setLoading(false);
      }
    };

    fetchFranchises();
  }, []);

  const fetchFranchiseDetails = async (franchiseId) => {
    if (!franchiseId) return;

    setDetailsLoading(true);
    try {
      const data = await fetchAPI(`/anime/franchises/${franchiseId}`);
      if (data) {
        setFranchiseDetails(data);
      }
    } catch (err) {
      console.error('Failed to load franchise details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleFranchiseClick = (franchise) => {
    setSelectedFranchise(franchise);
    fetchFranchiseDetails(franchise.id);
  };

  const renderFranchiseCard = (franchise, index) => (
    <motion.div
      key={franchise.id}
      className="franchise-card"
      onClick={() => handleFranchiseClick(franchise)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
    >
      <div className="franchise-card-image">
        <img
          src={fixImagePath(franchise.image?.optimized?.preview || franchise.image?.preview)}
          alt={franchise.name}
          loading="lazy"
        />
        <div className="franchise-card-overlay">
          <div className="franchise-card-stats">
            <div className="franchise-card-stat">
              <span className="franchise-card-stat-value">{franchise.total_releases}</span>
              <span className="franchise-card-stat-label">релизов</span>
            </div>
            <div className="franchise-card-stat">
              <span className="franchise-card-stat-value">{franchise.total_episodes}</span>
              <span className="franchise-card-stat-label">эпизодов</span>
            </div>
          </div>
        </div>
      </div>
      <div className="franchise-card-content">
        <h3 className="franchise-card-title">{franchise.name}</h3>
        <div className="franchise-card-meta">
          <div className="franchise-card-years">
            <span>{franchise.first_year}</span>
            <span>-</span>
            <span>{franchise.last_year}</span>
          </div>
          <div className="franchise-card-rating">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {franchise.rating?.toFixed(1) || 'N/A'}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="franchises-loading">
        <div className="franchises-loading-spinner"></div>
        <p>Загрузка франшиз...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p>{error}</p>
        <motion.button
          className="button primary-button"
          onClick={() => window.location.reload()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Попробовать снова
        </motion.button>
      </div>
    );
  }

  return (
    <motion.main
      className="main-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Франшизы</h1>
        <p>Полные коллекции серий и сезонов ваших любимых аниме</p>
      </motion.div>

      <div className="content-container">
        {selectedFranchise ? (
          <motion.div
            className="franchise-details-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.button
              className="back-button"
              onClick={() => {
                setSelectedFranchise(null);
                setFranchiseDetails(null);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Назад к списку
            </motion.button>

            <div className="franchise-details-header">
              <div className="franchise-details-info">
                <h2>{selectedFranchise.name}</h2>
                {selectedFranchise.name_english && (
                  <h3>{selectedFranchise.name_english}</h3>
                )}
                <div className="franchise-details-meta">
                  <div className="franchise-details-years">
                    <span>{selectedFranchise.first_year}</span>
                    <span>-</span>
                    <span>{selectedFranchise.last_year}</span>
                  </div>
                  <div className="franchise-details-rating">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {selectedFranchise.rating?.toFixed(1) || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="franchise-details-stats">
                <div className="franchise-details-stat">
                  <div className="franchise-details-stat-value">{selectedFranchise.total_releases}</div>
                  <div className="franchise-details-stat-label">Релизов</div>
                </div>
                <div className="franchise-details-stat">
                  <div className="franchise-details-stat-value">{selectedFranchise.total_episodes}</div>
                  <div className="franchise-details-stat-label">Эпизодов</div>
                </div>
                <div className="franchise-details-stat">
                  <div className="franchise-details-stat-value">{formatFranchiseDuration(selectedFranchise.total_duration_in_seconds)}</div>
                  <div className="franchise-details-stat-label">Общая длительность</div>
                </div>
              </div>
            </div>

            {detailsLoading ? (
              <div className="franchise-details-loading">
                <div className="franchise-details-loading-spinner"></div>
                <p>Загрузка релизов франшизы...</p>
              </div>
            ) : franchiseDetails && franchiseDetails.franchise_releases && franchiseDetails.franchise_releases.length > 0 ? (
              <div className="franchise-releases-container">
                <h3 className="franchise-releases-title">Релизы франшизы</h3>
                <div className="franchise-releases-grid">
                  {franchiseDetails.franchise_releases
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item, index) => (
                      <motion.div
                        key={item.id}
                        className="franchise-release-card"
                        onClick={() => onAnimeClick(item.release.id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <div className="franchise-release-badge">#{item.sort_order}</div>
                        <div className="franchise-release-image">
                          <img
                            src={fixImagePath(
                              item.release.poster?.optimized?.src ||
                              item.release.poster?.src
                            )}
                            alt={item.release.name.main}
                            loading="lazy"
                          />
                          <div className="franchise-release-overlay">
                            <div className="franchise-release-play">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                              </svg>
                            </div>
                          </div>
                          {item.release.is_ongoing && (
                            <div className="franchise-release-ongoing">Онгоинг</div>
                          )}
                        </div>
                        <div className="franchise-release-content">
                          <h4 className="franchise-release-title">{item.release.name.main}</h4>
                          <div className="franchise-release-meta">
                            <span>{item.release.year}</span>
                            <span className="dot"></span>
                            <span>{item.release.type.description}</span>
                            {item.release.episodes_total && (
                              <>
                                <span className="dot"></span>
                                <span>{item.release.episodes_total} эп.</span>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div className="franchise-no-releases">
                <div className="franchise-no-releases-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 7.5V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H15.5L21 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11V16M12 8V8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p>Информация о релизах этой франшизы не найдена</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="franchises-grid">
            {franchises.map((franchise, index) => renderFranchiseCard(franchise, index))}
          </div>
        )}
      </div>
    </motion.main>
  );
};

export default Franchises;