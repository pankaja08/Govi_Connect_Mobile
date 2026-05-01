import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Platform, Pressable } from 'react-native';
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import CropCard from '../components/CropCard';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getSeasonColor = (season) => {
  switch (season) {
    case 'Yala': return '#10B981';
    case 'Maha': return '#F59E0B';
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
    value: safeDateStr(value) || new Date().toISOString().split('T')[0],
    onChange: (e) => onChange(new Date(e.target.value)),
    style: { border: 'none', background: 'transparent', width: '100%', fontSize: 15, outline: 'none', color: '#111827', fontFamily: 'system-ui' }
  });
};

const safeDateStr = (dateVal) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
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
  const [dayEventsModalVisible, setDayEventsModalVisible] = useState(false);
  
  // Current Item states
  const [currentCrop, setCurrentCrop] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState({ date: '', events: [] });
  const [newCropForm, setNewCropForm] = useState({
    cropName: '', season: 'Yala', plantedDate: new Date(), harvestExpectedDate: new Date(), fieldSize: '', seedVariety: ''
  });
  const [newActivityForm, setNewActivityForm] = useState({
    activityType: 'FERTILIZER', activityName: '', activityDate: new Date()
  });
  const [yieldForm, setYieldForm] = useState({ yieldAmount: '', incomeAmount: '' });
  const [datePickerOpen, setDatePickerOpen] = useState({ open: false, field: null });

  // Add Button Animation
  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

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
    
    const pDate = new Date(newCropForm.plantedDate || new Date());
    const hDate = new Date(newCropForm.harvestExpectedDate || new Date());
    pDate.setHours(0, 0, 0, 0);
    hDate.setHours(0, 0, 0, 0);
    
    if (hDate.getTime() <= pDate.getTime()) {
      return showAlert('Validation Error', 'Harvest date must be after planted date and cannot be the same day.');
    }
    
    try {
      const payload = { ...newCropForm, fieldSize: Number(newCropForm.fieldSize) };

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
    const aDate = new Date(newActivityForm.activityDate || new Date());
    const pDate = new Date(currentCrop.plantedDate);
    aDate.setHours(0, 0, 0, 0);
    pDate.setHours(0, 0, 0, 0);

    if (aDate.getTime() < pDate.getTime()) {
      return showAlert('Validation Error', 'Activity date cannot be earlier than the planted date.');
    }

    try {
      const res = await apiClient.post(`/farm/crops/${currentCrop._id}/activities`, newActivityForm);
      setCrops(crops.map(c => c._id === currentCrop._id ? res.data.data.crop : c));
      setActivityModalVisible(false);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to add activity';
      showAlert('Error', msg);
    }
  };

  const handleToggleActivityStatus = async (cropId, activityId) => {
    try {
      const res = await apiClient.put(`/farm/crops/${cropId}/activities/${activityId}/toggle`);
      setCrops(crops.map(c => c._id === cropId ? res.data.data.crop : c));
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to update activity status');
    }
  };

  const openYieldModal = (crop) => {
    if (crop.harvestExpectedDate) {
      const today = new Date();
      const harvestDate = new Date(crop.harvestExpectedDate);
      
      today.setHours(0, 0, 0, 0);
      harvestDate.setHours(0, 0, 0, 0);

      if (today.getTime() < harvestDate.getTime()) {
        const formattedDate = harvestDate.toLocaleDateString();
        return showAlert('Action Not Allowed', `You can't update yield until the expected harvest date (${formattedDate}).`);
      }
    }

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

  const handleDayPress = (day) => {
    const clickedDate = day.dateString;
    const dayEvents = [];

    crops.forEach(crop => {
      if (crop.plantedDate) {
        if (safeDateStr(crop.plantedDate) === clickedDate) {
          dayEvents.push({ id: `p-${crop._id}`, type: 'Planting', title: `Planted ${crop.cropName}`, description: `Field Size: ${crop.fieldSize} Acres`, color: '#16a34a' });
        }
      }
      
      if (crop.harvestExpectedDate) {
        if (safeDateStr(crop.harvestExpectedDate) === clickedDate) {
          dayEvents.push({ id: `h-${crop._id}`, type: 'Harvest', title: `Expected Harvest: ${crop.cropName}`, description: `Season: ${crop.season}`, color: '#ca8a04' });
        }
      }

      if (crop.activities && Array.isArray(crop.activities)) {
        crop.activities.forEach(act => {
          if (act.activityDate && safeDateStr(act.activityDate) === clickedDate) {
               dayEvents.push({ 
                 id: act._id || Math.random().toString(), 
                 type: 'Activity', 
                 title: `${crop.cropName} - ${act.activityType}`, 
                 description: act.activityName, 
                 color: '#2563eb',
                 isCompleted: act.isCompleted
               });
          }
        });
      }
    });

    setSelectedDateEvents({ date: clickedDate, events: dayEvents });
    setDayEventsModalVisible(true);
  };

  const getMarkedDates = () => {
    let marked = {};
    crops.forEach(crop => {
      if (crop.plantedDate) {
        const planted = safeDateStr(crop.plantedDate);
        if (planted) marked[planted] = { ...marked[planted], marked: true, dotColor: '#16a34a' };
      }
      if (crop.harvestExpectedDate) {
        const harvest = safeDateStr(crop.harvestExpectedDate);
        if (harvest) marked[harvest] = { ...marked[harvest], marked: true, dotColor: '#ca8a04' };
      }
      if (crop.activities && Array.isArray(crop.activities)) {
        crop.activities.forEach(act => {
          if (act.activityDate) {
             const actDate = safeDateStr(act.activityDate);
             if (actDate) marked[actDate] = { ...marked[actDate], marked: true, dotColor: '#2563eb' };
          }
        });
      }
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
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
              <Text style={styles.headerTitle}>Farm Performance Analytics</Text>
              <AnimatedPressable 
                style={[styles.addButton, buttonAnimatedStyle]} 
                onPress={() => openCropModal()}
                onPressIn={() => buttonScale.value = withSpring(0.9)}
                onPressOut={() => buttonScale.value = withSpring(1)}
              >
                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.addButtonText}>Log New Crop</Text>
              </AnimatedPressable>
            </Animated.View>

            {/* Analytics Card */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.analyticsCard}>
              <View style={styles.analyticsHeader}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.analyticsTitle}>Season Analysis</Text>
                  <Text style={styles.analyticsSub}>View detailed yields and income</Text>
                </View>
                <View style={styles.pickerContainerSmall}>
                  <Picker
                    selectedValue={selectedSeason}
                    style={styles.pickerSmall}
                    itemStyle={{ fontSize: 14, height: 45 }}
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
                    <Text style={styles.analyticsCropName}>{crop.cropName} <Text style={{fontWeight:'normal', color: '#9CA3AF'}}>({crop.fieldSize} Acres)</Text></Text>
                    <View style={styles.analyticsValues}>
                       <Text style={styles.aYield}>{crop.yieldAmount} Kg</Text>
                       <Text style={styles.aIncome}>Rs {crop.incomeAmount}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Animated.View entering={FadeInUp.duration(400)} style={styles.emptyAnalytics}>
                  <Text style={styles.emptyAnalyticsMsg}>No completed yield data for this season.</Text>
                  <Text style={styles.emptyAnalyticsSubmsg}>Update crop logs with harvest data to see them here.</Text>
                </Animated.View>
              )}
            </Animated.View>

            {/* Calendar Component */}
            <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.calendarCard}>
               <Text style={styles.sectionTitle}>Crop Calendar</Text>
               <Calendar
                 markedDates={getMarkedDates()}
                 onDayPress={handleDayPress}
                 theme={{
                   todayTextColor: '#10B981',
                   arrowColor: '#111827',
                   textMonthFontWeight: 'bold',
                   dotStyle: { width: 6, height: 6, borderRadius: 3, marginTop: 1 },
                   calendarBackground: 'transparent'
                 }}
               />
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(300).duration(600).springify()} style={[styles.sectionTitle, { marginLeft: 16, marginTop: 24, marginBottom: 12 }]}>
              Recent Crop Logs
            </Animated.Text>
          </>
        )}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(350 + (index * 100)).duration(500).springify()}>
            <CropCard 
              crop={item} 
              onAddActivity={openActivityModal}
              onUpdateYield={openYieldModal}
              onEdit={openCropModal}
              onDelete={handleDeleteCrop}
              onToggleActivity={handleToggleActivityStatus}
            />
          </Animated.View>
        )}
        ListEmptyComponent={() => (
           <Animated.View entering={FadeInUp.delay(400)} style={styles.emptyList}>
             <Ionicons name="leaf-outline" size={48} color="#D1D5DB" />
             <Text style={styles.emptyListText}>No crops logged yet. Start tracking your farm!</Text>
           </Animated.View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* MODALS RETAINED FOR FUNCTIONALITY */}
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

      <Modal isVisible={dayEventsModalVisible} onBackdropPress={() => setDayEventsModalVisible(false)} style={styles.bottomModal}>
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Events on {selectedDateEvents.date}</Text>
            <TouchableOpacity onPress={() => setDayEventsModalVisible(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          <ScrollView>
            {selectedDateEvents.events.length > 0 ? (
              selectedDateEvents.events.map((evt, idx) => (
                <View key={evt.id || idx} style={[styles.eventItem, { borderLeftColor: evt.color || '#10B981' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.eventTitle, { textDecorationLine: evt.isCompleted ? 'line-through' : 'none' }]}>{evt.title}</Text>
                    {evt.type === 'Activity' && (
                       <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: evt.isCompleted ? '#10B98120' : '#F59E0B20' }}>
                         <Text style={{ fontSize: 12, fontWeight: '700', color: evt.isCompleted ? '#10B981' : '#F59E0B' }}>
                           {evt.isCompleted ? 'Completed' : 'Pending'}
                         </Text>
                       </View>
                    )}
                  </View>
                  <Text style={styles.eventDesc}>{evt.description}</Text>
                </View>
              ))
            ) : (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                <Text style={{ color: '#6B7280', marginTop: 10 }}>No events or activities on this day.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {Platform.OS !== 'web' && datePickerOpen.open && (
        <DateTimePicker
          value={(() => {
            const val = datePickerOpen.field === 'activityDate' ? newActivityForm.activityDate : newCropForm[datePickerOpen.field];
            if (val instanceof Date && !isNaN(val.getTime())) return val;
            return new Date();
          })()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setDatePickerOpen({ open: false, field: null });
            if (event.type === 'set' && selectedDate) {
              if (datePickerOpen.field === 'activityDate') {
                setNewActivityForm(prev => ({...prev, activityDate: selectedDate}));
              } else if (datePickerOpen.field) {
                const field = datePickerOpen.field;
                setNewCropForm(prev => ({...prev, [field]: selectedDate}));
              }
            }
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
    padding: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827', flex: 1, letterSpacing: -0.5 },
  addButton: { 
    backgroundColor: '#10B981', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16, letterSpacing: -0.5 },
  
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  analyticsSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  pickerContainerSmall: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    width: 140,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    height: 45,
  },
  pickerSmall: { 
    height: 45,
    fontSize: 14,
    color: '#374151'
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  analyticsCropName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  analyticsValues: { alignItems: 'flex-end' },
  aYield: { fontSize: 14, fontWeight: '600', color: '#10B981', marginBottom: 2 },
  aIncome: { fontSize: 14, fontWeight: '800', color: '#F59E0B' },
  emptyAnalytics: { alignItems: 'center', paddingVertical: 20 },
  emptyAnalyticsMsg: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  emptyAnalyticsSubmsg: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  
  emptyList: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 20, backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 16, shadowOpacity: 0.05, shadowRadius: 10 },
  emptyListText: { color: '#6B7280', marginTop: 12, fontWeight: '500' },
  
  bottomModal: { justifyContent: 'flex-end', margin: 0 },
  sheetContent: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: '#F9FAFB' },
  pickerContainer: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#F9FAFB' },
  datePickerBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, backgroundColor: '#F9FAFB' },
  submitBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 20, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  
  eventItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  eventDesc: { fontSize: 14, color: '#6B7280', marginTop: 6, fontWeight: '500' }
});

export default FarmerTrackerScreen;
