import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import CountUp from '../components/CountUp';
import CustomDonutChart from '../components/CustomDonutChart';
import GeoDistributionChart from '../components/GeoDistributionChart';


const { width } = Dimensions.get('window');

const StatCard = ({ title, value, colors, icon, iconType = 'Ionicons', delay = 0, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} style={styles.cardWrapper} onPress={onPress}>
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <View style={styles.iconCircle}>
          {iconType === 'Ionicons' ? (
            <Ionicons name={icon} size={20} color="#228531ff" />
          ) : iconType === 'MaterialCommunityIcons' ? (
            <MaterialCommunityIcons name={icon} size={20} color="#228531ff" />
          ) : (
            <FontAwesome5 name={icon} size={18} color="#228531ff" />
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <CountUp style={styles.statValue} value={value} delay={delay} />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    farmers: 0,
    agriOfficers: 0,
    pendingExperts: 0,
    pendingProducts: 0,
    geographicStats: []
  });
  const [loading, setLoading]         = useState(true);
  const [cropsBySeason, setCrops]     = useState({});
  const [cropLoading, setCropLoading] = useState(true);

  // ── Live refresh: re-fetch on focus + every 30s polling ─────────────────
  const intervalRef = useRef(null);

  const refreshAll = useCallback(async () => {
    fetchStats();
    fetchCropPerformance();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Immediate fetch when screen comes into focus
      refreshAll();

      // Poll every 30 seconds while screen is active
      intervalRef.current = setInterval(refreshAll, 30_000);

      return () => {
        // Clear polling when screen loses focus
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [refreshAll])
  );

  const fetchCropPerformance = async () => {
    setCropLoading(true);
    try {
      const res = await apiClient.get('/users/admin/crop-performance');
      if (res.data.status === 'success') {
        setCrops(res.data.data.cropsBySeason || {});
      }
    } catch (e) {
      console.log('Crop perf error:', e.message);
    } finally {
      setCropLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/admin/stats');
      if (response.data.status === 'success') {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header matching Drawer style for uniform look but hidden standard header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#2E7D32" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>System Overview</Text>
          <Text style={styles.headerSubtitle}>Live metrics and platform statistics</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshIconBtn} onPress={refreshAll}>
            <Ionicons name="refresh" size={18} color="#115C39" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('AdminReport')}>
            <Ionicons name="document-text" size={16} color="#fff" />
            <Text style={styles.reportBtnText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Top Stat Cards - 2x2 Grid */}
        <View style={styles.gridContainer}>
          {loading ? (
            <View style={styles.loadingContainerLarge}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Fetching Platform Metrics...</Text>
            </View>
          ) : (
            <>
              <StatCard
                title="Total Users"
                value={stats.totalUsers.toString()}
                colors={['#ffffffff', '#ffffffff']}
                icon="people"
                delay={0}
              />
              <StatCard
                title="Farmers"
                value={stats.farmers.toString()}
                colors={['#ffffffff', '#ffffffff']}
                icon="leaf"
                iconType="MaterialCommunityIcons"
                delay={100}
              />
              <StatCard
                title="Agri Officers"
                value={stats.agriOfficers.toString()}
                colors={['#ffffffff', '#ffffffff']}
                icon="school"
                delay={200}
              />
              <StatCard
                title="Pending"
                value={stats.pendingExperts.toString()}
                colors={['#ffffffff', '#ffffffff']}
                icon="time"
                delay={300}
              />
              <StatCard
                title="Approvals"
                value={stats.pendingProducts?.toString() || '0'}
                colors={['#ffffffff', '#ffffffff']}
                icon="storefront"
                iconType="Ionicons"
                delay={400}
                onPress={() => navigation.navigate('AdminMarketApprovals')}
              />
            </>
          )}
        </View>

        <View style={styles.filterBar}>
          <Text style={styles.filterDate}>DATE RANGE: 12/01/2025 - 03/01/2026</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterBtnText}>FILTER DATA</Text>
          </TouchableOpacity>
        </View>

        {/* Charts Row equivalent */}
        <View style={styles.rowCards}>
          {/* User Distribution Chart */}
          <View style={styles.cardLarge}>
            <Text style={styles.cardTitle}>User Distribution</Text>
            <Text style={styles.cardDesc}>
              Visualizes the breakdown of registered users by their roles to understand the platform's user base composition.
            </Text>
            <CustomDonutChart
              farmers={stats.farmers}
              agriOfficers={stats.agriOfficers}
              admins={stats.totalUsers - stats.farmers - stats.agriOfficers}
            />
          </View>

          {/* Geographical Distribution Chart */}
          <View style={styles.cardLarge}>
            <Text style={styles.cardTitle}>Geographical Distribution (Farmers)</Text>
            <Text style={styles.cardDesc}>
              Shows the concentration of farmers across different districts, highlighting regions with the highest platform adoption.
            </Text>
            <GeoDistributionChart data={stats.geographicStats} />
          </View>
        </View>

        {/* ── Crop Performance & Analytics ──────────────────────── */}
        <View style={styles.cropSectionHeader}>
          <MaterialCommunityIcons name="seed-outline" size={20} color="#FFB300" />
          <Text style={styles.sectionTitle}> Crop Performance & Analytics</Text>
        </View>

        {/* Formula info card */}
        <View style={styles.formulaCard}>
          <View style={styles.formulaIconWrap}>
            <Ionicons name="information-circle-outline" size={20} color="#4285F4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.formulaCardTitle}>Understanding Crop Performance Scoring</Text>
            <Text style={styles.formulaCardDesc}>
              The Crop Performance charts represent the top-performing crops for each agricultural season based on our intelligent{' '}
              <Text style={styles.formulaBold}>Performance Scorer (CPS)</Text>.
            </Text>
            <View style={styles.formulaPill}>
              <Text style={styles.formulaLabel}>FORMULA:{'  '}</Text>
              <Text style={styles.formulaText}>CPS = (Total Income / Total Acres) × (Total Yield / Total Acres)</Text>
            </View>
            <Text style={styles.formulaNote}>* Combines profitability per acre with yield productivity.</Text>
          </View>
        </View>

        {/* Season cards */}
        {cropLoading ? (
          <View style={styles.cropLoadingBox}>
            <ActivityIndicator size="small" color="#115C39" />
            <Text style={styles.cropLoadingText}>Calculating crop scores…</Text>
          </View>
        ) : Object.keys(cropsBySeason).length === 0 ? (
          <View style={styles.cropEmptyBox}>
            <MaterialCommunityIcons name="sprout-outline" size={36} color="#B0BEC5" />
            <Text style={styles.cropEmptyText}>No crop log data available yet.</Text>
          </View>
        ) : (
          <View style={styles.seasonScroll}>
            {['Yala', 'Maha', 'Inter-season'].filter(s => cropsBySeason[s]).map((season) => {
              const crops = cropsBySeason[season];
              const COLORS = {
                Yala:           { bar: '#FFB300', border: '#FFB300', bg: '#FFFDE7' },
                Maha:           { bar: '#4285F4', border: '#4285F4', bg: '#E8F0FE' },
                'Inter-season': { bar: '#34A853', border: '#34A853', bg: '#E6F4EA' },
              };
              const theme    = COLORS[season] || { bar: '#115C39', border: '#115C39', bg: '#E8F5E9' };
              const maxCPS   = Math.max(...crops.map(c => c.cpsScore), 1);

              const fmtCPS = (v) => {
                if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
                if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
                if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
                return v.toFixed(0);
              };

              const LABEL_MAP = {
                Yala:           'Best Crops: Yala',
                Maha:           'Best Crops: Maha',
                'Inter-season': 'Best Crops: Inter-Season',
              };

              return (
                <View
                  key={season}
                  style={[
                    styles.seasonCard,
                    { borderColor: theme.border, backgroundColor: theme.bg },
                  ]}
                >
                  <Text style={[styles.seasonCardTitle, { color: theme.border }]}>
                    🏆 {LABEL_MAP[season] || `Best Crops: ${season}`}
                  </Text>

                  {crops.slice(0, 6).map((crop, idx) => {
                    const barWPercent = Math.max((crop.cpsScore / maxCPS) * 100, 2);
                    return (
                      <View key={idx} style={styles.barRow}>
                        <Text style={styles.barCropLabel} numberOfLines={1}>{crop.cropName}</Text>
                        <View style={[styles.barTrack, { flex: 1 }]}>
                          <View style={[styles.barFillRect, { width: `${barWPercent}%`, backgroundColor: theme.bar }]} />
                        </View>
                        <Text style={styles.barCpsValue}>{fmtCPS(crop.cpsScore)}</Text>
                      </View>
                    );
                  })}

                  {/* X-axis tick labels aligned with the bars */}
                  <View style={[styles.barRow, { marginBottom: 0, marginTop: 4 }]}>
                    <View style={{ width: 80, marginRight: 4 }} />
                    <View style={[styles.xAxisRow, { flex: 1 }]}>
                      <Text style={styles.xTick}>0</Text>
                      <Text style={styles.xTick}>{fmtCPS(maxCPS * 0.5)}</Text>
                      <Text style={styles.xTick}>{fmtCPS(maxCPS)}</Text>
                    </View>
                    <View style={{ width: 55, marginLeft: 4 }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexWrap: 'wrap',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
    minWidth: 150,
  },
  headerTitle: {
    fontSize: width < 380 ? 18 : 20,
    fontWeight: 'bold',
    color: '#115C39',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#757575',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: width < 380 ? 8 : 0,
  },
  refreshIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  reportBtn: {
    flexDirection: 'row',
    backgroundColor: '#1B7A43',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardWrapper: {
    width: (width - 44) / 2,
    height: 110,
    marginBottom: 12,
  },
  statCard: {
    flex: 5,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopWidth: 5,
    borderTopColor: '#2b973bff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0,0,0,0.15)',
      },
    }),

  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  loadingContainerLarge: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  statTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(26, 72, 20, 0.9)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#124f1bff',
  },
  percentageContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  percentageText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterDate: {
    fontSize: 10,
    color: '#757575',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: width < 380 ? 8 : 0,
    flex: 1,
    marginRight: 8,
    textAlign: 'center',
  },
  filterBtn: {
    backgroundColor: '#1B7A43',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 100,
  },
  filterBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rowCards: {
    flexDirection: 'column', // Changed to column for mobile
  },
  cardLarge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 10,
  },
  geoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  geoBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  geoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1B7A43',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  // Fake Pie Chart Styles
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    marginBottom: 15,
  },
  pieOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pieInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pieSlice1: { position: 'absolute', width: '50%', height: '100%', backgroundColor: '#4CAF50', left: '50%' },
  pieSlice2: { position: 'absolute', width: '100%', height: '50%', backgroundColor: '#FFB300', top: '50%' },
  pieSlice3: { position: 'absolute', width: '50%', height: '50%', backgroundColor: '#2E7D32' },
  pieHole: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    position: 'absolute',
    zIndex: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 10,
    color: '#757575',
  },
  // Fake Bar Chart Styles
  barContainer: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  barItem: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    width: 40,
  },
  barFill: {
    width: 30,
    backgroundColor: '#4285F4',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#757575',
    marginTop: 5,
  },
  // Crop Performance
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  cropCardsContainer: {
    flexDirection: 'column',
  },
  cropCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  cropTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  cropBarRow: { flexDirection: 'row', alignItems: 'center' },
  cropLabel:  { width: 60, fontSize: 12, color: '#757575' },
  cropBarBg:  { flex: 1, height: 80, justifyContent: 'center' },
  cropBarFill:{ height: '100%', borderRadius: 4 },

  // ── Crop Performance Section ─────────────────────────────────────
  cropSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  // Formula info card
  formulaCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D7FD',
    gap: 10,
  },
  formulaIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  formulaCardTitle: {
    fontSize: 13, fontWeight: '800', color: '#1E3A8A', marginBottom: 3,
  },
  formulaCardDesc: {
    fontSize: 11, color: '#4B5563', lineHeight: 16, marginBottom: 8,
  },
  formulaPill: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  formulaLabel: {
    fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5,
  },
  formulaText: {
    fontSize: 10, fontWeight: '700', color: '#7DD3FC', fontFamily: 'monospace',
  },
  formulaBold: {
    fontWeight: '800', fontStyle: 'italic',
  },
  formulaNote: {
    fontSize: 10,
    color: '#6B8EAD',
    fontStyle: 'italic',
    marginTop: 6,
  },
  // Loading / empty
  cropLoadingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cropLoadingText: { fontSize: 13, color: '#757575' },
  cropEmptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cropEmptyText: { fontSize: 13, color: '#B0BEC5', fontStyle: 'italic' },
  // Season card scroll
  seasonScroll: {
    gap: 14,
    paddingBottom: 4,
  },
  seasonCard: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
    marginBottom: 6,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  seasonCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18,
  },
  // Horizontal bar
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barCropLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  barTrack: {
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFillRect: {
    height: '100%',
    borderRadius: 5,
  },
  barCpsValue: {
    width: 55,
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'right',
    marginLeft: 4,
  },
  // X-axis
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  xTick: {
    fontSize: 9,
    color: '#9CA3AF',
  },
});

export default AdminDashboardScreen;
