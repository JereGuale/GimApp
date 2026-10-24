
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import UserTabs from './UserTabs';
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

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'authenticated' : 'guest'}
      screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}
    >
      <Stack.Screen name="UserTabs" component={UserTabs} />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ presentation: 'transparentModal', animationEnabled: false }}
      />
      {!user && (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
