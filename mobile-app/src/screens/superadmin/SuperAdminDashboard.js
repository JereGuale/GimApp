import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SuperAdminService, CategoryService } from '../../services/adminApi';

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { width: winWidth } = useWindowDimensions();
  const isWide = winWidth > 700;

  const [metrics, setMetrics] = useState({
    totalUsers: 0, activeSubscriptions: 0, monthlyIncome: 0, expiringSoon: 0,
    monthlyChangePercent: 0, weeklyIncome: 0, weeklyChangePercent: 0,
    newRegistrationsWeek: 0, registrationsChange: 0,
    peakUsersTotal: 0, categoriesCount: 0, productsCount: 0,
    dailyChart: [], revenue_by_month: [], registrations_by_month: [], peak_hours: [],
    usersByRole: {},
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [roles, setRoles] = useState([
    { name: 'Admin', icon: 'shield-checkmark', color: '#22D3EE', count: 1, label: '1 admin' },
    { name: 'Trainer', icon: 'barbell', color: '#FB923C', count: 2, label: '2 trainers' },
    { name: 'User', icon: 'person', color: '#A78BFA', count: 0, label: '0 users' },
  ]);

  const loadData = async () => {
    if (!token) return;
    try {
      const [catData, metricsData] = await Promise.all([
        CategoryService.getAll(token).catch(() => []),
        SuperAdminService.getMetrics(token).catch(() => ({})),
      ]);

      const catList = Array.isArray(catData) ? catData : (catData?.data || []);
      setCategories(catList);

      let allProducts = [];
      catList.forEach(cat => {
        if (cat.products) allProducts = allProducts.concat(cat.products);
      });
      setProducts(allProducts);

      if (metricsData) {
        const totalUsers = metricsData.total_users || 0;
        const byRole = metricsData.users_by_role || {};
        setMetrics({
          totalUsers,
          activeSubscriptions: metricsData.active_subscriptions || 0,
          monthlyIncome: metricsData.monthly_income || 0,
          expiringSoon: metricsData.expiring_subscriptions || 0,
          monthlyChangePercent: metricsData.monthly_change_percent || 0,
          weeklyIncome: metricsData.weekly_income || 0,
          weeklyChangePercent: metricsData.weekly_change_percent || 0,
          newRegistrationsWeek: metricsData.new_registrations_week || 0,
          registrationsChange: metricsData.registrations_change || 0,
          peakUsersTotal: metricsData.peak_users_total || 0,
          categoriesCount: metricsData.categories_count || 0,
          productsCount: metricsData.products_count || 0,
          dailyChart: metricsData.daily_chart || [],
          revenue_by_month: metricsData.revenue_by_month || [],
          registrations_by_month: metricsData.registrations_by_month || [],
          peak_hours: metricsData.peak_hours || [],
          usersByRole: byRole,
        });
        // Update roles with real counts from users_by_role
        const adminCount = byRole.super_admin || byRole.admin || 0;
        const trainerCount = byRole.trainer || 0;
        const userCount = byRole.user || byRole.member || 0;
        setRoles([
          { name: 'Admin', icon: 'shield-checkmark', color: '#22D3EE', count: adminCount, label: adminCount + (adminCount === 1 ? ' admin' : ' admins') },
          { name: 'Trainer', icon: 'barbell', color: '#FB923C', count: trainerCount, label: trainerCount + (trainerCount === 1 ? ' trainer' : ' trainers') },
          { name: 'User', icon: 'person', color: '#A78BFA', count: userCount, label: userCount + (userCount === 1 ? ' user' : ' users') },
        ]);
      }
    } catch (error) {
      console.error('[Dashboard] Error:', error);
    }
  };

  useEffect(() => { loadData(); }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Bar Chart component
  const BarChart = ({ data, color, height = 110 }) => {
    const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const chartData = data.length > 0
      ? data
      : days.map((d) => ({ label: d, value: 0 }));
    const maxVal = Math.max(...chartData.map(d => d.value), 1);
    const today = new Date().getDay();
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 8, marginTop: 16, paddingHorizontal: 4 }}>
        {chartData.slice(0, 7).map((item, i) => {
          const barH = Math.max((item.value / maxVal) * (height - 28), 10);
          const isToday = i === today;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: isToday ? color : '#4B5563', fontSize: 9, fontWeight: '700', marginBottom: 4 }}>
                {'$' + Math.round(item.value)}
              </Text>
              <View style={{
                width: '80%', height: barH, borderRadius: 6,
                backgroundColor: isToday ? color : color + '60',
                ...(isToday && { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 6 }),
              }} />
              <Text style={{ color: isToday ? '#FFF' : '#6B7280', fontSize: 10, fontWeight: isToday ? '700' : '500', marginTop: 6 }}>
                {item.label || days[i % 7]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Mini Sparkline
  const Sparkline = ({ color }) => {
    const points = [3, 5, 4, 7, 6, 8, 7, 9];
    const max = Math.max(...points);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 28, gap: 3 }}>
        {points.map((v, i) => (
          <View key={i} style={{
            width: 4, borderRadius: 3, height: (v / max) * 28,
            backgroundColor: color, opacity: 0.25 + (i / points.length) * 0.75,
          }} />
        ))}
        <Ionicons name="trending-up" size={14} color={color} style={{ marginLeft: 4, marginBottom: -2 }} />
      </View>
    );
  };

  const fmtChange = (v) => (v >= 0 ? '+' : '') + v;

  const statCards = [
    {
      title: 'Ganancias Mensuales', value: '$' + metrics.monthlyIncome.toLocaleString(),
      sub: fmtChange(metrics.monthlyChangePercent) + '% este mes',
      subColor: metrics.monthlyChangePercent >= 0 ? '#10B981' : '#EF4444',
      subIcon: metrics.monthlyChangePercent >= 0 ? 'trending-up' : 'trending-down',
      icon: 'wallet-outline', bg: '#0F4C3A', iconBg: '#10B981', accent: '#10B981',
    },
    {
      title: 'Nuevos Registros', value: String(metrics.newRegistrationsWeek),
      sub: fmtChange(metrics.registrationsChange) + ' esta semana',
      subColor: metrics.registrationsChange >= 0 ? '#22D3EE' : '#EF4444',
      subIcon: metrics.registrationsChange >= 0 ? 'trending-up' : 'trending-down',
      icon: 'person-add-outline', bg: '#0C3547', iconBg: '#22D3EE', accent: '#22D3EE',
    },
    {
      title: 'Horas Pico',
      value: String(metrics.peakUsersTotal),
      sub: 'Usuarios activos', subColor: '#FB923C',
      subIcon: 'flame', icon: 'analytics-outline',
      bg: '#3D2C0A', iconBg: '#FB923C', accent: '#FB923C',
    },
    {
      title: 'Suscripciones', value: String(metrics.activeSubscriptions),
      sub: metrics.expiringSoon + ' por vencer', subColor: '#A78BFA',
      subIcon: 'calendar-outline', icon: 'ribbon-outline',
      bg: '#2D1B4E', iconBg: '#A78BFA', accent: '#A78BFA',
    },
  ];

  // Use daily chart from API (real daily earnings this week)
  const revenueData = metrics.dailyChart.length > 0
    ? metrics.dailyChart.map(d => ({ label: d.label, value: Number(d.value) }))
    : [{ label: 'D', value: 0 },{ label: 'L', value: 0 },{ label: 'M', value: 0 },{ label: 'X', value: 0 },{ label: 'J', value: 0 },{ label: 'V', value: 0 },{ label: 'S', value: 0 }];
  const weeklyTotal = metrics.weeklyIncome;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22D3EE" />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Super Admin Dashboard</Text>
          <View style={styles.titleAccent} />
        </View>
      </View>

      {/* Stats Row */}
      {isWide ? (
        <View style={styles.statsRowWide}>
          {statCards.map((card, i) => (
            <View key={i} style={[styles.statCard, styles.statCardWide, { backgroundColor: card.bg, borderColor: card.accent + '25' }]}>
              <View style={[styles.statAccentLine, { backgroundColor: card.accent }]} />
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: card.iconBg + '20' }]}>
                  <Ionicons name={card.icon} size={20} color={card.iconBg} />
                </View>
                <Text style={styles.statLabel}>{card.title}</Text>
              </View>
              <Text style={styles.statValue}>{card.value}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={card.subIcon} size={12} color={card.subColor} />
                <Text style={[styles.statSub, { color: card.subColor }]}>{card.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          {statCards.map((card, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: card.bg, borderColor: card.accent + '25' }]}>
              <View style={[styles.statAccentLine, { backgroundColor: card.accent }]} />
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: card.iconBg + '20' }]}>
                  <Ionicons name={card.icon} size={20} color={card.iconBg} />
                </View>
                <Text style={styles.statLabel}>{card.title}</Text>
              </View>
              <Text style={styles.statValue}>{card.value}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={card.subIcon} size={12} color={card.subColor} />
                <Text style={[styles.statSub, { color: card.subColor }]}>{card.sub}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Middle Row */}
      <View style={[styles.middleRow, isWide && { flexDirection: 'row' }]}>
        {/* Roles */}
        <View style={[styles.dashCard, { backgroundColor: theme.colors.surface, borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1 }, isWide && { flex: 1 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#22D3EE15', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="shield-account-outline" size={20} color="#22D3EE" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 0 }]}>Gestión de Roles y Permisos</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>Roles</Text>
          <View style={styles.rolesTable}>
            {roles.map((role, i) => (
              <TouchableOpacity
                key={role.name}
                style={[styles.roleRow, i < roles.length - 1 && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }]}
                onPress={() => navigation.navigate('UserRoles', { role: role.name.toLowerCase() })}
                activeOpacity={0.7}
              >
                <View style={styles.roleInfo}>
                  <View style={[styles.roleIcon, { backgroundColor: role.color + '15', borderWidth: 1, borderColor: role.color + '30' }]}>
                    <Ionicons name={role.icon} size={18} color={role.color} />
                  </View>
                  <Text style={[styles.roleName, { color: theme.colors.text }]}>{role.name}</Text>
                </View>
                <Text style={[styles.roleCount, { color: theme.colors.text }]}>{role.count}</Text>
                <Text style={[styles.roleLabel, { color: theme.colors.textSecondary }]}>{role.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.permissionsBtn}
            onPress={() => navigation.navigate('RoleManagement')}
            activeOpacity={0.8}
          >
            <Ionicons name="key-outline" size={18} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.permissionsBtnText}>Gestionar Permisos</Text>
          </TouchableOpacity>
        </View>

        {/* Revenue */}
        <View style={[styles.dashCard, { backgroundColor: theme.colors.surface, borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1 }, isWide && { flex: 1 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#22D3EE15', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="chart-line" size={20} color="#22D3EE" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 0 }]}>Ganancias de la Última Semana</Text>
          </View>
          <Text style={[styles.revenueValue, { color: '#22D3EE' }]}>
            {'$' + weeklyTotal.toLocaleString()} <Text style={styles.revenuePeriod}>esta semana</Text>
          </Text>
          <Text style={[styles.revenueTrend, metrics.weeklyChangePercent < 0 && { color: '#EF4444' }]}>
            {fmtChange(metrics.weeklyChangePercent)}% comparado a la anterior
          </Text>
          <BarChart data={revenueData} color="#22D3EE" height={100} />
        </View>
      </View>

      {/* Bottom Row */}
      <View style={[styles.bottomRow, isWide && { flexDirection: 'row' }]}>
        {/* Categories */}
        <View style={[styles.dashCard, { backgroundColor: theme.colors.surface, borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1 }, isWide && { flex: 1 }]}>
          <View style={styles.bottomCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="shape-outline" size={20} color="#22D3EE" />
              <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 0 }]}>Categorías</Text>
            </View>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('Categorias')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={16} color="#000" />
              <Text style={styles.createBtnText}>Crear Categoría</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.countRow}>
            <View style={[styles.countIcon, { backgroundColor: 'rgba(34,211,238,0.12)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.2)' }]}>
              <MaterialCommunityIcons name="view-grid-outline" size={26} color="#22D3EE" />
            </View>
            <Text style={[styles.countValue, { color: theme.colors.text }]}>{metrics.categoriesCount || categories.length}</Text>
            <View style={{ flex: 1 }} />
            <Sparkline color="#22D3EE" />
          </View>
        </View>

        {/* Products */}
        <View style={[styles.dashCard, { backgroundColor: theme.colors.surface, borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1 }, isWide && { flex: 1 }]}>
          <View style={styles.bottomCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="package-variant" size={20} color="#A78BFA" />
              <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 0 }]}>Productos</Text>
            </View>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: '#22D3EE' }]}
              onPress={() => navigation.navigate('Productos', { openModal: true })}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={16} color="#000" />
              <Text style={styles.createBtnText}>Crear Producto</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.countRow}>
            <View style={[styles.countIcon, { backgroundColor: 'rgba(167,139,250,0.12)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' }]}>
              <MaterialCommunityIcons name="package-variant-closed" size={26} color="#A78BFA" />
            </View>
            <Text style={[styles.countValue, { color: theme.colors.text }]}>{metrics.productsCount || products.length}</Text>
            <View style={{ flex: 1 }} />
            <Sparkline color="#A78BFA" />
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  titleRow: { marginBottom: 24 },
  pageTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  titleAccent: { width: 40, height: 3, borderRadius: 2, backgroundColor: '#22D3EE', marginTop: 8 },

  statsRow: { gap: 12, paddingBottom: 4, marginBottom: 16 },
  statsRowWide: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    width: 180, borderRadius: 16, padding: 16, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  statCardWide: { width: undefined, flex: 1 },
  statAccentLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: '#E5E7EB', fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  statValue: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  statSub: { fontSize: 11, fontWeight: '700' },

  middleRow: { gap: 16, marginBottom: 16 },
  dashCard: {
    borderRadius: 20, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },

  rolesTable: { marginBottom: 16 },
  roleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  roleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  roleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roleName: { fontSize: 15, fontWeight: '600' },
  roleCount: { fontSize: 16, fontWeight: '800', width: 40, textAlign: 'center' },
  roleLabel: { fontSize: 13, width: 80 },

  permissionsBtn: {
    backgroundColor: '#22D3EE', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#22D3EE', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  permissionsBtnText: { color: '#000', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  revenueValue: { fontSize: 30, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  revenuePeriod: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
  revenueTrend: { color: '#10B981', fontSize: 13, fontWeight: '700', marginBottom: 4 },

  bottomRow: { gap: 16, marginBottom: 16 },
  bottomCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FB923C', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12,
    shadowColor: '#FB923C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  createBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  countIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  countValue: { fontSize: 38, fontWeight: '900', letterSpacing: -1 },
});
