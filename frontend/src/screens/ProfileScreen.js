import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';
import { SRI_LANKA_MAP } from '../constants/locations';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { userRole, signOut } = React.useContext(AuthContext);
  const isGuest = userRole === 'Guest';
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    email: '',
    contactInfo: '',
    dob: '',
    province: '',
    district: '',
    location: ''
  });

  useEffect(() => {
    // Force hide header to prevent double header issue
    navigation.setOptions({ headerShown: false });
    if (!isGuest) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [navigation, isGuest]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/users/me');
      const userData = response.data.data.user;
      setUser(userData);
      setFormData({
        name: userData.name || '',
        nic: userData.nic || '',
        email: userData.email || '',
        contactInfo: userData.contactInfo || '',
        dob: userData.dob || '',
        province: userData.province || '',
        district: userData.district || '',
        location: userData.location || ''
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) return Alert.alert('Invalid Input', 'Name cannot be empty');

    try {
      const response = await apiClient.put('/users/updateMe', formData);
      setUser(response.data.data.user);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully 🪴');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile information');
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#1F9A4E" />
    </View>
  );

  const DetailRow = ({ icon, label, value, field, editable = true, keyboard = 'default' }) => (
    <View style={styles.detailRow}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="#666" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        {isEditing && editable ? (
          <TextInput
            style={styles.detailInput}
            value={formData[field]}
            onChangeText={(text) => setFormData({ ...formData, [field]: text })}
            placeholder={label}
            keyboardType={keyboard}
          />
        ) : (
          <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
        )}
      </View>
      {editable && !isEditing && <Ionicons name="pencil" size={16} color="#161616ff" />}
    </View>
  );

  const SearchablePicker = ({ label, icon, value, options, onSelect, placeholder }) => {
    const [modalVisible, setModalVisible] = useState(false);
    
    return (
      <View style={styles.detailRow}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#666" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.detailLabel}>{label}</Text>
          {isEditing ? (
            <TouchableOpacity 
              style={styles.pickerButton} 
              onPress={() => setModalVisible(true)}
            >
              <Text style={[styles.detailInput, !value && {color: '#999'}]}>
                {value || placeholder}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#2E7D32" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
          )}
        </View>

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
                    {value === item && <Ionicons name="checkmark" size={20} color="#2E7D32" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

        {/* Header Curve */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#25B059', '#158C43']}
            style={styles.headerCurve}
          >
            <View style={styles.topNavRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.appTitle}>Govi Connect</Text>
              <Text style={styles.pageSubtitle}>MY PROFILE &rarr;</Text>
            </View>
          </LinearGradient>

          {/* Avatar and Info Card Overlapping */}
          <View style={styles.profileTopSection}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatar, { backgroundColor: '#bdf0d0ff', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person-outline" size={60} color="#1B4332" />
              </View>
              {/* <View style={styles.levelBadge}>
                <Ionicons name="star" size={30} color="#ffffffff" />
                <Text style={styles.levelText}>0</Text>
              </View> */}
            </View>

            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userPhone}>{user?.contactInfo || 'Not Provided'}</Text>
          </View>
        </View>

        {/* Details Card */}
        {isGuest ? (
          <View style={styles.guestCard}>
            <View style={styles.guestIconContainer}>
              <Ionicons name="lock-closed-outline" size={50} color="#2E7D32" />
            </View>
            <Text style={styles.guestTitle}>Join Govi Connect</Text>
            <Text style={styles.guestSubtitle}>
              Log in to your account to view your farming profile, track your activities, and get personalized recommendations.
            </Text>
            
            <TouchableOpacity 
              style={styles.guestLoginButton}
              onPress={() => signOut()}
            >
              <LinearGradient
                colors={['#25B059', '#158C43']}
                style={styles.gradientButton}
              >
                <Text style={styles.guestLoginText}>Login / Register Now</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.guestFooter}>
              Unlock the full potential of digital farming! 🪴
            </Text>
          </View>
        ) : (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Your Personal Details</Text>

          <DetailRow icon="person-outline" label="Full Name" value={user?.name} field="name" />
          <DetailRow icon="card-outline" label="NIC Number" value={user?.nic} field="nic" />
          <DetailRow icon="mail-outline" label="Email Address" value={formData.email} field="email" />
          <DetailRow icon="call-outline" label="Contact Number" value={user?.contactInfo} field="contactInfo" keyboard="phone-pad" />
          <DetailRow icon="calendar-outline" label="Date of Birth" value={user?.dob} field="dob" />
          
          <SearchablePicker 
            icon="location-outline"
            label="Province" 
            value={formData.province} 
            options={Object.keys(SRI_LANKA_MAP)} 
            onSelect={(v) => {
              setFormData({...formData, province: v, district: ''});
            }} 
            placeholder="Select Province" 
          />
          
          <SearchablePicker 
            icon="map-outline"
            label="Farming District" 
            value={formData.district} 
            options={formData.province ? SRI_LANKA_MAP[formData.province] : []} 
            onSelect={(v) => setFormData({...formData, district: v})} 
            placeholder="Select District" 
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: isEditing ? '#F5A623' : '#1F9A4E' }]}
            onPress={isEditing ? handleUpdate : () => setIsEditing(true)}
          >
            <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Edit Profile'}</Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity style={styles.cancelLink} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelLinkText}>Discard Changes</Text>
            </TouchableOpacity>
          )}
        </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1 },

  headerContainer: {
    height: 420,
    backgroundColor: '#ffffffff',
    position: 'relative',
    alignItems: 'center'
  },
  headerCurve: {
    width: '140%',
    height: 380,
    borderBottomLeftRadius: width * 1.5,
    borderBottomRightRadius: width * 1.5,
    position: 'absolute',
    top: 0,
    paddingTop: 60,
    alignItems: 'center',
    left: '-20%'
  },
  topNavRow: {
    width: '100%',
    paddingHorizontal: '15%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 0,
  },
  backButton: {
    padding: 10,
    zIndex: 10
  },
  headerContent: {
    alignItems: 'center'
  },
  appTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  pageSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 5,
    textTransform: 'uppercase',
    letterSpacing: 2
  },

  profileTopSection: {
    marginTop: 175,
    alignItems: 'center',
    width: '100%',
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative'
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  levelBadge: {
    position: 'absolute',
    right: -10,
    top: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  levelText: {
    position: 'absolute',
    color: '#F5A623',
    fontWeight: 'bold',
    fontSize: 12,
    top: 20
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginTop: 15
  },
  userPhone: {
    fontSize: 18,
    color: '#ffffffff',
    marginTop: 2
  },

  detailsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
    marginTop: -20
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fbf9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  textContainer: {
    flex: 1
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#016c2eff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600'
  },
  detailInput: {
    fontSize: 16,
    color: '#1F9A4E',
    fontWeight: '600',
    padding: 0
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  cancelLink: {
    marginTop: 15,
    alignItems: 'center'
  },
  cancelLinkText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600'
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '80%',
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  optionText: {
    fontSize: 16,
    color: '#333'
  },
  guestCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginTop: -20,
    alignItems: 'center'
  },
  guestIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10
  },
  guestLoginButton: {
    width: '100%',
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  guestLoginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  guestFooter: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 10
  }
});

export default ProfileScreen;
