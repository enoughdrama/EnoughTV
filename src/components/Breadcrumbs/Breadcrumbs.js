import React from 'react';
import { motion } from 'framer-motion';
import { PAGES } from '../../utils/external/api';
import { useNavigation } from '../../context/NavigationContext';
import './styles/breadcrumbs.css';

const Breadcrumbs = ({ currentPage, pageHistory, navigateTo, selectedAnimeName }) => {
  const { breadcrumbSource } = useNavigation();
  
  const getBreadcrumbPath = () => {
    const paths = [];
    
    paths.push({
      id: PAGES.HOME,
      label: 'Главная',
      onClick: () => navigateTo(PAGES.HOME)
    });
    
    switch (currentPage) {
      case PAGES.SCHEDULE:
        paths.push({
          id: PAGES.SCHEDULE,
          label: 'Расписание',
          onClick: null
        });
        break;
      case PAGES.SEARCH:
        paths.push({
          id: PAGES.SEARCH,
          label: 'Поиск',
          onClick: null
        });
        break;
      case PAGES.ANIME_DETAILS:
        if (pageHistory.length > 0) {
          const previousPage = pageHistory[pageHistory.length - 1];
          
          if (previousPage.page === PAGES.SEARCH) {
            paths.push({
              id: PAGES.SEARCH,
              label: 'Поиск',
              onClick: () => navigateTo(PAGES.SEARCH)
            });
          } else if (previousPage.page === PAGES.SCHEDULE) {
            paths.push({
              id: PAGES.SCHEDULE,
              label: 'Расписание',
              onClick: () => navigateTo(PAGES.SCHEDULE)
            });
          } else if (previousPage.page === PAGES.FRANCHISES) {
            paths.push({
              id: PAGES.FRANCHISES,
              label: 'Франшизы',
              onClick: () => navigateTo(PAGES.FRANCHISES, previousPage.state || {})
            });
          } else if (previousPage.page === PAGES.FAVORITES) {
            paths.push({
              id: PAGES.FAVORITES,
              label: 'Избранное',
              onClick: () => navigateTo(PAGES.FAVORITES)
            });
          }
        } else if (breadcrumbSource !== PAGES.HOME) {
          paths.push({
            id: breadcrumbSource,
            label: breadcrumbSource === PAGES.SEARCH ? 'Поиск' :
                  breadcrumbSource === PAGES.SCHEDULE ? 'Расписание' :
                  breadcrumbSource === PAGES.FRANCHISES ? 'Франшизы' :
                  breadcrumbSource === PAGES.FAVORITES ? 'Избранное' : 'Главная',
            onClick: () => navigateTo(breadcrumbSource)
          });
        }
        
        paths.push({
          id: PAGES.ANIME_DETAILS,
          label: selectedAnimeName || 'Детали аниме',
          onClick: null
        });
        break;
      case PAGES.FRANCHISES:
        paths.push({
          id: PAGES.FRANCHISES,
          label: 'Франшизы',
          onClick: null
        });
        break;
      case PAGES.FAVORITES:
        paths.push({
          id: PAGES.FAVORITES,
          label: 'Избранное',
          onClick: null
        });
        break;
      case PAGES.PROFILE:
        paths.push({
          id: PAGES.PROFILE,
          label: 'Профиль',
          onClick: null
        });
        break;
      default:
        break;
    }
    
    return paths;
  };
  
  const breadcrumbs = getBreadcrumbPath();
  
  if (currentPage === PAGES.HOME || breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <motion.nav 
      className="breadcrumbs-container"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <motion.div 
              className={`breadcrumb ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
              whileTap={crumb.onClick ? { scale: 0.95 } : {}}
              onClick={crumb.onClick}
            >
              {index === 0 && (
                <span className="breadcrumb-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
              {crumb.label}
            </motion.div>
            {index < breadcrumbs.length - 1 && (
              <span className="breadcrumb-separator">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </motion.nav>
  );
};

export default Breadcrumbs;