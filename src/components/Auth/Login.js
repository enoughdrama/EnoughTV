import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getAuthUrl } from '../../utils/external/shikimori/shikimoriAuth';

import './styles/auth.css'

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        setIsLoading(true);
        const authUrl = getAuthUrl();
        window.location.href = authUrl;
    };

    if (isLoading) {
        return (
            <div className="auth-loading">
                <div className="auth-loading-spinner"></div>
                <h2>Переход на страницу авторизации...</h2>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="auth-title">Авторизация</h1>
                <p className="auth-subtitle">Для использования всех возможностей приложения, авторизуйтесь через Shikimori - платформу для любителей аниме и манги</p>

                <div className="social-auth">
                    <div className="social-auth-title">Авторизация через</div>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                        <img
                            src="https://shikimori.one/favicons/favicon-96x96.png"
                            alt="Shikimori Logo"
                            width="64"
                            height="64"
                            style={{ borderRadius: "12px" }}
                        />
                    </div>
                </div>

                <motion.button
                    className="shikimori-login-button"
                    onClick={handleLogin}
                    whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(75, 106, 160, 0.25)" }}
                    whileTap={{ scale: 0.98 }}
                >
                    <img src="https://shikimori.one/favicons/favicon-16x16.png" alt="Shikimori" />
                    Войти через Shikimori
                </motion.button>

                <div className="auth-footer">
                    <p>При авторизации вы разрешаете приложению доступ к данным вашего профиля Shikimori</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;