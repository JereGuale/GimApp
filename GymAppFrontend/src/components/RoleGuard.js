import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

/**
 * Componente protector que valida que el usuario tenga el rol requerido
 * Si no tiene el rol, lo desautentica automáticamente
 */
export function RoleGuard({ requiredRole, children, onUnauthorized }) {
  const { user, logout } = useAuth();

  const hasRole = Array.isArray(requiredRole)
    ? requiredRole.includes(user?.role)
    : user?.role === requiredRole;

  useEffect(() => {
    if (user && !hasRole) {
      console.warn(
        `[RoleGuard] Acceso denegado. Usuario (${user.role}) intentó acceder a panel con requerimientos:`,
        requiredRole
      );
      // Desautenticar automáticamente si intenta acceder sin permiso
      logout();
      if (onUnauthorized) {
        onUnauthorized();
      }
    }
  }, [user, requiredRole, hasRole, logout, onUnauthorized]);

  // Si el usuario no tiene el rol requerido, mostrar pantalla de error
  if (user && !hasRole) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Acceso Denegado</Text>
        <Text style={styles.errorMessage}>
          Tu rol no tiene permiso para acceder a esta sección
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F14',
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  errorMessage: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
});
