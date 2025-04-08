import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import '../../styles/profile.css';

const Profile = () => {
    const { currentUser, updateProfile, syncWatchHistory, logout } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setEmail(currentUser.email || '');
            setAvatarPreview(currentUser.avatar || null);
        }
    }, [currentUser]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSyncWatchHistory = async () => {
        setIsSyncing(true);
        try {
            const success = await syncWatchHistory();
            if (success) {
                setMessage({
                    type: 'success',
                    text: 'История просмотров успешно синхронизирована'
                });
            } else {
                setMessage({
                    type: 'error',
                    text: 'Не удалось синхронизировать историю просмотров'
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Произошла ошибка при синхронизации'
            });
        } finally {
            setIsSyncing(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('username', username);
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const success = await updateProfile({ username, avatar: avatarFile });

            if (success) {
                setMessage({
                    type: 'success',
                    text: 'Профиль успешно обновлен'
                });
            } else {
                setMessage({
                    type: 'error',
                    text: 'Не удалось обновить профиль'
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Произошла ошибка при обновлении профиля'
            });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (!currentUser) {
        return (
            <motion.div
                className="profile-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="profile-not-logged-in">
                    <div className="profile-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2>Вы не авторизованы</h2>
                    <p>Пожалуйста, войдите в систему, чтобы получить доступ к профилю</p>
                </div>
            </motion.div>
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
                <h1>Профиль пользователя</h1>
                <p>Управление учетной записью и настройками</p>
            </motion.div>

            <div className="content-container">
                <div className="profile-content">
                    <div className="profile-tabs">
                        <motion.button
                            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Информация
                        </motion.button>

                        <motion.button
                            className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Настройки
                        </motion.button>
                    </div>

                    {message && (
                        <motion.div
                            className={`profile-message ${message.type}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {message.text}
                        </motion.div>
                    )}

                    <div className="profile-panel">
                        {activeTab === 'info' && (
                            <form className="profile-form" onSubmit={handleSubmit}>
                                <div className="profile-avatar-section">
                                    <div className="profile-avatar-wrapper">
                                        <div className="profile-avatar">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt={username} />
                                            ) : (
                                                username ? username[0].toUpperCase() : '?'
                                            )}
                                        </div>
                                        <motion.label
                                            htmlFor="avatar-upload"
                                            className="avatar-upload-button"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </motion.label>
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            onChange={handleAvatarChange}
                                            accept="image/*"
                                            className="hidden-input"
                                        />
                                    </div>
                                    <div className="profile-avatar-info">
                                        <h3>{currentUser.username}</h3>
                                        <p>{currentUser.email}</p>
                                        <p className="member-since">Участник с {new Date(currentUser.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="profile-form-group">
                                    <label htmlFor="username">Имя пользователя</label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="profile-form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        disabled
                                        className="disabled-input"
                                    />
                                    <small>Email нельзя изменить</small>
                                </div>

                                <div className="profile-actions">
                                    <motion.button
                                        type="submit"
                                        className="profile-button primary-button"
                                        disabled={isSubmitting}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                                    </motion.button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'settings' && (
                            <div className="profile-settings">
                                <div className="settings-section">
                                    <h3 className="settings-title">Синхронизация</h3>
                                    <p className="settings-description">
                                        Синхронизируйте локальную историю просмотров с вашим аккаунтом
                                    </p>
                                    <motion.button
                                        className="profile-button secondary-button"
                                        onClick={handleSyncWatchHistory}
                                        disabled={isSyncing}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {isSyncing ? 'Синхронизация...' : 'Синхронизировать историю просмотров'}
                                    </motion.button>
                                </div>

                                <div className="settings-section">
                                    <h3 className="settings-title">Аккаунт</h3>
                                    <p className="settings-description">
                                        Управление учетной записью
                                    </p>
                                    <motion.button
                                        className="profile-button logout-button"
                                        onClick={logout}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Выйти из аккаунта
                                    </motion.button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.main>
    );
};

export default Profile;