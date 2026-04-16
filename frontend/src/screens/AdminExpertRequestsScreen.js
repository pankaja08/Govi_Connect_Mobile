import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

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
        reason: action === 'reject' ? rejectionReason : undefined
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

  const renderExpertItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.expertCard}
      onPress={() => {
        setSelectedExpert(item);
        setDetailModalVisible(true);
      }}
    >
      <View style={styles.expertInfo}>
        <Text style={styles.expertName}>{item.name}</Text>
        <Text style={styles.expertDetails}>Reg No: {item.expertRegNo}</Text>
        <Text style={styles.expertExpertise}>{item.areaOfExpertise || 'N/A'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#115C39" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#115C39" />
        </View>
      ) : experts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="documents-outline" size={80} color="#ccc" />
          <Text style={styles.noRequestsText}>No pending expert requests</Text>
        </View>
      ) : (
        <FlatList
          data={experts}
          renderItem={renderExpertItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Expert Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedExpert && (
              <ScrollView style={styles.modalBody}>
                <DetailRow label="Name" value={selectedExpert.name} />
                <DetailRow label="Email" value={selectedExpert.email} />
                <DetailRow label="NIC" value={selectedExpert.nic} />
                <DetailRow label="DOB" value={selectedExpert.dob} />
                <DetailRow label="Registration No" value={selectedExpert.expertRegNo} />
                <DetailRow label="Expertise" value={selectedExpert.areaOfExpertise} />
                <DetailRow label="Position" value={selectedExpert.jobPosition} />
                <DetailRow label="Assigned Area" value={selectedExpert.assignedArea} />
                <DetailRow label="Province" value={selectedExpert.province} />
                <DetailRow label="District" value={selectedExpert.district} />
                <DetailRow label="Requested On" value={new Date(selectedExpert.createdAt).toLocaleDateString()} />
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]} 
                onPress={() => setRejectionModalVisible(true)}
                disabled={processing}
              >
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
                  <Text style={styles.actionButtonText}>Approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={rejectionModalVisible}
        onRequestClose={() => setRejectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectionContent}>
            <Text style={styles.rejectionTitle}>Reason for Rejection</Text>
            <TextInput
              style={styles.rejectionInput}
              multiline
              numberOfLines={4}
              placeholder="Explain why the expert was rejected..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              textAlignVertical="top"
            />
            <View style={styles.rejectionActions}>
              <TouchableOpacity 
                style={[styles.miniButton, styles.cancelButton]} 
                onPress={() => setRejectionModalVisible(false)}
              >
                <Text style={styles.miniButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.miniButton, styles.confirmRejectButton]} 
                onPress={() => handleVerify('reject')}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.miniButtonText}>Submit Rejection</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || 'N/A'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  listContent: {
    padding: 15,
  },
  expertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  expertDetails: {
    fontSize: 14,
    color: '#666',
  },
  expertExpertise: {
    fontSize: 14,
    color: '#115C39',
    fontWeight: '600',
    marginTop: 2,
  },
  noRequestsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '90%',
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#115C39',
  },
  modalBody: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
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
    fontWeight: 'bold',
  },
  
  // Rejection Modal
  rejectionContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 10,
  },
  rejectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  rejectionInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  rejectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  miniButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmRejectButton: {
    backgroundColor: '#D32F2F',
  },
  miniButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmRejectButtonText: {
    color: '#fff',
  }
});

export default AdminExpertRequestsScreen;
