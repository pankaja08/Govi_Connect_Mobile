import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Platform } from 'react-native';
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import CropCard from '../components/CropCard';

const getSeasonColor = (season) => {
  switch (season) {
    case 'Yala': return '#10B981';
    case 'Maha': return '#EAB308';
    default: return '#3b82f6';
  }
};

const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 0) {
      const confirm = window.confirm(title + '\n' + message);
      if (confirm) {
        const confirmBtn = buttons.find(b => b.style === 'destructive' || b.text === 'Delete') || buttons[1];
        if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress();
      } else {
        const cancelBtn = buttons.find(b => b.style === 'cancel' || b.text === 'Cancel');
        if (cancelBtn && cancelBtn.onPress) cancelBtn.onPress();
      }
    } else {
      window.alert(title + (message ? '\n' + message : ''));
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const WebDatePicker = ({ value, onChange }) => {
  if (Platform.OS !== 'web') return null;
  return React.createElement('input', {
    type: 'date',
    value: value.toISOString().split('T')[0],
    onChange: (e) => onChange(new Date(e.target.value)),
    style: { border: 'none', background: 'transparent', width: '100%', fontSize: 15, outline: 'none', color: '#111827', fontFamily: 'system-ui' }
  });
};

const FarmerTrackerScreen = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Analytics State
  const [selectedSeason, setSelectedSeason] = useState('Yala');
  
  // Modal States
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [yieldModalVisible, setYieldModalVisible] = useState(false);
  
  // Current Item states
  const [currentCrop, setCurrentCrop] = useState(null);
  const [newCropForm, setNewCropForm] = useState({
    cropName: '', season: 'Yala', plantedDate: new Date(), harvestExpectedDate: new Date(), fieldSize: '', seedVariety: ''
  });
  const [newActivityForm, setNewActivityForm] = useState({
    activityType: 'FERTILIZER', activityName: '', activityDate: new Date()
  });
  const [yieldForm, setYieldForm] = useState({ yieldAmount: '', incomeAmount: '' });
  const [datePickerOpen, setDatePickerOpen] = useState({ open: false, field: null });

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const response = await apiClient.get('/farm/crops');
      setCrops(response.data.data.crops);
    } catch (error) {
      showAlert('Error', 'Failed to fetch crops');
    } finally {
      setLoading(false);
    }
  };

  const openCropModal = (crop = null) => {
    if (crop) {
      setCurrentCrop(crop);
      setNewCropForm({
        cropName: crop.cropName,
        season: crop.season,
        plantedDate: new Date(crop.plantedDate),
        harvestExpectedDate: new Date(crop.harvestExpectedDate),
        fieldSize: String(crop.fieldSize),
        seedVariety: crop.seedVariety || ''
      });
    } else {
      setCurrentCrop(null);
      setNewCropForm({
        cropName: '', season: 'Yala', plantedDate: new Date(), harvestExpectedDate: new Date(), fieldSize: '', seedVariety: ''
      });
    }
    setCropModalVisible(true);
  };

  const handleSaveCrop = async () => {
    if (!newCropForm.cropName || !newCropForm.fieldSize) return showAlert('Validation Error', 'Please fill required fields.');
    
    // Add safety if invalid instances are passed
    const pDate = new Date(newCropForm.plantedDate || new Date());
    const hDate = new Date(newCropForm.harvestExpectedDate || new Date());
    pDate.setHours(0, 0, 0, 0);
    hDate.setHours(0, 0, 0, 0);
    
    if (hDate.getTime() <= pDate.getTime()) {
      return showAlert('Validation Error', 'Harvest date must be after planted date and cannot be the same day.');
    }
    
    try {
      const payload = {
        ...newCropForm,
        fieldSize: Number(newCropForm.fieldSize)
      };

      if (currentCrop) {
        const res = await apiClient.put(`/farm/crops/${currentCrop._id}`, payload);
        setCrops(crops.map(c => c._id === currentCrop._id ? res.data.data.crop : c));
      } else {
        const res = await apiClient.post('/farm/crops', payload);
        setCrops([res.data.data.crop, ...crops]);
      }
      setCropModalVisible(false);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to save crop.';
      showAlert('Error', msg);
    }
  };

  const handleDeleteCrop = (id) => {
    showAlert('Delete Crop', 'Are you sure you want to delete this crop log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await apiClient.delete(`/farm/crops/${id}`);
            setCrops(crops.filter(c => c._id !== id));
          } catch (error) {
            showAlert('Error', 'Failed to delete crop');
          }
      }}
    ]);
  };

  const openActivityModal = (crop) => {
    setCurrentCrop(crop);
    setNewActivityForm({ activityType: 'FERTILIZER', activityName: '', activityDate: new Date() });
    setActivityModalVisible(true);
  };

  const handleSaveActivity = async () => {
    if (!newActivityForm.activityName) return showAlert('Error', 'Activity name is required');
    try {
      const res = await apiClient.post(`/farm/crops/${currentCrop._id}/activities`, newActivityForm);
      setCrops(crops.map(c => c._id === currentCrop._id ? res.data.data.crop : c));
      setActivityModalVisible(false);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to add activity');
    }
  };

  const openYieldModal = (crop) => {
    setCurrentCrop(crop);
    setYieldForm({ yieldAmount: String(crop.yieldAmount || ''), incomeAmount: String(crop.incomeAmount || '') });
    setYieldModalVisible(true);
  };

  const handleSaveYield = async () => {
    try {
      const payload = { yieldAmount: Number(yieldForm.yieldAmount), incomeAmount: Number(yieldForm.incomeAmount) };
      const res = await apiClient.put(`/farm/crops/${currentCrop._id}/analytics`, payload);
      setCrops(crops.map(c => c._id === currentCrop._id ? res.data.data.crop : c));
      setYieldModalVisible(false);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to update yield & income');
    }
  };

  const getMarkedDates = () => {
    let marked = {};
    crops.forEach(crop => {
      const planted = new Date(crop.plantedDate).toISOString().split('T')[0];
      const harvest = new Date(crop.harvestExpectedDate).toISOString().split('T')[0];
      
      marked[planted] = { ...marked[planted], marked: true, dotColor: '#16a34a' }; // Green for plant
      marked[harvest] = { ...marked[harvest], marked: true, dotColor: '#ca8a04' }; // Gold for harvest
      
      crop.activities.forEach(act => {
        const actDate = new Date(act.activityDate).toISOString().split('T')[0];
        marked[actDate] = { ...marked[actDate], marked: true, dotColor: '#2563eb' }; // Blue for activity
      });
    });
    return marked;
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#10B981" /></View>;
  }

  const seasonAnalyticsCrops = crops.filter(c => c.season === selectedSeason && c.yieldAmount > 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={crops}
        keyExtractor={item => item._id}
        ListHeaderComponent={() => (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Farm Performance Analytics</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => openCropModal()}>
                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.addButtonText}>Log New Crop</Text>
              </TouchableOpacity>
            </View>

            {/* Analytics Card */}
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsHeader}>
                <View>
                  <Text style={styles.analyticsTitle}>Season Performance Analysis</Text>
                  <Text style={styles.analyticsSub}>View detailed yields and income by agricultural season</Text>
                </View>
                <View style={styles.pickerContainerSmall}>
                  <Picker
                    selectedValue={selectedSeason}
                    style={styles.pickerSmall}
                    onValueChange={(itemValue) => setSelectedSeason(itemValue)}
                  >
                    <Picker.Item label="Yala" value="Yala" />
                    <Picker.Item label="Maha" value="Maha" />
                    <Picker.Item label="Inter-season" value="Inter-season" />
                  </Picker>
                </View>
              </View>

              {seasonAnalyticsCrops.length > 0 ? (
                seasonAnalyticsCrops.map(crop => (
                  <View key={crop._id} style={styles.analyticsRow}>
                    <Text style={styles.analyticsCropName}>{crop.cropName} <Text style={{fontWeight:'normal', color: '#6B7280'}}>({crop.fieldSize} Acres)</Text></Text>
                    <View style={styles.analyticsValues}>
                       <Text style={styles.aYield}>{crop.yieldAmount} Kg</Text>
                       <Text style={styles.aIncome}>Rs {crop.incomeAmount}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyAnalytics}>
                  <Text style={styles.emptyAnalyticsMsg}>No completed yield data for this season.</Text>
                  <Text style={styles.emptyAnalyticsSubmsg}>Update your crop logs with harvest data to see them here.</Text>
                </View>
              )}
            </View>

            {/* Calendar Component */}
            <View style={styles.calendarCard}>
               <Text style={styles.sectionTitle}>Crop Calendar</Text>
               <Calendar
                 markedDates={getMarkedDates()}
                 theme={{
                   todayTextColor: '#10B981',
                   arrowColor: '#111827',
                   dotStyle: { width: 6, height: 6, borderRadius: 3, marginTop: 1 },
                 }}
               />
            </View>

            <Text style={[styles.sectionTitle, { marginLeft: 16, marginTop: 16 }]}>Recent Crop Logs</Text>
          </>
        )}
        renderItem={({ item }) => (
          <CropCard 
            crop={item} 
            onAddActivity={openActivityModal}
            onUpdateYield={openYieldModal}
            onEdit={openCropModal}
            onDelete={handleDeleteCrop}
          />
        )}
        ListEmptyComponent={() => (
           <View style={styles.emptyList}>
             <Ionicons name="leaf-outline" size={40} color="#D1D5DB" />
             <Text style={styles.emptyListText}>No crops logged yet. Start tracking your farm!</Text>
           </View>
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* CROP MODAL */}
      <Modal isVisible={cropModalVisible} onBackdropPress={() => setCropModalVisible(false)} style={styles.bottomModal}>
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{currentCrop ? 'Edit Crop' : 'Log New Crop'}</Text>
            <TouchableOpacity onPress={() => setCropModalVisible(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.inputLabel}>Crop Name</Text>
            <TextInput style={styles.input} value={newCropForm.cropName} onChangeText={t => setNewCropForm({...newCropForm, cropName: t})} placeholder="e.g. Paddy" />
            
            <Text style={styles.inputLabel}>Season</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={newCropForm.season} onValueChange={v => setNewCropForm({...newCropForm, season: v})}>
                <Picker.Item label="Yala" value="Yala" />
                <Picker.Item label="Maha" value="Maha" />
                <Picker.Item label="Inter-season" value="Inter-season" />
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Planted Date</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.datePickerBtn}>
                <WebDatePicker value={newCropForm.plantedDate} onChange={(d) => setNewCropForm({...newCropForm, plantedDate: d})} />
              </View>
            ) : (
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setDatePickerOpen({ open: true, field: 'plantedDate' })}>
                <Text>{newCropForm.plantedDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.inputLabel}>Expected Harvest Date</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.datePickerBtn}>
                <WebDatePicker value={newCropForm.harvestExpectedDate} onChange={(d) => setNewCropForm({...newCropForm, harvestExpectedDate: d})} />
              </View>
            ) : (
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setDatePickerOpen({ open: true, field: 'harvestExpectedDate' })}>
                <Text>{newCropForm.harvestExpectedDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.inputLabel}>Field Size (Acres)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={newCropForm.fieldSize} onChangeText={t => setNewCropForm({...newCropForm, fieldSize: t})} placeholder="e.g. 2.5" />

            <Text style={styles.inputLabel}>Seed Variety</Text>
            <TextInput style={styles.input} value={newCropForm.seedVariety} onChangeText={t => setNewCropForm({...newCropForm, seedVariety: t})} placeholder="e.g. BG 300" />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveCrop}>
              <Text style={styles.submitBtnText}>Save Crop</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ACTIVITY MODAL */}
      <Modal isVisible={activityModalVisible} onBackdropPress={() => setActivityModalVisible(false)} style={styles.bottomModal}>
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Log Farm Activity</Text>
            <TouchableOpacity onPress={() => setActivityModalVisible(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          <Text style={styles.inputLabel}>Activity Type</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={newActivityForm.activityType} onValueChange={v => setNewActivityForm({...newActivityForm, activityType: v})}>
              <Picker.Item label="FERTILIZER" value="FERTILIZER" />
              <Picker.Item label="PESTICIDE" value="PESTICIDE" />
              <Picker.Item label="WEEDING" value="WEEDING" />
              <Picker.Item label="OTHER" value="OTHER" />
            </Picker>
          </View>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput style={styles.input} value={newActivityForm.activityName} onChangeText={t => setNewActivityForm({...newActivityForm, activityName: t})} placeholder="e.g. Applied Urea" />
          <Text style={styles.inputLabel}>Date Applied</Text>
          {Platform.OS === 'web' ? (
              <View style={styles.datePickerBtn}>
                <WebDatePicker value={newActivityForm.activityDate} onChange={(d) => setNewActivityForm({...newActivityForm, activityDate: d})} />
              </View>
          ) : (
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setDatePickerOpen({ open: true, field: 'activityDate' })}>
              <Text>{newActivityForm.activityDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSaveActivity}>
            <Text style={styles.submitBtnText}>Add Activity</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* YIELD MODAL */}
      <Modal isVisible={yieldModalVisible} onBackdropPress={() => setYieldModalVisible(false)} style={styles.bottomModal}>
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Update Yield & Income</Text>
            <TouchableOpacity onPress={() => setYieldModalVisible(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          <Text style={styles.inputLabel}>Total Yield (Kg)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={yieldForm.yieldAmount} onChangeText={t => setYieldForm({...yieldForm, yieldAmount: t})} placeholder="e.g. 5000" />
          <Text style={styles.inputLabel}>Income Received (LKR)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={yieldForm.incomeAmount} onChangeText={t => setYieldForm({...yieldForm, incomeAmount: t})} placeholder="e.g. 250000" />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSaveYield}>
            <Text style={styles.submitBtnText}>Save Yield</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {Platform.OS !== 'web' && (
        <DatePicker
          modal
          open={datePickerOpen.open}
          date={datePickerOpen.field && newCropForm[datePickerOpen.field] ? newCropForm[datePickerOpen.field] : new Date()}
          mode="date"
          onConfirm={(date) => {
            if(datePickerOpen.field === 'activityDate'){
               setNewActivityForm({...newActivityForm, activityDate: date});
            } else {
               setNewCropForm({...newCropForm, [datePickerOpen.field]: date});
            }
            setDatePickerOpen({ open: false, field: null });
          }}
          onCancel={() => {
            setDatePickerOpen({ open: false, field: null });
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    paddingTop: 24
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', flex: 1 },
  addButton: { 
    backgroundColor: '#10B981', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 8 
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  analyticsSub: { fontSize: 12, color: '#6B7280', flex: 1, marginTop: 4 },
  pickerContainerSmall: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    width: 120,
    justifyContent: 'center',
    marginLeft: 10
  },
  pickerSmall: { height: 40 },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  analyticsCropName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  analyticsValues: { alignItems: 'flex-end' },
  aYield: { fontSize: 13, fontWeight: '500', color: '#10B981', marginBottom: 2 },
  aIncome: { fontSize: 13, fontWeight: 'bold', color: '#EAB308' },
  emptyAnalytics: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyAnalyticsMsg: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  emptyAnalyticsSubmsg: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyList: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 20, backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16 },
  emptyListText: { color: '#6B7280', marginTop: 12 },
  bottomModal: { justifyContent: 'flex-end', margin: 0 },
  sheetContent: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#F9FAFB' },
  pickerContainer: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, backgroundColor: '#F9FAFB' },
  datePickerBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 14, backgroundColor: '#F9FAFB' },
  submitBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default FarmerTrackerScreen;
