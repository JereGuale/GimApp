import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Modal,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { OrderAPI } from "../../services/orderService";
import { API_URL } from "../../services/api";

const BASE_URL = API_URL.replace("/api", "");

const STATUS_LABELS = {
    pending: "Pago Pendiente",
    approved: "Pago Aprobado",
    processing: "Compra en Proceso",
    shipped: "Despachada a Destino",
    completed: "Compra Entregada",
    rejected: "Rechazada",
};

const STATUS_COLORS = {
    pending: "#F59E0B",
    approved: "#10B981",
    processing: "#8B5CF6",
    shipped: "#3B82F6",
    completed: "#10B981",
    rejected: "#EF4444",
};

const STATUS_ICONS = {
    pending: "time-outline",
    approved: "checkmark-circle-outline",
    processing: "cube-outline",
    shipped: "bicycle-outline",
    completed: "checkmark-done-circle-outline",
    rejected: "close-circle-outline",
};

const FILTERS = [
    { key: "all", label: "Todas", icon: "list-outline" },
    { key: "pending", label: "Pendiente", icon: "time-outline" },
    { key: "approved", label: "Aprobada", icon: "checkmark-circle-outline" },
    { key: "rejected", label: "Rechazada", icon: "close-circle-outline" },
];

const resolveStorageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${BASE_URL}/storage/${path}`;
};

export default function MyPurchasesScreen() {
    const { theme } = useTheme();
    const mutedText = theme.colors.textSecondary || theme.colors.secondaryText || "#6B7280";

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [receiptViewerUri, setReceiptViewerUri] = useState(null);

    const loadOrders = async () => {
        const result = await OrderAPI.getMyOrders();
        if (result.success) {
            setOrders(Array.isArray(result.data) ? result.data : []);
        } else {
            setOrders([]);
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadOrders();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const filteredOrders = useMemo(() => {
        let result = orders;

        if (activeFilter === "pending") {
            result = result.filter((order) => order.status === "pending");
        } else if (activeFilter === "approved") {
            result = result.filter((order) => order.status === "approved" || order.status === "processing" || order.status === "shipped" || order.status === "completed");
        } else if (activeFilter === "rejected") {
            result = result.filter((order) => order.status === "rejected");
        }

        if (searchQuery.trim()) {
            const q = searchQuery.trim().replace(/^#/, "");
            result = result.filter((order) => String(order.id).includes(q));
        }

        return result;
    }, [orders, activeFilter, searchQuery]);

    const renderOrderCard = (order) => {
        const statusColor = STATUS_COLORS[order.status] || theme.colors.primary;
        const statusIcon = STATUS_ICONS[order.status] || "help-circle-outline";
        const receiptUrl = resolveStorageUrl(order.payment_receipt);
        const items = Array.isArray(order.items) ? order.items : [];
        const createdAt = order.created_at
            ? new Date(order.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
            : "—";
        const isRejected = order.status === "rejected";

        // Título representativo: nombre del primer producto (+ N más si hay varios)
        const titleLabel = items.length === 0
            ? "Sin productos"
            : items.length === 1
                ? items[0].name
                : `${items[0].name} + ${items.length - 1} más`;

        return (
            <View
                style={[
                    styles.orderCard,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: isRejected ? "#FCA5A5" : theme.colors.border,
                        borderLeftColor: statusColor,
                        borderLeftWidth: 4,
                    },
                ]}
            >
                {/* Header: título + badge estado */}
                <View style={styles.orderHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.orderTitle, { color: theme.colors.text }]} numberOfLines={1}>
                            {titleLabel}
                        </Text>
                        <Text style={[styles.orderSubId, { color: mutedText }]}>Pedido #{order.id} · {createdAt}</Text>
                    </View>
                    <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: statusColor + "18" }]}>
                        <Ionicons name={statusIcon} size={12} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {STATUS_LABELS[order.status] || order.status}
                        </Text>
                    </View>
                </View>

                {/* Lista de productos */}
                {items.length > 0 && (
                    <View style={[styles.itemsList, { borderColor: theme.colors.border }]}>
                        {items.map((item, idx) => {
                            const imageUri = item.image
                                ? item.image.startsWith("http")
                                    ? item.image
                                    : `${BASE_URL}/storage/${item.image}`
                                : null;
                            return (
                                <View
                                    key={idx}
                                    style={[
                                        styles.itemRow,
                                        idx < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
                                    ]}
                                >
                                    {/* Miniatura */}
                                    {imageUri ? (
                                        <Image
                                            source={{ uri: imageUri }}
                                            style={styles.itemImg}
                                            contentFit="cover"
                                            cachePolicy="memory-disk"
                                        />
                                    ) : (
                                        <View style={[styles.itemImgPlaceholder, { backgroundColor: theme.isDark ? "#1F2937" : "#F3F4F6" }]}>
                                            <Ionicons name="cube-outline" size={18} color={mutedText} />
                                        </View>
                                    )}
                                    {/* Nombre + cantidad */}
                                    <View style={styles.itemInfo}>
                                        <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.itemQty, { color: mutedText }]}>
                                            x{item.quantity}  ·  ${Number(item.price || 0).toFixed(2)} c/u
                                        </Text>
                                    </View>
                                    {/* Subtotal */}
                                    <Text style={[styles.itemLineTotal, { color: theme.colors.text }]}>
                                        ${Number(item.line_total || item.price * item.quantity || 0).toFixed(2)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                <View style={styles.orderFooterRow}>
                    <Text style={[styles.orderTotal, { color: theme.colors.text }]}>
                        Total:{" "}
                        <Text style={{ color: "#FF6A1A" }}>${Number(order.total || 0).toFixed(2)}</Text>
                    </Text>
                    <TouchableOpacity
                        style={styles.receiptBadge}
                        onPress={() => receiptUrl ? setReceiptViewerUri(receiptUrl) : null}
                        activeOpacity={receiptUrl ? 0.7 : 1}
                    >
                        <Ionicons
                            name={receiptUrl ? "document-attach-outline" : "document-outline"}
                            size={13}
                            color={receiptUrl ? "#22C55E" : "#EF4444"}
                        />
                        <Text style={[styles.receiptText, { color: receiptUrl ? "#22C55E" : "#EF4444" }]}>
                            {receiptUrl ? "Ver comprobante" : "Sin comprobante"}
                        </Text>
                        {receiptUrl && (
                            <Ionicons name="chevron-forward" size={11} color="#22C55E" />
                        )}
                    </TouchableOpacity>
                </View>

                {isRejected && (
                    <View
                        style={[
                            styles.rejectionBanner,
                            { backgroundColor: theme.isDark ? "rgba(127, 29, 29, 0.2)" : "#FEF2F2" },
                        ]}
                    >
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text style={styles.rejectionBannerText} numberOfLines={3}>
                            <Text style={{ fontWeight: "800" }}>Motivo: </Text>
                            {order.rejection_reason || "Comprobante no válido"}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color="#FB923C" />
                <Text style={[styles.loadingText, { color: mutedText }]}>Cargando tus compras...</Text>
            </View>
        );
    }

    const totalCount = orders.length;
    const approvedCount = orders.filter((o) => o.status === "approved" || o.status === "processing" || o.status === "shipped" || o.status === "completed").length;
    const rejectedCount = orders.filter((o) => o.status === "rejected").length;

    return (
        <View style={[styles.rootContainer, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FB923C" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Summary */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{totalCount}</Text>
                        <Text style={[styles.summaryLabel, { color: mutedText }]}>Total</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Text style={[styles.summaryValue, { color: "#22C55E" }]}>{approvedCount}</Text>
                        <Text style={[styles.summaryLabel, { color: mutedText }]}>Aprobadas</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Text style={[styles.summaryValue, { color: "#EF4444" }]}>{rejectedCount}</Text>
                        <Text style={[styles.summaryLabel, { color: mutedText }]}>Rechazadas</Text>
                    </View>
                </View>

                {/* Search by Order Number */}
                <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Ionicons name="search-outline" size={18} color={mutedText} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text }]}
                        placeholder="Buscar por # de pedido..."
                        placeholderTextColor={mutedText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        keyboardType="numeric"
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={18} color={mutedText} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Status Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {FILTERS.map((filter) => {
                        const isActive = activeFilter === filter.key;
                        return (
                            <TouchableOpacity
                                key={filter.key}
                                onPress={() => setActiveFilter(filter.key)}
                                style={[
                                    styles.filterChip,
                                    {
                                        borderColor: isActive ? "#FF6A1A" : theme.colors.border,
                                        backgroundColor: isActive ? "#FF6A1A" : theme.colors.surface,
                                    },
                                ]}
                            >
                                <Ionicons name={filter.icon} size={13} color={isActive ? "#FFFFFF" : mutedText} />
                                <Text style={[styles.filterChipText, { color: isActive ? "#FFFFFF" : mutedText }]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Orders List */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mis compras</Text>
                        <Text style={[styles.resultCount, { color: mutedText }]}>
                            {filteredOrders.length} resultado{filteredOrders.length !== 1 ? "s" : ""}
                        </Text>
                    </View>

                    {filteredOrders.length === 0 ? (
                        <View style={[styles.emptyBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                            <Ionicons name="bag-outline" size={40} color={mutedText} style={{ marginBottom: 8 }} />
                            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                                {searchQuery ? `Sin resultados para "#${searchQuery}"` : "Sin compras aquí"}
                            </Text>
                            <Text style={[styles.emptyText, { color: mutedText }]}>
                                {searchQuery ? "Intenta con otro número de pedido" : "No hay compras para este filtro."}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredOrders}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={({ item }) => renderOrderCard(item)}
                            scrollEnabled={false}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Receipt Viewer Modal */}
            <Modal
                visible={!!receiptViewerUri}
                transparent
                animationType="fade"
                onRequestClose={() => setReceiptViewerUri(null)}
            >
                <View style={styles.receiptModalOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setReceiptViewerUri(null)}
                    />
                    <View style={styles.receiptModalCard}>
                        <View style={styles.receiptModalHeader}>
                            <Text style={styles.receiptModalTitle}>Comprobante de pago</Text>
                            <TouchableOpacity
                                onPress={() => setReceiptViewerUri(null)}
                                style={styles.receiptModalClose}
                            >
                                <Ionicons name="close" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        {receiptViewerUri && (
                            <Image
                                source={{ uri: receiptViewerUri }}
                                style={styles.receiptImage}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                            />
                        )}
                        <Text style={styles.receiptModalNote}>
                            Este es el comprobante que enviaste al realizar tu pedido.
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    rootContainer: { flex: 1 },
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 100, gap: 14 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingText: { marginTop: 10, fontSize: 14, fontWeight: "600" },

    summaryRow: { flexDirection: "row", gap: 10 },
    summaryCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 2 },
    summaryValue: { fontSize: 22, fontWeight: "800" },
    summaryLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },

    searchContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: "500", padding: 0 },

    filterRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
    filterChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    filterChipText: { fontSize: 12, fontWeight: "700" },

    section: { gap: 10 },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    sectionTitle: { fontSize: 20, fontWeight: "800" },
    resultCount: { fontSize: 13, fontWeight: "600" },
    listContent: { gap: 10 },

    emptyBox: { borderWidth: 1, borderRadius: 14, paddingVertical: 32, paddingHorizontal: 16, alignItems: "center", gap: 4 },
    emptyTitle: { fontSize: 15, fontWeight: "700" },
    emptyText: { fontSize: 13, fontWeight: "500", textAlign: "center" },

    orderCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    orderTitle: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
    orderSubId: { fontSize: 11, fontWeight: "500", marginTop: 2 },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 11, fontWeight: "700" },

    // Product items list
    itemsList: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
    itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 10 },
    itemImg: { width: 48, height: 48, borderRadius: 8 },
    itemImgPlaceholder: { width: 48, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 13, fontWeight: "700", lineHeight: 18 },
    itemQty: { fontSize: 11, fontWeight: "500", marginTop: 2 },
    itemLineTotal: { fontSize: 13, fontWeight: "800", minWidth: 52, textAlign: "right" },

    divider: { height: StyleSheet.hairlineWidth },

    orderFooterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    orderTotal: { fontSize: 15, fontWeight: "700" },
    receiptBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
    receiptText: { fontSize: 11, fontWeight: "600" },

    rejectionBanner: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, padding: 10, marginTop: 2 },
    rejectionBannerText: { flex: 1, fontSize: 12, color: "#B91C1C", lineHeight: 16 },

    // Receipt viewer modal
    receiptModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "flex-end" },
    receiptModalCard: { backgroundColor: "#111827", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", maxHeight: "90%" },
    receiptModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.1)" },
    receiptModalTitle: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
    receiptModalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
    receiptImage: { width: "100%", height: 440 },
    receiptModalNote: { fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", paddingVertical: 14, paddingHorizontal: 16 },
});
