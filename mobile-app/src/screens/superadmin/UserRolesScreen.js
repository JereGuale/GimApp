import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { userRolesApi, rolesApi } from '../../services/rolePermissionService';
import { adminApi } from '../../services/adminApi';

export default function UserRolesScreen({ navigation }) {
    const { theme } = useTheme();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersResponse, rolesResponse] = await Promise.all([
                adminApi.getUsers(),
                rolesApi.getAll(),
            ]);

            if (usersResponse.success) {
                setUsers(usersResponse.data);
            }
            if (rolesResponse.success) {
                setRoles(rolesResponse.data);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los datos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageUserRoles = async (user) => {
        try {
            const response = await userRolesApi.getUserRoles(user.id);
            if (response.success) {
                const userRoleIds = response.data.map(r => r.id);
                setSelectedRoleIds(userRoleIds);
                setSelectedUser(user);
                setModalVisible(true);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los roles del usuario');
            console.error(error);
        }
    };

    const handleToggleRole = (roleId) => {
        setSelectedRoleIds(prev => {
            if (prev.includes(roleId)) {
                return prev.filter(id => id !== roleId);
            } else {
                return [...prev, roleId];
            }
        });
    };

    const handleSaveRoles = async () => {
        if (!selectedUser) return;

        try {
            const response = await userRolesApi.assignRoles(selectedUser.id, selectedRoleIds);
            if (response.success) {
                Alert.alert('Éxito', 'Roles actualizados exitosamente');
                setModalVisible(false);
                loadData();
            } else {
                Alert.alert('Error', 'No se pudieron actualizar los roles');
            }
        } catch (error) {
            Alert.alert('Error', 'Error al actualizar los roles');
            console.error(error);
        }
    };

    const renderUserItem = ({ item }) => {
        // Get role names for this user (if already loaded)
        const userRoleNames = item.roles?.map(r => r.display_name).join(', ') || 'Sin roles';

        return (
            <View style={[styles.userCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.userAvatar}>
                            <Ionicons name="person" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.userText}>
                            <Text style={[styles.userName, { color: theme.colors.text }]}>{item.name}</Text>
                            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{item.email}</Text>
                            <Text style={[styles.userRoles, { color: theme.colors.textSecondary }]}>
                                Roles: {userRoleNames}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.manageButton, { backgroundColor: '#3B82F6' }]}
                    onPress={() => handleManageUserRoles(item)}
                >
                    <Ionicons name="shield-checkmark-outline" size={16} color="#FFF" />
                    <Text style={styles.manageButtonText}>Gestionar Roles</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Asignar Roles a Usuarios</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Users List */}
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            {/* Manage Roles Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                                Roles de {selectedUser?.name}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.rolesScrollView}>
                            {roles.map((role) => {
                                const isSelected = selectedRoleIds.includes(role.id);
                                const isSystemRole = ['super_admin', 'admin', 'trainer', 'user'].includes(role.name);

                                return (
                                    <TouchableOpacity
                                        key={role.id}
                                        style={[
                                            styles.roleOption,
                                            { borderColor: theme.colors.border },
                                            isSelected && styles.roleOptionSelected
                                        ]}
                                        onPress={() => handleToggleRole(role.id)}
                                    >
                                        <View style={styles.roleOptionContent}>
                                            <View style={styles.roleCheckbox}>
                                                {isSelected && <Ionicons name="checkmark" size={18} color="#FFF" />}
                                            </View>
                                            <View style={styles.roleOptionText}>
                                                <Text style={[styles.roleOptionName, { color: theme.colors.text }]}>
                                                    {role.display_name}
                                                </Text>
                                                <Text style={[styles.roleOptionDescription, { color: theme.colors.textSecondary }]}>
                                                    {role.description || 'Sin descripción'}
                                                </Text>
                                                {isSystemRole && (
                                                    <Text style={styles.systemRoleBadge}>Rol del sistema</Text>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: '#3B82F6' }]}
                                onPress={handleSaveRoles}
                            >
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
    },
    userCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    userHeader: {
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userText: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 4,
    },
    userRoles: {
        fontSize: 13,
        fontStyle: 'italic',
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    manageButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 16,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    rolesScrollView: {
        maxHeight: 400,
    },
    roleOption: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    roleOptionSelected: {
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    roleOptionContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    roleCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: '#3B82F6',
    },
    roleOptionText: {
        flex: 1,
    },
    roleOptionName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    roleOptionDescription: {
        fontSize: 13,
        marginBottom: 4,
    },
    systemRoleBadge: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
