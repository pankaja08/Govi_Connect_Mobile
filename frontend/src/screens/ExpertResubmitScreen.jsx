import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';

const ExpertResubmitScreen = () => {
  const { signOut, signIn } = React.useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    email: '',
    contactInfo: '',
    dob: '',
    address: '',
    province: '',
    district: '',
    expertRegNo: '',
    areaOfExpertise: '',
    jobPosition: '',
    assignedArea: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/me');
      const userData = response.data.data.user;
      setUser(userData);
      
      // Prefill form
      setFormData({
        name: userData.name || '',
        nic: userData.nic || '',
        email: userData.email || '',
        contactInfo: userData.contactInfo || '',
        dob: userData.dob || '',
        address: userData.address || '',
        province: userData.province || '',
        district: userData.district || '',
        expertRegNo: userData.expertRegNo || '',
        areaOfExpertise: userData.areaOfExpertise || '',
        jobPosition: userData.jobPosition || '',
        assignedArea: userData.assignedArea || ''
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load profile details');
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    const requiredFields = ['name', 'nic', 'email', 'expertRegNo', 'areaOfExpertise'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert('Required', `Please fill in all mandatory fields.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post('/users/resubmit-expert', formData);
      setSubmitting(false);
      
      const { user: updatedUser } = response.data.data;
      
      Alert.alert(
        'Success', 
        'Your profile has been resubmitted and is now under review.',
        [{ 
          text: 'OK', 
          onPress: async () => {
            // Update context with new status
            const token = await apiClient.defaults.headers.common['Authorization'].split(' ')[1];
            await signIn(token, 'Expert', 'Pending');
          } 
        }]
      );
    } catch (error) {
      setSubmitting(false);
      console.error('Error resubmitting:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to resubmit request');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.rejectionBadge}>
              <Ionicons name="alert-circle" size={24} color="#D32F2F" />
              <Text style={styles.rejectionHeader}>Registration Rejected</Text>
            </View>
            
            <View style={styles.reasonCard}>
              <Text style={styles.reasonLabel}>Reason for Rejection:</Text>
              <Text style={styles.reasonText}>{user?.rejectionReason || 'No reason provided.'}</Text>
            </View>
            
            <Text style={styles.instructionText}>
              Please correct the information below and resubmit your profile for a new review.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <Input label="Full Name" value={formData.name} onChangeText={(t) => updateField('name', t)} />
            <Input label="NIC Number" value={formData.nic} onChangeText={(t) => updateField('nic', t)} />
            <Input label="Email" value={formData.email} onChangeText={(t) => updateField('email', t)} keyboardType="email-address" />
            <Input label="Contact No" value={formData.contactInfo} onChangeText={(t) => updateField('contactInfo', t)} keyboardType="phone-pad" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expert Credentials</Text>
            <Input label="Registration Number" value={formData.expertRegNo} onChangeText={(t) => updateField('expertRegNo', t)} />
            <Input label="Area of Expertise" value={formData.areaOfExpertise} onChangeText={(t) => updateField('areaOfExpertise', t)} />
            <Input label="Job Position" value={formData.jobPosition} onChangeText={(t) => updateField('jobPosition', t)} />
            <Input label="Assigned Area" value={formData.assignedArea} onChangeText={(t) => updateField('assignedArea', t)} />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, submitting && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Resubmit Profile</Text>
                <Ionicons name="send-outline" size={20} color="#fff" style={{marginLeft: 10}} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()}>
            <Text style={styles.logoutButtonText}>Logout and exit</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Input = ({ label, value, onChangeText, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={`Enter ${label}...`}
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 25,
  },
  rejectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  rejectionHeader: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  reasonCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#D32F2F',
    marginBottom: 15,
    elevation: 2,
  },
  reasonLabel: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  reasonText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});

export default ExpertResubmitScreen;
