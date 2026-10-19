import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileAPI } from '../services/notificationService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.local_profile_photo) delete parsed.local_profile_photo;
          return parsed;
        }
      } catch {}
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem('token') || null;
      } catch {}
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      return !window.localStorage.getItem('token');
    }
    return true;
  });

  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.local_profile_photo) {
          delete parsedUser.local_profile_photo;
        }
        setUser(parsedUser);

        // Intenta obtener los datos mÃ¡s recientes del backend
        ProfileAPI.getProfile(storedToken).then((res) => {
          if (res.success && res.data) {
            updateUser({
              ...parsedUser,
              ...res.data,
              profile_photo: res.data.profile_photo || parsedUser.profile_photo,
              profile_photo_url: res.data.profile_photo_url || parsedUser.profile_photo_url,
            });
          }
        }).catch((error) => {
          console.warn('No se pudo sincronizar el perfil en segundo plano:', error);
        });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, authToken, keepLoggedIn = true) => {
    try {
      if (keepLoggedIn) {
        await AsyncStorage.setItem('token', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  };

  const logout = async () => {
    console.log('[AuthContext] logout() called');
    try {
      console.log('[AuthContext] Starting AsyncStorage cleanup...');
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('[AuthContext] AsyncStorage cleanup completed');
    } catch (error) {
      console.error('[AuthContext] Error cleaning AsyncStorage:', error);
    }
    console.log('[AuthContext] Setting token and user to null...');
    setToken(null);
    setUser(null);
    setLoading(false);
    console.log('[AuthContext] logout() completed');
  };

  const updateUser = async (updatedUser) => {
    try {
      const nextUser = {
        ...user,
        ...updatedUser,
        profile_photo: updatedUser?.profile_photo || user?.profile_photo,
        profile_photo_url: updatedUser?.profile_photo_url || user?.profile_photo_url,
      };
      await AsyncStorage.setItem('user', JSON.stringify(nextUser));
      setUser(nextUser);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading, avatarPreview, setAvatarPreview }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
