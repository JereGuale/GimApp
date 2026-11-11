import React, { useEffect, useRef } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - 32, 400);

/**
 * OrderConfirmationModal
 * Ventana flotante de confirmación de pedido / suscripción.
 *
 * Props:
 *  visible      {boolean}
 *  type         {"order" | "subscription"}   default "order"
 *  onClose      {function}
 *  onGoToOrders {function}  optional
 */
export default function OrderConfirmationModal({
    visible,
    type = "order",
    onClose,
    onGoToOrders,
}) {
    const { isDark } = useTheme();

    const scaleAnim   = useRef(new Animated.Value(0.75)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1, useNativeDriver: true, tension: 85, friction: 7,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1, duration: 200, useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.75);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const isSubscription = type === "subscription";

    const title   = isSubscription ? "¡Suscripción enviada!" : "¡Compra enviada!";
    const mainMsg = isSubscription
        ? "Tu comprobante de pago fue enviado exitosamente."
        : "Tu comprobante de pago fue enviado exitosamente.";
    const notificationMsg = isSubscription
        ? "Te avisaremos mediante las notificaciones de la aplicación cuando el administrador revise y apruebe tu pago."
        : "Te avisaremos mediante las notificaciones de la aplicación cuando el administrador revise y apruebe tu pedido.";
    const btnLabel = isSubscription ? "Ver mi suscripción" : "Ver mis compras";
    const btnIcon  = isSubscription ? "card-outline" : "bag-handle-outline";

    // ── Theme tokens ────────────────────────────────────────────────────────
    const bg      = isDark ? "#0B0F14" : "#FFFFFF";
    const surface = isDark ? "#141821" : "#F2F2F2";
    const border  = isDark ? "#1F2937" : "#E5E5E5";
    const textPri = isDark ? "#F1F5F9" : "#181818";
    const textSec = isDark ? "#6B7280" : "#6B6B6B";
    const accent  = isDark ? "#FB923C" : "#000000"; // orange in dark, black in light
    const accentFg = isDark ? "#000000" : "#FFFFFF";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Backdrop */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            />

            {/* Card */}
            <View style={styles.centeredWrapper} pointerEvents="box-none">
                <Animated.View
                    style={[
                        styles.card,
                        {
                            backgroundColor: bg,
                            shadowColor: isDark ? "#000" : "#94A3B8",
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    {/* ── Top accent bar ── */}
                    <View style={[styles.topBar, { backgroundColor: accent }]} />

                    <View style={styles.cardInner}>

                        {/* ── Close ── */}
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: surface }]}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={18} color={textSec} />
                        </TouchableOpacity>

                        {/* ── Success icon ── */}
                        <View style={[styles.iconCircle, { backgroundColor: surface, borderColor: border }]}>
                            <Ionicons
                                name={isSubscription ? "card-outline" : "bag-handle-outline"}
                                size={36}
                                color={accent}
                            />
                        </View>

                        {/* ── Check badge ── */}
                        <View style={[styles.checkBadge, { backgroundColor: "#22C55E", borderColor: bg }]}>
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                        </View>

                        {/* ── Title ── */}
                        <Text style={[styles.title, { color: textPri }]}>{title}</Text>
                        <Text style={[styles.mainMsg, { color: textSec }]}>{mainMsg}</Text>

                        {/* ── In-app notification notice ── */}
                        <View style={[styles.notificationBox, { backgroundColor: surface, borderColor: border }]}>
                            <View style={styles.notificationIconCircle}>
                                <Ionicons name="notifications" size={16} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.notificationText, { color: textSec }]}>{notificationMsg}</Text>
                        </View>

                        <View style={[styles.whatsappBox, { backgroundColor: bg, borderColor: border }]}>
                            <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
                            <Text style={[styles.whatsappText, { color: textSec }]}>
                                También podrías recibir información por WhatsApp si el administrador necesita contactarte.
                            </Text>
                        </View>

                        {/* ── Buttons ── */}
                        <View style={styles.btns}>
                            {onGoToOrders && (
                                <TouchableOpacity
                                    style={[styles.btnPrimary, { backgroundColor: accent }]}
                                    onPress={onGoToOrders}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name={btnIcon} size={17} color={accentFg} />
                                    <Text style={[styles.btnPrimaryText, { color: accentFg }]}>
                                        {btnLabel}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={14} color={accentFg} style={{ marginLeft: 2 }} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.btnSecondary, { borderColor: border, backgroundColor: surface }]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.btnSecondaryText, { color: textSec }]}>
                                    Seguir comprando
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.78)",
    },
    centeredWrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "box-none",
    },
    card: {
        width: CARD_W,
        borderRadius: 28,
        overflow: "hidden",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 20,
    },

    // Accent bar at top
    topBar: { height: 4 },

    cardInner: {
        padding: 24,
        alignItems: "center",
    },

    // Close
    closeBtn: {
        alignSelf: "flex-end",
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },

    // Icon
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 24,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    checkBadge: {
        position: "absolute",
        top: 82,
        right: CARD_W / 2 - 54,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2.5,
    },

    // Text
    title: {
        fontSize: 21,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    mainMsg: {
        fontSize: 13,
        textAlign: "center",
        lineHeight: 18,
        marginBottom: 16,
        fontWeight: "500",
    },

    // In-app notification box
    notificationBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        marginBottom: 16,
        width: "100%",
    },
    notificationIconCircle: {
        width: 25,
        height: 25,
        borderRadius: 13,
        backgroundColor: "#F59E0B",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    notificationText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: "500",
    },
    whatsappBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        width: "100%",
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderRadius: 14,
    },
    whatsappText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 16,
        textAlign: "center",
        fontWeight: "500",
    },

    // Buttons
    btns: { width: "100%", gap: 10 },
    btnPrimary: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 52,
        borderRadius: 16,
    },
    btnPrimaryText: {
        fontSize: 15,
        fontWeight: "800",
    },
    btnSecondary: {
        height: 46,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
    },
    btnSecondaryText: {
        fontSize: 13,
        fontWeight: "700",
    },
});
