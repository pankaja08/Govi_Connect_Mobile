import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  Dimensions,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

// ─── Sri Lanka Provinces & Districts ────────────────────────────────────────
const SRI_LANKA_DATA = {
  'Western': ['Colombo', 'Gampaha', 'Kalutara'],
  'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'Southern': ['Galle', 'Matara', 'Hambantota'],
  'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'Eastern': ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  'Uva': ['Badulla', 'Monaragala'],
  'Sabaragamuwa': ['Kegalle', 'Ratnapura'],
};

const ALL_PROVINCES = Object.keys(SRI_LANKA_DATA);

// Flat list of all unique districts (sorted)
const ALL_DISTRICTS = [...new Set(Object.values(SRI_LANKA_DATA).flat())].sort();

// ─── Custom Dropdown Picker Component ───────────────────────────────────────
const DropdownPicker = ({ label, required, value, options, onSelect, placeholder, icon }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={dropdownStyles.wrapper}>
      <Text style={dropdownStyles.label}>
        {label} {required && <Text style={dropdownStyles.required}>*</Text>}
      </Text>

      {/* Trigger row */}
      <TouchableOpacity
        style={[dropdownStyles.trigger, open && dropdownStyles.triggerOpen]}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.85}
      >
        <Ionicons name={icon || 'map-outline'} size={18} color="#115C39" style={dropdownStyles.triggerIcon} />
        <Text style={[dropdownStyles.triggerText, !value && dropdownStyles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={open ? '#115C39' : '#9CA3AF'}
        />
      </TouchableOpacity>

      {/* Inline expanded list */}
      {open && (
        <View style={dropdownStyles.inlineList}>
          {options.map((item, idx) => {
            const isSelected = item === value;
            const isLast = idx === options.length - 1;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  dropdownStyles.inlineOption,
                  isSelected && dropdownStyles.inlineOptionSelected,
                  isLast && dropdownStyles.inlineOptionLast,
                ]}
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    dropdownStyles.inlineOptionText,
                    isSelected && dropdownStyles.inlineOptionTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color="#115C39" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const dropdownStyles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '700', color: '#4B5563' },
  required: { color: '#EF4444' },

  // Trigger button
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginTop: 6,
  },
  triggerOpen: {
    borderColor: '#115C39',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  triggerIcon: { marginRight: 10 },
  triggerText: { flex: 1, fontSize: 14, color: '#1F2937' },
  placeholder: { color: '#9CA3AF' },

  // Inline list
  inlineList: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#115C39',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  inlineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inlineOptionLast: {
    borderBottomWidth: 0,
  },
  inlineOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  inlineOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  inlineOptionTextSelected: {
    color: '#115C39',
    fontWeight: '700',
  },
});

const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: 'User',
    district: '',
    province: '',
    contactInfo: '',
    nic: '',
    dob: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/admin/all');
      setUsers(response.data.data.users);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Basic Validation
      if (!formData.name || !formData.email || !formData.username || (!isEditMode && !formData.password)) {
        Alert.alert('Error', 'Please fill in all required fields marked with *');
        return;
      }

      // Password Match Validation
      if (!isEditMode && formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      const payload = { ...formData };
      delete payload.confirmPassword; // Don't send this to backend

      if (isEditMode && !payload.password) {
        delete payload.password;
      }

      if (isEditMode) {
        await apiClient.put(`/users/admin/update/${selectedUser._id}`, payload);
        if (Platform.OS === 'web') {
           window.alert('User updated successfully');
        } else {
           Alert.alert('Success', 'User updated successfully');
        }
      } else {
        await apiClient.post('/users/admin/create', payload);
        if (Platform.OS === 'web') {
           window.alert('User created successfully');
        } else {
           Alert.alert('Success', 'User created successfully');
        }
      }

      setModalVisible(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Operation failed');
    }
  };

  const executeDelete = async (userId) => {
    try {
      await apiClient.delete(`/users/admin/delete/${userId}`);
      fetchUsers();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to delete user';
      if (Platform.OS === 'web') {
         window.alert('Error: ' + errorMsg);
      } else {
         Alert.alert('Error', errorMsg);
      }
    }
  };

  const handleDeleteUser = (userId, userName) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
        executeDelete(userId);
      }
    } else {
      Alert.alert(
        'Delete User',
        `Are you sure you want to delete ${userName}? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => executeDelete(userId)
          }
        ]
      );
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      district: user.district || '',
      province: user.province || '',
      contactInfo: user.contactInfo || '',
      nic: user.nic || '',
      dob: user.dob || '',
      address: user.address || '',
      password: '', // Keep empty unless changing
      confirmPassword: ''
    });
    setIsEditMode(true);
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      username: '',
      role: 'User',
      district: '',
      province: '',
      contactInfo: '',
      nic: '',
      dob: '',
      address: '',
      password: '',
      confirmPassword: ''
    });
    setIsEditMode(false);
    setSelectedUser(null);
  };

  const renderUserTable = (title, icon, roleType, color) => {
    const filteredUsers = users.filter(u => u.role === roleType);

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name={icon} size={22} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
          </View>
        </View>

        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableInner}>
              {/* Header */}
              <View style={[styles.tableHeader, { backgroundColor: roleType === 'Admin' ? '#FFF1F1' : roleType === 'Expert' ? '#EFF6FF' : '#F9FAFB' }]}>
                <Text style={styles.columnHeaderName}>NAME</Text>
                <Text style={styles.columnHeaderEmail}>EMAIL</Text>
                <Text style={styles.columnHeader}>CONTACT</Text>
                <Text style={styles.columnHeader}>DISTRICT</Text>
                <Text style={styles.columnHeader}>STATUS</Text>
                <Text style={styles.columnHeaderActions}>ACTIONS</Text>
              </View>

            {/* Rows */}
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <View key={user._id} style={[styles.tableRow, index === filteredUsers.length - 1 && styles.lastRow]}>
                  <View style={styles.nameCell}>
                    <View>
                      <Text style={styles.userNameText}>{user.name}</Text>
                      <Text style={styles.userSubText}>{user.username}</Text>
                    </View>
                  </View>
                  <Text style={styles.emailCell} numberOfLines={1} ellipsizeMode="tail">{user.email}</Text>
                  <Text style={styles.cellText}>{user.contactInfo || 'N/A'}</Text>
                  <Text style={styles.cellText}>{user.district || 'N/A'}</Text>
                  <View style={styles.statusCell}>
                    <View style={[
                      styles.statusBadge, 
                      user.status === 'Pending' ? { backgroundColor: '#FFF7ED' } : 
                      user.status === 'Rejected' ? { backgroundColor: '#FEF2F2' } : 
                      { backgroundColor: '#F0FDF4' }
                    ]}>
                      <View style={[
                        styles.statusDot, 
                        user.status === 'Pending' ? { backgroundColor: '#F97316' } : 
                        user.status === 'Rejected' ? { backgroundColor: '#EF4444' } : 
                        { backgroundColor: '#22C55E' }
                      ]} />
                      <Text style={[
                        styles.statusText,
                        user.status === 'Pending' ? { color: '#C2410C' } : 
                        user.status === 'Rejected' ? { color: '#B91C1C' } : 
                        { color: '#15803D' }
                      ]}>{user.status || 'Active'}</Text>
                    </View>
                  </View>
                  <View style={styles.actionsCell}>
                    <TouchableOpacity 
                      onPress={() => openEditModal(user)}
                      style={styles.actionBtn}
                    >
                      <View style={[styles.actionItem, styles.editItem]}>
                        <Ionicons name="pencil" size={16} color="#F59E0B" />
                        <Text style={styles.editText}>Edit</Text>
                      </View>
                    </TouchableOpacity>
                    {roleType !== 'Admin' && (
                      <TouchableOpacity 
                        onPress={() => handleDeleteUser(user._id, user.name)}
                        style={styles.actionBtn}
                      >
                        <View style={[styles.actionItem, styles.deleteItem]}>
                          <Ionicons name="trash" size={16} color="#EF4444" />
                          <Text style={styles.deleteText}>Delete</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No users found in this category.</Text>
              </View>
            )}
          </View>
        </ScrollView>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#115C39" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color="#115C39" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Users & Experts</Text>
            <Text style={styles.subtitle}>Manage all registered members</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => { resetForm(); setModalVisible(true); }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.createBtnText}>Create New User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderUserTable('Administrators', 'shield-checkmark', 'Admin', '#DC2626')}
        {renderUserTable('Agri Officers / Experts', 'leaf', 'Expert', '#2563EB')}
        {renderUserTable('Farmers / Users', 'person', 'User', '#115C39')}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? 'Edit User' : 'Create New User'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Section 1: Basic Information */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeadingRow}>
                   <View style={styles.headingAccent} />
                   <Text style={styles.sectionHeading}>Basic Information</Text>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputIconGroup}>
                    <Ionicons name="person-outline" size={20} color="#115C39" style={styles.inputIcon} />
                    <TextInput
                      style={styles.flexInput}
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChangeText={(val) => setFormData({ ...formData, name: val })}
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>NIC Number <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputIconGroup}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#115C39" style={styles.inputIcon} />
                    <TextInput
                      style={styles.flexInput}
                      placeholder="123456789V or 12 digits"
                      value={formData.nic}
                      onChangeText={(val) => setFormData({ ...formData, nic: val })}
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputIconGroup}>
                    <Ionicons name="mail-outline" size={20} color="#115C39" style={styles.inputIcon} />
                    <TextInput
                      style={styles.flexInput}
                      placeholder="email@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(val) => setFormData({ ...formData, email: val })}
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Contact Number <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputIconGroup}>
                    <Ionicons name="call-outline" size={20} color="#115C39" style={styles.inputIcon} />
                    <TextInput
                      style={styles.flexInput}
                      placeholder="07XXXXXXXX"
                      keyboardType="phone-pad"
                      value={formData.contactInfo}
                      onChangeText={(val) => setFormData({ ...formData, contactInfo: val })}
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputIconGroup}>
                    <Ionicons name="calendar-outline" size={20} color="#115C39" style={styles.inputIcon} />
                    <TextInput
                      style={styles.flexInput}
                      placeholder="YYYY-MM-DD"
                      value={formData.dob}
                      onChangeText={(val) => setFormData({ ...formData, dob: val })}
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Permanent Address <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputIconGroup}>
                    <Ionicons name="home-outline" size={20} color="#115C39" style={styles.inputIcon} />
                    <TextInput
                      style={styles.flexInput}
                      placeholder="Residential address"
                      value={formData.address}
                      onChangeText={(val) => setFormData({ ...formData, address: val })}
                    />
                  </View>
                </View>

                {/* Province Dropdown */}
                <DropdownPicker
                  label="Province"
                  required
                  value={formData.province}
                  options={ALL_PROVINCES}
                  placeholder="Select Province"
                  icon="map-outline"
                  onSelect={(val) => {
                    // When province changes, reset district if it no longer belongs
                    const validDistricts = SRI_LANKA_DATA[val] || [];
                    const keepDistrict = validDistricts.includes(formData.district)
                      ? formData.district
                      : '';
                    setFormData({ ...formData, province: val, district: keepDistrict });
                  }}
                />

                {/* District Dropdown — filtered by selected province */}
                <DropdownPicker
                  label="District"
                  required
                  value={formData.district}
                  options={
                    formData.province && SRI_LANKA_DATA[formData.province]
                      ? SRI_LANKA_DATA[formData.province]
                      : ALL_DISTRICTS
                  }
                  placeholder={
                    formData.province
                      ? `Select District in ${formData.province}`
                      : 'Select Province first'
                  }
                  icon="location-outline"
                  onSelect={(val) => setFormData({ ...formData, district: val })}
                />

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Target Role</Text>
                  <View style={styles.roleSelector}>
                    {['Admin', 'Expert', 'User'].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roleOption, formData.role === r && styles.roleActive]}
                        onPress={() => setFormData({ ...formData, role: r })}
                      >
                        <Text style={[styles.roleOptionText, formData.role === r && styles.roleActiveText]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Section 2: Account Credentials */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeadingRow}>
                   <View style={styles.headingAccent} />
                   <Text style={styles.sectionHeading}>Account Credentials</Text>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Username <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputIconGroup}>
                    <MaterialCommunityIcons name="at" size={20} color="#115C39" style={styles.inputIcon} />
                    <TextInput
                      style={styles.flexInput}
                      placeholder="username"
                      autoCapitalize="none"
                      value={formData.username}
                      onChangeText={(val) => setFormData({ ...formData, username: val })}
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>{isEditMode ? 'New Password' : 'Password'} <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputIconGroup}>
                    <Ionicons name="lock-closed-outline" size={20} color="#115C39" style={styles.inputIcon} />
                    <TextInput
                      style={styles.flexInput}
                      placeholder={isEditMode ? "Leave blank to keep current" : "Enter password"}
                      secureTextEntry
                      value={formData.password}
                      onChangeText={(val) => setFormData({ ...formData, password: val })}
                    />
                  </View>
                </View>

                {(!isEditMode || formData.password.length > 0) && (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
                    <View style={styles.inputIconGroup}>
                      <MaterialIcons name="verified-user" size={20} color="#115C39" style={styles.inputIcon} />
                      <TextInput
                        style={styles.flexInput}
                        placeholder="Repeat password"
                        secureTextEntry
                        value={formData.confirmPassword}
                        onChangeText={(val) => setFormData({ ...formData, confirmPassword: val })}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Bottom padding so last field isn't hidden behind submit button */}
              <View style={{ height: 16 }} />
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateUser}>
              <Text style={styles.submitBtnText}>{isEditMode ? 'Update User' : 'Create User'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 20 : 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  menuBtn: {
    marginRight: 15,
    padding: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: width < 380 ? 22 : 28,
    fontWeight: '800',
    color: '#115C39',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#115C39',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 15,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tableInner: {
    minWidth: 920, // Increased to accommodate wider email column
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  columnHeader: {
    width: 140, // Fixed width for scrollable table
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'left',
    paddingHorizontal: 5,
  },
  columnHeaderName: {
    width: 180, // Larger width for Name column
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'left',
    paddingHorizontal: 5,
  },
  columnHeaderActions: {
    width: 180, // Matching actionsCell
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'left',
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // More stable tap padding
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  nameCell: {
    width: 180, // Match header
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  userSubText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cellText: {
    width: 140, // Match header
    fontSize: 12,
    color: '#475569',
    textAlign: 'left',
    paddingHorizontal: 5,
  },
  emailCell: {
    width: 210, // Wider for email to stay on one line
    fontSize: 12,
    color: '#475569',
    textAlign: 'left',
    paddingHorizontal: 5,
  },
  columnHeaderEmail: {
    width: 210, // Matching emailCell
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'left',
    paddingHorizontal: 5,
  },
  statusCell: {
    width: 110, // Matching status badge
    alignItems: 'flex-start',
    paddingHorizontal: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  actionsCell: {
    width: 180, // Slightly wider for safer tapping
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    padding: 6,
    borderRadius: 6,
  },
  editItem: {
    backgroundColor: '#FFFBEB',
  },
  deleteItem: {
    backgroundColor: '#FEF2F2',
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginLeft: 6,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 6,
  },
  emptyRow: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 480,
    // Height is bounded; flex column so header/scroll/button stack
    height: '85%',
    flexDirection: 'column',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    paddingHorizontal: width < 380 ? 16 : 20,
    paddingTop: width < 380 ? 16 : 20,
    paddingBottom: width < 380 ? 16 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalBody: {
    flex: 1,
    marginBottom: 12,
  },
  modalBodyContent: {
    paddingBottom: 8,
  },
  formSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#FAFCFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F4F0',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headingAccent: {
    width: 4,
    height: 20,
    backgroundColor: '#115C39',
    borderRadius: 2,
    marginRight: 10,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  inputWrapper: {
    marginBottom: 18,
  },
  required: {
    color: '#EF4444',
  },
  inputIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  inputIcon: {
    marginRight: 10,
  },
  flexInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    marginTop: 6,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 4,
    marginTop: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleActive: {
    backgroundColor: '#115C39',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  roleActiveText: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#115C39',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#115C39',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  }
});

export default AdminUsersScreen;
