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

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

// -- Forum specific question Card for Expert
const ExpertQuestionCard = ({ question, user, onPostAnswer, onEdit, onDelete }) => {
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);

  // Use answers filtering to show only 'Expert' responses
  const expertAnswers = question.answers?.filter(a => a.authorRole === 'Expert') || [];

  const handlePost = async () => {
    setPosting(true);
    const success = await onPostAnswer(question._id, answerText);
    if (success) {
      setAnswerText(''); // Clear on success
    }
    setPosting(false);
  };

  return (
    <View style={styles.forumCard}>
      <View style={styles.qHeader}>
        <View style={styles.qAvatar}>
          <Text style={styles.qAvatarText}>Q</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.qMeta}>Asked by {question.authorName} on {formatDate(question.createdAt)}</Text>
          <Text style={styles.qText}>{question.text}</Text>
        </View>
      </View>

      {expertAnswers.length > 0 && (
        <View style={styles.existingAnswersContainer}>
          <Text style={styles.existingAnsTitle}>EXISTING EXPERT ANSWERS</Text>
          {expertAnswers.map(ans => {
            const isMe = ans.author === user?._id;
            return (
              <View key={ans._id} style={styles.existAnsBox}>
                <View style={styles.existAnsHeader}>
                  <View style={styles.existAvatar}>
                    <Text style={styles.existAvatarText}>E</Text>
                  </View>
                  <Text style={styles.existAnsAuthor}>{ans.authorName}</Text>
                  
                  {isMe && (
                    <View style={styles.existAnsActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(question._id, ans._id, ans.text)}>
                        <Ionicons name="pencil" size={12} color="#1565C0" />
                        <Text style={[styles.actionBtnText, {color: '#1565C0'}]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(question._id, ans._id)}>
                        <Ionicons name="trash" size={12} color="#D32F2F" />
                        <Text style={[styles.actionBtnText, {color: '#D32F2F'}]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <Text style={styles.existAnsText}>{ans.text}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.postAnswerContainer}>
        <Text style={styles.postAnswerLabel}>Post your official answer</Text>
        <TextInput
          style={styles.postAnswerInput}
          multiline
          placeholder="Type your expert advice here..."
          placeholderTextColor="#999"
          value={answerText}
          onChangeText={setAnswerText}
        />
        <View style={{ alignItems: 'flex-end' }}>
          <TouchableOpacity 
            style={[styles.postAnsBtn, posting && {opacity: 0.7}]} 
            onPress={handlePost} 
            disabled={posting}
          >
            {posting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postAnsBtnText}>Post Answer</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const ExpertDashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('forum'); // 'blog' or 'forum'
  
  const [formData, setFormData] = useState({
    title: '',
    location: 'All Island',
    season: 'Any Season',
    cropType: 'Any Crop',
    farmingMethod: 'Any Method'
  });

  const [questions, setQuestions] = useState([]);
  const [loadingForum, setLoadingForum] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState(null);
  const [editAnswerId, setEditAnswerId] = useState(null);
  const [editAnswerText, setEditAnswerText] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'forum') {
      fetchQuestions();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data.data.user);
    } catch (error) {
      console.log('Failed to fetch expert details');
    }
  };

  const fetchQuestions = async () => {
    setLoadingForum(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get('/forum');
      setQuestions(res.data?.data?.questions || []);
    } catch (err) {
      console.log('Error fetching forum questions', err);
    } finally {
      setLoadingForum(false);
    }
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handlePostAnswer = async (questionId, text) => {
    setErrorMsg('');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length < 10) {
      setErrorMsg('Failed to post answer: Your official answer is too short. Please provide at least 10 words.');
      return false; // Return false so the input isn't cleared locally
    }

    try {
      const res = await apiClient.post(`/forum/${questionId}/answers`, { text: text.trim() });
      setQuestions(prev => prev.map(q => q._id === questionId ? res.data.data.question : q));
      return true;
    } catch (err) {
      setErrorMsg('Failed to post answer: ' + (err.response?.data?.message || 'Server error'));
      return false;
    }
  };

  const openEditModal = (qId, aId, defaultText) => {
    setEditQuestionId(qId);
    setEditAnswerId(aId);
    setEditAnswerText(defaultText);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    setErrorMsg('');
    const words = editAnswerText.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length < 10) {
      Alert.alert('Too Short', 'Failed to edit answer: Your official answer is too short. Please provide at least 10 words.');
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await apiClient.patch(`/forum/${editQuestionId}/answers/${editAnswerId}`, { text: editAnswerText.trim() });
      setQuestions(prev => prev.map(q => q._id === editQuestionId ? res.data.data.question : q));
      setEditModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not edit answer. Window might have expired.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteAnswer = (qId, aId) => {
    Alert.alert('Delete Answer', 'Are you sure you want to delete this official answer?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiClient.delete(`/forum/${qId}/answers/${aId}`);
            setQuestions(prev => prev.map(q => q._id === qId ? res.data.data.question : q));
          } catch(err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not delete answer. Window might have expired.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
      >
        
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

        {/* --- ERROR BANNER (Replicates screenshot) --- */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <Ionicons name="close" size={20} color="#D32F2F" style={{marginRight: 6}} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
            <TouchableOpacity onPress={() => setErrorMsg('')}>
              <Ionicons name="close-outline" size={20} color="#D32F2F" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* --- TABS --- */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'blog' && styles.tabButtonActive]}
            onPress={() => setActiveTab('blog')}
          >
            <Ionicons name="document-text-outline" size={18} color={activeTab === 'blog' ? '#fff' : '#1F9A4E'} />
            <Text style={[styles.tabText, activeTab === 'blog' && styles.tabTextActive]}>Blog Content</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'forum' && styles.tabButtonActive, {marginLeft: 10}]}
            onPress={() => setActiveTab('forum')}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={activeTab === 'forum' ? '#fff' : '#1F9A4E'} />
            <Text style={[styles.tabText, activeTab === 'forum' && styles.tabTextActive]}>Forum Dashboard</Text>
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        {activeTab === 'blog' ? (
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
        ) : (
          <View style={styles.forumSection}>
            <View style={styles.forumSectionHeader}>
              <Text style={styles.forumTitle}>Expert Forum Dashboard</Text>
              <Text style={styles.forumSubtitle}>Provide official answers to farmer inquiries.</Text>
            </View>

            {loadingForum ? (
              <ActivityIndicator size="large" color="#1F9A4E" style={{ marginTop: 30 }} />
            ) : questions.length === 0 ? (
               <Text style={{ textAlign: 'center', marginTop: 30, color: '#666' }}>No questions available right now.</Text>
            ) : (
              questions.map(q => (
                 <ExpertQuestionCard 
                    key={q._id} 
                    question={q} 
                    user={user} 
                    onPostAnswer={handlePostAnswer}
                    onEdit={openEditModal}
                    onDelete={handleDeleteAnswer} 
                 />
              ))
            )}
          </View>
        )}
        
        <View style={{height: 40}} />
      </ScrollView>

      {/* --- EDIT ANSWER MODAL --- */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 25 }]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Edit Official Answer</Text>
            <TextInput
              style={[styles.textInput, { height: 120, textAlignVertical: 'top' }]}
              multiline
              value={editAnswerText}
              onChangeText={setEditAnswerText}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
              <TouchableOpacity 
                style={{ paddingVertical: 10, paddingHorizontal: 20, marginRight: 10 }}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: '#666', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, { marginTop: 0, paddingHorizontal: 25, borderRadius: 8 }]}
                onPress={handleSaveEdit}
                disabled={submittingEdit}
              >
                {submittingEdit ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f7f4' },
  scrollContent: { 
    flexGrow: 1, 
    minHeight: '100%',
    paddingBottom: 40 
  },
  
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

  // Error Banner
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '500',
    flex: 1
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#e6f3eb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cce6d6'
  },
  tabButtonActive: {
    backgroundColor: '#1F9A4E',
    borderColor: '#1F9A4E',
    elevation: 3,
    shadowColor: '#1F9A4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabText: {
    marginLeft: 6,
    color: '#1F9A4E',
    fontWeight: 'bold',
    fontSize: 14
  },
  tabTextActive: {
    color: '#fff'
  },

  formCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
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
  optionText: { fontSize: 15, color: '#333' },

  // Forum Styles
  forumSection: {
    marginHorizontal: 15,
  },
  forumSectionHeader: {
    marginBottom: 15,
    paddingHorizontal: 5
  },
  forumTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4
  },
  forumSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  forumCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15
  },
  qAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2
  },
  qAvatarText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 16
  },
  qMeta: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
    fontWeight: '600'
  },
  qText: {
    fontSize: 15,
    color: '#111',
    lineHeight: 22
  },
  
  existingAnswersContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  existingAnsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7f8c8d',
    letterSpacing: 1,
    marginBottom: 10
  },
  existAnsBox: {
    backgroundColor: '#FFFDE7', // slight yellow tint matching screenshot
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFF59D'
  },
  existAnsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  existAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FBC02D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  existAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  existAnsAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    flex: 1
  },
  existAnsActions: {
    flexDirection: 'row',
    gap: 12
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4
  },
  existAnsText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginLeft: 32
  },

  postAnswerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15
  },
  postAnswerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10
  },
  postAnswerInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    marginBottom: 10
  },
  postAnsBtn: {
    backgroundColor: '#1F4529',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6
  },
  postAnsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13
  }
});

export default ExpertDashboardScreen;
