import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get('window');

const CustomDonutChart = ({ farmers = 0, agriOfficers = 0, admins = 0 }) => {
  const total = farmers + agriOfficers + admins || 1;
  const radius = 60;
  const strokeWidth = 25;
  const circumference = 2 * Math.PI * radius;
  const size = (radius + strokeWidth) * 2;

  // Staggered animation values
  const farmerShared = useSharedValue(0);
  const agriShared = useSharedValue(0);
  const adminShared = useSharedValue(0);

  const prevData = React.useRef({ farmers: -1, agriOfficers: -1, admins: -1 });

  useEffect(() => {
    // Only animate if data actually changed
    if (
      farmers !== prevData.current.farmers ||
      agriOfficers !== prevData.current.agriOfficers ||
      admins !== prevData.current.admins
    ) {
      prevData.current = { farmers, agriOfficers, admins };
      const duration = 1200;
      farmerShared.value = withTiming(farmers / total, { duration, easing: Easing.out(Easing.exp) });
      agriShared.value = withTiming(agriOfficers / total, { duration, easing: Easing.out(Easing.exp) });
      adminShared.value = withTiming(admins / total, { duration, easing: Easing.out(Easing.exp) });
    }
  }, [farmers, agriOfficers, admins, total]);

  const animatedFarmerProps = useAnimatedProps(() => ({
    strokeDasharray: `${circumference * farmerShared.value} ${circumference}`,
  }));

  const animatedAgriProps = useAnimatedProps(() => ({
    strokeDasharray: `${circumference * agriShared.value} ${circumference}`,
    strokeDashoffset: -circumference * (farmerShared.value),
  }));

  const animatedAdminProps = useAnimatedProps(() => ({
    strokeDasharray: `${circumference * adminShared.value} ${circumference}`,
    strokeDashoffset: -circumference * (farmerShared.value + agriShared.value),
  }));

  const data = [
    { label: 'Farmers/Users', value: farmers,      color: '#4CAF50' },
    { label: 'Agri Officers', value: agriOfficers, color: '#FFB300' },
    { label: 'Admins',        value: admins,        color: '#2E7D32' },
  ];

  const realTotal = farmers + agriOfficers + admins;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Background Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F0F0F0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Farmers Segment */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#4CAF50"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeLinecap="butt"
              animatedProps={animatedFarmerProps}
            />
            {/* Agri Officers Segment */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#FFB300"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeLinecap="butt"
              animatedProps={animatedAgriProps}
            />
            {/* Admins Segment */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#2E7D32"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeLinecap="butt"
              animatedProps={animatedAdminProps}
            />
          </G>
        </Svg>
        
        {/* Center Label */}
        <View style={styles.centerLabel}>
          <Text style={styles.centerValue}>{total === 1 && farmers === 0 ? 0 : total}</Text>
          <Text style={styles.centerText}>Users</Text>
        </View>
      </View>

      {/* Legend — count + % cards */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => {
          const pct = realTotal > 0 ? ((item.value / realTotal) * 100).toFixed(0) : 0;
          return (
            <View key={index} style={styles.legendCard}>
              <View style={[styles.legendAccent, { backgroundColor: item.color }]} />
              <View style={styles.legendCardBody}>
                <Text style={styles.legendCount}>{item.value}</Text>
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={[styles.legendPct, { color: item.color }]}>{pct}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#115C39',
  },
  centerText: {
    fontSize: 10,
    color: '#757575',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 18,
    width: '100%',
    gap: 8,
  },
  legendCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5EAE8',
    minWidth: 90,
  },
  legendAccent: {
    width: 5,
  },
  legendCardBody: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  legendCount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A2E22',
    lineHeight: 22,
  },
  legendLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  legendPct: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  // kept for safety (no longer used but harmless)
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default CustomDonutChart;
