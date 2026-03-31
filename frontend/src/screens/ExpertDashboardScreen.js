import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

const DROPDOWNS = {
  locations: ['All Island', 'Western', 'Central', 'Southern', 'Northern', 'Eastern'],
  seasons: ['Any Season', 'Maha Season', 'Yala Season'],
  crops: ['Any Crop', 'Paddy', 'Vegetables', 'Fruits', 'Export Crops'],
  methods: ['Any Method', 'Organic', 'Conventional', 'Hydroponics']
};

const SearchablePicker = ({ label, value, options, onSelect, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    <View style={[styles.inputGroup, { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.pickerButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerText, !value && {color: '#999'}]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#333" />
      </TouchableOpacity>

      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                  {value === item && <Ionicons name="checkmark" size={20} color="#1F9A4E" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ExpertDashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    location: 'All Island',
    season: 'Any Season',
    cropType: 'Any Crop',
    farmingMethod: 'Any Method'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data.data.user);
    } catch (error) {
      console.log('Failed to fetch expert details');
    }
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Banner */}
        <View style={styles.headerContainer}>
           {/* Top Navigation Row (Hamburger) */}
           <View style={styles.topNavRow}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
              <Ionicons name="menu" size={32} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.topNavTitle}>EXPERT PORTAL</Text>
          </View>

          <LinearGradient
            colors={['#1F9A4E', '#167B3B']}
            style={styles.bannerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.welcomeSubtitle}>WELCOME BACK</Text>
            <Text style={styles.welcomeTitle}>Hello, {user?.name || 'Expert'}!</Text>
            <Text style={styles.welcomeText}>
              Share your agricultural expertise with Sri Lankan farmers through insightful blog posts and direct forum discussions.
            </Text>
            
            {/* Decorative Icon */}
            <Ionicons name="leaf" size={100} color="rgba(255,255,255,0.06)" style={styles.bgIcon} />
          </LinearGradient>
        </View>

        {/* Content Section */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <Text style={styles.formTitle}>📝 Create New Blog</Text>
            <Text style={styles.formSubtitle}>Craft an insightful article to share with the GOVI CONNECT farming community</Text>
          </View>

          {/* Form Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Article Title <Text style={{color:'red'}}>*</Text></Text>
            <TextInput
              style={styles.textInput}
              placeholder="E.g., Effective Paddy Cultivation Techniques for the upcoming Maha Season"
              value={formData.title}
              onChangeText={(t) => updateField('title', t)}
            />
          </View>

          <View style={styles.row}>
            <SearchablePicker label="Location" value={formData.location} options={DROPDOWNS.locations} onSelect={(v) => updateField('location', v)} />
            <View style={{ width: 15 }} />
            <SearchablePicker label="Season" value={formData.season} options={DROPDOWNS.seasons} onSelect={(v) => updateField('season', v)} />
          </View>

          <View style={styles.row}>
            <SearchablePicker label="Crop Type" value={formData.cropType} options={DROPDOWNS.crops} onSelect={(v) => updateField('cropType', v)} />
            <View style={{ width: 15 }} />
            <SearchablePicker label="Farming Method" value={formData.farmingMethod} options={DROPDOWNS.methods} onSelect={(v) => updateField('farmingMethod', v)} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cover Image Upload</Text>
            <TouchableOpacity style={styles.imageUploadBox}>
              <Ionicons name="cloud-upload-outline" size={36} color="#1F9A4E" />
              <Text style={styles.uploadText}>Click to browse or drag and drop</Text>
              <Text style={styles.uploadSubText}>PNG, JPG up to 5MB</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Publish Blog</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{marginLeft: 8}}/>
          </TouchableOpacity>

        </View>
        
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f7f4' },
  scrollContent: { },
  
  headerContainer: {
    backgroundColor: '#1F9A4E',
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    marginBottom: 10
  },
  menuButton: {
    marginRight: 15,
  },
  topNavTitle: {
    color: '#F5A623', // Yellow brand accent
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  
  bannerCard: {
    marginHorizontal: 15,
    padding: 25,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 10
  },
  welcomeSubtitle: {
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    lineHeight: 34
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 22,
    width: '90%'
  },
  bgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    transform: [{ rotate: '-15deg' }]
  },

  formCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: -15, // Overlaps the green header slightly
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  formHeaderRow: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 5
  },
  formSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fbfcfb'
  },
  
  pickerButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#fbfcfb', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    paddingHorizontal: 15, 
    paddingVertical: 14 
  },
  pickerText: { fontSize: 13, color: '#333' },

  imageUploadBox: {
    borderWidth: 2,
    borderColor: '#c3e0cf',
    borderStyle: 'dashed',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f4faf6'
  },
  uploadText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F9A4E'
  },
  uploadSubText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666'
  },

  submitBtn: {
    backgroundColor: '#1F9A4E',
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F9A4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  optionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 15, color: '#333' }
});

export default ExpertDashboardScreen;
