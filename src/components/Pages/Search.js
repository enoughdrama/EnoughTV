import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimeGrid from '../AnimeCard/AnimeGrid';
import { fetchAPI } from '../../utils/external/api';
import './styles/search.css';

const Search = ({ onAnimeClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef(null);

  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [yearRange, setYearRange] = useState({ min: 1990, max: new Date().getFullYear() });
  const [selectedYearRange, setSelectedYearRange] = useState({ min: 1990, max: new Date().getFullYear() });

  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [sortOrder, setSortOrder] = useState('RATING_DESC');

  const [types, setTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  const [seasons, setSeasons] = useState([]);
  const [selectedSeasons, setSelectedSeasons] = useState([]);

  const [ageRatings, setAgeRatings] = useState([]);
  const [selectedAgeRatings, setSelectedAgeRatings] = useState([]);

  const [publishStatuses, setPublishStatuses] = useState([]);
  const [selectedPublishStatuses, setSelectedPublishStatuses] = useState([]);

  const [productionStatuses, setProductionStatuses] = useState([]);
  const [selectedProductionStatuses, setSelectedProductionStatuses] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const resultsContainerRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const fetchReferenceData = async () => {
      try {
        const genresData = await fetchAPI('/anime/catalog/references/genres');
        if (genresData && genresData.length > 0) {
          setGenres(genresData);
        }

        const typesData = await fetchAPI('/anime/catalog/references/types');
        if (typesData && typesData.length > 0) {
          setTypes(typesData);
        }

        const seasonsData = await fetchAPI('/anime/catalog/references/seasons');
        if (seasonsData && seasonsData.length > 0) {
          setSeasons(seasonsData);
        }

        const ageRatingsData = await fetchAPI('/anime/catalog/references/age-ratings');
        if (ageRatingsData && ageRatingsData.length > 0) {
          setAgeRatings(ageRatingsData);
        }

        const publishStatusesData = await fetchAPI('/anime/catalog/references/publish-statuses');
        if (publishStatusesData && publishStatusesData.length > 0) {
          setPublishStatuses(publishStatusesData);
        }

        const productionStatusesData = await fetchAPI('/anime/catalog/references/production-statuses');
        if (productionStatusesData && productionStatusesData.length > 0) {
          setProductionStatuses(productionStatusesData);
        }

      } catch (error) {
        console.error('Failed to fetch reference data:', error);
      }
    };

    fetchReferenceData();
  }, []);

  useEffect(() => {
    let count = 0;

    if (selectedGenres.length > 0) count++;
    if (selectedTypes.length > 0) count++;
    if (selectedSeasons.length > 0) count++;
    if (selectedAgeRatings.length > 0) count++;
    if (selectedPublishStatuses.length > 0) count++;
    if (selectedProductionStatuses.length > 0) count++;
    if (selectedYearRange.min !== yearRange.min || selectedYearRange.max !== yearRange.max) count++;

    setActiveFiltersCount(count);
  }, [
    selectedGenres,
    selectedTypes,
    selectedSeasons,
    selectedAgeRatings,
    selectedPublishStatuses,
    selectedProductionStatuses,
    selectedYearRange,
    yearRange
  ]);

  const buildQueryParams = (page) => {
    const params = new URLSearchParams();

    params.append('page', page);
    params.append('limit', itemsPerPage);

    if (query.trim()) {
      params.append('f[search]', query.trim());
    }

    if (selectedGenres.length > 0) {
      params.append('f[genres]', selectedGenres.join(','));
    }

    if (selectedTypes.length > 0) {
      selectedTypes.forEach(type => {
        params.append('f[types][]', type);
      });
    }

    if (selectedSeasons.length > 0) {
      selectedSeasons.forEach(season => {
        params.append('f[seasons][]', season);
      });
    }

    if (selectedAgeRatings.length > 0) {
      selectedAgeRatings.forEach(rating => {
        params.append('f[age_ratings][]', rating);
      });
    }

    if (selectedPublishStatuses.length > 0) {
      selectedPublishStatuses.forEach(status => {
        params.append('f[publish_statuses][]', status);
      });
    }

    if (selectedProductionStatuses.length > 0) {
      selectedProductionStatuses.forEach(status => {
        params.append('f[production_statuses][]', status);
      });
    }

    if (selectedYearRange.min !== yearRange.min) {
      params.append('f[years][from_year]', selectedYearRange.min);
    }

    if (selectedYearRange.max !== yearRange.max) {
      params.append('f[years][to_year]', selectedYearRange.max);
    }

    if (sortOrder) {
      params.append('f[sorting]', sortOrder);
    }

    return params;
  };

  const handleSearch = async (e, page = 1) => {
    if (e) e.preventDefault();

    setIsSearching(true);
    setHasSearched(true);

    try {
      const params = buildQueryParams(page);
      const response = await fetchAPI(`/anime/catalog/releases?${params.toString()}`);

      if (response && response.data) {
        setResults(response.data);

        if (response.meta && response.meta.pagination) {
          const paginationInfo = response.meta.pagination;
          setTotalPages(paginationInfo.total_pages || 1);
          setTotalItems(paginationInfo.total || 0);
          setCurrentPage(page);
        }
      } else {
        setResults([]);
        setTotalPages(1);
        setTotalItems(0);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;

    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    handleSearch(null, newPage);
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  };

  const toggleType = (typeValue) => {
    setSelectedTypes(prev => {
      if (prev.includes(typeValue)) {
        return prev.filter(value => value !== typeValue);
      } else {
        return [...prev, typeValue];
      }
    });
  };

  const toggleSeason = (seasonValue) => {
    setSelectedSeasons(prev => {
      if (prev.includes(seasonValue)) {
        return prev.filter(value => value !== seasonValue);
      } else {
        return [...prev, seasonValue];
      }
    });
  };

  const toggleAgeRating = (ratingValue) => {
    setSelectedAgeRatings(prev => {
      if (prev.includes(ratingValue)) {
        return prev.filter(value => value !== ratingValue);
      } else {
        return [...prev, ratingValue];
      }
    });
  };

  const togglePublishStatus = (statusValue) => {
    setSelectedPublishStatuses(prev => {
      if (prev.includes(statusValue)) {
        return prev.filter(value => value !== statusValue);
      } else {
        return [...prev, statusValue];
      }
    });
  };

  const toggleProductionStatus = (statusValue) => {
    setSelectedProductionStatuses(prev => {
      if (prev.includes(statusValue)) {
        return prev.filter(value => value !== statusValue);
      } else {
        return [...prev, statusValue];
      }
    });
  };

  const handleYearChange = (type, value) => {
    setSelectedYearRange(prev => ({
      ...prev,
      [type]: parseInt(value, 10)
    }));
  };

  const resetFilters = () => {
    setSelectedGenres([]);
    setSelectedTypes([]);
    setSelectedSeasons([]);
    setSelectedAgeRatings([]);
    setSelectedPublishStatuses([]);
    setSelectedProductionStatuses([]);
    setSelectedYearRange({ min: yearRange.min, max: yearRange.max });
    setCurrentPage(1);
  };

  const focusVariants = {
    focused: {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.9), 0 4px 6px -2px rgba(0, 0, 0, 0.9), 0 0 0 3px rgba(99, 102, 241, 0.3)',
      transition: { duration: 0.2 }
    },
    unfocused: {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.9), 0 2px 4px -1px rgba(0, 0, 0, 0.9)',
      transition: { duration: 0.2 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const filterVariants = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.3, delay: 0.1 }
      }
    }
  };

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const maxVisibleButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    const pageNumbers = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );

    return (
      <motion.div
        className="pagination"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          className="pagination-button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="First page"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19l-7-7 7-7M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>

        <motion.button
          className="pagination-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Previous page"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>

        {startPage > 1 && (
          <>
            <motion.button
              className="pagination-button"
              onClick={() => onPageChange(1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              1
            </motion.button>
            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {pageNumbers.map(number => (
          <motion.button
            key={number}
            className={`pagination-button ${currentPage === number ? 'active' : ''}`}
            onClick={() => onPageChange(number)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {number}
          </motion.button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
            <motion.button
              className="pagination-button"
              onClick={() => onPageChange(totalPages)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {totalPages}
            </motion.button>
          </>
        )}

        <motion.button
          className="pagination-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Next page"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>

        <motion.button
          className="pagination-button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Last page"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 5l7 7-7 7M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </motion.div>
    );
  };

  return (
    <motion.main
      className="main-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="content-container">
        <motion.div
          className="search-page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Поиск аниме</h1>
          <p>Найдите любимое аниме по названию, жанру и другим параметрам</p>
        </motion.div>

        <motion.form
          onSubmit={(e) => handleSearch(e, 1)}
          className="search-form"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="search-top-container">
            <motion.div
              className="search-input-container"
              variants={itemVariants}
            >
              <motion.div
                className="search-input-wrapper"
                variants={focusVariants}
                animate={isFocused ? "focused" : "unfocused"}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Введите название аниме..."
                  className="search-input"
                  aria-label="Поиск аниме"
                />
                <AnimatePresence>
                  {query && (
                    <motion.button
                      type="button"
                      className="clear-input"
                      onClick={() => {
                        setQuery('');
                        searchInputRef.current.focus();
                      }}
                      aria-label="Очистить поиск"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.button
                type="button"
                className={`filter-toggle-button ${showFilters ? 'active' : ''} ${activeFiltersCount > 0 ? 'has-filters' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
                whileTap={{ scale: 0.95 }}
                variants={itemVariants}
                aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
                aria-expanded={showFilters}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {activeFiltersCount > 0 && (
                  <span className="filter-count">{activeFiltersCount}</span>
                )}
                <span>Фильтры</span>
              </motion.button>
            </motion.div>

            <motion.button
              type="submit"
              className="button primary-button search-button"
              disabled={isSearching}
              whileTap={!isSearching ? { scale: 0.95 } : {}}
              variants={itemVariants}
            >
              {isSearching ? (
                <span className="search-spinner"></span>
              ) : (
                'Найти'
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="search-filters"
                variants={filterVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <div className="filters-header">
                  <h3>Расширенный поиск</h3>
                  <motion.button
                    type="button"
                    onClick={resetFilters}
                    className="reset-filters-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={
                      selectedGenres.length === 0 &&
                      selectedTypes.length === 0 &&
                      selectedSeasons.length === 0 &&
                      selectedAgeRatings.length === 0 &&
                      selectedPublishStatuses.length === 0 &&
                      selectedProductionStatuses.length === 0 &&
                      selectedYearRange.min === yearRange.min &&
                      selectedYearRange.max === yearRange.max
                    }
                    aria-label="Сбросить все фильтры"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Сбросить фильтры
                  </motion.button>
                </div>

                <div className="filters-grid">
                  <div className="filter-section">
                    <h4>Жанры</h4>
                    <div className="genres-grid">
                      {genres.map(genre => (
                        <motion.button
                          key={genre.id}
                          type="button"
                          className={`genre-button ${selectedGenres.includes(genre.id) ? 'active' : ''}`}
                          onClick={() => toggleGenre(genre.id)}
                          whileTap={{ scale: 0.95 }}
                          aria-pressed={selectedGenres.includes(genre.id)}
                        >
                          {genre.name}
                          {selectedGenres.includes(genre.id) && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Тип</h4>
                    <div className="categories-grid">
                      {types.map(type => (
                        <motion.button
                          key={type.value}
                          type="button"
                          className={`category-button ${selectedTypes.includes(type.value) ? 'active' : ''}`}
                          onClick={() => toggleType(type.value)}
                          whileTap={{ scale: 0.95 }}
                          aria-pressed={selectedTypes.includes(type.value)}
                        >
                          {type.description}
                          {selectedTypes.includes(type.value) && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Сезон</h4>
                    <div className="categories-grid">
                      {seasons.map(season => (
                        <motion.button
                          key={season.value}
                          type="button"
                          className={`category-button ${selectedSeasons.includes(season.value) ? 'active' : ''}`}
                          onClick={() => toggleSeason(season.value)}
                          whileTap={{ scale: 0.95 }}
                          aria-pressed={selectedSeasons.includes(season.value)}
                        >
                          {season.description}
                          {selectedSeasons.includes(season.value) && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Возрастной рейтинг</h4>
                    <div className="categories-grid">
                      {ageRatings.map(rating => (
                        <motion.button
                          key={rating.value}
                          type="button"
                          className={`category-button ${selectedAgeRatings.includes(rating.value) ? 'active' : ''}`}
                          onClick={() => toggleAgeRating(rating.value)}
                          whileTap={{ scale: 0.95 }}
                          aria-pressed={selectedAgeRatings.includes(rating.value)}
                        >
                          {rating.label}
                          {selectedAgeRatings.includes(rating.value) && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Статус выхода</h4>
                    <div className="categories-grid">
                      {publishStatuses.map(status => (
                        <motion.button
                          key={status.value}
                          type="button"
                          className={`category-button ${selectedPublishStatuses.includes(status.value) ? 'active' : ''}`}
                          onClick={() => togglePublishStatus(status.value)}
                          whileTap={{ scale: 0.95 }}
                          aria-pressed={selectedPublishStatuses.includes(status.value)}
                        >
                          {status.description}
                          {selectedPublishStatuses.includes(status.value) && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Статус озвучки</h4>
                    <div className="categories-grid">
                      {productionStatuses.map(status => (
                        <motion.button
                          key={status.value}
                          type="button"
                          className={`category-button ${selectedProductionStatuses.includes(status.value) ? 'active' : ''}`}
                          onClick={() => toggleProductionStatus(status.value)}
                          whileTap={{ scale: 0.95 }}
                          aria-pressed={selectedProductionStatuses.includes(status.value)}
                        >
                          {status.description}
                          {selectedProductionStatuses.includes(status.value) && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Год выпуска</h4>
                    <div className="range-inputs">
                      <div className="range-input-group">
                        <label htmlFor="year-min">От</label>
                        <input
                          id="year-min"
                          type="number"
                          min={yearRange.min}
                          max={selectedYearRange.max}
                          value={selectedYearRange.min}
                          onChange={(e) => handleYearChange('min', e.target.value)}
                        />
                      </div>
                      <div className="range-input-group">
                        <label htmlFor="year-max">До</label>
                        <input
                          id="year-max"
                          type="number"
                          min={selectedYearRange.min}
                          max={yearRange.max}
                          value={selectedYearRange.max}
                          onChange={(e) => handleYearChange('max', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Сортировка</h4>
                    <div className="sort-options">
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="sort-select"
                        aria-label="Сортировка результатов"
                      >
                        <option value="RATING_DESC">По популярности (убывание)</option>
                        <option value="RATING_ASC">По популярности (возрастание)</option>
                        <option value="YEAR_DESC">По году (сначала новые)</option>
                        <option value="YEAR_ASC">По году (сначала старые)</option>
                        <option value="FRESH_AT_DESC">По дате добавления (сначала новые)</option>
                        <option value="FRESH_AT_ASC">По дате добавления (сначала старые)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              className="search-results-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="loading"
            >
              <div className="search-status">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Ищем аниме {query.trim() ? <>по запросу <span className="search-query">"{query}"</span></> : 'по заданным фильтрам'}
                </motion.p>
              </div>
              <div className="anime-grid skeleton-grid">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="skeleton-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-meta"></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {results.length > 0 ? (
                <motion.div
                  className="search-results-container"
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  ref={resultsContainerRef}
                >
                  <div className="search-status">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {totalPages > 1 ? (
                        <>
                          Показаны результаты <span className="results-count">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span> из <span className="results-count">{totalItems}</span>
                          {query.trim() && <> по запросу <span className="search-query">"{query}"</span></>}
                        </>
                      ) : (
                        <>
                          Найдено <span className="results-count">{results.length}</span> результатов
                          {query.trim() ? <> по запросу <span className="search-query">"{query}"</span></> : ' по заданным фильтрам'}
                        </>
                      )}
                    </motion.p>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`results-page-${currentPage}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AnimeGrid
                        animeList={results}
                        onAnimeClick={(id, name) => onAnimeClick(id, name)}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </motion.div>
              ) : (
                hasSearched && (
                  <motion.div
                    className="empty-state search-empty-state"
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="empty-state-icon"
                      whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                    <h2>
                      {query.trim()
                        ? <>По запросу "{query}" ничего не найдено</>
                        : <>По заданным фильтрам ничего не найдено</>
                      }
                    </h2>
                    <p className="empty-state-hint">Попробуйте изменить параметры поиска или сбросить фильтры</p>
                    <div className="empty-state-actions">
                      <motion.button
                        className="button secondary-button retry-button"
                        onClick={() => {
                          setQuery('');
                          searchInputRef.current.focus();
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Новый поиск
                      </motion.button>
                      {(
                        selectedGenres.length > 0 ||
                        selectedTypes.length > 0 ||
                        selectedSeasons.length > 0 ||
                        selectedAgeRatings.length > 0 ||
                        selectedPublishStatuses.length > 0 ||
                        selectedProductionStatuses.length > 0 ||
                        selectedYearRange.min !== yearRange.min ||
                        selectedYearRange.max !== yearRange.max
                      ) && (
                          <motion.button
                            className="button danger-button"
                            onClick={resetFilters}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Сбросить фильтры
                          </motion.button>
                        )}
                    </div>
                  </motion.div>
                )
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
};

export default Search;