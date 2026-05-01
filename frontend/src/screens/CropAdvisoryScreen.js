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
    {
      icon: '🌾',
      title: 'Location-Based',
      description: 'Tailored to your farming zone and climate.'
    },
    {
      icon: '📅',
      title: 'Seasonal Guidance',
      description: 'Optimal crops for Yala and Maha seasons.'
    },
    {
      icon: '🌱',
      title: 'Soil Matching',
      description: 'Best crop suggestions for your soil type.'
    },
    {
      icon: '🧪',
      title: 'Fertilizer Tips',
      description: 'Recommended fertilizers for each crop.'
    },
    {
      icon: '🛡️',
      title: 'Disease Awareness',
      description: 'Common diseases to watch for and prevent.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Choose Your Location',
      description: 'Pick your zone to match crops with rainfall and climate patterns.'
    },
    {
      number: '2',
      title: 'Select Season & Soil Type',
      description: 'Choose Maha or Yala and add soil type for more targeted results.'
    },
    {
      number: '3',
      title: 'Get Detailed Results',
      description: 'View suitable crops with care instructions, fertilizer tips, and disease warnings.'
    }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [locationsData, seasonsData, soilTypesData] = await Promise.all([
        getLocations(),
        getSeasons(),
        getSoilTypes()
      ]);
      setLocations(locationsData);
      setSeasons(seasonsData);
      setSoilTypes(soilTypesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!selectedLocation || !selectedSeason) {
      Alert.alert('Error', 'Please select both location and season.');
      return;
    }

    try {
      setLoading(true);
      const recommendations = await getRecommendations(
        selectedLocation,
        selectedSeason,
        selectedSoil
      );
      setCrops(recommendations);
      setShowResults(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setCrops([]);
    setShowResults(false);
    setSelectedLocation('');
    setSelectedSeason('');
    setSelectedSoil('Any');
  };

  const handleBackToForm = () => {
    setShowResults(false);
  };

  const openSelector = (selectorName) => {
    setActiveSelector(selectorName);
  };

  const closeSelector = () => {
    setActiveSelector(null);
  };

  const selectorConfig = {
    location: {
      title: 'Select Location',
      value: selectedLocation,
      options: locations.map((location) => ({ label: location.name, value: location.name })),
      onSelect: setSelectedLocation,
    },
    season: {
      title: 'Select Season',
      value: selectedSeason,
      options: seasons.map((season) => ({ label: season.name, value: season.name })),
      onSelect: setSelectedSeason,
    },
    soil: {
      title: 'Select Soil Type',
      value: selectedSoil,
      options: [
        { label: 'Any Soil Type', value: 'Any' },
        ...soilTypes.map((soil) => ({ label: soil.name, value: soil.name })),
      ],
      onSelect: setSelectedSoil,
    },
  };

  const currentSelector = activeSelector ? selectorConfig[activeSelector] : null;

  const handleSelectOption = (value) => {
    if (!currentSelector) return;
    currentSelector.onSelect(value);
    closeSelector();
  };

  const renderBenefitCard = ({ item }) => (
    <View style={styles.benefitCard}>
      <Text style={styles.benefitIcon}>{item.icon}</Text>
      <Text style={styles.benefitTitle}>{item.title}</Text>
      <Text style={styles.benefitDescription}>{item.description}</Text>
    </View>
  );

  const renderStep = ({ item }) => (
    <View style={styles.stepItem}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNumber}>{item.number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{item.title}</Text>
        <Text style={styles.stepDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const renderCropCard = ({ item }) => (
    <View style={styles.cropCard}>
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/200' }}
        style={styles.cropImage}
        resizeMode="cover"
      />

      <View style={styles.cropContent}>
        <Text style={styles.cropName}>{item.cropName}</Text>

        <View style={styles.careSection}>
          <Text style={styles.cardSectionLabel}>Care Instructions</Text>
          <Text style={styles.careText}>{item.careInstructions}</Text>
        </View>

        {item.fertilizers && item.fertilizers.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.cardSectionLabel}>📦 Fertilizers</Text>
            <View style={styles.tagContainer}>
              {item.fertilizers.map((fert, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{fert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {item.diseases && item.diseases.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.cardSectionLabel}>⚠️ Common Diseases</Text>
            <View style={styles.tagContainer}>
              {item.diseases.map((disease, idx) => (
                <View key={idx} style={[styles.tag, styles.diseaseTag]}>
                  <Text style={styles.tagText}>{disease}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  if (loadingData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#149b60" />
        <Text style={styles.loadingText}>Loading crop data...</Text>
      </View>
    );
  }

  if (showResults) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0d7b47', '#0b6f42']}
          style={styles.resultsHeader}
        >
          <View style={styles.resultsHeaderContent}>
            <View style={styles.resultsBackRow}>
              <TouchableOpacity style={styles.backButton} onPress={handleBackToForm}>
                <MaterialCommunityIcons name="arrow-left" size={18} color="#ffffff" />
                <Text style={styles.backButtonText}>Back to Form</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.resultsTitle}>Crop Recommendations</Text>
            <Text style={styles.resultsCriteria}>
              {selectedLocation} • {selectedSeason}
              {selectedSoil && selectedSoil !== 'Any' ? ` • ${selectedSoil}` : ''}
            </Text>
            <Text style={styles.resultsCount}>
              Found {crops.length} crop{crops.length !== 1 ? 's' : ''} for your selection
            </Text>
          </View>
        </LinearGradient>

        {crops.length > 0 ? (
          <View style={styles.resultsContainer}>
            <FlatList
              data={crops}
              renderItem={renderCropCard}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.cropList}
            />
          </View>
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#FF6B6B" />
            <Text style={styles.noResultsText}>No crops found for your selection</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your preferences</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.newSearchButton}
          onPress={handleNewSearch}
        >
          <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
          <Text style={styles.newSearchText}>Reset and Search Again</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0d7b47', '#0b6f42']}
        style={styles.heroSection}
      >
        <View style={styles.factsBadge}>
          <Text style={styles.factsBadgeText}>Powered by Facts</Text>
        </View>
        <Text style={styles.heroTitle}>Smart Crop</Text>
        <Text style={styles.heroTitle}>Recommendations</Text>
        <Text style={styles.heroSubtitle}>
          Data-driven crop advice for your location, season, and soil conditions.
        </Text>
      </LinearGradient>

      <View style={styles.benefitsSection}>
        <Text style={styles.sectionEyebrow}>Our Benefits</Text>
        <Text style={styles.sectionTitle}>Benefits of Smart Crop Advisory</Text>
        <Text style={styles.sectionSubtitle}>
          Grow more confidently with practical recommendations for local farming.
        </Text>
        <FlatList
          data={benefits}
          renderItem={renderBenefitCard}
          keyExtractor={(item, idx) => idx.toString()}
          scrollEnabled={false}
          numColumns={1}
          contentContainerStyle={styles.benefitsList}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formTitle}>Get Crop Recommendations</Text>
        <Text style={styles.formDescription}>
          Select your location, season, and soil type to receive personalized crop guidance.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location *</Text>
          <TouchableOpacity style={styles.pickerWrapper} onPress={() => openSelector('location')} activeOpacity={0.8}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#4CAF50" style={styles.pickerIcon} />
            <Text style={[styles.selectorText, !selectedLocation && styles.selectorPlaceholder]}>
              {selectedLocation || '-- Select Location --'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#6c7a89" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Season *</Text>
          <TouchableOpacity style={styles.pickerWrapper} onPress={() => openSelector('season')} activeOpacity={0.8}>
            <MaterialCommunityIcons name="calendar" size={20} color="#4CAF50" style={styles.pickerIcon} />
            <Text style={[styles.selectorText, !selectedSeason && styles.selectorPlaceholder]}>
              {selectedSeason || '-- Select Season --'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#6c7a89" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Soil Type</Text>
          <TouchableOpacity style={styles.pickerWrapper} onPress={() => openSelector('soil')} activeOpacity={0.8}>
            <MaterialCommunityIcons name="grain" size={20} color="#4CAF50" style={styles.pickerIcon} />
            <Text style={styles.selectorText}>{selectedSoil || 'Any Soil Type'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#6c7a89" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleGetRecommendations}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Get My Recommendations</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={handleNewSearch}>
          <Text style={styles.resetButtonText}>Reset Form</Text>
        </TouchableOpacity>

      </View>

      <View style={styles.processSection}>
        <Text style={styles.sectionEyebrow}>Simple Process</Text>
        <Text style={styles.processTitle}>How It Works</Text>
        <Text style={styles.processSubtitle}>Three steps to smarter farming decisions.</Text>

        <FlatList
          data={steps}
          renderItem={renderStep}
          keyExtractor={(item) => item.number}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        />

        <View style={styles.proTipContainer}>
          <Text style={styles.proTipTitle}>Pro Tip</Text>
          <Text style={styles.proTipText}>
            Start with "Any Soil Type" to explore all matching crops, then narrow down with a specific soil type.
          </Text>
        </View>
      </View>

      <View style={{ height: 30 }} />

      <Modal
        visible={!!activeSelector}
        transparent
        animationType="slide"
        onRequestClose={closeSelector}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeSelector}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{currentSelector?.title || 'Select Option'}</Text>
              <TouchableOpacity onPress={closeSelector}>
                <MaterialCommunityIcons name="close" size={22} color="#2f3b4a" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalOptionsWrap} showsVerticalScrollIndicator={false}>
              {currentSelector?.options?.map((option) => {
                const isSelected = currentSelector.value === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.modalOptionItem, isSelected && styles.modalOptionItemSelected]}
                    onPress={() => handleSelectOption(option.value)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check-circle" size={18} color="#0f9258" />
                    )}
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
  container: {
    flex: 1,
    backgroundColor: '#f2f8f3',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f8f3',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#566273',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 42,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  factsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  factsBadgeText: {
    color: '#d4f4e3',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.92,
    lineHeight: 20,
    marginTop: 14,
    paddingHorizontal: 8,
  },
  benefitsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginTop: 14,
    marginHorizontal: 12,
    borderRadius: 18,
  },
  sectionEyebrow: {
    fontSize: 12,
    color: '#c08243',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1d2230',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 35,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#60697a',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 18,
    lineHeight: 20,
  },
  benefitsList: {
    paddingHorizontal: 2,
  },
  benefitCard: {
    width: '100%',
    backgroundColor: '#f7f9fb',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef1f3',
    marginBottom: 10,
  },
  benefitIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1d2230',
    textAlign: 'center',
    marginBottom: 6,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#6a7383',
    textAlign: 'center',
    lineHeight: 18,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginHorizontal: 12,
    marginTop: 14,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d2230',
    marginBottom: 6,
  },
  formDescription: {
    fontSize: 14,
    color: '#657082',
    marginBottom: 18,
    lineHeight: 19,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#313745',
    marginBottom: 8,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d5dde4',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    minHeight: 42,
    paddingHorizontal: 10,
  },
  pickerIcon: {
    marginRight: 8,
  },
  selectorText: {
    flex: 1,
    paddingVertical: 10,
    color: '#2d3748',
    fontSize: 13,
    fontWeight: '500',
  },
  selectorPlaceholder: {
    color: '#8b97a4',
    fontWeight: '400',
  },
  submitButton: {
    backgroundColor: '#0f9258',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 11,
    marginTop: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d7dbe1',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    backgroundColor: '#f7f8fa',
  },
  resetButtonText: {
    color: '#6a7282',
    fontSize: 14,
    fontWeight: '600',
  },
  processSection: {
    backgroundColor: '#ecf8f1',
    marginHorizontal: 12,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  processTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1d2230',
    marginTop: 6,
  },
  processSubtitle: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
    color: '#5f6777',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#13965b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepNumber: {
    color: '#fff',
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    color: '#18202f',
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#4f5868',
    lineHeight: 18,
  },
  proTipContainer: {
    marginTop: 16,
    backgroundColor: '#dff4e7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#c3e8d0',
  },
  proTipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#147244',
    marginBottom: 4,
  },
  proTipText: {
    fontSize: 13,
    color: '#2c6247',
    lineHeight: 18,
  },
  resultsHeader: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingTop: 16,
  },
  resultsHeaderContent: {
    alignItems: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 14,
    padding: 12,
  },
  resultsBackRow: {
    marginBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  resultsCriteria: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '400',
  },
  resultsCount: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.85,
    fontWeight: '500',
  },
  resultsContainer: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cropList: {
    paddingHorizontal: 4,
  },
  cropCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#111',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eaf0ec',
  },
  cropImage: {
    width: '100%',
    height: 150,
  },
  cropContent: {
    padding: 14,
  },
  cropName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#253040',
    marginBottom: 10,
  },
  careSection: {
    marginBottom: 12,
    backgroundColor: '#f7faf8',
    borderRadius: 10,
    padding: 10,
  },
  cardSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  careText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },
  tagsSection: {
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: '#4CAF50',
  },
  diseaseTag: {
    backgroundColor: '#ffebee',
    borderColor: '#FF6B6B',
  },
  tagText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 16,
    borderRadius: 12,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  newSearchButton: {
    backgroundColor: '#117a4c',
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  newSearchText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 22,
    maxHeight: '62%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2b3a',
  },
  modalOptionsWrap: {
    marginTop: 4,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  modalOptionItemSelected: {
    backgroundColor: '#eefaf3',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#2f3b4a',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#0f9258',
    fontWeight: '700',
  },
});

export default CropAdvisoryScreen;
