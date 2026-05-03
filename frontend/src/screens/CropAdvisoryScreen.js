import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getLocations, getSeasons, getSoilTypes, getRecommendations } from '../api/cropAdvisoryApi';

// ── Colour tokens matching Community Forum ──────────────────────────────────
const C = {
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryMid: '#388E3C',
  accent: '#4CAF50',
  surface: '#FFFFFF',
  bg: '#F1F8F2',
  cardBg: '#FFFFFF',
  border: '#C8E6C9',
  textDark: '#1B2A1E',
  textMid: '#4A5E4F',
  textLight: '#7A9080',
  tagGreen: '#E8F5E9',
  tagRed: '#FFEBEE',
  tagRedBorder: '#EF9A9A',
};

const CropAdvisoryScreen = () => {
  const [locations, setLocations] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [soilTypes, setSoilTypes] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedSoil, setSelectedSoil] = useState('Any');
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [activeSelector, setActiveSelector] = useState(null);

  const benefits = [
    { icon: 'map-marker-radius', title: 'Location-Based', desc: 'Tailored to your farming zone.' },
    { icon: 'weather-partly-cloudy', title: 'Seasonal Guidance', desc: 'Optimal crops for Yala & Maha.' },
    { icon: 'terrain', title: 'Soil Matching', desc: 'Best crops for your soil type.' },
    { icon: 'flask-outline', title: 'Fertilizer Tips', desc: 'Recommended fertilizers per crop.' },
    { icon: 'shield-bug-outline', title: 'Disease Awareness', desc: 'Common diseases to prevent.' },
  ];

  const steps = [
    { number: '1', title: 'Choose Location', desc: 'Pick your zone to match climate patterns.' },
    { number: '2', title: 'Select Season & Soil', desc: 'Choose Maha or Yala and add soil type.' },
    { number: '3', title: 'Get Results', desc: 'View crops with care tips and disease alerts.' },
  ];

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [loc, sea, soil] = await Promise.all([getLocations(), getSeasons(), getSoilTypes()]);
      setLocations(loc);
      setSeasons(sea);
      setSoilTypes(soil);
    } catch {
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!selectedLocation || !selectedSeason) {
      Alert.alert('Required', 'Please select both location and season.');
      return;
    }
    try {
      setLoading(true);
      const result = await getRecommendations(selectedLocation, selectedSeason, selectedSoil);
      setCrops(result);
      setShowResults(true);
    } catch {
      Alert.alert('Error', 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCrops([]);
    setShowResults(false);
    setSelectedLocation('');
    setSelectedSeason('');
    setSelectedSoil('Any');
  };

  const selectorConfig = {
    location: {
      title: 'Select Location',
      value: selectedLocation,
      options: locations.map(l => ({ label: l.name, value: l.name })),
      onSelect: setSelectedLocation,
    },
    season: {
      title: 'Select Season',
      value: selectedSeason,
      options: seasons.map(s => ({ label: s.name, value: s.name })),
      onSelect: setSelectedSeason,
    },
    soil: {
      title: 'Select Soil Type',
      value: selectedSoil,
      options: [
        { label: 'Any Soil Type', value: 'Any' },
        ...soilTypes.map(s => ({ label: s.name, value: s.name })),
      ],
      onSelect: setSelectedSoil,
    },
  };

  const currentSelector = activeSelector ? selectorConfig[activeSelector] : null;

  const handleSelectOption = (value) => {
    if (!currentSelector) return;
    currentSelector.onSelect(value);
    setActiveSelector(null);
  };

  // ── Render: loading spinner ─────────────────────────────────────────────
  if (loadingData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading crop data…</Text>
      </View>
    );
  }

  // ── Render: results page ────────────────────────────────────────────────
  if (showResults) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.resultsHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowResults(false)}>
            <MaterialCommunityIcons name="arrow-left" size={16} color="#fff" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.resultsTitle}>Crop Recommendations</Text>
          <Text style={styles.resultsMeta}>
            {selectedLocation} · {selectedSeason}
            {selectedSoil && selectedSoil !== 'Any' ? ` · ${selectedSoil}` : ''}
          </Text>
          <View style={styles.resultsCountBadge}>
            <Text style={styles.resultsCountText}>
              {crops.length} crop{crops.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        </LinearGradient>

        {crops.length > 0 ? (
          <View style={styles.resultsBody}>
            <FlatList
              data={crops}
              keyExtractor={(_, i) => i.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.cropCard}>
                  <Image
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/400x160?text=No+Image' }}
                    style={styles.cropImage}
                    resizeMode="cover"
                  />
                  <View style={styles.cropBody}>
                    <Text style={styles.cropName}>{item.cropName}</Text>

                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>📋 Care Instructions</Text>
                      <Text style={styles.infoText}>{item.careInstructions}</Text>
                    </View>

                    {item.fertilizers?.length > 0 && (
                      <View style={styles.tagsBlock}>
                        <Text style={styles.infoLabel}>📦 Fertilizers</Text>
                        <View style={styles.tagRow}>
                          {item.fertilizers.map((f, i) => (
                            <View key={i} style={styles.tagGreen}>
                              <Text style={styles.tagGreenText}>{f}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {item.diseases?.length > 0 && (
                      <View style={styles.tagsBlock}>
                        <Text style={styles.infoLabel}>⚠️ Common Diseases</Text>
                        <View style={styles.tagRow}>
                          {item.diseases.map((d, i) => (
                            <View key={i} style={styles.tagRed}>
                              <Text style={styles.tagRedText}>{d}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="sprout-outline" size={44} color={C.textLight} />
            <Text style={styles.emptyTitle}>No crops found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
          </View>
        )}

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <MaterialCommunityIcons name="magnify" size={17} color="#fff" />
          <Text style={styles.resetBtnText}>Search Again</Text>
        </TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // ── Render: main form page ──────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>AI-Powered Advisory</Text>
        </View>
        <Text style={styles.heroTitle}>Smart Crop{'\n'}Recommendations</Text>
        <Text style={styles.heroSub}>
          Data-driven advice for your location, season & soil.
        </Text>
      </LinearGradient>

      {/* ── Selection Form ── */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Get Recommendations</Text>

        {/* Location */}
        <Text style={styles.fieldLabel}>Location *</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setActiveSelector('location')} activeOpacity={0.75}>
          <MaterialCommunityIcons name="map-marker-outline" size={18} color={C.primary} />
          <Text style={[styles.pickerText, !selectedLocation && styles.pickerPlaceholder]}>
            {selectedLocation || 'Select location'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={C.textLight} />
        </TouchableOpacity>

        {/* Season */}
        <Text style={styles.fieldLabel}>Season *</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setActiveSelector('season')} activeOpacity={0.75}>
          <MaterialCommunityIcons name="calendar-month-outline" size={18} color={C.primary} />
          <Text style={[styles.pickerText, !selectedSeason && styles.pickerPlaceholder]}>
            {selectedSeason || 'Select season'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={C.textLight} />
        </TouchableOpacity>

        {/* Soil */}
        <Text style={styles.fieldLabel}>Soil Type</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setActiveSelector('soil')} activeOpacity={0.75}>
          <MaterialCommunityIcons name="terrain" size={18} color={C.primary} />
          <Text style={styles.pickerText}>{selectedSoil || 'Any Soil Type'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={C.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleGetRecommendations}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
              <MaterialCommunityIcons name="leaf" size={17} color="#fff" />
              <Text style={styles.submitBtnText}>Get Recommendations</Text>
            </>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearBtn} onPress={handleReset}>
          <Text style={styles.clearBtnText}>Clear Selection</Text>
        </TouchableOpacity>
      </View>

      {/* ── Benefits ── */}
      <View style={styles.section}>
        <Text style={styles.sectionEye}>WHY USE THIS</Text>
        <Text style={styles.sectionTitle}>Benefits of Smart Advisory</Text>
        {benefits.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <MaterialCommunityIcons name={b.icon} size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── How it works ── */}
      <View style={styles.stepsSection}>
        <Text style={styles.sectionEye}>SIMPLE PROCESS</Text>
        <Text style={styles.sectionTitle}>How It Works</Text>
        {steps.map((s, i) => (
          <View key={i} style={[styles.stepRow, i < steps.length - 1 && { marginBottom: 12 }]}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>{s.number}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}
        <View style={styles.tipBox}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={C.primary} style={{ marginRight: 6 }} />
          <Text style={styles.tipText}>
            Start with "Any Soil Type" to explore all matches, then narrow down.
          </Text>
        </View>
      </View>

      <View style={{ height: 28 }} />

      {/* ── Selector Modal ── */}
      <Modal
        visible={!!activeSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSelector(null)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setActiveSelector(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{currentSelector?.title}</Text>
              <TouchableOpacity onPress={() => setActiveSelector(null)}>
                <MaterialCommunityIcons name="close" size={20} color={C.textMid} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {currentSelector?.options?.map(opt => {
                const sel = currentSelector.value === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionRow, sel && styles.optionRowSel]}
                    onPress={() => handleSelectOption(opt.value)}
                  >
                    <Text style={[styles.optionText, sel && styles.optionTextSel]}>{opt.label}</Text>
                    {sel && <MaterialCommunityIcons name="check-circle" size={17} color={C.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loadingText: { marginTop: 10, fontSize: 13, color: C.textMid },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  heroBadgeText: { color: '#C8E6C9', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 17,
  },

  // ── Form card ─────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    marginTop: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: C.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.3 },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    backgroundColor: '#FAFFFE',
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
    gap: 8,
  },
  pickerText: { flex: 1, fontSize: 13, color: C.textDark, fontWeight: '500' },
  pickerPlaceholder: { color: C.textLight, fontWeight: '400' },
  submitBtn: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
    gap: 7,
    elevation: 2,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  clearBtn: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  clearBtnText: { color: C.textMid, fontSize: 13, fontWeight: '600' },

  // ── Sections ─────────────────────────────────────────────────────────────
  section: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
  },
  sectionEye: { fontSize: 10, fontWeight: '700', color: C.primaryMid, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 12 },

  // ── Benefits ──────────────────────────────────────────────────────────────
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.tagGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  benefitDesc: { fontSize: 12, color: C.textMid, lineHeight: 16 },

  // ── Steps ─────────────────────────────────────────────────────────────────
  stepsSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNum: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  stepDesc: { fontSize: 12, color: C.textMid, lineHeight: 16 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#C8E6C9',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  tipText: { flex: 1, fontSize: 12, color: C.primaryDark, lineHeight: 17 },

  // ── Results page ─────────────────────────────────────────────────────────
  resultsHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
    gap: 4,
  },
  backBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  resultsTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  resultsMeta: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  resultsCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  resultsBody: { paddingHorizontal: 12, paddingTop: 12 },

  // ── Crop cards ────────────────────────────────────────────────────────────
  cropCard: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  cropImage: { width: '100%', height: 130 },
  cropBody: { padding: 12 },
  cropName: { fontSize: 15, fontWeight: '800', color: C.textDark, marginBottom: 8 },
  infoBox: {
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  infoLabel: { fontSize: 10, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
  infoText: { fontSize: 12, color: C.textMid, lineHeight: 17 },
  tagsBlock: { marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 5 },
  tagGreen: {
    backgroundColor: C.tagGreen,
    borderWidth: 0.5,
    borderColor: C.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagGreenText: { fontSize: 11, color: C.primaryDark, fontWeight: '600' },
  tagRed: {
    backgroundColor: C.tagRed,
    borderWidth: 0.5,
    borderColor: C.tagRedBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagRedText: { fontSize: 11, color: '#C62828', fontWeight: '600' },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: C.surface,
    borderRadius: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginTop: 12 },
  emptySubtitle: { fontSize: 12, color: C.textLight, marginTop: 4 },

  resetBtn: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 12,
    gap: 6,
  },
  resetBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // ── Modal ─────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingBottom: 22,
    maxHeight: '58%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 14, fontWeight: '700', color: C.textDark },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 9,
    marginBottom: 4,
  },
  optionRowSel: { backgroundColor: '#E8F5E9' },
  optionText: { fontSize: 13, color: C.textDark, fontWeight: '500' },
  optionTextSel: { color: C.primary, fontWeight: '700' },
});

export default CropAdvisoryScreen;
