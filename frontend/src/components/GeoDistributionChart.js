import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

// Sri Lankan district color palette (rotating through a curated set)
const DISTRICT_COLORS = [
  ['#1B7A43', '#2ECC71'],  // deep green → bright green
  ['#0D47A1', '#42A5F5'],  // deep blue → sky blue
  ['#E65100', '#FFA726'],  // deep orange → amber
  ['#6A1B9A', '#AB47BC'],  // deep purple → light purple
  ['#00695C', '#26A69A'],  // teal dark → teal light
  ['#C62828', '#EF5350'],  // deep red → light red
  ['#37474F', '#78909C'],  // slate dark → slate light
  ['#F57F17', '#FFEE58'],  // dark yellow → yellow
  ['#1565C0', '#5C9EE0'],  // navy → mid blue
  ['#2E7D32', '#81C784'],  // forest → light green
];

const AnimatedBar = ({ item, index, maxCount, totalFarmers, delay }) => {
  const animWidth = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  const colors = DISTRICT_COLORS[index % DISTRICT_COLORS.length];
  const percentage = totalFarmers > 0 ? ((item.count / totalFarmers) * 100).toFixed(1) : 0;
  const barMaxWidth = screenWidth - 180; // label + padding

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(animWidth, {
          toValue: maxCount > 0 ? (item.count / maxCount) * barMaxWidth : 0,
          duration: 700,
          useNativeDriver: false,
          easing: Easing.out(Easing.exp),
        }),
      ]),
    ]).start();
  }, [item.count, maxCount]);

  const districtName = item._id || 'Unknown';

  return (
    <Animated.View style={[styles.barRow, { opacity: animOpacity }]}>
      {/* District Label */}
      <View style={styles.labelContainer}>
        <View style={[styles.labelDot, { backgroundColor: colors[0] }]} />
        <Text style={styles.districtLabel} numberOfLines={1}>
          {districtName}
        </Text>
      </View>

      {/* Bar + Count */}
      <View style={styles.barAndCount}>
        <Animated.View style={[styles.barTrack]}>
          <Animated.View style={{ width: animWidth, borderRadius: 6, overflow: 'hidden' }}>
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.barFill}
            />
          </Animated.View>
        </Animated.View>
        <View style={styles.countBadge}>
          <Text style={[styles.countText, { color: colors[0] }]}>{item.count}</Text>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const GeoDistributionChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="map-marker-off-outline" size={40} color="#C8E6C9" />
        <Text style={styles.emptyTitle}>No District Data</Text>
        <Text style={styles.emptySubtitle}>
          District info will appear once farmers register with their location.
        </Text>
      </View>
    );
  }

  // Sort by count descending (already sorted from backend, but ensure)
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const maxCount = sorted[0]?.count || 1;
  const totalFarmers = sorted.reduce((sum, d) => sum + d.count, 0);

  return (
    <View style={styles.container}>
      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <MaterialCommunityIcons name="map-marker-multiple" size={16} color="#1B7A43" />
          <Text style={styles.summaryValue}>{sorted.length}</Text>
          <Text style={styles.summaryLabel}>Districts</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <MaterialCommunityIcons name="account-group" size={16} color="#1B7A43" />
          <Text style={styles.summaryValue}>{totalFarmers}</Text>
          <Text style={styles.summaryLabel}>Total Farmers</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <MaterialCommunityIcons name="trophy-outline" size={16} color="#E65100" />
          <Text style={[styles.summaryValue, { color: '#E65100' }]} numberOfLines={1}>
            {sorted[0]?._id || '—'}
          </Text>
          <Text style={styles.summaryLabel}>Top District</Text>
        </View>
      </View>

      {/* Bars */}
      <View style={styles.barsContainer}>
        {sorted.map((item, index) => (
          <AnimatedBar
            key={item._id || index}
            item={item}
            index={index}
            maxCount={maxCount}
            totalFarmers={totalFarmers}
            delay={index * 80}
          />
        ))}
      </View>

      {/* Footer note */}
      <Text style={styles.footerNote}>
        <MaterialCommunityIcons name="information-outline" size={11} color="#BDBDBD" />
        {'  '}Based on registered farmer profiles
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  // --- Summary Row ---
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8F3',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#C8E6C9',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B5E20',
    marginTop: 2,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#757575',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // --- Bars ---
  barsContainer: {
    width: '100%',
  },
  barRow: {
    marginBottom: 14,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  districtLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  barAndCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: 12,
    borderRadius: 6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 60,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 4,
  },
  percentText: {
    fontSize: 10,
    color: '#9E9E9E',
  },

  // --- Empty State ---
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BDBDBD',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#BDBDBD',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },

  // --- Footer ---
  footerNote: {
    fontSize: 10,
    color: '#BDBDBD',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default GeoDistributionChart;
