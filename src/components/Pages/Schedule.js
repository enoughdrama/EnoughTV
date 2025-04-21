import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimeGrid from '../AnimeCard/AnimeGrid';
import { fetchAPI } from '../../utils/external/api';
import './styles/schedule.css';

const Schedule = ({ onAnimeClick }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState('today');
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const simpleDays = [
    { id: 'today', label: 'Сегодня' },
    { id: 'tomorrow', label: 'Завтра' },
    { id: 'yesterday', label: 'Вчера' }
  ];

  const weekDays = [
    { id: '0', label: 'Понедельник' },
    { id: '1', label: 'Вторник' },
    { id: '2', label: 'Среда' },
    { id: '3', label: 'Четверг' },
    { id: '4', label: 'Пятница' },
    { id: '5', label: 'Суббота' },
    { id: '6', label: 'Воскресенье' }
  ];

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const endpoint = showFullSchedule ? '/anime/schedule/week' : '/anime/schedule/now';
        const data = await fetchAPI(endpoint);

        if (data) {
          setScheduleData(data);

          // Set default active day based on data structure
          if (showFullSchedule && !weekDays.find(d => d.id === activeDay)) {
            setActiveDay('0'); // Default to Monday for weekly view
          } else if (!showFullSchedule && !simpleDays.find(d => d.id === activeDay)) {
            setActiveDay('today'); // Default to today for simple view
          }
        } else {
          setError("Данные не получены");
        }
      } catch (err) {
        console.error("Schedule fetch error:", err);
        setError("Не удалось загрузить расписание");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [showFullSchedule]);

  const getAnimeListForDay = (day) => {
    if (!scheduleData) return [];

    // Handle the "now" endpoint format (with today, tomorrow, yesterday properties)
    if (!showFullSchedule && scheduleData.hasOwnProperty(day)) {
      return scheduleData[day]?.map(item => item.release) || [];
    }

    // Handle the "week" endpoint format (direct array)
    if (showFullSchedule) {
      // If scheduleData is an array, we're using the week endpoint
      if (Array.isArray(scheduleData)) {
        const weekDay = parseInt(day, 10);
        if (!isNaN(weekDay)) {
          // Filter releases by publish_day matching the selected day
          return scheduleData
            .filter(item => parseInt(item.release?.publish_day?.value, 10) === weekDay + 1) // API uses 1-7 for days
            .map(item => item.release) || [];
        }
      }
      // If scheduleData has days property (older API format)
      else if (scheduleData?.days && Array.isArray(scheduleData.days)) {
        const numericDay = parseInt(day, 10);
        if (!isNaN(numericDay) && scheduleData.days[numericDay]) {
          return scheduleData.days[numericDay].map(item => item.release) || [];
        }
      }
    }

    return [];
  };

  const getEmptyMessage = (day) => {
    const messages = {
      today: "Сегодня нет новых выпусков",
      tomorrow: "Завтра нет запланированных выпусков",
      yesterday: "Вчера не было выпусков",
      '0': "В понедельник нет выпусков",
      '1': "Во вторник нет выпусков",
      '2': "В среду нет выпусков",
      '3': "В четверг нет выпусков",
      '4': "В пятницу нет выпусков",
      '5': "В субботу нет выпусков",
      '6': "В воскресенье нет выпусков"
    };

    return messages[day] || "Нет выпусков";
  };

  const getActiveDayLabel = () => {
    const day = showFullSchedule
      ? weekDays.find(d => d.id === activeDay)?.label
      : simpleDays.find(d => d.id === activeDay)?.label;
    return day || '';
  };

  const handleToggleScheduleType = () => {
    // Switch view type and reset active day appropriately
    const newShowFullSchedule = !showFullSchedule;
    setShowFullSchedule(newShowFullSchedule);

    // Set appropriate default day when toggling views
    if (newShowFullSchedule) {
      // Get current day of week (0-6) when switching to full week view
      const currentDayOfWeek = new Date().getDay();
      // Sunday is 0 in JS but we want Monday as 0
      const adjustedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      setActiveDay(adjustedDay.toString());
    } else {
      setActiveDay('today');
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        <h1>Расписание выхода</h1>
        <p>График выхода новых серий</p>
      </motion.div>

      <div className="content-container">
        <motion.div
          className="schedule-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="schedule-title">
            <span className="schedule-title-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>Расписание аниме</span>
          </div>

          <motion.div
            className="schedule-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.button
              className={`toggle-button ${showFullSchedule ? 'active' : ''}`}
              onClick={handleToggleScheduleType}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="toggle-button-icon">
                {showFullSchedule ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {showFullSchedule ? 'Вернуться к краткому виду' : 'Открыть полное расписание на неделю'}
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div
          className="tabs-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="tabs-switch-indicator">
            <span>Показаны релизы:</span>
            <span className="day-indicator">{getActiveDayLabel()}</span>
          </div>

          <div className="tabs-grid">
            {(showFullSchedule ? weekDays : simpleDays).map((day, index) => (
              <motion.button
                key={day.id}
                className={`tab ${activeDay === day.id ? 'active' : ''}`}
                onClick={() => setActiveDay(day.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
              >
                {day.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="schedule-content"
          >
            {loading ? (
              <div className="anime-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-meta"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimeGrid
                animeList={getAnimeListForDay(activeDay)}
                onAnimeClick={onAnimeClick}
                emptyMessage={getEmptyMessage(activeDay)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.main>
  );
};

export default Schedule;