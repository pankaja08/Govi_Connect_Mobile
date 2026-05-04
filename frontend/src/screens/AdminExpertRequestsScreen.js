import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';

// ---------- Avatar Colors ----------
const AVATAR_GRADIENTS = [
  ['#115C39', '#1a8a56'],
  ['#2E7D32', '#66BB6A'],
  ['#00796B', '#4DB6AC'],
  ['#388E3C', '#81C784'],
  ['#1B5E20', '#43A047'],
  ['#006064', '#26C6DA'],
];

const getGradient = (name = '') => {
  const index = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

// ---------- Animated Card ----------
const ExpertCard = ({ item, index, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const gradient = getGradient(item.name);
  const initials = getInitials(item.name);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Top accent bar */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardAccent}
        />

        <View style={styles.cardBody}>
          {/* Avatar + Name row */}
          <View style={styles.cardTopRow}>
            <LinearGradient
              colors={gradient}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>

            <View style={styles.cardNameBlock}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={11} color="#F97316" />
                <Text style={styles.pendingText}>Pending Review</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward-circle" size={28} color={gradient[0]} />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Info rows */}
          <View style={styles.infoGrid}>
            <InfoChip
              icon="medal-outline"
              label="Expertise"
              value={item.areaOfExpertise || 'N/A'}
              color={gradient[0]}
            />
            <InfoChip
              icon="card-outline"
              label="Reg No"
              value={item.expertRegNo || 'N/A'}
              color={gradient[1]}
            />
            <InfoChip
              icon="location-outline"
              label="District"
              value={item.district || 'N/A'}
              color={gradient[0]}
            />
            <InfoChip
              icon="briefcase-outline"
              label="Position"
              value={item.jobPosition || 'N/A'}
              color={gradient[1]}
            />
          </View>

          {/* CTA Button */}
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Ionicons name="eye-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.ctaText}>View Full Details</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ---------- Info Chip ----------
const InfoChip = ({ icon, label, value, color }) => (
  <View style={styles.infoChip}>
    <View style={[styles.chipIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={14} color={color} />
    </View>
    <View>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

// ---------- Main Screen ----------
const AdminExpertRequestsScreen = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingExperts();
  }, []);

  const fetchPendingExperts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/admin/pending-experts');
      setExperts(response.data.data.experts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending experts:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load pending requests');
    }
  };

  const handleVerify = async (action) => {
    if (action === 'reject' && !rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.patch(`/users/admin/verify-expert/${selectedExpert._id}`, {
        action,
        reason: action === 'reject' ? rejectionReason : undefined,
      });

      setProcessing(false);
      setDetailModalVisible(false);
      setRejectionModalVisible(false);
      setRejectionReason('');

      Alert.alert(
        'Success',
        `Expert ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
      );

      fetchPendingExperts();
    } catch (error) {
      setProcessing(false);
      console.error('Error verifying expert:', error);
      Alert.alert('Error', 'Failed to process request');
    }
  };

  const renderExpertItem = useCallback(
    ({ item, index }) => (
      <ExpertCard
        item={item}
        index={index}
        onPress={() => {
          setSelectedExpert(item);
          setDetailModalVisible(true);
        }}
      />
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#115C39" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : experts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="documents-outline" size={80} color="#ccc" />
          <Text style={styles.noRequestsTitle}>All Clear!</Text>
          <Text style={styles.noRequestsText}>No pending expert requests</Text>
        </View>
      ) : (
        <FlatList
          data={experts}
          renderItem={renderExpertItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchPendingExperts}
        />
      )}

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={selectedExpert ? getGradient(selectedExpert.name) : ['#115C39', '#1a8a56']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalGradientHeader}
            >
              <Text style={styles.modalTitle}>Expert Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            {selectedExpert && (
              <ScrollView style={styles.modalBody}>
                <DetailRow label="Name" value={selectedExpert.name} icon="person-outline" />
                <DetailRow label="Email" value={selectedExpert.email} icon="mail-outline" />
                <DetailRow label="NIC" value={selectedExpert.nic} icon="card-outline" />
                <DetailRow label="DOB" value={selectedExpert.dob} icon="calendar-outline" />
                <DetailRow label="Registration No" value={selectedExpert.expertRegNo} icon="ribbon-outline" />
                <DetailRow label="Expertise" value={selectedExpert.areaOfExpertise} icon="medal-outline" />
                <DetailRow label="Position" value={selectedExpert.jobPosition} icon="briefcase-outline" />
                <DetailRow label="Assigned Area" value={selectedExpert.assignedArea} icon="map-outline" />
                <DetailRow label="Province" value={selectedExpert.province} icon="flag-outline" />
                <DetailRow label="District" value={selectedExpert.district} icon="location-outline" />
                <DetailRow
                  label="Requested On"
                  value={new Date(selectedExpert.createdAt).toLocaleDateString()}
                  icon="time-outline"
                />
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => setRejectionModalVisible(true)}
                disabled={processing}
              >
                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleVerify('approve')}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={rejectionModalVisible}
        onRequestClose={() => setRejectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectionContent}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="alert-circle" size={28} color="#D32F2F" />
              <Text style={styles.rejectionTitle}>Reason for Rejection</Text>
            </View>
            <TextInput
              style={styles.rejectionInput}
              multiline
              numberOfLines={4}
              placeholder="Explain why the expert was rejected..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              textAlignVertical="top"
              placeholderTextColor="#bbb"
            />
            <View style={styles.rejectionActions}>
              <TouchableOpacity
                style={[styles.miniButton, styles.cancelButton]}
                onPress={() => setRejectionModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.miniButton, styles.confirmRejectButton]}
                onPress={() => handleVerify('reject')}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.miniButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ---------- Detail Row ----------
const DetailRow = ({ label, value, icon }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconWrap}>
      <Ionicons name={icon} size={16} color="#115C39" />
    </View>
    <View style={styles.detailTexts}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  </View>
);

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  listContent: {
    padding: 16,
    paddingTop: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
  },
  noRequestsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
  },
  noRequestsText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },

  // ---- Card ----
  cardWrapper: {
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#28ce20ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  cardAccent: {
    height: 5,
    width: '100%',
  },
  cardBody: {
    padding: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardNameBlock: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  pendingText: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '46%',
  },
  chipIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 10,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    maxWidth: 100,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ---- Modal ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalGradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTexts: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginTop: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#2E7D32',
  },
  rejectButton: {
    backgroundColor: '#D32F2F',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ---- Rejection Modal ----
  rejectionContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  rejectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  rejectionInput: {
    height: 110,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  rejectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10,
  },
  miniButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  confirmRejectButton: {
    backgroundColor: '#D32F2F',
  },
  miniButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default AdminExpertRequestsScreen;
