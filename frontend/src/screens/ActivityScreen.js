import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import apiClient from '../api/client';

const ActivityScreen = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState({ title: '', description: '', status: 'Pending' });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await apiClient.get('/activities');
      setActivities(response.data.data.activities);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!currentActivity.title) return Alert.alert('Error', 'Title is required');
    try {
      const response = await apiClient.post('/activities', currentActivity);
      setActivities([response.data.data.activity, ...activities]);
      setModalVisible(false);
      setCurrentActivity({ title: '', description: '', status: 'Pending' });
    } catch (error) {
      Alert.alert('Error', 'Failed to add activity');
    }
  };

  const toggleStatus = async (activity) => {
    const newStatus = activity.status === 'Pending' ? 'Completed' : 'Pending';
    try {
      const response = await apiClient.patch(`/activities/${activity._id}`, { status: newStatus });
      setActivities(activities.map(a => a._id === activity._id ? response.data.data.activity : a));
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const deleteActivity = async (id) => {
    try {
      await apiClient.delete(`/activities/${id}`);
      setActivities(activities.filter(a => a._id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete activity');
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add New Farming Task</Text>
      </TouchableOpacity>

      <FlatList
        data={activities}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.activityCard}>
            <View style={styles.activityInfo}>
              <Text style={[styles.taskTitle, item.status === 'Completed' && styles.completedText]}>{item.title}</Text>
              <Text style={styles.taskDesc}>{item.description}</Text>
              <Text style={styles.taskDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => toggleStatus(item)} style={[styles.statusToggle, { backgroundColor: item.status === 'Completed' ? '#4CAF50' : '#FFC107' }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteActivity(item._id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No activities found. Add some to get started!</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Farming Activity</Text>
            <TextInput
              style={styles.input}
              placeholder="Title (e.g., Water Plants)"
              value={currentActivity.title}
              onChangeText={text => setCurrentActivity({ ...currentActivity, title: text })}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description"
              multiline
              value={currentActivity.description}
              onChangeText={text => setCurrentActivity({ ...currentActivity, description: text })}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4CAF50' }]} onPress={handleAddActivity}>
                <Text style={styles.btnText}>Add Task</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#9e9e9e' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  activityCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, flexDirection: 'row', elevation: 2 },
  activityInfo: { flex: 1 },
  taskTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  completedText: { textDecorationLine: 'line-through', color: '#888' },
  taskDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  taskDate: { fontSize: 12, color: '#999', marginTop: 4 },
  actions: { justifyContent: 'space-between', alignItems: 'flex-end', marginLeft: 10 },
  statusToggle: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  deleteBtn: { marginTop: 10 },
  deleteText: { color: '#f44336', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 15, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});

export default ActivityScreen;
