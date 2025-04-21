import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimeCard from '../AnimeCard/AnimeCard';
import EmptyState from '../UI/EmptyState';
import LoadingSkeleton from '../UI/LoadingSkeleton';
import { fetchAPI } from '../../utils/external/api';
import { getFavorites } from '../../utils/app/favorites';

import './styles/favorites.css';

const Favorites = ({ onAnimeClick }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadFavorites = async () => {
            setLoading(true);
            try {
                const favoritesObj = getFavorites();
                const animeIds = Object.keys(favoritesObj);

                if (animeIds.length === 0) {
                    setFavorites([]);
                    setLoading(false);
                    return;
                }

                const favoritesList = [];

                for (const animeId of animeIds) {
                    try {
                        const animeData = await fetchAPI(`/anime/releases/${animeId}`);
                        if (animeData) {
                            favoritesList.push({
                                ...animeData,
                                addedToFavoritesAt: favoritesObj[animeId].addedAt
                            });
                        }
                    } catch (err) {
                        console.error(`Failed to fetch anime ${animeId}:`, err);
                    }
                }

                setFavorites(favoritesList.sort((a, b) =>
                    new Date(b.addedToFavoritesAt) - new Date(a.addedToFavoritesAt)
                ));
            } catch (err) {
                console.error('Error loading favorites:', err);
                setError('Не удалось загрузить список избранного');
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, []);

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
                <h1>Избранное</h1>
                <p>Ваши любимые аниме</p>
            </motion.div>

            <div className="content-container">
                {error ? (
                    <div className="error-container">
                        <div className="error-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p>{error}</p>
                    </div>
                ) : loading ? (
                    <div className="favorites-grid">
                        {[...Array(8)].map((_, i) => (
                            <LoadingSkeleton key={i} />
                        ))}
                    </div>
                ) : favorites.length > 0 ? (
                    <div className="favorites-grid">
                        {favorites.map((anime, index) => (
                            <AnimeCard
                                key={anime.id}
                                anime={anime}
                                onClick={onAnimeClick}
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                        message="У вас пока нет избранных аниме"
                        hint="Добавляйте аниме в избранное, чтобы быстро находить их здесь"
                    />
                )}
            </div>
        </motion.main>
    );
};

export default Favorites;