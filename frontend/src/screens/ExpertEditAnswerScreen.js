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
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';

const ExpertEditAnswerScreen = ({ navigation, route }) => {
    const { questionId, answer } = route.params;
    const [editText, setEditText] = useState(answer?.text || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        if (editText.trim().length < 5) {
            if (Platform.OS === 'web') {
                window.alert('Answer must be at least 5 characters.');
            } else {
                Alert.alert('Too Short', 'Please provide a more detailed answer (at least 5 characters).');
            }
            return;
        }

        try {
            setIsSubmitting(true);
            await apiClient.patch(
                `/forum/${questionId}/answers/${answer._id}`,
                { text: editText.trim() }
            );
            if (Platform.OS === 'web') {
                window.alert('Answer updated successfully!');
            } else {
                Alert.alert('Success', 'Your answer has been updated.');
            }
            navigation.goBack();
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not update answer.';
            if (Platform.OS === 'web') {
                window.alert(msg);
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Edit Expert Answer</Text>
                    <Text style={styles.headerSub}>Update your official response</Text>
                </View>
                <View style={styles.expertBadge}>
                    <Ionicons name="shield-checkmark" size={18} color="#F5A623" />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Original Question Preview */}
                    <View style={styles.questionPreviewCard}>
                        <View style={styles.questionPreviewHeader}>
                            <Ionicons name="help-circle-outline" size={16} color="#2E7D32" />
                            <Text style={styles.questionPreviewLabel}>Question</Text>
                        </View>
                        <Text style={styles.questionPreviewText} numberOfLines={3}>
                            {route.params?.questionText || 'Forum question'}
                        </Text>
                    </View>

                    {/* Edit Form Card */}
                    <View style={styles.formCard}>
                        <View style={styles.formCardHeader}>
                            <View style={styles.expertAvatarSmall}>
                                <Ionicons name="person" size={16} color="#2E7D32" />
                            </View>
                            <Text style={styles.formCardTitle}>Expert Answer</Text>
                        </View>

                        <Text style={styles.inputLabel}>
                            Answer Text <Text style={{ color: 'red' }}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.editInput}
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            placeholder="Share your expert knowledge here..."
                            placeholderTextColor="#a0a0a0"
                            textAlignVertical="top"
                        />

                        <View style={styles.charCountRow}>
                            <Ionicons
                                name={editText.trim().length >= 5 ? 'checkmark-circle' : 'alert-circle'}
                                size={14}
                                color={editText.trim().length >= 5 ? '#2E7D32' : '#E57373'}
                            />
                            <Text
                                style={[
                                    styles.charCount,
                                    { color: editText.trim().length >= 5 ? '#2E7D32' : '#E57373' },
                                ]}
                            >
                                {editText.trim().length} characters{' '}
                                {editText.trim().length < 5 ? '(min 5 required)' : ''}
                            </Text>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={isSubmitting}
                        >
                            <Ionicons
                                name={isSubmitting ? 'hourglass-outline' : 'checkmark-circle-outline'}
                                size={18}
                                color="#fff"
                                style={{ marginRight: 8 }}
                            />
                            <Text style={styles.saveBtnText}>
                                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => navigation.goBack()}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Info Note */}
                    <View style={styles.noteCard}>
                        <Ionicons name="information-circle-outline" size={16} color="#1565C0" />
                        <Text style={styles.noteText}>
                            Your updated answer will be visible to all farmers immediately after saving.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F8F2',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 26,
        paddingBottom: 16,
        minHeight: Platform.OS === 'android' ? 90 : 76,
    },
    backButton: {
        marginRight: 12,
        padding: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerCenter: {
        flex: 1,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        marginTop: 2,
    },
    expertBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 50,
    },
    questionPreviewCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#2E7D32',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    questionPreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionPreviewLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#2E7D32',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 6,
    },
    questionPreviewText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        lineHeight: 20,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 14,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    formCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    expertAvatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#A5D6A7',
    },
    formCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1B3A1F',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1B3A1F',
        marginBottom: 10,
    },
    editInput: {
        backgroundColor: '#F9FBF9',
        borderRadius: 12,
        padding: 14,
        minHeight: 180,
        fontSize: 14,
        color: '#333',
        lineHeight: 22,
        borderWidth: 1.5,
        borderColor: '#D0E8D0',
        textAlignVertical: 'top',
    },
    charCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    charCount: {
        fontSize: 11,
        marginLeft: 5,
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: '#2E7D32',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    saveBtnDisabled: {
        backgroundColor: '#81C784',
        elevation: 0,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    cancelBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelBtnText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    noteCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    noteText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        color: '#1565C0',
        lineHeight: 18,
        fontWeight: '500',
    },
});

export default ExpertEditAnswerScreen;
