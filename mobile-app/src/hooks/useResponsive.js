import { useWindowDimensions } from 'react-native';

/**
 * Custom hook for responsive design layout triggers
 */
export const useResponsive = () => {
    const { width } = useWindowDimensions();

    // Breakpoints
    const isSmallScreen = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    return {
        width,
        isSmallScreen,
        isTablet,
        isDesktop,
    };
};

export default useResponsive;
