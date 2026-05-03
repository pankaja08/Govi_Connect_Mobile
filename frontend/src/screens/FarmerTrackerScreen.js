import React, { useState, useEffect, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';
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

// ── Season Selector (replaces native Picker – works on iOS & Android) ──
const SEASONS = ['Yala', 'Maha', 'Inter-season'];
const SeasonSelector = ({ value, onChange, compact }) => (
    <View style={compact ? styles.seasonSelectorCompact : styles.seasonSelectorFull}>
        {SEASONS.map(s => (
            <TouchableOpacity
                key={s}
                style={[
                    compact ? styles.seasonOptionCompact : styles.seasonOptionFull,
                    value === s && (compact ? styles.seasonOptionCompactActive : styles.seasonOptionFullActive)
                ]}
                onPress={() => onChange(s)}
            >
                <Text style={[
                    compact ? styles.seasonOptionCompactText : styles.seasonOptionFullText,
                    value === s && styles.seasonOptionActiveText
                ]}>
                    {s === 'Inter-season' && compact ? 'Inter' : s}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

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
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await apiClient.delete(`/farm/crops/${id}`);
                        setCrops(crops.filter(c => c._id !== id));
                    } catch (error) {
                        showAlert('Error', 'Failed to delete crop');
                    }
                }
            }
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
        const today = new Date().toISOString().split('T')[0];
        let marked = {};

        const addDot = (dateStr, dot) => {
            if (!dateStr) return;
            if (!marked[dateStr]) marked[dateStr] = { dots: [] };
            // avoid duplicate dot keys
            if (!marked[dateStr].dots.find(d => d.key === dot.key)) {
                marked[dateStr].dots = [...marked[dateStr].dots, dot];
            }
        };

        crops.forEach(crop => {
            if (crop.plantedDate) {
                addDot(safeDateStr(crop.plantedDate), { key: `p-${crop._id}`, color: '#16a34a' });
            }
            if (crop.harvestExpectedDate) {
                const hDate = safeDateStr(crop.harvestExpectedDate);
                const isFutureHarvest = hDate && hDate >= today;
                addDot(hDate, { key: `h-${crop._id}`, color: isFutureHarvest ? '#F59E0B' : '#ca8a04' });
            }
            if (crop.activities && Array.isArray(crop.activities)) {
                crop.activities.forEach(act => {
                    if (act.activityDate) {
                        const actDate = safeDateStr(act.activityDate);
                        const isFuture = actDate && actDate > today;
                        addDot(actDate, {
                            key: act._id || `act-${Math.random()}`,
                            color: isFuture ? '#7C3AED' : '#2563eb'
                        });
                    }
                });
            }
        });
        return marked;
    };

    const ListHeader = useMemo(() => {
        // Show ALL crops for the selected season (with or without yield)
        const seasonAnalyticsCrops = crops.filter(c => c.season === selectedSeason);
        const totalYield = seasonAnalyticsCrops.reduce((sum, c) => sum + (c.yieldAmount || 0), 0);
        const totalIncome = seasonAnalyticsCrops.reduce((sum, c) => sum + (c.incomeAmount || 0), 0);

        return (
            <>
                <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
                    <Text style={styles.headerTitle}>Farm Tracker </Text>
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

                <FarmAnalytics
                    crops={crops}
                    selectedSeason={selectedSeason}
                    setSelectedSeason={setSelectedSeason}
                />

                <FarmCalendar
                    markedDates={getMarkedDates()}
                    onDayPress={handleDayPress}
                />

                <Animated.Text entering={FadeInDown.delay(300).duration(600).springify()} style={[styles.sectionTitle, { marginLeft: 16, marginTop: 24, marginBottom: 12 }]}>
                    Recent Crop Logs
                </Animated.Text>
            </>
        );
    }, [crops, selectedSeason, buttonAnimatedStyle]);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#10B981" /></View>;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={crops}
                keyExtractor={item => item._id}
                showsVerticalScrollIndicator={false}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={Platform.OS === 'android'}
                ListHeaderComponent={ListHeader}
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
                        <TextInput style={styles.input} value={newCropForm.cropName} onChangeText={t => setNewCropForm({ ...newCropForm, cropName: t })} placeholder="e.g. Paddy" />

                        <Text style={styles.inputLabel}>Season</Text>
                        <SeasonSelector
                            value={newCropForm.season}
                            onChange={v => setNewCropForm({ ...newCropForm, season: v })}
                        />

                        <Text style={styles.inputLabel}>Planted Date</Text>
                        {Platform.OS === 'web' ? (
                            <View style={styles.datePickerBtn}>
                                <WebDatePicker value={newCropForm.plantedDate} onChange={(d) => setNewCropForm({ ...newCropForm, plantedDate: d })} />
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.datePickerBtn}
                                onPress={() => setDatePickerOpen({ open: true, field: 'plantedDate' })}
                            >
                                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                                <Text style={styles.datePickerText}>{newCropForm.plantedDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.inputLabel}>Expected Harvest Date</Text>
                        {Platform.OS === 'web' ? (
                            <View style={styles.datePickerBtn}>
                                <WebDatePicker value={newCropForm.harvestExpectedDate} onChange={(d) => setNewCropForm({ ...newCropForm, harvestExpectedDate: d })} />
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.datePickerBtn}
                                onPress={() => setDatePickerOpen({ open: true, field: 'harvestExpectedDate' })}
                            >
                                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                                <Text style={styles.datePickerText}>{newCropForm.harvestExpectedDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.inputLabel}>Field Size (Acres)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={newCropForm.fieldSize} onChangeText={t => setNewCropForm({ ...newCropForm, fieldSize: t })} placeholder="e.g. 2.5" />

                        <Text style={styles.inputLabel}>Seed Variety</Text>
                        <TextInput style={styles.input} value={newCropForm.seedVariety} onChangeText={t => setNewCropForm({ ...newCropForm, seedVariety: t })} placeholder="e.g. BG 300" />

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
                    <View style={styles.activityTypeGrid}>
                        {['FERTILIZER', 'PESTICIDE', 'WEEDING', 'OTHER'].map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.activityTypeBtn,
                                    newActivityForm.activityType === type && styles.activityTypeBtnActive
                                ]}
                                onPress={() => setNewActivityForm({ ...newActivityForm, activityType: type })}
                            >
                                <Text style={[
                                    styles.activityTypeBtnText,
                                    newActivityForm.activityType === type && styles.activityTypeBtnTextActive
                                ]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput style={styles.input} value={newActivityForm.activityName} onChangeText={t => setNewActivityForm({ ...newActivityForm, activityName: t })} placeholder="e.g. Applied Urea" />
                    <Text style={styles.inputLabel}>Date Applied</Text>
                    {Platform.OS === 'web' ? (
                        <View style={styles.datePickerBtn}>
                            <WebDatePicker value={newActivityForm.activityDate} onChange={(d) => setNewActivityForm({ ...newActivityForm, activityDate: d })} />
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() => setDatePickerOpen({ open: true, field: 'activityDate' })}
                        >
                            <Ionicons name="calendar-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                            <Text style={styles.datePickerText}>{newActivityForm.activityDate.toLocaleDateString()}</Text>
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
                    <TextInput style={styles.input} keyboardType="numeric" value={yieldForm.yieldAmount} onChangeText={t => setYieldForm({ ...yieldForm, yieldAmount: t })} placeholder="e.g. 5000" />
                    <Text style={styles.inputLabel}>Income Received (LKR)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={yieldForm.incomeAmount} onChangeText={t => setYieldForm({ ...yieldForm, incomeAmount: t })} placeholder="e.g. 250000" />
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

            {/* ── Date Picker Modal (Refined to avoid deprecation warnings) ── */}
            {Platform.OS === 'ios' ? (
                <Modal
                    isVisible={datePickerOpen.open}
                    onBackdropPress={() => setDatePickerOpen({ open: false, field: null })}
                    style={{ justifyContent: 'flex-end', margin: 0 }}
                    backdropOpacity={0.4}
                >
                    <View style={styles.iosCalendarContainer}>
                        <View style={styles.iosPickerHeader}>
                            <Text style={styles.iosPickerTitle}>Select Date</Text>
                            <TouchableOpacity
                                onPress={() => setDatePickerOpen({ open: false, field: null })}
                                style={styles.doneBtnPill}
                            >
                                <Text style={styles.iosPickerDone}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inlinePickerWrapper}>
                            <DateTimePicker
                                value={(() => {
                                    const field = datePickerOpen.field;
                                    const val = field === 'activityDate'
                                        ? newActivityForm.activityDate
                                        : field ? newCropForm[field] : new Date();
                                    return (val instanceof Date && !isNaN(val.getTime())) ? val : new Date();
                                })()}
                                mode="date"
                                display="inline"
                                accentColor="#10B981"
                                onValueChange={(_event, date) => {
                                    if (date) {
                                        const field = datePickerOpen.field;
                                        if (field === 'activityDate') {
                                            setNewActivityForm(prev => ({ ...prev, activityDate: date }));
                                        } else if (field) {
                                            setNewCropForm(prev => ({ ...prev, [field]: date }));
                                        }
                                    }
                                }}
                            />
                        </View>
                    </View>
                </Modal>
            ) : (
                datePickerOpen.open && (
                    <DateTimePicker
                        value={(() => {
                            const field = datePickerOpen.field;
                            const val = field === 'activityDate'
                                ? newActivityForm.activityDate
                                : field ? newCropForm[field] : new Date();
                            return (val instanceof Date && !isNaN(val.getTime())) ? val : new Date();
                        })()}
                        mode="date"
                        display="default"
                        onValueChange={(_event, date) => {
                            setDatePickerOpen({ open: false, field: null });
                            if (date) {
                                const field = datePickerOpen.field;
                                if (field === 'activityDate') {
                                    setNewActivityForm(prev => ({ ...prev, activityDate: date }));
                                } else if (field) {
                                    setNewCropForm(prev => ({ ...prev, [field]: date }));
                                }
                            }
                        }}
                        onDismiss={() => setDatePickerOpen({ open: false, field: null })}
                    />
                )
            )}
        </SafeAreaView>
    );
};

// ── Internal Memoized Components for Performance ──

const FarmAnalytics = memo(({ crops, selectedSeason, setSelectedSeason }) => {
    const seasonAnalyticsCrops = crops.filter(c => c.season === selectedSeason);
    const totalYield = seasonAnalyticsCrops.reduce((sum, c) => sum + (c.yieldAmount || 0), 0);
    const totalIncome = seasonAnalyticsCrops.reduce((sum, c) => sum + (c.incomeAmount || 0), 0);

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
                <View>
                    <Text style={styles.analyticsTitle}>Season Analysis</Text>
                    <Text style={styles.analyticsSub}>Yields & income per crop</Text>
                </View>
            </View>

            <SeasonSelector value={selectedSeason} onChange={setSelectedSeason} compact />

            {seasonAnalyticsCrops.length > 0 ? (
                <>
                    <View style={styles.analyticsColHeader}>
                        <Text style={[styles.analyticsColText, { flex: 1 }]}>Crop</Text>
                        <Text style={styles.analyticsColText}>Yield (Kg)</Text>
                        <Text style={[styles.analyticsColText, { minWidth: 90, textAlign: 'right' }]}>Income (Rs)</Text>
                    </View>

                    {seasonAnalyticsCrops.map(crop => (
                        <View key={crop._id} style={styles.analyticsRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.analyticsCropName}>{crop.cropName}</Text>
                                <Text style={styles.analyticsCropSub}>{crop.fieldSize} Ac · {crop.seedVariety || '—'}</Text>
                            </View>
                            <Text style={styles.aYield}>{crop.yieldAmount > 0 ? crop.yieldAmount : '—'}</Text>
                            <Text style={styles.aIncome}>{crop.incomeAmount > 0 ? crop.incomeAmount.toLocaleString() : '—'}</Text>
                        </View>
                    ))}

                    {(totalYield > 0 || totalIncome > 0) && (
                        <View style={styles.analyticsTotalRow}>
                            <Text style={styles.analyticsTotalLabel}>Total</Text>
                            <Text style={styles.analyticsTotalYield}>{totalYield} Kg</Text>
                            <Text style={styles.analyticsTotalIncome}>Rs {totalIncome.toLocaleString()}</Text>
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.emptyAnalytics}>
                    <Ionicons name="leaf-outline" size={28} color="#D1D5DB" />
                    <Text style={styles.emptyAnalyticsMsg}>No crops logged for {selectedSeason} season.</Text>
                </View>
            )}
        </Animated.View>
    );
});

const FarmCalendar = memo(({ markedDates, onDayPress }) => (
    <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.calendarCard}>
        <Text style={styles.sectionTitle}>Crop Calendar</Text>
        <View style={styles.calLegend}>
            <View style={styles.calLegendItem}><View style={[styles.calDot, { backgroundColor: '#16a34a' }]} /><Text style={styles.calLegendText}>Planted</Text></View>
            <View style={styles.calLegendItem}><View style={[styles.calDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.calLegendText}>Harvest</Text></View>
            <View style={styles.calLegendItem}><View style={[styles.calDot, { backgroundColor: '#2563eb' }]} /><Text style={styles.calLegendText}>Activity</Text></View>
            <View style={styles.calLegendItem}><View style={[styles.calDot, { backgroundColor: '#7C3AED' }]} /><Text style={styles.calLegendText}>Upcoming</Text></View>
        </View>

        <Calendar
            markingType='multi-dot'
            markedDates={markedDates}
            onDayPress={onDayPress}
            style={styles.calendarStyle}
            theme={{
                todayBackgroundColor: '#10B981',
                todayTextColor: '#ffffff',
                arrowColor: '#111827',
                textMonthFontWeight: '800',
                textMonthFontSize: 14,
                textDayFontSize: 12,
                textDayHeaderFontSize: 11,
                calendarBackground: 'transparent',
                dayTextColor: '#374151',
                textSectionTitleColor: '#9CA3AF',
                selectedDayBackgroundColor: '#10B981',
            }}
        />
    </Animated.View>
));

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp('5%'),
        paddingBottom: hp('2%'),
    },
    headerTitle: { fontSize: wp('6%'), fontWeight: '800', color: '#111827', flex: 1, letterSpacing: -0.5 },
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
    // ── Season Selector styles ──
    seasonSelectorFull: {
        flexDirection: 'row',
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        padding: 4,
        marginBottom: 8,
    },
    seasonOptionFull: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    seasonOptionFullActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    seasonOptionFullText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
    seasonSelectorCompact: {
        flexDirection: 'row',
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        padding: 3,
        marginBottom: 12,
    },
    seasonOptionCompact: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        borderRadius: 8,
    },
    seasonOptionCompactActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 3,
        elevation: 2,
    },
    seasonOptionCompactText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
    seasonOptionActiveText: { color: '#10B981', fontWeight: '800' },

    // ── Analytics Card styles ──
    analyticsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    analyticsTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
    analyticsSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    analyticsColHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
        marginBottom: 4,
    },
    analyticsColText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4, minWidth: 70, textAlign: 'right' },
    analyticsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 8,
    },
    analyticsCropName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    analyticsCropSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
    aYield: { fontSize: 13, fontWeight: '700', color: '#10B981', minWidth: 70, textAlign: 'right' },
    aIncome: { fontSize: 13, fontWeight: '800', color: '#F59E0B', minWidth: 90, textAlign: 'right' },
    analyticsTotalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 4,
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
        gap: 8,
    },
    analyticsTotalLabel: { flex: 1, fontSize: 14, fontWeight: '800', color: '#111827' },
    analyticsTotalYield: { fontSize: 13, fontWeight: '800', color: '#059669', minWidth: 70, textAlign: 'right' },
    analyticsTotalIncome: { fontSize: 13, fontWeight: '800', color: '#D97706', minWidth: 90, textAlign: 'right' },
    emptyAnalytics: { alignItems: 'center', paddingVertical: 20, gap: 6 },
    emptyAnalyticsMsg: { fontSize: 14, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
    emptyAnalyticsSubmsg: { fontSize: 12, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },

    // ── Calendar styles ──
    calendarStyle: { marginHorizontal: -6 },
    calLegend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
    calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    calDot: { width: 8, height: 8, borderRadius: 4 },
    calLegendText: { fontSize: 10, color: '#6B7280', fontWeight: '600' },

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
    datePickerBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center' },
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
    eventDesc: { fontSize: 14, color: '#6B7280', marginTop: 6, fontWeight: '500' },

    activityTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 4,
    },
    activityTypeBtn: {
        flex: 1,
        minWidth: '45%',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    activityTypeBtnActive: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    activityTypeBtnText: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
    activityTypeBtnTextActive: { color: '#059669' },

    // iOS Date Picker Modal (Polished)
    iosCalendarContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    iosPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iosPickerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    iosPickerDone: { fontSize: 15, color: '#fff', fontWeight: '700' },
    doneBtnPill: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    inlinePickerWrapper: {
        padding: 10,
    },
    // Date picker text
    datePickerText: { fontSize: 15, color: '#374151', fontWeight: '500' },
});

export default FarmerTrackerScreen;