import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se pudo cargar esta pantalla</Text>
        <Text style={styles.message}>
          Ocurrió un error inesperado. Tus datos no se han eliminado. Intenta nuevamente.
        </Text>
        <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
          <Text style={styles.buttonText}>Intentar de nuevo</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  title: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 360,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
