// lightTheme.js
// Paleta premium, minimalista, moderna, siguiendo la referencia Gymshark/Apple

import { DefaultTheme as NavigationDefault } from '@react-navigation/native';

export const LightTheme = {
  ...NavigationDefault,
  colors: {
    ...NavigationDefault.colors,
    background: '#FFFFFF', // Fondo blanco puro
    card: '#FFFFFF',
    text: '#181818', // Negro suave
    primary: '#FF6A1A', // Naranja quemado
    border: '#E5E5E5',
    surface: '#FFFFFF',
    secondaryText: '#6B6B6B', // Gris medio
    accent: '#FF6A1A', // Naranja quemado
    badgeBg: '#F2F2F2',
  },
  fonts: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
};
