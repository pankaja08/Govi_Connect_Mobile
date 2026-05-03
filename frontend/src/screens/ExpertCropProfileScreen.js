import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import {
    createCrop,
    deleteCrop,
    getAllCrops,
    getLocations,
    getSeasons,
    getSoilTypes,
    updateCrop,
} from '../api/cropAdvisoryApi';

const defaultForm = {
    cropName: '',
    careInstructions: '',
    locations: [],
    seasons: [],
    soilTypes: [],
    fertilizers: '',
    diseases: '',
    imageUrl: '',
};

const toNames = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean);
};

const toCsv = (value) => toNames(value).join(', ');

const csvToArray = (value) =>
    String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const getImagePayload = (asset) => {
    if (!asset?.uri) return null;

    if (Platform.OS === 'web' && asset.file) {
        return asset.file;
    }

    const fileName = asset.fileName || asset.uri.split('/').pop() || `crop-${Date.now()}.jpg`;
    const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : 'jpg';
    const type = asset.mimeType || `image/${extension}`;

    return {
        uri: asset.uri,
        name: fileName,
        type,
    };
};

const ExpertCropProfileScreen = ({ navigation }) => {
    const { userRole } = React.useContext(AuthContext);
    const { width } = useWindowDimensions();
    const [crops, setCrops] = useState([]);
    const [locations, setLocations] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [soilTypes, setSoilTypes] = useState([]);
    const [form, setForm] = useState(defaultForm);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const isManager = userRole === 'Expert' || userRole === 'Admin';
    const isEditing = !!editingId;
    const cardsPerRow = width >= 1200 ? 4 : width >= 900 ? 3 : 2;
    const gridGap = 10;
    const cardWidth = (width - 32 - gridGap * (cardsPerRow - 1)) / cardsPerRow;

    const loadPageData = useCallback(async () => {
        try {
            setLoading(true);
            const [cropsData, locationsData, seasonsData, soilTypesData] = await Promise.all([
                getAllCrops(),
                getLocations(),
                getSeasons(),
                getSoilTypes(),
            ]);
            setCrops(cropsData);
            setLocations(locationsData);
            setSeasons(seasonsData);
            setSoilTypes(soilTypesData);
        } catch (error) {
            Alert.alert('Error', 'Failed to load crop profile data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPageData();
    }, [loadPageData]);

    const resetForm = () => {
        setForm(defaultForm);
        setSelectedImage(null);
        setEditingId(null);
    };

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const toggleMultiSelect = (key, value) => {
        setForm((prev) => {
            const currentValues = prev[key] || [];
            const exists = currentValues.includes(value);
            return {
                ...prev,
                [key]: exists
                    ? currentValues.filter((item) => item !== value)
                    : [...currentValues, value],
            };
        });
    };

    const pickImage = async () => {
        try {
            if (Platform.OS !== 'web') {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permissionResult.granted) {
                    Alert.alert('Permission required', 'Please allow photo access to upload crop images.');
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.[0]) return;
            setSelectedImage(result.assets[0]);
            updateField('imageUrl', '');
        } catch (error) {
            Alert.alert('Error', 'Could not open image picker.');
        }
    };

    const handleEdit = (crop) => {
        setEditingId(crop._id);
        setSelectedImage(null);
        setForm({
            cropName: crop.cropName || '',
            careInstructions: crop.careInstructions || '',
            locations: toNames(crop.locations),
            seasons: toNames(crop.seasons),
            soilTypes: toNames(crop.soilTypes),
            fertilizers: toCsv(crop.fertilizers),
            diseases: toCsv(crop.diseases),
            imageUrl: crop.imageUrl || '',
        });
    };

    const buildFormData = () => {
        const body = new FormData();
        body.append('cropName', form.cropName.trim());
        body.append('careInstructions', form.careInstructions.trim());
        body.append('locations', JSON.stringify(form.locations));
        body.append('seasons', JSON.stringify(form.seasons));
        body.append('soilTypes', JSON.stringify(form.soilTypes));
        body.append('fertilizers', JSON.stringify(csvToArray(form.fertilizers)));
        body.append('diseases', JSON.stringify(csvToArray(form.diseases)));

        const imagePayload = getImagePayload(selectedImage);
        if (imagePayload) {
            body.append('image', imagePayload);
        } else if (form.imageUrl.trim()) {
            body.append('imageUrl', form.imageUrl.trim());
        }

        return body;
    };

    const handleSave = async () => {
        if (!form.cropName.trim() || !form.careInstructions.trim()) {
            Alert.alert('Missing details', 'Crop name and care instructions are required.');
            return;
        }
        if (!form.locations.length || !form.seasons.length) {
            Alert.alert('Missing details', 'At least one location and one season are required.');
            return;
        }

        try {
            setSaving(true);
            const payload = buildFormData();
            if (isEditing) {
                await updateCrop(editingId, payload);
            } else {
                await createCrop(payload);
            }
            await loadPageData();
            resetForm();
            Alert.alert('Success', isEditing ? 'Crop updated successfully.' : 'Crop added successfully.');
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to save crop.');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (id) => {
        const runDelete = async () => {
            try {
                setDeletingId(id);
                await deleteCrop(id);
                await loadPageData();
                if (editingId === id) resetForm();
            } catch (error) {
                const message = error?.response?.data?.message || 'Failed to delete crop.';
                Alert.alert('Error', message);
            } finally {
                setDeletingId(null);
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to delete this crop?');
            if (confirmed) {
                runDelete();
            }
            return;
        }

        Alert.alert('Delete crop', 'Are you sure you want to delete this crop?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: runDelete,
            },
        ]);
    };

    const inputOptions = useMemo(
        () => ({
            locations: locations.map((item) => item.name),
            seasons: seasons.map((item) => item.name),
            soilTypes: soilTypes.map((item) => item.name),
        }),
        [locations, seasons, soilTypes]
    );

    if (!isManager) {
        return (
            <View style={styles.centerBox}>
                <MaterialCommunityIcons name="lock-outline" size={44} color="#5d6b7a" />
                <Text style={styles.lockTitle}>Expert/Admin access required</Text>
                <Text style={styles.lockText}>Crop management is only available for expert and admin users.</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#0f9258" />
                <Text style={styles.loadingText}>Loading crop profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('ExpertHome')}>
                <MaterialCommunityIcons name="arrow-left" size={18} color="#0f9258" />
                <Text style={styles.backButtonText}>Back to Expert Home</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Crop Profile Management</Text>
            <Text style={styles.subtitle}>Add, view, update, and delete crop details stored in MongoDB.</Text>

            <View style={styles.formCard}>
                <Text style={styles.formHeading}>{isEditing ? 'Update Crop' : 'Add New Crop'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Crop name"
                    value={form.cropName}
                    onChangeText={(value) => updateField('cropName', value)}
                />
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    multiline
                    placeholder="Care instructions"
                    value={form.careInstructions}
                    onChangeText={(value) => updateField('careInstructions', value)}
                />
                <View style={styles.multiSelectBlock}>
                    <Text style={styles.multiSelectLabel}>Locations *</Text>
                    <View style={styles.optionWrap}>
                        {inputOptions.locations.map((name) => {
                            const selected = form.locations.includes(name);
                            return (
                                <TouchableOpacity
                                    key={name}
                                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                                    onPress={() => toggleMultiSelect('locations', name)}
                                >
                                    <MaterialCommunityIcons
                                        name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                        size={18}
                                        color={selected ? '#0f9258' : '#6d7a86'}
                                    />
                                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.multiSelectBlock}>
                    <Text style={styles.multiSelectLabel}>Seasons *</Text>
                    <View style={styles.optionWrap}>
                        {inputOptions.seasons.map((name) => {
                            const selected = form.seasons.includes(name);
                            return (
                                <TouchableOpacity
                                    key={name}
                                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                                    onPress={() => toggleMultiSelect('seasons', name)}
                                >
                                    <MaterialCommunityIcons
                                        name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                        size={18}
                                        color={selected ? '#0f9258' : '#6d7a86'}
                                    />
                                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.multiSelectBlock}>
                    <Text style={styles.multiSelectLabel}>Soil Types (optional)</Text>
                    <View style={styles.optionWrap}>
                        {inputOptions.soilTypes.map((name) => {
                            const selected = form.soilTypes.includes(name);
                            return (
                                <TouchableOpacity
                                    key={name}
                                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                                    onPress={() => toggleMultiSelect('soilTypes', name)}
                                >
                                    <MaterialCommunityIcons
                                        name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                        size={18}
                                        color={selected ? '#0f9258' : '#6d7a86'}
                                    />
                                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Fertilizers (comma separated)"
                    value={form.fertilizers}
                    onChangeText={(value) => updateField('fertilizers', value)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Diseases (comma separated)"
                    value={form.diseases}
                    onChangeText={(value) => updateField('diseases', value)}
                />

                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <MaterialCommunityIcons name="image-plus" size={20} color="#0f9258" />
                    <Text style={styles.imageButtonText}>{selectedImage ? 'Change Image' : 'Upload Crop Image'}</Text>
                </TouchableOpacity>

                {!selectedImage && (
                    <TextInput
                        style={styles.input}
                        placeholder="Or paste existing Cloudinary image URL"
                        value={form.imageUrl}
                        onChangeText={(value) => updateField('imageUrl', value)}
                    />
                )}

                {(selectedImage?.uri || form.imageUrl) && (
                    <Image source={{ uri: selectedImage?.uri || form.imageUrl }} style={styles.previewImage} />
                )}

                <View style={styles.formActions}>
                    <TouchableOpacity
                        style={[styles.primaryButton, saving && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? <ActivityIndicator color="#fff" size="small" /> : null}
                        <Text style={styles.primaryButtonText}>{isEditing ? 'Update Crop' : 'Save Crop'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
                        <Text style={styles.secondaryButtonText}>{isEditing ? 'Cancel Edit' : 'Clear'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.listHeaderRow}>
                <Text style={styles.listHeading}>Crops In System ({crops.length})</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={loadPageData}>
                    <MaterialCommunityIcons name="refresh" size={16} color="#0f9258" />
                    <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.gridWrap}>
                {crops.map((crop) => (
                    <View key={crop._id} style={[styles.cropCard, { width: cardWidth }]}>
                        <Image
                            source={{ uri: crop.imageUrl || 'https://via.placeholder.com/280x150?text=No+Image' }}
                            style={styles.cropImage}
                        />
                        <View style={styles.cropBody}>
                            <Text style={styles.cropName} numberOfLines={1}>{crop.cropName}</Text>
                            <Text style={styles.cropMeta} numberOfLines={2}>
                                Locations: {toNames(crop.locations).join(', ') || 'N/A'}
                            </Text>
                            <Text style={styles.cropMeta} numberOfLines={1}>
                                Seasons: {toNames(crop.seasons).join(', ') || 'N/A'}
                            </Text>
                            <Text style={styles.cropMeta} numberOfLines={2}>
                                {crop.careInstructions}
                            </Text>
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(crop)}>
                                    <MaterialCommunityIcons name="pencil-outline" size={14} color="#0f9258" />
                                    <Text style={styles.editText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => confirmDelete(crop._id)}
                                    disabled={deletingId === crop._id}
                                >
                                    {deletingId === crop._id ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="delete-outline" size={14} color="#fff" />
                                            <Text style={styles.deleteText}>Delete</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f4' },
    content: { padding: 16, paddingBottom: 30 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f2f7f4' },
    backButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f6ee',
        borderWidth: 1,
        borderColor: '#b8dec9',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginBottom: 10,
    },
    backButtonText: { marginLeft: 6, color: '#0f9258', fontWeight: '700' },
    loadingText: { marginTop: 10, color: '#4f5d6b' },
    lockTitle: { marginTop: 10, fontSize: 18, fontWeight: '700', color: '#314052' },
    lockText: { marginTop: 6, color: '#5d6b7a', textAlign: 'center' },
    title: { fontSize: 25, fontWeight: '800', color: '#1f2d3d' },
    subtitle: { marginTop: 6, color: '#5e6b78', marginBottom: 14 },
    formCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e6eeea' },
    formHeading: { fontSize: 19, fontWeight: '700', color: '#1f2d3d', marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#d9e2dd',
        borderRadius: 10,
        backgroundColor: '#fbfdfc',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10,
    },
    multilineInput: { minHeight: 90, textAlignVertical: 'top' },
    multiSelectBlock: { marginBottom: 12 },
    multiSelectLabel: { fontSize: 14, fontWeight: '700', color: '#314052', marginBottom: 8 },
    optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1ddd6',
        backgroundColor: '#f8fcf9',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 2,
    },
    optionChipSelected: {
        borderColor: '#0f9258',
        backgroundColor: '#e9f7ef',
    },
    optionText: { marginLeft: 6, color: '#4f5d6b', fontWeight: '600' },
    optionTextSelected: { color: '#0f9258' },
    imageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#8dc2a8',
        backgroundColor: '#effaf4',
        borderRadius: 10,
        paddingVertical: 12,
        marginBottom: 10,
    },
    imageButtonText: { marginLeft: 8, color: '#0f9258', fontWeight: '700' },
    previewImage: { width: '100%', height: 160, borderRadius: 10, marginBottom: 10 },
    formActions: { flexDirection: 'row', gap: 10 },
    primaryButton: {
        flex: 1,
        backgroundColor: '#0f9258',
        borderRadius: 10,
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: { color: '#fff', fontWeight: '700' },
    secondaryButton: {
        minWidth: 94,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ced9d2',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    secondaryButtonText: { color: '#425160', fontWeight: '600' },
    disabledButton: { opacity: 0.7 },
    listHeaderRow: { marginTop: 20, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listHeading: { fontSize: 20, fontWeight: '700', color: '#1f2d3d' },
    refreshButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#e7f6ee', borderRadius: 20 },
    refreshText: { marginLeft: 5, color: '#0f9258', fontWeight: '700' },
    gridWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
    cropCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e6eeea' },
    cropImage: { width: '100%', height: 95, backgroundColor: '#edf2ef' },
    cropBody: { padding: 10 },
    cropName: { fontSize: 15, fontWeight: '700', color: '#1f2d3d', marginBottom: 5 },
    cropMeta: { color: '#4f5d6b', marginBottom: 3, lineHeight: 16, fontSize: 12 },
    cardActions: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
    editButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#9ad0b5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7 },
    editText: { marginLeft: 5, color: '#0f9258', fontWeight: '700' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d9534f', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, minWidth: 74, justifyContent: 'center', gap: 4 },
    deleteText: { color: '#fff', fontWeight: '700' },
});

export default ExpertCropProfileScreen;