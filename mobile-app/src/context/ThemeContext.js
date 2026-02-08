import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDark,
    colors: {
      background: isDark ? '#0B0F14' : '#FFFFFF',
      surface: isDark ? '#111827' : '#F3F4F6',
      text: isDark ? '#FFFFFF' : '#1F2937',
      textSecondary: isDark ? '#E5E7EB' : '#6B7280',
      border: isDark ? '#1F2937' : '#E5E7EB',
      primary: '#0084FF',
      cyan: '#22D3EE',
      orange: '#FB923C',
      purple: '#A78BFA',
      red: '#EF4444'
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
