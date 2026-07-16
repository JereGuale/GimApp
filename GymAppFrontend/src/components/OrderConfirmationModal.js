import React, { useEffect, useRef } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_W } = Dimensions.get("window");

/**
 * OrderConfirmationModal
 * Ventana flotante de confirmacion de pedido / suscripcion.
 *
 * Props:
 *  visible      {boolean}
 *  type         {"order" | "subscription"}   default "order"
 *  onClose      {function}
 *  onGoToOrders {function}  optional — navega a Mis Compras
 */
export default function OrderConfirmationModal({
    visible,
    type = "order",
    onClose,
    onGoToOrders,
}) {
    const scaleAnim = useRef(new Animated.Value(0.7)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 7,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.7);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const isSubscription = type === "subscription";

    const title = isSubscription ? "¡Suscripción enviada!" : "¡Pedido recibido!";
    const emoji = isSubscription ? "💳" : "🛍️";
    const mainMsg = isSubscription
        ? "Tu comprobante de pago fue enviado exitosamente."
        : "Tu pedido fue registrado y el comprobante enviado con éxito.";
    const subMsg =
        "Pronto te enviaremos más detalles a tu WhatsApp una vez que el administrador lo revise y apruebe. ¡Gracias por tu preferencia!";
    const accentColor = isSubscription ? "#5B3DF5" : "#FF6A1A";
    const gradColors = isSubscription
        ? ["#1E1B4B", "#312E81"]
        : ["#1C0A00", "#431407"];

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
                        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
                    ]}
                >
                    <LinearGradient
                        colors={gradColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardInner}
                    >
                        {/* Close button */}
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>

                        {/* Icon circle */}
                        <View style={[styles.iconCircle, { borderColor: accentColor + "44", backgroundColor: accentColor + "22" }]}>
                            <Text style={styles.emoji}>{emoji}</Text>
                        </View>

                        {/* Checkmark badge */}
                        <View style={[styles.checkBadge, { backgroundColor: "#22C55E" }]}>
                            <Ionicons name="checkmark" size={18} color="#fff" />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>{title}</Text>

                        {/* Main message */}
                        <Text style={styles.mainMsg}>{mainMsg}</Text>

                        {/* WhatsApp notice */}
                        <View style={[styles.waBox, { borderColor: accentColor + "55", backgroundColor: accentColor + "15" }]}>
                            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                            <Text style={styles.waText}>{subMsg}</Text>
                        </View>

                        {/* Steps */}
                        <View style={styles.stepsRow}>
                            {[
                                { icon: "document-text-outline", label: "Pedido\nregistrado" },
                                { icon: "time-outline", label: "En\nrevisión" },
                                { icon: "checkmark-circle-outline", label: "Aprobación\npendiente" },
                            ].map((step, i, arr) => (
                                <React.Fragment key={i}>
                                    <View style={styles.step}>
                                        <View style={[styles.stepIcon, { backgroundColor: i === 0 ? "#22C55E22" : "rgba(255,255,255,0.08)", borderColor: i === 0 ? "#22C55E" : "rgba(255,255,255,0.15)" }]}>
                                            <Ionicons name={step.icon} size={16} color={i === 0 ? "#22C55E" : "rgba(255,255,255,0.5)"} />
                                        </View>
                                        <Text style={[styles.stepLabel, { color: i === 0 ? "#fff" : "rgba(255,255,255,0.45)" }]}>{step.label}</Text>
                                    </View>
                                    {i < arr.length - 1 && (
                                        <View style={styles.stepLine} />
                                    )}
                                </React.Fragment>
                            ))}
                        </View>

                        {/* Buttons */}
                        <View style={styles.btns}>
                            {onGoToOrders && (
                                <TouchableOpacity
                                    style={[styles.btn, { backgroundColor: accentColor }]}
                                    onPress={onGoToOrders}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="bag-handle-outline" size={16} color="#fff" />
                                    <Text style={styles.btnText}>
                                        {isSubscription ? "Ver mi suscripción" : "Ver mis compras"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.btnOutline}
                                onPress={onClose}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.btnOutlineText}>Seguir comprando</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
}

const CARD_W = Math.min(SCREEN_W - 32, 400);

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.75)",
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    },
    cardInner: {
        padding: 28,
        alignItems: "center",
    },
    closeBtn: {
        alignSelf: "flex-end",
        padding: 4,
        marginBottom: 8,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    emoji: {
        fontSize: 40,
    },
    checkBadge: {
        position: "absolute",
        top: 80,
        right: CARD_W / 2 - 56,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2.5,
        borderColor: "#111",
    },
    title: {
        fontSize: 22,
        fontWeight: "900",
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: -0.3,
        fontFamily: Platform.OS === "web" ? "Plus Jakarta Sans, sans-serif" : undefined,
    },
    mainMsg: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        textAlign: "center",
        lineHeight: 18,
        marginBottom: 16,
    },
    waBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        marginBottom: 20,
        width: "100%",
    },
    waText: {
        flex: 1,
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
        lineHeight: 17,
    },
    stepsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        gap: 0,
        width: "100%",
    },
    step: {
        alignItems: "center",
        gap: 6,
        flex: 1,
    },
    stepIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    stepLabel: {
        fontSize: 9,
        fontWeight: "700",
        textAlign: "center",
        lineHeight: 12,
    },
    stepLine: {
        height: 1.5,
        width: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
        marginBottom: 18,
    },
    btns: {
        width: "100%",
        gap: 10,
    },
    btn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 50,
        borderRadius: 16,
    },
    btnText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
    },
    btnOutline: {
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.2)",
    },
    btnOutlineText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 13,
        fontWeight: "700",
    },
});
