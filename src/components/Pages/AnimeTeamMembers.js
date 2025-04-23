import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchAPI, fixImagePath } from '../../utils/external/api';

const AnimeTeamMembers = ({ animeId }) => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            if (!animeId) return;

            setLoading(true);
            try {
                const data = await fetchAPI(`/anime/releases/${animeId}/members`);
                if (data && Array.isArray(data)) {
                    setTeamMembers(data);
                } else {
                    setTeamMembers([]);
                }
            } catch (err) {
                console.error('Error fetching team members:', err);
                setError('Ошибка при загрузке данных команды');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, [animeId]);

    const getTeamMembersByRole = () => {
        if (!teamMembers || teamMembers.length === 0) return {};

        const roleOrder = {
            'translating': 1,
            'voicing': 2,
            'editing': 3,
            'timing': 4,
            'decorating': 5,
            'poster': 6
        };

        const roleDescriptions = {};
        teamMembers.forEach(member => {
            if (member.role && member.role.value && member.role.description) {
                roleDescriptions[member.role.value] = member.role.description;
            }
        });

        const membersByRole = teamMembers.reduce((groups, member) => {
            if (!member.role || !member.role.value) return groups;

            if (!groups[member.role.value]) {
                groups[member.role.value] = {
                    members: [],
                    description: roleDescriptions[member.role.value] || member.role.value,
                    order: roleOrder[member.role.value] || 99
                };
            }
            groups[member.role.value].members.push(member);
            return groups;
        }, {});

        return membersByRole;
    };

    const teamMembersByRole = getTeamMembersByRole();

    if (loading) {
        return (
            <div className="team-members-loading">
                <div className="skeleton-line" style={{ width: '40%', height: '24px', marginBottom: '20px' }}></div>
                <div className="skeleton-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-card" style={{ height: '80px' }}></div>
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

    if (Object.keys(teamMembersByRole).length === 0) {
        return (
            <div className="team-members-empty-state">
                <p>Информация о команде отсутствует</p>
            </div>
        );
    }

    return (
        <div className="info-section voice-team-section">
            <h3>Команда озвучки</h3>
            <div className="voice-team-container">
                {Object.values(teamMembersByRole)
                    .sort((a, b) => a.order - b.order)
                    .map((roleData, index) => (
                        <motion.div
                            key={index}
                            className="voice-team-role"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div className="voice-team-role-title">{roleData.description}</div>
                            <div className="voice-team-members">
                                {roleData.members.map((member, i) => (
                                    <motion.div
                                        key={i}
                                        className="voice-team-member"
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: (index * 0.1) + (i * 0.05) }}
                                    >
                                        {member.user && member.user.avatar ? (
                                            <div className="voice-team-member-avatar">
                                                <img
                                                    src={fixImagePath(member.user.avatar.thumbnail?.src || member.user.avatar.preview?.src)}
                                                    alt={member.user.nickname || member.nickname || 'Участник команды'}
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="voice-team-member-avatar default-avatar">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="voice-team-member-info">
                                            <div className="voice-team-member-name">
                                                {member.nickname || (member.user && member.user.nickname) || 'Участник команды'}
                                            </div>
                                            {member.user && member.user.nickname && (
                                                <div className="voice-team-member-username">@{member.user.nickname}</div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
            </div>
        </div>
    );
};

export default AnimeTeamMembers;