import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../context/ThemeContext';
import { rolesApi, permissionsApi, userRolesApi } from '../../services/rolePermissionService';
import { API_URL } from '../../services/api';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RoleManagementScreen({ navigation }) {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [permissionMatrix, setPermissionMatrix] = useState({});
    const [selectedRoles, setSelectedRoles] = useState({});
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setErrorMsg(null);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                Alert.alert('Error', 'No se encontró token de autenticación.');
                navigation.goBack();
                return;
            }

            console.log('[RoleManagement] Loading data...');

            // Parallel calls
            const [usersData, permsData, rolesData] = await Promise.all([
                axios.get(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(e => ({ error: e })),
                permissionsApi.getTrainerPermissions().catch(e => ({ error: e })),
                rolesApi.getAll().catch(e => ({ error: e }))
            ]);

            // Handlers
            if (usersData?.data?.success) {
                const fetchedUsers = usersData.data.data;
                setUsers(fetchedUsers || []);
                const initialRoles = {};
                (fetchedUsers || []).forEach(user => {
                    initialRoles[user.id] = user.roles?.[0]?.id || null;
                });
                setSelectedRoles(initialRoles);
            } else {
                console.warn('[RoleManagement] Users load failed');
            }

            if (permsData?.success && permsData?.data) {
                const { permissions, trainer_role_id, permission_matrix } = permsData.data;
                let flatPermissions = [];

                if (Array.isArray(permissions)) {
                    flatPermissions = permissions;
                } else if (permissions && typeof permissions === 'object') {
                    Object.values(permissions).forEach(group => {
                        if (Array.isArray(group)) flatPermissions = [...flatPermissions, ...group];
                    });
                }
                setAllPermissions(flatPermissions);
                if (trainer_role_id) {
                    setPermissionMatrix({ [trainer_role_id]: permission_matrix || {} });
                }
            } else if (permsData?.error) {
                // Check for 401 specifically
                const status = permsData.error.response?.status || permsData.error.message;
                if (String(status).includes('401')) {
                    setErrorMsg('Sesión expirada o no autorizada (401).');
                } else {
                    setErrorMsg('Error cargando permisos.');
                }
            }

            if (rolesData?.success) {
                setRoles(rolesData.data || []);
            }

        } catch (error) {
            console.error('[RoleManagement] Critical:', error);
            setErrorMsg(`Error crítico: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, roleId) => {
        try {
            if (roleId === 'remove') {
                await userRolesApi.removeRole(userId);
            } else if (roleId) {
                await userRolesApi.assignRole(userId, roleId);
            }
            setSelectedRoles(prev => ({ ...prev, [userId]: roleId === 'remove' ? null : roleId }));
            Alert.alert('Éxito', 'Rol actualizado correctamente');
            loadData(); // Reload to confirm
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el rol');
        }
    };

    const handlePermissionToggle = async (permissionId) => {
        const trainerRoleId = Object.keys(permissionMatrix)[0];
        if (!trainerRoleId) return;

        const currentStatus = permissionMatrix[trainerRoleId]?.[permissionId];
        const action = currentStatus ? 'revoke' : 'assign';

        // Optimistic
        setPermissionMatrix(prev => ({
            ...prev,
            [trainerRoleId]: {
                ...prev[trainerRoleId],
                [permissionId]: !currentStatus
            }
        }));

        try {
            if (action === 'assign') {
                await permissionsApi.assignToRole(trainerRoleId, permissionId);
            } else {
                await permissionsApi.revokeFromRole(trainerRoleId, permissionId);
            }
        } catch (error) {
            console.error('Toggle error:', error);
            Alert.alert('Error', 'Fallo al actualizar permiso');
            loadData(); // Revert/Reload
        }
    };

    const filteredUsers = users.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ marginTop: 10, color: theme.colors.text }}>Cargando...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Gestión de Roles</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {errorMsg ? (
                    <View style={[styles.errorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                        <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMsg}</Text>
                        <TouchableOpacity onPress={loadData} style={{ marginTop: 8 }}>
                            <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Asignación de Roles</Text>
                    <View style={[styles.searchContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.colors.text }]}
                            placeholder="Buscar usuario..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {filteredUsers.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                No se encontraron usuarios
                            </Text>
                        </View>
                    ) : (
                        filteredUsers.map(user => {
                            const currentRole = roles.find(r => r.id === selectedRoles[user.id]);
                            return (
                                <View key={user.id} style={[styles.userRow, { borderBottomColor: theme.colors.border }]}>
                                    <View style={styles.userInfo}>
                                        <Text style={[styles.userName, { color: theme.colors.text }]}>
                                            {user.name || 'Sin Nombre'}
                                        </Text>
                                        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                                            {user.email || 'Sin Email'} - {currentRole ? currentRole.display_name : 'Sin Rol'}
                                        </Text>
                                    </View>
                                    <View style={[styles.pickerContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                        <Picker
                                            selectedValue={selectedRoles[user.id]}
                                            onValueChange={(value) => handleRoleChange(user.id, value)}
                                            style={[styles.picker, { color: theme.colors.text }]}
                                            dropdownIconColor={theme.colors.text}
                                        >
                                            <Picker.Item label="Asignar" value={null} />
                                            {roles.map(role => (
                                                <Picker.Item key={role.id} label={role.display_name} value={role.id} />
                                            ))}
                                            <Picker.Item label="Quitar" value="remove" />
                                        </Picker>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Permisos del Rol Trainer
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, marginBottom: 15 }}>
                        Define qué acciones pueden realizar los entrenadores.
                    </Text>

                    {allPermissions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                {errorMsg ? 'Error cargando datos.' : 'No hay permisos disponibles.'}
                            </Text>
                        </View>
                    ) : (
                        <View>
                            <View style={[styles.matrixHeader, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <View style={[styles.matrixCell, styles.matrixFirstCell]}>
                                    <Text style={[styles.matrixHeaderText, { color: theme.colors.text }]}>Permiso</Text>
                                </View>
                                <View style={styles.matrixCell}>
                                    <Text style={[styles.matrixHeaderText, { color: theme.colors.text }]}>Estado</Text>
                                </View>
                            </View>

                            {allPermissions.map((permission, index) => {
                                const trainerRoleId = Object.keys(permissionMatrix)[0];
                                const isChecked = trainerRoleId ? !!permissionMatrix[trainerRoleId]?.[permission.id] : false;
                                return (
                                    <View
                                        key={permission.id}
                                        style={[
                                            styles.matrixRow,
                                            {
                                                borderBottomColor: theme.colors.border,
                                                backgroundColor: index % 2 === 0 ? theme.colors.background : 'transparent'
                                            }
                                        ]}
                                    >
                                        <View style={[styles.matrixCell, styles.matrixFirstCell]}>
                                            <Text style={[styles.permissionText, { color: theme.colors.text }]}>
                                                {permission.display_name || permission.name}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>
                                                {permission.description || ''}
                                            </Text>
                                        </View>
                                        <View style={styles.matrixCell}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.checkbox,
                                                    { borderColor: theme.colors.border },
                                                    isChecked && styles.checkboxChecked
                                                ]}
                                                onPress={() => handlePermissionToggle(permission.id)}
                                            >
                                                {isChecked ? (
                                                    <Ionicons name="checkmark" size={18} color="#FFF" />
                                                ) : null}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 60, paddingHorizontal: 15, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backButton: { padding: 5 },
    content: { padding: 15, paddingBottom: 40 },
    section: { borderRadius: 12, padding: 15, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 45, marginBottom: 15 },
    searchInput: { flex: 1, marginLeft: 10 },
    userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '500' },
    userEmail: { fontSize: 12 },
    pickerContainer: { borderWidth: 1, borderRadius: 8, width: 140, height: 40, justifyContent: 'center' },
    picker: { height: 40, width: 140 },
    matrixHeader: { flexDirection: 'row', paddingVertical: 10, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    matrixHeaderText: { fontWeight: 'bold', fontSize: 12 },
    matrixRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
    matrixCell: { width: 80, alignItems: 'center', justifyContent: 'center' },
    matrixFirstCell: { flex: 1, alignItems: 'flex-start', paddingLeft: 10 },
    permissionText: { fontSize: 13, fontWeight: '500' },
    checkbox: { width: 24, height: 24, borderWidth: 2, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    emptyContainer: { padding: 20, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    errorContainer: { padding: 10, margin: 10, borderRadius: 8, borderWidth: 1, borderColor: 'red' },
    errorText: { fontSize: 12 },
});
