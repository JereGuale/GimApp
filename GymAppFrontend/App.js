import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { DarkTheme } from './src/theme/darkTheme';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { Platform } from 'react-native';
import AppErrorBoundary from './src/components/AppErrorBoundary';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'rn-web-input-cleaner';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      input, textarea {
        outline: none !important;
        outline-width: 0 !important;
        outline-style: none !important;
        -webkit-tap-highlight-color: transparent;
      }
      input:focus, textarea:focus {
        outline: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>
            <NotificationProvider>
              <NavigationContainer theme={DarkTheme}>
                <RootNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
