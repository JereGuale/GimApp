
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import TrainerLoginScreen from '../screens/auth/TrainerLoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import UserTabs from './UserTabs';
import AdminTabs from './AdminTabs';
import SuperAdminTabs from './SuperAdminTabs';
import ProductDetailScreen from '../screens/user/ProductDetailScreen';
import CartScreen from '../screens/user/CartScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F14' }}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  const isAuthenticated = !!(user && token);
  console.log('[RootNavigator] Rendering with auth state:', { isAuthenticated, user: user?.name || null, hasToken: !!token });
  if (user) {
    console.log('[RootNavigator] User role:', user.role);
    console.log('[RootNavigator] User object:', user);
  }

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
      screenOptions={{ headerShown: false }}
    >
      {user && token ? (
        <>
          {user.role === 'admin' && (
            <Stack.Screen name="SuperAdminTabs" component={SuperAdminTabs} />
          )}
          {user.role === 'trainer' && (
            <Stack.Screen name="AdminTabs" component={AdminTabs} />
          )}
          {user.role === 'user' && (
            <Stack.Screen name="UserTabs" component={UserTabs} />
          )}
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen name="TrainerLogin" component={TrainerLoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
