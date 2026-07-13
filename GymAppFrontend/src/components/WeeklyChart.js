import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';


export default function WeeklyChart({ data, total, changePercent }) {
    const { theme } = useTheme();

    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.amount), 1);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                        Ganancias de la Última Semana
                    </Text>
                    <Text style={[styles.total, { color: '#22D3EE' }]}>
                        ${total.toFixed(2)}
                    </Text>
                </View>
                {changePercent !== undefined && (
                    <View style={[
                        styles.changeBadge,
                        { backgroundColor: changePercent >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                    ]}>
                        <Text style={[
                            styles.changeText,
                            { color: changePercent >= 0 ? '#10B981' : '#EF4444' }
                        ]}>
                            {changePercent >= 0 ? '+' : ''}{changePercent}%
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.chart}>
                {data.map((item, index) => {
                    const barHeight = maxValue > 0 ? (item.amount / maxValue) * 100 : 0;
                    return (
                        <View key={index} style={styles.barContainer}>
                            <View style={styles.barWrapper}>
                                <LinearGradient
                                    colors={['#22D3EE', '#0891B2']}
                                    style={[
                                        styles.bar,
                                        {
                                            height: `${barHeight}%`,
                                            opacity: 0.8 + (barHeight / 500)
                                        }
                                    ]}
                                />

                            </View>
                            <Text style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>
                                {item.day}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    total: {
        fontSize: 36,
        fontWeight: '900'
    },
    changeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    changeText: {
        fontSize: 14,
        fontWeight: '700'
    },
    chart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 150,
        gap: 8
    },
    barContainer: {
        flex: 1,
        alignItems: 'center'
    },
    barWrapper: {
        width: '100%',
        height: 120,
        justifyContent: 'flex-end',
        marginBottom: 8
    },
    bar: {
        width: '100%',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        minHeight: 4
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '600'
    }
});
