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
  Dimensions,
  ActivityIndicator,
  Alert
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
        
        {/* Simple Header */}
        <View style={styles.topHeader}>
           <TouchableOpacity onPress={() => navigation.openDrawer()}>
             <Ionicons name="menu" size={30} color="#fff" />
           </TouchableOpacity>
           <Text style={styles.topHeaderTitle}>EXPERT PORTAL</Text>
        </View>

        <View style={styles.bannerContainer}>
            <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.welcomeBanner}>
                <Text style={styles.welcomeSubtitle}>BLOG MANAGEMENT</Text>
                <Text style={styles.welcomeTitle}>Hello, {user?.name || 'Expert'}!</Text>
                <Text style={styles.welcomeInfo}>
                   You are in the Write Blogs section. For answering farmer questions, please visit the Community Forum section.
                </Text>
                <Ionicons name="create" size={100} color="rgba(255,255,255,0.07)" style={styles.leafBg} />
            </LinearGradient>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>📝 Create New Blog</Text>
          <Text style={styles.sectionSubtitle}>Share your expertise with the farming community</Text>
          
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Article Title <Text style={{color:'red'}}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="E.g., Tips for high-yield organic farming"
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
              <SearchablePicker label="Crop" value={formData.cropType} options={DROPDOWNS.crops} onSelect={(v) => updateField('cropType', v)} />
              <View style={{ width: 15 }} />
              <SearchablePicker label="Method" value={formData.farmingMethod} options={DROPDOWNS.methods} onSelect={(v) => updateField('farmingMethod', v)} />
            </View>

            <TouchableOpacity style={styles.imageUploadBox}>
              <Ionicons name="cloud-upload-outline" size={32} color="#2E7D32" />
              <Text style={styles.uploadText}>Upload Cover Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.publishBtn}>
              <Text style={styles.publishBtnText}>Publish Blog Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8faf9' },
  scrollContent: { flexGrow: 1 },
  topHeader: {
    height: Platform.OS === 'android' ? 90 : 60,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 0
  },
  topHeaderTitle: { color: '#F5A623', fontWeight: 'bold', fontSize: 14, marginLeft: 15, letterSpacing: 1 },
  bannerContainer: { padding: 16, backgroundColor: '#2E7D32', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 25 },
  welcomeBanner: { borderRadius: 20, padding: 24, overflow: 'hidden' },
  welcomeSubtitle: { color: '#F5A623', fontWeight: 'bold', fontSize: 11, marginBottom: 4 },
  welcomeTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
  welcomeInfo: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 18, width: '90%' },
  leafBg: { position: 'absolute', bottom: -10, right: -10 },
  contentSection: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#666', marginBottom: 20 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  textInput: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 14 },
  row: { flexDirection: 'row', marginBottom: 16 },
  pickerButton: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { fontSize: 13, color: '#333' },
  imageUploadBox: { backgroundColor: '#F1F8E9', borderWidth: 1.5, borderColor: '#2E7D32', borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', marginVertical: 10 },
  uploadText: { color: '#2E7D32', fontWeight: 'bold', marginTop: 8 },
  publishBtn: { backgroundColor: '#2E7D32', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  publishBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  optionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 15, color: '#333' },
});

export default ExpertDashboardScreen;
