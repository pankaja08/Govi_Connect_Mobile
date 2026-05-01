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
  FlatList,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

const FormInput = ({ label, icon, value, onChangeText, placeholder, secure = false, keyboard = 'default', error }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} <Text style={{color: '#F59E0B'}}>*</Text></Text>
      <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused, error && styles.inputErrorBorder]}>
        <Ionicons name={icon} size={20} color={error ? "#EF4444" : (isFocused ? "#F59E0B" : "rgba(255,255,255,0.6)")} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboard}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {error ? <Text style={styles.errorHint}>{error}</Text> : null}
    </View>
  );
};

const DateInput = ({ label, icon, value, onChangeDate, placeholder, error }) => {
  const [show, setShow] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShow(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      if (Platform.OS === 'android') setShow(false);
      const dateString = selectedDate.toISOString().split('T')[0];
      onChangeDate(dateString);
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };

  const currentValDate = value ? new Date(value) : new Date();

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} <Text style={{color: '#F59E0B'}}>*</Text></Text>
      
      {Platform.OS === 'web' ? (
        <View style={[styles.inputWrapper, { paddingVertical: 2 }, error && styles.inputErrorBorder]}>
          <Ionicons name={icon} size={20} color={error ? "#EF4444" : "rgba(255,255,255,0.6)"} style={styles.inputIcon} />
          {React.createElement('input', {
            type: 'date',
            value: value || '',
            onChange: (e) => onChangeDate(e.target.value),
            style: { border: 'none', background: 'transparent', width: '100%', fontSize: 16, outline: 'none', color: '#fff', padding: '10px 0', colorScheme: 'dark' }
          })}
        </View>
      ) : (
        <>
          <TouchableOpacity 
            style={[styles.inputWrapper, { paddingVertical: 12, height: 56 }, error && styles.inputErrorBorder]} 
            onPress={() => setShow(true)}
          >
            <Ionicons name={icon} size={20} color={error ? "#EF4444" : "rgba(255,255,255,0.6)"} style={styles.inputIcon} />
            <Text style={[styles.input, { paddingVertical: 0 }, !value && { color: 'rgba(255,255,255,0.4)' }]}>
              {value || placeholder}
            </Text>
          </TouchableOpacity>
          {show && (
            <DateTimePicker
              value={isNaN(currentValDate.getTime()) ? new Date() : currentValDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </>
      )}
      {error ? <Text style={styles.errorHint}>{error}</Text> : null}
    </View>
  );
};

const SearchablePicker = ({ label, value, options, onSelect, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    <View style={[styles.inputGroup, { flex: 1 }]}>
      <Text style={styles.label}>{label} <Text style={{color: '#F59E0B'}}>*</Text></Text>
      <TouchableOpacity 
        style={[styles.inputWrapper, {height: 56, justifyContent: 'space-between'}]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.input, !value && {color: 'rgba(255,255,255,0.4)'}]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.6)" />
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
                  {value === item && <Ionicons name="checkmark" size={20} color="#064E3B" />}
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
    name: '', nic: '', email: '', contactInfo: '', dob: '', address: '', province: '', district: '', username: '', password: '', confirmPassword: '', expertRegNo: '', areaOfExpertise: '', jobPosition: '', assignedArea: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  const validate = () => {
    let newErrors = {};
    const requiredFields = ['name', 'nic', 'email', 'contactInfo', 'dob', 'address', 'province', 'district', 'username', 'password', 'confirmPassword'];
    if (isExpert) requiredFields.push('expertRegNo', 'areaOfExpertise', 'jobPosition', 'assignedArea');

    requiredFields.forEach(field => {
      if (!formData[field]) newErrors[field] = 'Required';
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) newErrors.email = 'Invalid email';

    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (formData.nic && !nicRegex.test(formData.nic)) newErrors.nic = 'Invalid format';

    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;
      if (isNaN(dobDate.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(formData.dob)) newErrors.dob = 'Use YYYY-MM-DD';
      else if (age < 17) newErrors.dob = 'Age must be 17+';
    }

    if (formData.password && formData.password.length < 6) newErrors.password = 'Min 6 chars';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'province') newData.district = '';
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
        Alert.alert('Success', 'Registration successful!', [
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
      <LinearGradient colors={['#1a512eff', '#0a2f1cff', '#1a512eff']} style={styles.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>G</Text>
            </View>
            <Text style={styles.title}>Join Govi Connect</Text>
            <Text style={styles.subtitle}>Create your agriculture platform account</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.glassCard}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <FormInput label="Full Name" icon="person-outline" value={formData.name} onChangeText={(t) => updateField('name', t)} placeholder="Enter your full name" error={errors.name} />
            <FormInput label="NIC Number" icon="card-outline" value={formData.nic} onChangeText={(t) => updateField('nic', t)} placeholder="123456789V or 12 digits" error={errors.nic} />
            <FormInput label="Email Address" icon="mail-outline" value={formData.email} onChangeText={(t) => updateField('email', t)} placeholder="email@example.com" keyboard="email-address" error={errors.email} />
            <FormInput label="Contact Number" icon="call-outline" value={formData.contactInfo} onChangeText={(t) => updateField('contactInfo', t)} placeholder="07XXXXXXXX" keyboard="phone-pad" error={errors.contactInfo} />
            <DateInput label="Date of Birth" icon="calendar-outline" value={formData.dob} onChangeDate={(t) => updateField('dob', t)} placeholder="YYYY-MM-DD" error={errors.dob} />
            <FormInput label="Permanent Address" icon="home-outline" value={formData.address} onChangeText={(t) => updateField('address', t)} placeholder="Residential address" error={errors.address} />

            <View style={styles.row}>
              <SearchablePicker label="Province" value={formData.province} options={Object.keys(SRI_LANKA_MAP)} onSelect={(v) => updateField('province', v)} placeholder="Province" />
              <View style={{ width: 15 }} />
              <SearchablePicker label="District" value={formData.district} options={formData.province ? SRI_LANKA_MAP[formData.province] : []} onSelect={(v) => updateField('district', v)} placeholder="District" />
            </View>
            {(errors.province || errors.district) && <Text style={styles.errorHint}>Location is required</Text>}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={styles.glassCard}>
            <Text style={styles.sectionTitle}>Account Credentials</Text>
            <FormInput label="Username" icon="at-outline" value={formData.username} onChangeText={(t) => updateField('username', t)} placeholder="Choose a username" error={errors.username} />
            <FormInput label="Password" icon="lock-closed-outline" value={formData.password} onChangeText={(t) => updateField('password', t)} placeholder="Min. 6 characters" secure={true} error={errors.password} />
            <FormInput label="Confirm Password" icon="shield-checkmark-outline" value={formData.confirmPassword} onChangeText={(t) => updateField('confirmPassword', t)} placeholder="Repeat password" secure={true} error={errors.confirmPassword} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600).springify()} style={styles.expertToggleRow}>
            <View style={styles.expertToggleText}>
              <Text style={styles.expertTitle}>Register as Agricultural Expert?</Text>
              <Text style={styles.expertSubtitle}>All expert fields will become mandatory</Text>
            </View>
            <Switch
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(245, 158, 11, 0.4)' }}
              thumbColor={isExpert ? '#F59E0B' : '#f4f3f4'}
              onValueChange={setIsExpert}
              value={isExpert}
            />
          </Animated.View>

          {isExpert && (
            <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Expert Credentials</Text>
              <FormInput label="Registration Number" icon="ribbon-outline" value={formData.expertRegNo} onChangeText={(t) => updateField('expertRegNo', t)} placeholder="Official Reg No." error={errors.expertRegNo} />
              <FormInput label="Area of Expertise" icon="flask-outline" value={formData.areaOfExpertise} onChangeText={(t) => updateField('areaOfExpertise', t)} placeholder="e.g. Plant Pathology" error={errors.areaOfExpertise} />
              <FormInput label="Job Position" icon="briefcase-outline" value={formData.jobPosition} onChangeText={(t) => updateField('jobPosition', t)} placeholder="e.g. Agronomist" error={errors.jobPosition} />
              <FormInput label="Assigned Area" icon="map-outline" value={formData.assignedArea} onChangeText={(t) => updateField('assignedArea', t)} placeholder="Covered region" error={errors.assignedArea} />
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(500).duration(600).springify()}>
            <AnimatedPressable
              style={[styles.button, buttonAnimatedStyle, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              onPressIn={() => { buttonScale.value = withSpring(0.95); }}
              onPressOut={() => { buttonScale.value = withSpring(1); }}
            >
              <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Complete Registration'}</Text>
            </AnimatedPressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(600).springify()} style={styles.loginLink}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  header: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  logoBadge: {
    width: 60, height: 60, backgroundColor: '#F59E0B', borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  logoText: { color: '#064E3B', fontSize: 30, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 5, fontWeight: '500' },

  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 20,
    ...(Platform.OS === 'web' && { backdropFilter: 'blur(20px)' }),
  },
  sectionTitle: { 
    fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 20, 
    borderLeftWidth: 3, borderLeftColor: '#F59E0B', paddingLeft: 10,
    letterSpacing: 0.5, textTransform: 'uppercase'
  },

  inputGroup: { marginBottom: 18 },
  label: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 16, height: 56 
  },
  inputWrapperFocused: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: '100%', color: '#fff', fontSize: 16 },
  inputErrorBorder: { borderColor: '#EF4444' },
  errorHint: { color: '#EF4444', fontSize: 12, marginTop: 6, fontWeight: '600', marginLeft: 4 },

  row: { flexDirection: 'row', justifyContent: 'space-between' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, maxHeight: '80%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  optionItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 16, color: '#374151', fontWeight: '500' },

  expertToggleRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: 18, borderRadius: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  expertToggleText: { flex: 1, marginRight: 15 },
  expertTitle: { fontSize: 15, fontWeight: 'bold', color: '#F59E0B' },
  expertSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  button: {
    backgroundColor: '#F59E0B', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', 
    marginTop: 10, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 15, elevation: 8,
  },
  buttonText: { color: '#064E3B', fontSize: 18, fontWeight: '800', letterSpacing: 0.8 },

  loginLink: { marginTop: 25, alignItems: 'center' },
  loginLinkText: { fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  loginLinkBold: { color: '#F59E0B', fontWeight: 'bold' }
});

export default RegisterScreen;
