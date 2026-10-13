import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { DarkTheme } from './src/theme/darkTheme';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppErrorBoundary from './src/components/AppErrorBoundary';

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
