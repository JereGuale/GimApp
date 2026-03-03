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
    primary: '#000000', // Negro puro para contraste
    border: '#E5E5E5',
    surface: '#FFFFFF',
    secondaryText: '#6B6B6B', // Gris medio
    accent: '#000000', // Negro puro
    badgeBg: '#F2F2F2',
    orange: '#FB923C',
  },
  fonts: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
};
