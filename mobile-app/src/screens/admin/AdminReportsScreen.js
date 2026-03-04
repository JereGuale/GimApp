import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { SuperAdminService } from '../../services/adminApi';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function AdminReportsScreen() {
    const { theme, isDark } = useTheme();
    const { token } = useAuth();
    const { isSmallScreen } = useResponsive();

    const [activeTab, setActiveTab] = useState('Panel Principal');
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);

    // Helper to get local date string YYYY-MM-DD avoiding UTC timezone shift
    const getLocalDateString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Daily Report State
    const [dailyDate, setDailyDate] = useState(getLocalDateString());
    const [dailyReports, setDailyReports] = useState([]);
    const [dailyTotal, setDailyTotal] = useState(0);

    // Modal State for Delete Confirmation
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Register Daily Income State
    const [clientName, setClientName] = useState('');
    const [amount, setAmount] = useState('');

    // Monthly Report State
    const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
    const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
    const [monthlyReports, setMonthlyReports] = useState([]);
    const [monthlyTotal, setMonthlyTotal] = useState(0);

    const loadDashboard = async () => {
        try {
            const data = await SuperAdminService.getReportDashboard(token);
            setDashboardData(data);
        } catch (error) {
            console.error('Error loading dashboard metrics:', error);
        }
    };

    const loadDailyReports = async () => {
        try {
            const resp = await SuperAdminService.getDailyReports(token, dailyDate);
            setDailyReports(resp.data || []);
            setDailyTotal(resp.total || 0);
        } catch (error) {
            console.error('Error loading daily reports:', error);
        }
    };

    const loadMonthlyReports = async () => {
        try {
            const resp = await SuperAdminService.getMonthlyReports(token, monthlyMonth, monthlyYear);
            setMonthlyReports(resp.data || []);
            setMonthlyTotal(resp.total || 0);
        } catch (error) {
            console.error('Error loading monthly reports:', error);
        }
    };

    const reloadAll = async () => {
        setRefreshing(true);
        await Promise.all([loadDashboard(), loadDailyReports(), loadMonthlyReports()]);
        setRefreshing(false);
    };

    useEffect(() => {
        if (token) reloadAll();
    }, [token, activeTab, dailyDate, monthlyMonth, monthlyYear]);

    const handlePreviousDay = () => {
        const d = new Date(dailyDate + 'T12:00:00');
        d.setDate(d.getDate() - 1);
        setDailyDate(d.toISOString().split('T')[0]);
    };

    const handleNextDay = () => {
        const d = new Date(dailyDate + 'T12:00:00');
        d.setDate(d.getDate() + 1);
        setDailyDate(d.toISOString().split('T')[0]);
    };

    const handleSetToday = () => {
        setDailyDate(getLocalDateString());
    };

    const handleRegisterIncome = async () => {
        if (!clientName.trim() || !amount.trim()) {
            Alert.alert('Error', 'Por favor ingresa nombre del cliente y valor pagado.');
            return;
        }

        try {
            await SuperAdminService.registerDailyIncome(token, {
                client_name: clientName,
                amount: parseFloat(amount),
                entry_date: dailyDate
            });
            setClientName('');
            setAmount('');
            Alert.alert('Éxito', 'Ingreso registrado correctamente');
            reloadAll();
        } catch (error) {
            Alert.alert('Error', 'No se pudo registrar el ingreso diario');
        }
    };

    const handleDeleteDaily = (id) => {
        // Instead of Alert or window.confirm, open the custom Modal
        setItemToDelete(id);
        setIsDeleteModalVisible(true);
    };

    const confirmDeleteDaily = async () => {
        if (!itemToDelete) return;

        setIsDeleteModalVisible(false);
        try {
            await SuperAdminService.deleteDailyIncome(token, itemToDelete);

            if (Platform.OS === 'web') {
                window.alert('Registro eliminado correctamente.');
            } else {
                Alert.alert('Éxito', 'Registro eliminado correctamente.');
            }
            reloadAll();
        } catch (error) {
            if (Platform.OS === 'web') {
                window.alert('Hubo un problema al eliminar el registro.');
            } else {
                Alert.alert('Error', 'Hubo un problema al eliminar el registro.');
            }
        }
    };

    // Helpert function to handle HTML printing exclusively via iframe for Web 
    // This avoids `window.print()` capturing the entire browser viewport (Sidebars, UI buttons, etc)
    const printHtmlToWebIframe = (htmlContent) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(htmlContent);
        iframe.contentWindow.document.close();

        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Remove iframe after printing
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };

    const generateDailyPDF = async () => {
        const downloadDate = new Date();
        const formattedDate = downloadDate.toLocaleDateString();
        const formattedTime = downloadDate.toLocaleTimeString();

        const htmlRows = dailyReports.map(r => `
      <tr>
        <td>${r.client_name}</td>
        <td>${new Date(r.entry_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td class="amount">$${Number(r.amount).toFixed(2)}</td>
      </tr>
    `).join('');

        const htmlContent = `
      <html>
        <head>
          <style>
            body { 
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                padding: 40px; 
                color: #1F2937; 
                background-color: #FFFFFF;
            }
            .header-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #E5E7EB;
            }
            h1 { 
                color: #1E3A8A; 
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .meta-info {
                color: #6B7280;
                font-size: 14px;
                text-align: center;
                margin-bottom: 5px;
            }
            
            .summary-box {
                background-color: #F8FAFC;
                border: 1px solid #E2E8F0;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 30px;
                display: flex;
                justify-content: space-around;
            }
            .summary-item {
                text-align: center;
            }
            .summary-label {
                font-size: 13px;
                color: #64748B;
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
            }
            .summary-value {
                font-size: 24px;
                color: #0F172A;
                font-weight: 700;
            }
            .summary-value.highlight {
                color: #10B981;
            }

            table { 
                width: 100%; 
                border-collapse: separate; 
                border-spacing: 0;
                margin-top: 20px; 
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #E2E8F0;
            }
            th, td { 
                padding: 14px 16px; 
                text-align: left; 
                border-bottom: 1px solid #E2E8F0;
            }
            th { 
                background-color: #F8FAFC; 
                color: #475569; 
                font-weight: 600;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            tr:last-child td {
                border-bottom: none;
            }
            .amount {
                font-weight: 600;
                color: #0F172A;
            }
            
            .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #E5E7EB;
                text-align: center;
                font-size: 12px;
                color: #9CA3AF;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1>Reporte de Contabilidad Diario</h1>
            <div class="meta-info"><b>FitAdmin</b> - Sistema de Gestión de Gimnasio</div>
            <div class="meta-info">Generado el ${formattedDate} a las ${formattedTime}</div>
          </div>

          <div class="summary-box">
             <div class="summary-item">
                <div class="summary-label">Fecha del Reporte</div>
                <div class="summary-value">${new Date(dailyDate + 'T00:00:00').toLocaleDateString()}</div>
             </div>
             <div class="summary-item">
                <div class="summary-label">Personas Atendidas</div>
                <div class="summary-value">${dailyReports.length}</div>
             </div>
             <div class="summary-item">
                <div class="summary-label">Ingresos Obtenidos</div>
                <div class="summary-value highlight">$${Number(dailyTotal).toFixed(2)}</div>
             </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Cliente</th>
                <th style="width: 25%;">Hora de Ingreso</th>
                <th style="width: 25%;">Pago</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows.length > 0 ? htmlRows : '<tr><td colspan="3" style="text-align:center; color:#9CA3AF;">No hay registros para este día.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Documento generado automáticamente por FitAdmin.
          </div>
        </body>
      </html>
    `;

        try {
            if (Platform.OS === 'web') {
                await Print.printAsync({ html: htmlContent });
            } else {
                const { uri } = await Print.printToFileAsync({ html: htmlContent });
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            if (Platform.OS === 'web') {
                window.alert('No se pudo generar el PDF. ' + error.message);
            } else {
                Alert.alert('Error', 'No se pudo generar el PDF. ' + error.message);
            }
        }
    };

    const generateMonthlyPDF = async () => {
        const htmlRows = monthlyReports.map(r => {
            const isExpired = new Date(r.ends_at) < new Date();
            const statusColor = isExpired ? '#EF4444' : '#10B981';
            const statusText = isExpired ? 'VENCIDO' : 'ACTIVO';
            return `
      <tr>
        <td>${r.user?.name || 'Usuario ' + r.user_id} <br><small>${r.plan?.name || ''}</small></td>
        <td>$${Number(r.price).toFixed(2)}</td>
        <td>${new Date(r.starts_at).toLocaleDateString()}</td>
        <td>${new Date(r.ends_at).toLocaleDateString()}</td>
        <td style="color:${statusColor}; font-weight:bold;">${statusText}</td>
      </tr>
    `}).join('');

        const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 20px; color: #333; }
            h1 { color: #2563EB; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
            th { background-color: #F3F4F6; color: #374151; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Reporte Mensual Suscripciones - FitAdmin</h1>
          <p>Período: Mes ${monthlyMonth} - Año ${monthlyYear}</p>
          <table>
            <thead>
              <tr><th>Cliente / Plan</th><th>Monto</th><th>Fecha de Pago</th><th>Vencimiento</th><th>Estado</th></tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
          <div class="total">Total Suscripciones: $${Number(monthlyTotal).toFixed(2)}</div>
        </body>
      </html>
    `;

        try {
            if (Platform.OS === 'web') {
                printHtmlToWebIframe(htmlContent);
            } else {
                const { uri } = await Print.printToFileAsync({ html: htmlContent });
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            if (Platform.OS === 'web') {
                window.alert('No se pudo generar el PDF. ' + error.message);
            } else {
                Alert.alert('Error', 'No se pudo generar el PDF. ' + error.message);
            }
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', flexDirection: isSmallScreen ? 'column' : 'row' }]}>
            {/* Sidebar */}
            <View style={[
                styles.sidebar,
                {
                    backgroundColor: theme.colors.surface,
                    borderRightWidth: isSmallScreen ? 0 : 1,
                    borderBottomWidth: isSmallScreen ? 1 : 0,
                    borderRightColor: theme.colors.border,
                    borderBottomColor: theme.colors.border,
                    width: isSmallScreen ? '100%' : 220,
                    paddingTop: isSmallScreen ? 20 : 40,
                    flexDirection: isSmallScreen ? 'row' : 'column',
                    flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
                    justifyContent: isSmallScreen ? 'center' : 'flex-start',
                    gap: isSmallScreen ? 10 : 0
                }
            ]}>
                {!isSmallScreen && <Text style={[styles.logoText, { color: theme.colors.text }]}>Fit<Text style={{ color: '#2563EB' }}>Admin</Text></Text>}

                <TouchableOpacity
                    style={[styles.navItem, activeTab === 'Panel Principal' && styles.navItemActive]}
                    onPress={() => setActiveTab('Panel Principal')}
                >
                    <Ionicons name="grid" size={18} color={activeTab === 'Panel Principal' ? '#fff' : theme.colors.textSecondary} />
                    <Text style={[styles.navText, activeTab === 'Panel Principal' ? { color: '#fff', fontWeight: 'bold' } : { color: theme.colors.textSecondary }]}>
                        Panel Principal
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navItem, activeTab === 'Reporte Mensual' && styles.navItemActive]}
                    onPress={() => setActiveTab('Reporte Mensual')}
                >
                    <Ionicons name="calendar-outline" size={18} color={activeTab === 'Reporte Mensual' ? '#fff' : theme.colors.textSecondary} />
                    <Text style={[styles.navText, activeTab === 'Reporte Mensual' ? { color: '#fff', fontWeight: 'bold' } : { color: theme.colors.textSecondary }]}>
                        Reporte Mensual
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navItem, activeTab === 'Clientes Mensuales' && styles.navItemActive]}
                    onPress={() => setActiveTab('Clientes Mensuales')}
                >
                    <Ionicons name="people-outline" size={18} color={activeTab === 'Clientes Mensuales' ? '#fff' : theme.colors.textSecondary} />
                    <Text style={[styles.navText, activeTab === 'Clientes Mensuales' ? { color: '#fff', fontWeight: 'bold' } : { color: theme.colors.textSecondary }]}>Clientes Mensuales</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content Area */}
            <ScrollView
                style={styles.mainScrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reloadAll} />}
            >
                {activeTab === 'Reporte Mensual' || activeTab === 'Clientes Mensuales' ? (
                    <View style={styles.contentContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Reportes Mensuales</Text>

                        <View style={[styles.sectionBox, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.tableHeaderSection}>
                                <View>
                                    <Text style={[styles.boxTitle, { color: theme.colors.text }]}>Reporte Mensual</Text>
                                    <Text style={[styles.boxSubtitle, { color: theme.colors.textSecondary }]}>Clientes con pago de membresía mensual activa e inactiva.</Text>
                                </View>
                                <View style={styles.tableActions}>
                                    <Text style={{ color: theme.colors.textSecondary, marginRight: 15, fontWeight: 'bold' }}>Mes: {monthlyMonth} / {monthlyYear}</Text>
                                    <TouchableOpacity style={styles.pdfBtnMonthly} onPress={generateMonthlyPDF}>
                                        <Ionicons name="download-outline" size={18} color="#fff" />
                                        <Text style={styles.pdfBtnText}>Descargar Reporte PDF</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.tableHead, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Text style={[styles.th, { flex: 2, color: theme.colors.textSecondary }]}>CLIENTE</Text>
                                <Text style={[styles.th, { flex: 1, color: theme.colors.textSecondary }]}>MONTO</Text>
                                <Text style={[styles.th, { flex: 1.5, color: theme.colors.textSecondary }]}>FECHA DE PAGO</Text>
                                <Text style={[styles.th, { flex: 1.5, color: theme.colors.textSecondary }]}>VENCIMIENTO</Text>
                                <Text style={[styles.th, { flex: 1, color: theme.colors.textSecondary }]}>ESTADO</Text>
                            </View>

                            {monthlyReports.map((item, idx) => {
                                const isExpired = new Date(item.ends_at) < new Date();
                                return (
                                    <View key={item.id} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                                        <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                                            <View style={styles.avatarPlaceholder}><Ionicons name="person" size={14} color="#9CA3AF" /></View>
                                            <View>
                                                <Text style={[styles.tdText, { color: theme.colors.text, fontWeight: '600' }]}>{item.user?.name || 'ID: ' + item.user_id}</Text>
                                                <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>{item.plan?.name}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.td, styles.tdText, { flex: 1, color: theme.colors.text, fontWeight: '700' }]}>
                                            ${Number(item.price).toFixed(2)}
                                        </Text>
                                        <Text style={[styles.td, styles.tdText, { flex: 1.5, color: theme.colors.textSecondary }]}>
                                            {new Date(item.starts_at).toLocaleDateString()}
                                        </Text>
                                        <Text style={[styles.td, styles.tdText, { flex: 1.5, color: theme.colors.textSecondary }]}>
                                            {new Date(item.ends_at).toLocaleDateString()}
                                        </Text>
                                        <View style={[styles.td, { flex: 1 }]}>
                                            <View style={[styles.badge, { backgroundColor: isExpired ? '#EF4444' : '#10B981' }]}>
                                                <Text style={styles.badgeText}>{isExpired ? 'VENCIDO' : 'ACTIVO'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                            {monthlyReports.length === 0 && (
                                <Text style={{ padding: 20, textAlign: 'center', color: theme.colors.textSecondary }}>No hay suscripciones registradas en este mes.</Text>
                            )}

                            <View style={[styles.tableFooter, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', marginRight: 20, color: theme.colors.text }}>
                                    Total Membresías (Mes {monthlyMonth}):
                                </Text>
                                <Text style={{ width: 100, fontWeight: 'bold', color: theme.colors.text }}>${Number(monthlyTotal).toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.contentContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Panel Administrativo</Text>

                        {/* Metrics Row */}
                        <View style={styles.metricsRow}>
                            <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={styles.metricHeader}>
                                    <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Ingresos Hoy</Text>
                                    <View style={styles.iconCircle}><Ionicons name="cash-outline" size={16} color="#374151" /></View>
                                </View>
                                <Text style={[styles.metricValue, { color: theme.colors.text }]}>${Number(dashboardData?.ingresosHoy || dailyTotal).toFixed(2)}</Text>
                                <Text style={[styles.metricSub, { color: '#10B981' }]}>
                                    <Ionicons name="trending-up" size={12} /> {dailyReports.length} clientes diarios hoy
                                </Text>
                            </View>

                            <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={styles.metricHeader}>
                                    <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Total Mensual</Text>
                                    <View style={styles.iconCircle}><Ionicons name="wallet-outline" size={16} color="#374151" /></View>
                                </View>
                                <Text style={[styles.metricValue, { color: theme.colors.text }]}>${Number(dashboardData?.totalMensual || 0).toFixed(2)}</Text>
                                <Text style={[styles.metricSub, { color: theme.colors.textSecondary }]}>
                                    ${dashboardData?.mensualPases || 0} Diario • ${dashboardData?.mensualSuscripciones || 0} Mensual
                                </Text>
                            </View>

                            <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={styles.metricHeader}>
                                    <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Clientes Atendidos (Mes)</Text>
                                    <View style={styles.iconCircle}><Ionicons name="people-outline" size={16} color="#374151" /></View>
                                </View>
                                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{monthlyReports.length}</Text>
                                <Text style={[styles.metricSub, { color: theme.colors.textSecondary }]}>
                                    Mensuales
                                </Text>
                            </View>

                            <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={styles.metricHeader}>
                                    <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Clientes Activos Mensuales</Text>
                                    <View style={styles.iconCircle}><Ionicons name="person-outline" size={16} color="#374151" /></View>
                                </View>
                                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{dashboardData?.suscripcionesActivas || 0}</Text>
                                <Text style={[styles.metricSub, { color: '#EF4444' }]}>
                                    {dashboardData?.vencidasEsteMes || 0} cuentas vencidas este mes
                                </Text>
                            </View>
                        </View>

                        {/* Registrar Ingreso Diario */}
                        <View style={[styles.sectionBox, { backgroundColor: theme.colors.surface }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={[styles.boxTitle, { color: theme.colors.text }]}>Registrar Ingreso Diario</Text>
                                <TouchableOpacity onPress={handleSetToday} style={styles.todayBtn}>
                                    <Text style={styles.todayBtnText}>Ir a Hoy</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.formRow, { flexDirection: isSmallScreen ? 'column' : 'row', alignItems: isSmallScreen ? 'stretch' : 'flex-end' }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nombre del cliente</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                                        placeholder="Carlos Gómez"
                                        placeholderTextColor={theme.colors.border}
                                        value={clientName}
                                        onChangeText={setClientName}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: isSmallScreen ? 1 : 0.6 }]}>
                                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Valor pagado</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                                        placeholder="$ 0.00"
                                        placeholderTextColor={theme.colors.border}
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={setAmount}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: isSmallScreen ? 1 : 0.8 }]}>
                                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Fecha Seleccionada</Text>
                                    <View style={styles.dateSelectorContainer}>
                                        <TouchableOpacity onPress={handlePreviousDay} style={styles.dateNavBtn}>
                                            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
                                        </TouchableOpacity>
                                        <View style={[styles.dateDisplay, { borderColor: theme.colors.border, backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                                            <Text style={[styles.dateText, { color: theme.colors.text }]}>
                                                {new Date(dailyDate + 'T12:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={handleNextDay} style={styles.dateNavBtn}>
                                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[styles.btnWrapper, isSmallScreen && { marginTop: 10 }]}>
                                    <TouchableOpacity style={[styles.primaryBtn, isSmallScreen && { width: '100%', height: 50 }]} onPress={handleRegisterIncome}>
                                        <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 5 }} />
                                        <Text style={styles.primaryBtnText}>Registrar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Daily Report Table Section */}
                        <View style={[styles.sectionBox, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.tableHeaderSection}>
                                <View>
                                    <Text style={[styles.boxTitle, { color: theme.colors.text }]}>Reporte Diario</Text>
                                    <Text style={[styles.boxSubtitle, { color: theme.colors.textSecondary }]}>Lista de clientes registrados con pase de un día.</Text>
                                </View>
                                <View style={styles.tableActions}>
                                    <TouchableOpacity style={styles.pdfBtnDaily} onPress={generateDailyPDF}>
                                        <Ionicons name="download-outline" size={18} color="#fff" />
                                        <Text style={styles.pdfBtnText}>Descargar Reporte PDF</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.tableHead, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Text style={[styles.th, { flex: 2, color: theme.colors.textSecondary }]}>CLIENTE</Text>
                                <Text style={[styles.th, { flex: 1.5, color: theme.colors.textSecondary }]}>HORA DE REGISTRO</Text>
                                <Text style={[styles.th, { flex: 1.5, color: theme.colors.textSecondary }]}>MONTO PAGADO</Text>
                                <Text style={[styles.th, { flex: 0.5, textAlign: 'center', color: theme.colors.textSecondary }]}></Text>
                            </View>

                            {dailyReports.map((item, idx) => (
                                <View key={item.id} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                                    <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                                        <View style={styles.avatarPlaceholder}><Ionicons name="person" size={14} color="#9CA3AF" /></View>
                                        <Text style={[styles.tdText, { color: theme.colors.text, fontWeight: '600' }]}>{item.client_name}</Text>
                                    </View>
                                    <Text style={[styles.td, styles.tdText, { flex: 1.5, color: theme.colors.textSecondary }]}>
                                        {new Date(item.entry_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <Text style={[styles.td, styles.tdText, { flex: 1.5, color: theme.colors.text, fontWeight: '700' }]}>
                                        ${Number(item.amount).toFixed(2)}
                                    </Text>
                                    <View style={[styles.td, { flex: 0.5, alignItems: 'center' }]}>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteDaily(item.id)}
                                            style={{ padding: 8 }}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            {dailyReports.length === 0 && (
                                <Text style={{ padding: 20, textAlign: 'center', color: theme.colors.textSecondary }}>No hay ingresos registrados para esta fecha.</Text>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Custom Delete Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isDeleteModalVisible}
                onRequestClose={() => setIsDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconContainer}>
                                <Ionicons name="warning-outline" size={28} color="#EF4444" />
                            </View>
                        </View>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Eliminar Registro</Text>
                        <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
                            ¿Estás seguro que deseas eliminar este ingreso diario? Esta acción no se puede deshacer.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setIsDeleteModalVisible(false)}
                            >
                                <Text style={[styles.modalBtnTextCancel, { color: theme.colors.text }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnDelete]}
                                onPress={confirmDeleteDaily}
                            >
                                <Text style={styles.modalBtnTextDelete}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row' },
    sidebar: { width: 220, padding: 16, borderRightWidth: 1, paddingTop: 40 },
    logoText: { fontSize: 22, fontWeight: '900', marginBottom: 30, textAlign: 'center' },
    navItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 },
    navItemActive: { backgroundColor: '#FB923C' },
    navText: { marginLeft: 12, fontSize: 13, fontWeight: '500' },

    mainScrollView: { flex: 1 },
    contentContainer: { padding: 24 },
    sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },

    metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
    metricCard: { flex: 1, minWidth: 200, padding: 20, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#9CA3AF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
    metricHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    metricLabel: { fontSize: 13, fontWeight: '500' },
    iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    metricValue: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
    metricSub: { fontSize: 11, fontWeight: '600' },

    sectionBox: { padding: 20, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#9CA3AF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 },
    boxTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    boxSubtitle: { fontSize: 12, marginBottom: 16 },

    formRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    inputGroup: { flex: 1 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    input: { height: 44, borderWidth: 1, borderRadius: 8, borderColor: '#E2E8F0', paddingHorizontal: 14, fontSize: 14, backgroundColor: '#F8FAFC' },
    btnWrapper: { marginBottom: 0 },
    primaryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 20, height: 44, borderRadius: 8, justifyContent: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    tableHeaderSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    tableActions: { flexDirection: 'row', alignItems: 'center' },
    pdfBtnDaily: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 40, borderRadius: 8, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
    pdfBtnMonthly: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 40, borderRadius: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
    pdfBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 6 },

    todayBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#E0F2FE' },
    todayBtnText: { color: '#0369A1', fontSize: 12, fontWeight: '700' },

    dateSelectorContainer: { flexDirection: 'row', alignItems: 'center' },
    dateNavBtn: { padding: 10 },
    dateDisplay: { flex: 1, height: 44, borderWidth: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
    dateText: { fontSize: 13, fontWeight: '700' },

    tableHead: { flexDirection: 'row', padding: 14, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    th: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
    td: {},
    tdText: { fontSize: 12 },
    avatarPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

    tableFooter: { flexDirection: 'row', padding: 16, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, alignItems: 'center' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', maxWidth: 400, borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    modalHeader: { marginBottom: 16 },
    modalIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    modalMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel: { backgroundColor: '#F1F5F9' },
    modalBtnTextCancel: { fontSize: 14, fontWeight: '600' },
    modalBtnDelete: { backgroundColor: '#EF4444' },
    modalBtnTextDelete: { color: '#ffffff', fontSize: 14, fontWeight: '700' }
});
