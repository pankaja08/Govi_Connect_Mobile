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
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getLocations, getSeasons, getSoilTypes, getRecommendations } from '../api/cropAdvisoryApi';

const { width } = Dimensions.get('window');

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

  const benefits = [
    {
      icon: '🌾',
      title: 'Location-Based',
      description: 'Recommendations tailored to your farming zone and climate.'
    },
    {
      icon: '📅',
      title: 'Seasonal Guidance',
      description: 'Optimal crops for Yala and Maha seasons.'
    },
    {
      icon: '🌱',
      title: 'Soil Matching',
      description: 'Crops suited to your soil type for best results.'
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

  const renderBenefitCard = ({ item }) => (
    <View style={styles.benefitCard}>
      <Text style={styles.benefitIcon}>{item.icon}</Text>
      <Text style={styles.benefitTitle}>{item.title}</Text>
      <Text style={styles.benefitDescription}>{item.description}</Text>
    </View>
  );

  const renderCropCard = ({ item, index }) => (
    <View style={styles.cropCard}>
      {index === 0 && (
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.topRecommendedBadge}
        >
          <MaterialCommunityIcons name="star" size={16} color="#fff" />
          <Text style={styles.badgeText}>Top Recommended</Text>
        </LinearGradient>
      )}

      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/200' }}
        style={styles.cropImage}
        resizeMode="cover"
      />

      <View style={styles.cropContent}>
        <Text style={styles.cropName}>{item.cropName}</Text>

        <View style={styles.careSection}>
          <Text style={styles.sectionLabel}>Care Instructions</Text>
          <Text style={styles.careText}>{item.careInstructions}</Text>
        </View>

        {item.fertilizers && item.fertilizers.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionLabel}>📦 Fertilizers</Text>
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
            <Text style={styles.sectionLabel}>⚠️ Common Diseases</Text>
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
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading crop data...</Text>
      </View>
    );
  }

  if (showResults) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.resultsHeader}
        >
          <View style={styles.resultsHeaderContent}>
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
          <Text style={styles.newSearchText}>New Search</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={styles.heroSection}
      >
        <Text style={styles.heroTitle}>Revolutionizing Agriculture</Text>
        <Text style={styles.heroSubtitle}>
          Get personalized crop recommendations based on your location, season, and soil type
        </Text>
      </LinearGradient>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionLabel}>Why Choose Smart Crop Advisory</Text>
        <Text style={styles.sectionTitle}>Our Benefits</Text>
        <FlatList
          data={benefits}
          renderItem={renderBenefitCard}
          keyExtractor={(item, idx) => idx.toString()}
          scrollEnabled={false}
          numColumns={2}
          columnWrapperStyle={styles.benefitsRow}
          contentContainerStyle={styles.benefitsList}
        />
      </View>

      {/* Form Section */}
      <View style={styles.formSection}>
        <Text style={styles.formTitle}>Get Your Recommendations</Text>
        <Text style={styles.formDescription}>
          Select your location, season, and soil type to receive personalized recommendations.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.pickerWrapper}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#4CAF50" style={styles.pickerIcon} />
            <Picker
              selectedValue={selectedLocation}
              onValueChange={setSelectedLocation}
              style={styles.picker}
            >
              <Picker.Item label="Select Location" value="" />
              {locations.map(location => (
                <Picker.Item
                  key={location._id}
                  label={location.name}
                  value={location.name}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Season *</Text>
          <View style={styles.pickerWrapper}>
            <MaterialCommunityIcons name="calendar" size={20} color="#4CAF50" style={styles.pickerIcon} />
            <Picker
              selectedValue={selectedSeason}
              onValueChange={setSelectedSeason}
              style={styles.picker}
            >
              <Picker.Item label="Select Season" value="" />
              {seasons.map(season => (
                <Picker.Item
                  key={season._id}
                  label={season.name}
                  value={season.name}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Soil Type (Optional)</Text>
          <View style={styles.pickerWrapper}>
            <MaterialCommunityIcons name="grain" size={20} color="#4CAF50" style={styles.pickerIcon} />
            <Picker
              selectedValue={selectedSoil}
              onValueChange={setSelectedSoil}
              style={styles.picker}
            >
              <Picker.Item label="Any" value="Any" />
              {soilTypes.map(soil => (
                <Picker.Item
                  key={soil._id}
                  label={soil.name}
                  value={soil.name}
                />
              ))}
            </Picker>
          </View>
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
              <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Get Recommendations</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },

  // Benefits Section
  benefitsSection: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  benefitsList: {
    paddingHorizontal: 4,
  },
  benefitsRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  benefitCard: {
    width: (width - 56) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  benefitIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  benefitDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Form Section
  formSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 28,
    marginHorizontal: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  pickerIcon: {
    marginLeft: 12,
  },
  picker: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Results
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    paddingTop: 32,
  },
  resultsHeaderContent: {
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  resultsCriteria: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 12,
    fontWeight: '500',
  },
  resultsCount: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
  },
  resultsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  cropList: {
    paddingHorizontal: 4,
  },
  cropCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  topRecommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  cropImage: {
    width: '100%',
    height: 180,
  },
  cropContent: {
    padding: 16,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  careSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  careText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  tagsSection: {
    marginBottom: 14,
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

  // No Results
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

  // New Search Button
  newSearchButton: {
    backgroundColor: '#2196F3',
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CropAdvisoryScreen;
