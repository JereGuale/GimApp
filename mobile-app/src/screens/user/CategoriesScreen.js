
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function CategoriesScreen() {
  const { theme } = useTheme();

  const categories = [
    {
      id: 'supplements',
      title: 'Suplementos',
      image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1600&auto=format&fit=crop',
      borderColor: '#22D3EE',
      buttonColor: '#22D3EE',
      icon: 'fitness-outline'
    },
    {
      id: 'apparel',
      title: 'Ropa Deportiva',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format&fit=crop',
      borderColor: '#FB923C',
      buttonColor: '#FB923C',
      icon: 'shirt-outline'
    },
    {
      id: 'others',
      title: 'Otros',
      image: 'https://images.unsplash.com/photo-1517836357463-d25ddfcf2e1e?q=80&w=1600&auto=format&fit=crop',
      borderColor: '#A78BFA',
      buttonColor: '#A78BFA',
      icon: 'barbell-outline'
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Categorías de Productos</Text>
      <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
        Explora nuestros productos por categoría
      </Text>

      {categories.map((item) => (
        <ImageBackground
          key={item.id}
          source={{ uri: item.image }}
          style={[
            styles.card,
            {
              borderColor: item.borderColor,
              shadowColor: item.borderColor
            }
          ]}
          imageStyle={styles.cardImage}
        >
          <View style={styles.cardOverlay}>
            <View style={styles.cardHeader}>
              <Ionicons name={item.icon} size={48} color={item.borderColor} style={styles.categoryIcon} />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.cardButton,
                {
                  backgroundColor: item.buttonColor,
                  shadowColor: item.buttonColor
                }
              ]}
            >
              <Text style={styles.cardButtonText}>Ver Productos</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5
  },
  pageSubtitle: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20
  },
  card: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 12
  },
  cardImage: { borderRadius: 24 },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 20, 0.70)',
    padding: 24,
    justifyContent: 'space-between'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  categoryIcon: {
    textShadowColor: 'rgba(34, 211, 238, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5
  },
  cardButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  }
});
