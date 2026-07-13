
import { DarkTheme as NavigationDark } from '@react-navigation/native';

export const DarkTheme = {
  ...NavigationDark,
  colors: {
    ...NavigationDark.colors,
    background: '#0B0F14',
    card: '#141821',
    surface: '#141821',
    text: '#E5E7EB',
    primary: '#FFFFFF',
    border: '#1F2937',
    accent: '#FFFFFF',
    orange: '#FB923C',
    textSecondary: '#9CA3AF',
  }
};
