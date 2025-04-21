import React from 'react';
import { motion } from 'framer-motion';
import { getAuthUrl } from '../../utils/shikimoriAuth';

const Login = () => {
    const handleLogin = () => {
        const authUrl = getAuthUrl();
        window.location.href = authUrl;
    };

    return (
        <div className="login-container">
            <motion.div
                className="login-icon"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <h1 className="login-title">Авторизация</h1>
                <p className="login-description">Для использования всех возможностей приложения, авторизуйтесь через Shikimori - платформу для любителей аниме и манги</p>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="shikimori-logo"
            >
                <img
                    src="https://shikimori.one/favicons/favicon-96x96.png"
                    alt="Shikimori Logo"
                    width="96"
                    height="96"
                />
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <motion.button
                    className="shikimori-button"
                    onClick={handleLogin}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Войти через Shikimori
                </motion.button>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="login-note"
            >
                <p>При авторизации вы разрешаете приложению доступ к данным вашего профиля Shikimori</p>
            </motion.div>
        </div>
    );
};

export default Login;