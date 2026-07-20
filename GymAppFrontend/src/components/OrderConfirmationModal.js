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

    const title   = isSubscription ? "¡Suscripción enviada!" : "¡Pedido recibido!";
    const mainMsg = isSubscription
        ? "Tu comprobante de pago fue enviado exitosamente."
        : "Tu pedido fue registrado y el comprobante enviado con éxito.";
    const subMsg =
        "Pronto te enviaremos más detalles a tu WhatsApp una vez que el administrador lo revise y apruebe. ¡Gracias por tu preferencia!";
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

    const STEPS = [
        { icon: "document-text-outline", label: isSubscription ? "Suscripción\nenviada" : "Pedido\nregistrado", done: true  },
        { icon: "time-outline",           label: "En\nrevisión",        done: false },
        { icon: "checkmark-circle-outline", label: "Aprobación\npendiente", done: false },
    ];

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

                        {/* ── WhatsApp notice ── */}
                        <View style={[styles.waBox, { backgroundColor: surface, borderColor: border }]}>
                            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                            <Text style={[styles.waText, { color: textSec }]}>{subMsg}</Text>
                        </View>

                        {/* ── Steps ── */}
                        <View style={[styles.stepsCard, { backgroundColor: surface, borderColor: border }]}>
                            {STEPS.map((step, i, arr) => (
                                <React.Fragment key={i}>
                                    <View style={styles.step}>
                                        <View style={[
                                            styles.stepIcon,
                                            {
                                                backgroundColor: step.done
                                                    ? (isDark ? "rgba(251,146,60,0.12)" : "rgba(0,0,0,0.06)")
                                                    : "transparent",
                                                borderColor: step.done ? accent : border,
                                            }
                                        ]}>
                                            <Ionicons
                                                name={step.icon}
                                                size={16}
                                                color={step.done ? accent : (isDark ? "#374151" : "#CCCCCC")}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.stepLabel,
                                            { color: step.done ? textPri : textSec, fontWeight: step.done ? "800" : "500" }
                                        ]}>
                                            {step.label}
                                        </Text>
                                    </View>
                                    {i < arr.length - 1 && (
                                        <View style={[styles.stepLine, { backgroundColor: border }]} />
                                    )}
                                </React.Fragment>
                            ))}
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

    // WhatsApp box
    waBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        marginBottom: 16,
        width: "100%",
    },
    waText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: "500",
    },

    // Steps
    stepsCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 10,
        marginBottom: 20,
        width: "100%",
        paddingHorizontal: 8,
    },
    step: { alignItems: "center", gap: 6, flex: 1 },
    stepIcon: {
        width: 36,
        height: 36,
        borderRadius: 11,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    stepCheckBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#E11D48",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#FFFFFF",
    },
    stepLabel: {
        fontSize: 9,
        textAlign: "center",
        lineHeight: 13,
    },
    stepLine: {
        height: 1.5,
        width: 22,
        marginBottom: 18,
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
