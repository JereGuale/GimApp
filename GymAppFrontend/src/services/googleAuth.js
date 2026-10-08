import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { authGoogle } from './api';
import { GOOGLE_WEB_CLIENT_ID } from '../../.env.js';

WebBrowser.maybeCompleteAuthSession();

// Configuration for Google OAuth
export const GOOGLE_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || '',
};

/**
 * Executes Google Sign-in flow.
 * Supports Web (popup/redirect) and Mobile (AuthSession / WebBrowser).
 * Sends token or verified info to backend /api/auth/google.
 */
export const performGoogleSignIn = async () => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'gymapp',
      preferLocalhost: true,
    });

    const clientId = Platform.select({
      web: GOOGLE_CONFIG.webClientId,
      android: GOOGLE_CONFIG.androidClientId || GOOGLE_CONFIG.webClientId,
      ios: GOOGLE_CONFIG.iosClientId || GOOGLE_CONFIG.webClientId,
      default: GOOGLE_CONFIG.webClientId,
    });

    if (!clientId) {
      throw new Error('GOOGLE_CONFIG_MISSING');
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token%20id_token` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&nonce=${Math.random().toString(36).substring(7)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      // Extraer parámetros hash (#access_token=... o #id_token=...)
      const urlPart = result.url.split('#')[1] || result.url.split('?')[1] || '';
      const params = new URLSearchParams(urlPart);
      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');

      let userInfo = null;
      if (accessToken) {
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (userRes.ok) {
            userInfo = await userRes.json();
          }
        } catch (e) {
          console.warn('Error fetching Google userinfo:', e);
        }
      }

      const payload = {
        id_token: idToken,
        access_token: accessToken,
        google_id: userInfo?.sub,
        email: userInfo?.email,
        name: userInfo?.name,
        photo: userInfo?.picture,
      };

      const backendResponse = await authGoogle(payload);
      return backendResponse;
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      return null;
    } else {
      throw new Error('No se completó la autenticación con Google');
    }
  } catch (error) {
    if (error.message === 'GOOGLE_CONFIG_MISSING') {
      throw error;
    }
    console.error('Google Sign-in Error:', error);
    throw error;
  }
};
