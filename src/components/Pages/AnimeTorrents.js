import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchAPI } from '../../utils/external/api';
import './styles/animeTorrents.css';

const AnimeTorrents = ({ animeId }) => {
    const [torrents, setTorrents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({
        quality: 'all',
        type: 'all',
    });

    useEffect(() => {
        const fetchTorrents = async () => {
            if (!animeId) return;

            setLoading(true);
            try {
                const data = await fetchAPI(`/anime/torrents/release/${animeId}`);
                if (data && Array.isArray(data)) {
                    setTorrents(data);
                } else {
                    setTorrents([]);
                }
            } catch (err) {
                console.error('Error fetching torrents:', err);
                setError('Ошибка при загрузке данных торрентов');
            } finally {
                setLoading(false);
            }
        };

        fetchTorrents();
    }, [animeId]);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Байт';

        const k = 1024;
        const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFilterChange = (filterType, value) => {
        setFilter(prevFilter => ({
            ...prevFilter,
            [filterType]: value
        }));
    };

    const getUniqueValues = (field) => {
        const values = new Set();

        torrents.forEach(torrent => {
            if (torrent[field] && torrent[field].value) {
                values.add(torrent[field].value);
            }
        });

        return Array.from(values);
    };

    const filteredTorrents = torrents.filter(torrent => {
        const qualityMatch = filter.quality === 'all' || (torrent.quality && torrent.quality.value === filter.quality);
        const typeMatch = filter.type === 'all' || (torrent.type && torrent.type.value === filter.type);

        return qualityMatch && typeMatch;
    });

    const qualities = getUniqueValues('quality');
    const types = getUniqueValues('type');

    if (loading) {
        return (
            <div className="torrents-loading">
                <div className="skeleton-line" style={{ width: '40%', height: '24px', marginBottom: '20px' }}></div>
                <div className="skeleton-grid">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton-card" style={{ height: '120px' }}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
            </div>
        );
    }

    if (torrents.length === 0) {
        return (
            <div className="torrents-empty-state">
                <div className="torrents-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 22h16a2 2 0 002-2V8l-6-6H6a2 2 0 00-2 2v16a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 18v-6M9 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <p>Торренты не найдены</p>
            </div>
        );
    }

    return (
        <div className="torrents-container">
            <div className="torrents-filters">
                <div className="filter-group">
                    <label>Качество:</label>
                    <select
                        value={filter.quality}
                        onChange={(e) => handleFilterChange('quality', e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Все</option>
                        {qualities.map(quality => (
                            <option key={quality} value={quality}>{quality}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Тип:</label>
                    <select
                        value={filter.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Все</option>
                        {types.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="torrents-list">
                {filteredTorrents.length === 0 ? (
                    <div className="torrents-no-results">
                        <p>Нет торрентов, соответствующих фильтрам</p>
                    </div>
                ) : (
                    filteredTorrents
                        .sort((a, b) => (b.seeders || 0) - (a.seeders || 0))
                        .map((torrent, index) => (
                            <motion.div
                                key={torrent.id}
                                className="torrent-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <div className="torrent-header">
                                    <div className="torrent-title">{torrent.label}</div>
                                    <div className="torrent-quality">
                                        {torrent.quality && (
                                            <span className="quality-badge">{torrent.quality.description}</span>
                                        )}
                                        {torrent.type && (
                                            <span className="type-badge">{torrent.type.description}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="torrent-meta">
                                    <div className="torrent-main-info">
                                        <div className="torrent-info-row">
                                            <span className="size-badge">{formatFileSize(torrent.size)}</span>
                                            {torrent.description && (
                                                <span className="description-badge">{torrent.description}</span>
                                            )}
                                        </div>
                                        <div className="torrent-codecs">
                                            {torrent.codec && (
                                                <span className="codec-badge">{torrent.codec.description}</span>
                                            )}
                                            {torrent.color && (
                                                <span className="color-badge">{torrent.color.description}</span>
                                            )}
                                            {torrent.bitrate && (
                                                <span className="bitrate-badge">{torrent.bitrate} кбит/с</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="torrent-stats-container">
                                        <div className="torrent-stats">
                                            <div className="stat-item seeders">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span>{torrent.seeders || 0}</span>
                                            </div>

                                            <div className="stat-item leechers">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span>{torrent.leechers || 0}</span>
                                            </div>

                                            <div className="stat-item completed">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span>{torrent.completed_times || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="torrent-actions">
                                    {torrent.magnet && (
                                        <motion.a
                                            href={torrent.magnet}
                                            className="torrent-button magnet-button"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 6v6M12 16v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M7.211 6a7 7 0 1 0 9.578 0H21v3a4 4 0 0 1-4 4h-2m-5-7H3v3a4 4 0 0 0 4 4h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Скачать
                                        </motion.a>
                                    )}
                                </div>
                            </motion.div>
                        ))
                )}
            </div>
        </div>
    );
};

export default AnimeTorrents;