import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, borderColor }) => (
  <View style={[styles.statCard, { borderLeftColor: borderColor }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statValue, { color: borderColor }]}>{value}</Text>
  </View>
);

const AdminDashboardScreen = ({ navigation }) => {
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
        <TouchableOpacity style={styles.reportBtn}>
          <Ionicons name="document-text" size={16} color="#fff" />
          <Text style={styles.reportBtnText}>Report</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Top Stat Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <StatCard title="TOTAL USERS" value="9" borderColor="#FFB300" />
          <StatCard title="FARMERS" value="6" borderColor="#2196F3" />
          <StatCard title="AGRI OFFICERS" value="1" borderColor="#4CAF50" />
          <StatCard title="PENDING" value="1" borderColor="#F44336" />
        </ScrollView>

        <View style={styles.filterBar}>
          <Text style={styles.filterDate}>DATE RANGE: 12/01/2025 - 03/01/2026</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterBtnText}>FILTER DATA</Text>
          </TouchableOpacity>
        </View>

        {/* Charts Row equivalent */}
        <View style={styles.rowCards}>
          {/* User Distribution Fake Chart */}
          <View style={styles.cardLarge}>
            <Text style={styles.cardTitle}>User Distribution</Text>
            <View style={styles.pieContainer}>
              <View style={styles.pieOuter}>
                <View style={styles.pieInner}>
                  <View style={styles.pieSlice1} />
                  <View style={styles.pieSlice2} />
                  <View style={styles.pieSlice3} />
                </View>
                <View style={styles.pieHole} />
              </View>
            </View>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#4CAF50' }]} /><Text style={styles.legendText}>Farmers</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#FFB300' }]} /><Text style={styles.legendText}>Agri Officers</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#2E7D32' }]} /><Text style={styles.legendText}>Admins</Text></View>
            </View>
          </View>

          {/* Geographical Distribution Fake Chart */}
          <View style={styles.cardLarge}>
            <Text style={styles.cardTitle}>Geographical Distribution</Text>
            <View style={styles.barContainer}>
              <View style={styles.barItem}><View style={[styles.barFill, { height: '30%' }]} /><Text style={styles.barLabel}>Gam.</Text></View>
              <View style={styles.barItem}><View style={[styles.barFill, { height: '30%' }]} /><Text style={styles.barLabel}>Amp.</Text></View>
              <View style={styles.barItem}><View style={[styles.barFill, { height: '30%' }]} /><Text style={styles.barLabel}>Kil.</Text></View>
              <View style={styles.barItem}><View style={[styles.barFill, { height: '90%' }]} /><Text style={styles.barLabel}>Gam.</Text></View>
            </View>
          </View>
        </View>

        {/* Crop Performance Section */}
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="seed-outline" size={20} color="#FFB300" /> Crop Performance
        </Text>

        <View style={styles.cropCardsContainer}>
          <View style={styles.cropCard}>
            <Text style={styles.cropTitle}>🏆 Best Crops: Yala</Text>
            <View style={styles.cropBarRow}>
              <Text style={styles.cropLabel}>Banana</Text>
              <View style={styles.cropBarBg}><View style={[styles.cropBarFill, { width: '80%', backgroundColor: '#FFB300' }]} /></View>
            </View>
          </View>

          <View style={styles.cropCard}>
            <Text style={styles.cropTitle}>🏆 Best Crops: Maha</Text>
            <View style={styles.cropBarRow}>
              <Text style={styles.cropLabel}>Mango</Text>
              <View style={styles.cropBarBg}><View style={[styles.cropBarFill, { width: '90%', backgroundColor: '#2196F3' }]} /></View>
            </View>
          </View>

          <View style={styles.cropCard}>
            <Text style={styles.cropTitle}>🏆 Best Crops: Inter</Text>
            <View style={styles.cropBarRow}>
              <Text style={styles.cropLabel}>Pumpkin</Text>
              <View style={styles.cropBarBg}><View style={[styles.cropBarFill, { width: '60%', backgroundColor: '#4CAF50' }]} /></View>
            </View>
          </View>
        </View>

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
  reportBtn: {
    flexDirection: 'row',
    backgroundColor: '#1B7A43',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: width < 380 ? 8 : 0,
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
  statsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: 140,
    marginRight: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cropTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  cropBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropLabel: {
    width: 60,
    fontSize: 12,
    color: '#757575',
  },
  cropBarBg: {
    flex: 1,
    height: 80,
    justifyContent: 'center',
  },
  cropBarFill: {
    height: '100%',
    borderRadius: 4,
  }
});

export default AdminDashboardScreen;
