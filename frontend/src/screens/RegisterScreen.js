import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../api/client';

const SRI_LANKA_MAP = {
  'Western': ['Colombo', 'Gampaha', 'Kalutara'],
  'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'Southern': ['Galle', 'Matara', 'Hambantota'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'Sabaragamuwa': ['Ratnapura', 'Kegalle'],
  'Eastern': ['Trincomalee', 'Batticaloa', 'Ampara'],
  'Uva': ['Badulla', 'Moneragala'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu']
};

const FormInput = ({ label, icon, value, onChangeText, placeholder, secure = false, keyboard = 'default', error }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label} <Text style={{color: 'red'}}>*</Text></Text>
    <View style={[styles.inputWrapper, error && styles.inputErrorBorder]}>
      <Ionicons name={icon} size={20} color={error ? "#D32F2F" : "#2E7D32"} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize="none"
      />
    </View>
    {error ? <Text style={styles.errorHint}>{error}</Text> : null}
  </View>
);

const SearchablePicker = ({ label, value, options, onSelect, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    <View style={[styles.inputGroup, { flex: 1 }]}>
      <Text style={styles.label}>{label} <Text style={{color: 'red'}}>*</Text></Text>
      <TouchableOpacity 
        style={styles.pickerButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerText, !value && {color: '#999'}]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#2E7D32" />
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

const RegisterScreen = ({ navigation }) => {
  const [isExpert, setIsExpert] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    email: '',
    contactInfo: '',
    dob: '',
    address: '',
    province: '',
    district: '',
    username: '',
    password: '',
    confirmPassword: '',
    expertRegNo: '',
    areaOfExpertise: '',
    jobPosition: '',
    assignedArea: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const validate = () => {
    let newErrors = {};

    // Required fields check
    const requiredFields = ['name', 'nic', 'email', 'contactInfo', 'dob', 'address', 'province', 'district', 'username', 'password', 'confirmPassword'];
    if (isExpert) {
      requiredFields.push('expertRegNo', 'areaOfExpertise', 'jobPosition', 'assignedArea');
    }

    requiredFields.forEach(field => {
      if (!formData[field]) newErrors[field] = 'Field is required';
    });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // NIC validation (12 digits OR 9 digits + V/X)
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (formData.nic && !nicRegex.test(formData.nic)) {
      newErrors.nic = 'Invalid NIC format (e.g. 123456789V or 12 digits)';
    }

    // Contact number validation (Sri Lanka format: starts with 0, 10 digits)
    const phoneRegex = /^0\d{9}$/;
    if (formData.contactInfo && !phoneRegex.test(formData.contactInfo)) {
      newErrors.contactInfo = 'Must start with 0 and have exactly 10 digits';
    }

    // DOB validation (Age > 15)
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (isNaN(dobDate.getTime())) {
        newErrors.dob = 'Invalid date';
      } else if (age < 16) {
        newErrors.dob = 'Must be at least 16 years old';
      }
    }

    // Password Match and Length
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      updateField('dob', `${year}-${month}-${day}`);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'province') newData.district = ''; // Reset district when province changes
      return newData;
    });
  };

  const handleRegister = async () => {
    if (!validate()) {
      if (Platform.OS !== 'web') Alert.alert('Invalid Input', 'Please correct the errors before proceeding.');
      return;
    }

    try {
      setLoading(true);
      const payload = { ...formData, role: isExpert ? 'Expert' : 'User' };
      await apiClient.post('/auth/register', payload);
      setLoading(false);

      if (Platform.OS === 'web') {
        window.alert('Registration successful!');
        navigation.navigate('Login');
      } else {
        Alert.alert('Success 🪴', 'Registration successful!', [
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Registration failed';
      Alert.alert('Error', msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>

          <View style={styles.header}>
            <Ionicons name="leaf" size={60} color="#2E7D32" />
            <Text style={styles.title}>Govi Connect</Text>
            <Text style={styles.subtitle}>Unified Smart Agriculture Platform</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <FormInput label="Full Name" icon="person-outline" value={formData.name} onChangeText={(t) => updateField('name', t)} placeholder="Enter your full name" error={errors.name} />
            <FormInput label="NIC Number" icon="card-outline" value={formData.nic} onChangeText={(t) => updateField('nic', t)} placeholder="123456789V or 12 digits" error={errors.nic} />
            <FormInput label="Email Address" icon="mail-outline" value={formData.email} onChangeText={(t) => updateField('email', t)} placeholder="email@example.com" keyboard="email-address" error={errors.email} />
            <FormInput label="Contact Number" icon="call-outline" value={formData.contactInfo} onChangeText={(t) => updateField('contactInfo', t)} placeholder="07XXXXXXXX" keyboard="phone-pad" error={errors.contactInfo} />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth <Text style={{color: 'red'}}>*</Text></Text>
              <TouchableOpacity 
                style={[styles.inputWrapper, errors.dob && styles.inputErrorBorder]} 
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={errors.dob ? "#D32F2F" : "#2E7D32"} style={styles.inputIcon} />
                <Text style={[styles.input, !formData.dob && {color: '#999'}]}>
                  {formData.dob || "YYYY-MM-DD"}
                </Text>
              </TouchableOpacity>
              {errors.dob ? <Text style={styles.errorHint}>{errors.dob}</Text> : null}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.dob ? new Date(formData.dob) : new Date(new Date().setFullYear(new Date().getFullYear() - 16))}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <FormInput label="Permanent Address" icon="home-outline" value={formData.address} onChangeText={(t) => updateField('address', t)} placeholder="Residential address" error={errors.address} />

            <View style={styles.row}>
              <SearchablePicker 
                label="Province" 
                value={formData.province} 
                options={Object.keys(SRI_LANKA_MAP)} 
                onSelect={(v) => updateField('province', v)} 
                placeholder="Province" 
              />
              <View style={{ width: 10 }} />
              <SearchablePicker 
                label="District" 
                value={formData.district} 
                options={formData.province ? SRI_LANKA_MAP[formData.province] : []} 
                onSelect={(v) => updateField('district', v)} 
                placeholder="District" 
              />
            </View>
            {(errors.province || errors.district) && <Text style={styles.errorHint}>Location is required</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Credentials</Text>
            <FormInput label="Username" icon="at-outline" value={formData.username} onChangeText={(t) => updateField('username', t)} placeholder="Choose a username" error={errors.username} />
            <FormInput label="Password" icon="lock-closed-outline" value={formData.password} onChangeText={(t) => updateField('password', t)} placeholder="Min. 6 characters" secure={true} error={errors.password} />
            <FormInput label="Confirm Password" icon="shield-checkmark-outline" value={formData.confirmPassword} onChangeText={(t) => updateField('confirmPassword', t)} placeholder="Repeat password" secure={true} error={errors.confirmPassword} />
          </View>

          <View style={styles.expertToggleRow}>
            <View style={styles.expertToggleText}>
              <Text style={styles.expertTitle}>Register as Agricultural Expert?</Text>
              <Text style={styles.expertSubtitle}>All expert fields will become mandatory</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#81C784' }}
              thumbColor={isExpert ? '#2E7D32' : '#f4f3f4'}
              onValueChange={setIsExpert}
              value={isExpert}
            />
          </View>

          {isExpert && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expert Credentials</Text>
              <FormInput label="Registration Number" icon="ribbon-outline" value={formData.expertRegNo} onChangeText={(t) => updateField('expertRegNo', t)} placeholder="Official Reg No." error={errors.expertRegNo} />
              <FormInput label="Area of Expertise" icon="flask-outline" value={formData.areaOfExpertise} onChangeText={(t) => updateField('areaOfExpertise', t)} placeholder="e.g. Plant Pathology" error={errors.areaOfExpertise} />
              <FormInput label="Job Position" icon="briefcase-outline" value={formData.jobPosition} onChangeText={(t) => updateField('jobPosition', t)} placeholder="e.g. Agronomist" error={errors.jobPosition} />
              <FormInput label="Assigned Area" icon="map-outline" value={formData.assignedArea} onChangeText={(t) => updateField('assignedArea', t)} placeholder="Covered region" error={errors.assignedArea} />
            </View>
          )}

          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>{loading ? 'Processing...' : 'Complete Registration'}</Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2E7D32', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },

  section: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 25, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#2E7D32', paddingLeft: 12 },

  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#2E7D32', fontWeight: '800', marginBottom: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FBF9', borderRadius: 12, borderWidth: 1, borderColor: '#E8F5E9', paddingHorizontal: 15 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },
  inputErrorBorder: { borderColor: '#D32F2F' },
  errorHint: { color: '#D32F2F', fontSize: 11, marginTop: 4, fontWeight: '500' },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  pickerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FBF9', borderRadius: 12, borderWidth: 1, borderColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 12 },
  pickerText: { fontSize: 16, color: '#333' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  optionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 16, color: '#333' },

  expertToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9', padding: 15, borderRadius: 20, marginBottom: 20 },
  expertToggleText: { flex: 1, marginRight: 15 },
  expertTitle: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
  expertSubtitle: { fontSize: 11, color: '#666', marginTop: 2 },
  expertSection: { borderTopWidth: 5, borderTopColor: '#2E7D32' },

  registerButton: { backgroundColor: '#2E7D32', flexDirection: 'row', padding: 18, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 5, marginTop: 10 },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 },

  loginLink: { marginTop: 25, alignItems: 'center' },
  loginLinkText: { fontSize: 15, color: '#666' },
  loginLinkBold: { color: '#2E7D32', fontWeight: 'bold' }
});

export default RegisterScreen;
