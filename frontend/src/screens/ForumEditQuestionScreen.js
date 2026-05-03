import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const CATEGORIES = [
    'General Farming',
    'Pest & Disease Management',
    'Fertilizer Usage',
    'Crop Cultivation',
    'Weather & Irrigation',
    'Market Prices',
];

const ForumEditQuestionScreen = ({ navigation, route }) => {
    const { question } = route.params;
    const [editText, setEditText] = useState(question?.text || '');
    const [editCategory, setEditCategory] = useState(question?.category || '');
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSaveEdit = async () => {
        const wordCount = editText.trim().split(/\s+/).filter(w => w.length > 0).length;

        if (!editCategory || editText.trim().length < 10) {
            Alert.alert('Incomplete', 'Please provide a category and a valid question (at least 10 characters).');
            return;
        }

        if (wordCount < 4) {
            Alert.alert('Too Short', 'Please enter at least 4 words in your question.');
            return;
        }
        try {
            setIsSubmitting(true);
            await apiClient.patch(`/forum/${question._id}`, { text: editText.trim(), category: editCategory });
            Alert.alert('Success', 'Question updated successfully!');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Could not update question.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Question</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
                    <View style={styles.formContainer}>
                        <Text style={styles.inputLabel}>Category</Text>
                        <TouchableOpacity style={styles.categoryPickerBtn} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
                            <Text style={[styles.categoryPickerText, { color: editCategory ? '#2E7D32' : '#999' }]}>
                                {editCategory || 'Select Category'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="#333" />
                        </TouchableOpacity>

                        {showCategoryPicker && (
                            <View style={styles.categoryList}>
                                {CATEGORIES.map(c => (
                                    <TouchableOpacity key={c} style={styles.categoryItem} onPress={() => { setEditCategory(c); setShowCategoryPicker(false); }}>
                                        <Text style={styles.categoryItemText}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={styles.inputLabel}>Question details</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            placeholder="What's your question?"
                            placeholderTextColor="#777"
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} disabled={isSubmitting}>
                            <Text style={styles.saveBtnText}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F8F2' },
    headerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32', paddingHorizontal: 16, paddingTop: 26, paddingBottom: 14, minHeight: 82 },
    backButton: { marginRight: 12, padding: 6 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    container: { flex: 1, paddingHorizontal: 16, backgroundColor: '#F3F8F2' },
    containerContent: { paddingBottom: 40 },
    formContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 22, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#1B3A1F', marginBottom: 8, marginTop: 10 },
    categoryPickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 10 },
    categoryPickerText: { fontSize: 14, fontWeight: '600' },
    categoryList: { backgroundColor: '#fff', borderRadius: 10, elevation: 2, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
    categoryItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    categoryItemText: { fontSize: 13, color: '#333' },
    editInput: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, minHeight: 150, textAlignVertical: 'top', marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    saveBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 10, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

export default ForumEditQuestionScreen;
