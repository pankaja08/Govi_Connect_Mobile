import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

const DROPDOWNS = {
  locations: ['All Island', 'Western', 'Central', 'Southern', 'Northern', 'Eastern'],
  seasons: ['Any Season', 'Maha Season', 'Yala Season', 'Rainy Season'],
  crops: ['Any Crop', 'Paddy', 'Vegetables', 'Fruits', 'Export Crops', 'Plantation Crop'],
  methods: ['Any Method', 'Organic', 'Conventional', 'Hydroponics', 'Integrated/Avenue Planting']
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
        <Text style={[styles.pickerText, !value && { color: '#999' }]}>
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

const ExpertDashboardScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const editData = route?.params?.editData;
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    location: 'All Island',
    season: 'Any Season',
    cropType: 'Any Crop',
    farmingMethod: 'Any Method',
  });

  const [coverImage, setCoverImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const richText = React.useRef();

  // Validations
  const isTitleValid = formData.title.trim().length >= 5;
  const isContentValid = contentLength >= 200;
  const validDropdowns =
    formData.location !== '' &&
    formData.season !== 'Any Season' &&
    formData.cropType !== 'Any Crop' &&
    formData.farmingMethod !== 'Any Method';

  const isFormValid = isTitleValid && isContentValid && validDropdowns && coverImage !== null;

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || '',
        content: editData.content || '',
        location: editData.location || 'All Island',
        season: editData.season || 'Any Season',
        cropType: editData.cropType || 'Any Crop',
        farmingMethod: editData.farmingMethod || 'Any Method'
      });
      setCoverImage(editData.imageUrl);

      // Calculate length assuming stripped HTML
      const stripped = (editData.content || '').replace(/<[^>]+>/g, '');
      setContentLength(stripped.length);

      // Delay to ensure the richText ref is ready to accept content
      setTimeout(() => {
        richText.current?.setContentHTML(editData.content || '');
      }, 500);
    } else {
      // Clear form when returning to empty state
      setFormData({
        title: '', content: '', location: 'All Island', season: 'Any Season', cropType: 'Any Crop', farmingMethod: 'Any Method'
      });
      setCoverImage(null);
      setContentLength(0);
      setTimeout(() => {
        richText.current?.setContentHTML('');
      }, 500);
    }
  }, [editData]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data.data.user);
    } catch (error) {
      console.log('Failed to fetch expert details');
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri) => {
    try {
      const CLOUD_NAME = "dkwyk8nih";
      const UPLOAD_PRESET = "govi_connect_blog";

      const apiUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

      const data = new FormData();
      data.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });
      data.append('upload_preset', UPLOAD_PRESET);
      data.append('folder', 'blogs');

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const responseJson = await response.json();
      if (responseJson.secure_url) {
        return responseJson.secure_url;
      } else {
        console.error("Cloudinary Error Response:", responseJson);
        throw new Error(responseJson.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Cloudinary Upload Error: ", error);
      throw new Error("Failed to upload image to Cloudinary.");
    }
  };

  const handlePublish = async () => {
    if (!isFormValid) return;
    setSubmitting(true);

    try {
      let uploadedUrl = coverImage;
      // Only upload to Cloudinary if it's a local file URI (string NOT starting with 'http')
      if (coverImage && !coverImage.startsWith('http')) {
        uploadedUrl = await uploadImageAsync(coverImage);
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        location: formData.location,
        season: formData.season,
        cropType: formData.cropType,
        farmingMethod: formData.farmingMethod,
        imageUrl: uploadedUrl
      };

      if (editData) {
        // Update existing blog
        await apiClient.put(`/blogs/${editData._id}`, payload);
        Alert.alert('Updated', 'Blog updated successfully!');

        // Reset params and go back to View Past Blogs
        navigation.setParams({ editData: null });
        navigation.navigate('MyBlogs');
      } else {
        // Create new blog
        await apiClient.post('/blogs', payload);
        Alert.alert('Published', 'Blog published successfully!');

        setFormData({
          title: '', content: '', location: 'All Island', season: 'Any Season', cropType: 'Any Crop', farmingMethod: 'Any Method'
        });
        setCoverImage(null);
        richText.current?.setContentHTML('');
        setContentLength(0);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Error publishing blog. Please check your connection.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : null}>
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
              <Text style={styles.welcomeName}>Hello, {user?.name || 'Expert'}!</Text>
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
              <Text style={styles.formTitle}>
                {editData ? '✏️ Edit Blog' : '📝 Create New Blog'}
              </Text>
              <Text style={styles.formSubtitle}>
                {editData ? 'Update your insightful article' : 'Craft an insightful article to share with the GOVI CONNECT farming community'}
              </Text>
            </View>

            {/* Form Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Article Title <Text style={{ color: isTitleValid ? '#1F9A4E' : 'red' }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, !isTitleValid && formData.title.length > 0 && { borderColor: 'red' }]}
                placeholder="E.g., Effective Paddy Cultivation Techniques for the upcoming Maha Season"
                value={formData.title}
                onChangeText={(t) => updateField('title', t)}
              />
              {!isTitleValid && formData.title.length > 0 && (
                <Text style={styles.errorText}>Title must be at least 5 characters.</Text>
              )}
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

            {/* Blog Content Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Blog Content <Text style={{ color: isContentValid ? '#1F9A4E' : 'red' }}>*</Text>
              </Text>
              <View style={[styles.richTextContainer, !isContentValid && contentLength > 0 && { borderColor: 'red' }]}>
                <RichToolbar
                  editor={richText}
                  actions={[
                    actions.setBold, actions.setItalic, actions.insertBulletsList, actions.insertOrderedList, actions.insertLink
                  ]}
                  iconTint="#333"
                  selectedIconTint="#1F9A4E"
                  style={styles.richToolbar}
                />
                <RichEditor
                  ref={richText}
                  style={styles.richEditor}
                  initialHeight={200}
                  placeholder="Write your insightful blog content here..."
                  onChange={(text) => {
                    updateField('content', text);
                    const stripped = text.replace(/<[^>]+>/g, '');
                    setContentLength(stripped.length);
                  }}
                />
              </View>
              <Text style={[styles.charCount, !isContentValid && contentLength > 0 && { color: 'red' }]}>
                {contentLength} / 200 min characters
              </Text>
            </View>

            {/* Cover Image Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Cover Image Upload <Text style={{ color: coverImage ? '#1F9A4E' : 'red' }}>*</Text>
              </Text>
              {!coverImage ? (
                <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage}>
                  <Ionicons name="cloud-upload-outline" size={36} color="#1F9A4E" />
                  <Text style={styles.uploadText}>Click to browse or drag and drop</Text>
                  <Text style={styles.uploadSubText}>PNG, JPG up to 5MB</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: coverImage }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.clearImageBtn} onPress={() => setCoverImage(null)}>
                    <Ionicons name="close-circle" size={24} color="rgba(255,0,0,0.8)" />
                    <Text style={styles.clearImageText}>Clear Image</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
              disabled={!isFormValid || submitting}
              onPress={handlePublish}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {editData ? 'Save Changes' : 'Publish Blog'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f7f4' },
  scrollContent: { flexGrow: 1 },

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
    color: '#F5A623',
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
  welcomeName: {
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
    marginTop: -15,
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  optionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 15, color: '#333' },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5
  },
  richTextContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fbfcfb'
  },
  richToolbar: {
    backgroundColor: '#fbfcfb',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  richEditor: {
    minHeight: 200,
    padding: 10,
    backgroundColor: '#fbfcfb'
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right'
  },
  imageUploadBox: {
    backgroundColor: '#F1F8E9',
    borderWidth: 1.5,
    borderColor: '#1F9A4E',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 10
  },
  uploadText: { color: '#1F9A4E', fontWeight: 'bold', marginTop: 8 },
  uploadSubText: { color: '#888', fontSize: 12, marginTop: 4 },
  imagePreviewContainer: {
    alignItems: 'center',
    position: 'relative',
    borderRadius: 15,
    overflow: 'hidden'
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  clearImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  clearImageText: {
    color: 'red',
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 12
  },
  submitBtn: {
    backgroundColor: '#1F9A4E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#1F9A4E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitBtnDisabled: {
    backgroundColor: '#a5d6b8',
    elevation: 0,
    shadowOpacity: 0
  },
});

export default ExpertDashboardScreen;
