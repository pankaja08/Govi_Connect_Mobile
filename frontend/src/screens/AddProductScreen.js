import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, Image, Platform, ActionSheetIOS,
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { productApi } from '../api/productApi';
import { AuthContext } from '../context/AuthContext';

const CLOUD_NAME    = 'dkwyk8nih';
const UPLOAD_PRESET = 'govi_connect_blog';

// Upload a local file URI directly to Cloudinary (unsigned preset)
const uploadToCloudinary = async (uri) => {
    if (!uri) return '';
    // Already a remote URL — no re-upload needed
    if (uri.startsWith('http')) return uri;

    const ext      = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const filename = `product_${Date.now()}.${ext}`;

    const form = new FormData();
    form.append('file',           { uri, name: filename, type: mimeType });
    form.append('upload_preset',  UPLOAD_PRESET);
    form.append('folder',         'Market Products');

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: form }
    );
    const data = await res.json();
    if (!data.secure_url) throw new Error(data.error?.message || 'Image upload failed');
    return data.secure_url;
};

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Seeds', 'Fertilizers', 'Equipment', 'Other'];
const UNITS = ['Kg', 'g', 'L', 'ml', 'piece', 'Packet', 'bag', 'box', 'bundle'];
const SALE_TYPES = ['Retail Only', 'Wholesale Only', 'Retail & Wholesale'];

const PickerRow = ({ label, options, value, onChange }) => (
    <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
            {options.map(opt => (
                <TouchableOpacity
                    key={opt}
                    style={[styles.optionPill, value === opt && styles.optionPillActive]}
                    onPress={() => onChange(opt)}
                >
                    <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>{opt}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    </View>
);

const AddProductScreen = ({ route, navigation }) => {
    const { editProduct } = route.params || {};
    const { userRole } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('Kg');
    const [category, setCategory] = useState('');
    const [saleType, setSaleType] = useState('Retail & Wholesale');
    const [contactNumber, setContactNumber] = useState('');
    const [location, setLocation] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    // Guard: guests cannot list products
    useEffect(() => {
        if (userRole === 'Guest') {
            Alert.alert(
                'Login Required',
                'You need to be a registered user to list products on Govi Mart.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        }
    }, [userRole]);

    // Pre-fill form if editing
    useEffect(() => {
        if (editProduct) {
            setName(editProduct.name || '');
            setDescription(editProduct.description || '');
            setPrice(editProduct.price?.toString() || '');
            setQuantity(editProduct.quantity?.toString() || '');
            setUnit(editProduct.unit || 'Kg');
            setCategory(editProduct.category || '');
            setSaleType(editProduct.saleType || 'Retail & Wholesale');
            setContactNumber(editProduct.contactNumber || '');
            setLocation(editProduct.location || '');
            setImage(editProduct.image || null);
        }
    }, [editProduct]);

    const openImagePicker = async (useCamera = false) => {
        try {
            // Request the right permission
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Please allow camera access in your device settings.');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Please allow photo library access in your device settings.');
                    return;
                }
            }

            const options = {
                mediaTypes: ['images'],       // ✅ new API (expo-image-picker v15+)
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            };

            const result = useCamera
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

            if (!result.canceled && result.assets?.length > 0) {
                setImage(result.assets[0].uri);  // store local URI, upload on submit
            }
        } catch (err) {
            console.log('ImagePicker error:', err);
            Alert.alert('Error', 'Could not open image picker. Please try again.');
        }
    };

    const pickImage = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Take Photo', 'Choose from Library'],
                    cancelButtonIndex: 0,
                },
                (idx) => {
                    if (idx === 1) openImagePicker(true);
                    if (idx === 2) openImagePicker(false);
                }
            );
        } else {
            // Android: show Alert-based choice
            Alert.alert(
                'Product Image',
                'Choose an option',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: '📷  Take Photo',        onPress: () => openImagePicker(true) },
                    { text: '🖼️  Choose from Library', onPress: () => openImagePicker(false) },
                ]
            );
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) return Alert.alert('Missing Field', 'Please enter a product name.');
        if (!description.trim()) return Alert.alert('Missing Field', 'Please enter a product description.');
        if (!price || parseFloat(price) <= 0) return Alert.alert('Invalid Price', 'Price must be greater than 0.');
        if (!quantity || parseInt(quantity) <= 0) return Alert.alert('Invalid Quantity', 'Quantity must be at least 1.');
        if (!category) return Alert.alert('Missing Field', 'Please select a category.');
        if (!image) return Alert.alert('Missing Image', 'Please add a product image.');
        
        const phoneRegex = /^0\d{9}$/;
        if (!contactNumber.trim() || !phoneRegex.test(contactNumber.trim())) {
            return Alert.alert('Invalid Contact', 'Please enter a valid 10-digit contact number starting with 0.');
        }
        
        if (!location.trim()) return Alert.alert('Missing Field', 'Please enter the pickup location.');

        setLoading(true);
        try {
            // Upload image to Cloudinary first (if a local URI is set)
            let imageUrl = '';
            if (image) {
                imageUrl = await uploadToCloudinary(image);
            }

            const payload = {
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price),
                quantity: parseInt(quantity),
                unit,
                category,
                saleType,
                image: imageUrl,
                contactNumber: contactNumber.trim(),
                location: location.trim(),
            };

            if (editProduct) {
                await productApi.update(editProduct._id, payload);
                Alert.alert(
                    '✅ Product Updated!',
                    'Your product has been updated successfully.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                await productApi.create(payload);
                Alert.alert(
                    '✅ Product Listed!',
                    'Your product has been listed on Govi Mart and is pending review.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || err.message || 'Could not list product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView 
                style={styles.screen} 
                keyboardShouldPersistTaps="handled" 
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                keyboardDismissMode="on-drag"
            >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editProduct ? 'Edit Product' : 'List a Product'}</Text>
            </View>

            <View style={styles.form}>
                {/* Product Name */}
                <View style={styles.field}>
                    <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="e.g. Fresh Tomatoes (Hybrid)" value={name} onChangeText={setName} />
                </View>

                {/* Description */}
                <View style={styles.field}>
                    <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe your product..."
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Price + Quantity */}
                <View style={styles.row}>
                    <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Price (Rs.) <Text style={styles.required}>*</Text></Text>
                        <TextInput style={styles.input} placeholder="350.00" keyboardType="numeric" value={price} onChangeText={setPrice} />
                    </View>
                    <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.label}>Quantity <Text style={styles.required}>*</Text></Text>
                        <TextInput style={styles.input} placeholder="100" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                    </View>
                </View>

                {/* Unit */}
                <PickerRow label="Unit" options={UNITS} value={unit} onChange={setUnit} />

                {/* Category */}
                <View style={styles.field}>
                    <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.optionPill, category === cat && styles.optionPillActive]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[styles.optionText, category === cat && styles.optionTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Sale Type */}
                <View style={styles.field}>
                    <Text style={styles.label}>Sale Type <Text style={styles.required}>*</Text></Text>
                    <Text style={styles.hint}>Choose whether you sell retail quantities, bulk wholesale, or both.</Text>
                    {SALE_TYPES.map(st => (
                        <TouchableOpacity key={st} style={styles.radioRow} onPress={() => setSaleType(st)}>
                            <View style={[styles.radio, saleType === st && styles.radioActive]}>
                                {saleType === st && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.radioLabel, saleType === st && styles.radioLabelActive]}>{st}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Product Image */}
                <View style={styles.field}>
                    <Text style={styles.label}>Product Image <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="camera-outline" size={36} color="#2E7D32" />
                                <Text style={styles.imagePickerText}>Choose Image</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {image && (
                        <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImage}>
                            <Ionicons name="close-circle" size={20} color="#E53935" />
                            <Text style={{ color: '#E53935', marginLeft: 4, fontSize: 13 }}>Remove image</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Contact + Location */}
                <View style={styles.row}>
                    <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Contact Number <Text style={styles.required}>*</Text></Text>
                        <TextInput style={styles.input} placeholder="0718474118" keyboardType="phone-pad" value={contactNumber} onChangeText={setContactNumber} />
                    </View>
                    <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
                        <TextInput style={styles.input} placeholder="Jaffna" value={location} onChangeText={setLocation} />
                    </View>
                </View>

                {/* Submit */}
                <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.submitBtnText}>🚀  {editProduct ? 'Update Product' : 'List Product'}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
            <View style={{ height: 60 }} />
        </ScrollView>
    </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F5F5F5' },

    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },

    form: { padding: 16 },

    field: { marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
    required: { color: '#E53935' },
    hint: { fontSize: 12, color: '#888', marginBottom: 10 },
    input: { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: '#fff', color: '#1A1A1A' },
    textArea: { height: 100, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },

    optionRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
    optionPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff' },
    optionPillActive: { borderColor: '#2E7D32', backgroundColor: '#2E7D32' },
    optionText: { fontSize: 13, color: '#555', fontWeight: '600' },
    optionTextActive: { color: '#fff' },

    radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    radioActive: { borderColor: '#2E7D32' },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
    radioLabel: { fontSize: 14, color: '#555', fontWeight: '500' },
    radioLabelActive: { color: '#2E7D32', fontWeight: '700' },

    imagePicker: { borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', borderRadius: 14, overflow: 'hidden', backgroundColor: '#FAFAFA' },
    imagePlaceholder: { height: 130, justifyContent: 'center', alignItems: 'center', gap: 8 },
    imagePickerText: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
    previewImage: { width: '100%', height: 200 },
    removeImage: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },

    submitBtn: { backgroundColor: '#2E7D32', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});

export default AddProductScreen;
