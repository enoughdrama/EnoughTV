import React, { createContext, useState, useContext } from 'react';
import { PAGES } from '../utils/external/api';

const NavigationContext = createContext();

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider = ({ children }) => {
    const [breadcrumbSource, setBreadcrumbSource] = useState(PAGES.HOME);

    const setSource = (source) => {
        setBreadcrumbSource(source);
    };

    return (
        <NavigationContext.Provider value={{ breadcrumbSource, setSource }}>
            {children}
        </NavigationContext.Provider>
    );
};

export default NavigationContext;