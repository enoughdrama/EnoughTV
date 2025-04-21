import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import AnimeCard from '../AnimeCard/AnimeCard';
import EmptyState from '../UI/EmptyState';
import LoadingSkeleton from '../UI/LoadingSkeleton';
import '../../styles/history.css';

const History = ({ onAnimeClick }) => {
    const { currentUser, isAuthenticated } = useAuth();
    const [watchHistory, setWatchHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWatchHistory = async () => {
            setLoading(true);
            try {
                // Get from localStorage first
                const localHistory = JSON.parse(localStorage.getItem('enoughtv_watch_history') || '{}');

                if (isAuthenticated) {
                    // If authenticated, fetch from server and merge with local
                    const response = await fetch('https://api.example.com/api/watch-history', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('enoughtvToken')}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch watch history');
                    }

                    const data = await response.json();

                    // Prepare history data for display
                    const historyItems = Object.entries(data.history || localHistory)
                        .map(([animeId, animeData]) => ({
                            id: animeId,
                            lastWatched: animeData.lastWatched,
                            ...animeData
                        }))
                        .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));

                    setWatchHistory(historyItems);
                } else {
                    // If not authenticated, use only local history
                    const historyItems = Object.entries(localHistory)
                        .map(([animeId, animeData]) => ({
                            id: animeId,
                            lastWatched: animeData.lastWatched,
                            ...animeData
                        }))
                        .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));

                    setWatchHistory(historyItems);
                }
            } catch (err) {
                console.error('Error fetching watch history:', err);
                setError('Не удалось загрузить историю просмотров');
            } finally {
                setLoading(false);
            }
        };

        fetchWatchHistory();
    }, [isAuthenticated]);

    const handleClearHistory = async () => {
        if (alert('Вы уверены, что хотите очистить всю историю просмотров?')) {
            try {
                localStorage.removeItem('enoughtv_watch_history');

                if (isAuthenticated) {
                    // Clear on server too
                    await fetch('https://api.example.com/api/watch-history', {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('enoughtvToken')}`
                        }
                    });
                }

                setWatchHistory([]);
            } catch (err) {
                console.error('Error clearing watch history:', err);
                setError('Не удалось очистить историю просмотров');
            }
        }
    };

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
                <h1>История просмотров</h1>
                <p>Ваши недавно просмотренные аниме</p>
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
                    <div className="history-grid">
                        {[...Array(8)].map((_, i) => (
                            <LoadingSkeleton key={i} />
                        ))}
                    </div>
                ) : watchHistory.length > 0 ? (
                    <>
                        <div className="history-header">
                            <div className="history-title">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <h2>Недавно просмотренные</h2>
                            </div>
                            <motion.button
                                className="history-clear-button"
                                onClick={handleClearHistory}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Очистить историю
                            </motion.button>
                        </div>

                        <div className="history-grid">
                            {watchHistory.map((item, index) => (
                                <AnimeCard
                                    key={item.id}
                                    anime={item}
                                    onClick={onAnimeClick}
                                    index={index}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                        message="История просмотров пуста"
                        hint="Начните смотреть аниме, чтобы они появились здесь"
                    />
                )}

                {!isAuthenticated && watchHistory.length > 0 && (
                    <div className="history-auth-notice">
                        <div className="history-auth-notice-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="history-auth-notice-content">
                            <h3>История просмотров сохраняется локально</h3>
                            <p>Войдите в аккаунт, чтобы синхронизировать историю просмотров между устройствами</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.main>
    );
};

export default History;