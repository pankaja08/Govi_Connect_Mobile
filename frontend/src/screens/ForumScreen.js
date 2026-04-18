import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';

const CATEGORIES = [
  'General Farming',
  'Pest & Disease Management',
  'Fertilizer Usage',
  'Crop Cultivation',
  'Weather & Irrigation',
  'Market Prices',
];

const CATEGORY_COLORS = {
  'General Farming': { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  'Pest & Disease Management': { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  'Fertilizer Usage': { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  'Crop Cultivation': { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' },
  'Weather & Irrigation': { bg: '#E0F7FA', text: '#00695C', border: '#80DEEA' },
  'Market Prices': { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' },
};

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First', icon: 'arrow-up-circle-outline' },
  { key: 'oldest', label: 'Oldest First', icon: 'arrow-down-circle-outline' },
  { key: 'mostAnswered', label: 'Most Answered', icon: 'chatbubbles-outline' },
];

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
};

const getInitials = (name = '') => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};

const CategoryBadge = ({ category }) => {
  const colors = CATEGORY_COLORS[category] || { bg: '#EEE', text: '#333', border: '#CCC' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{category}</Text>
    </View>
  );
};

const Avatar = ({ name, role, size = 42 }) => {
  const isExpert = role === 'Expert';
  const bg = isExpert ? '#FBC02D' : '#F1F8E9';
  const textColor = isExpert ? '#FFF' : '#2E7D32';
  const borderColor = isExpert ? '#FBC02D' : '#A5D6A7';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderColor, borderWidth: 1 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.45, color: textColor }]}>{getInitials(name)}</Text>
    </View>
  );
};

// ─── Question Card (Original Styled Farmer View) ───
const QuestionCard = ({ question, currentUserId, onDelete, onEdit, onPress }) => {
  const isOwner = currentUserId && (question.author === currentUserId || question.author?._id === currentUserId);
  const withinEditWindow = Date.now() - new Date(question.createdAt).getTime() < 3600000;
  const canModify = isOwner && withinEditWindow;
  const hasAnswers = question.answers && question.answers.length > 0;

  return (
    <TouchableOpacity
      style={styles.questionCard}
      activeOpacity={0.8}
      onPress={() => onPress && onPress(question)}
    >
      <View style={styles.cardContent}>
        <View style={styles.authorRow}>
          <Text style={styles.authorName}>{question.authorName}</Text>
          <View style={[styles.roleBadge, question.authorRole === 'Expert' ? styles.roleBadgeExpert : styles.roleBadgeUser]}>
            <Text style={[styles.roleBadgeText, question.authorRole === 'Expert' ? styles.roleTextExpert : styles.roleTextUser]}>
              {question.authorRole?.toUpperCase() || 'USER'}
            </Text>
          </View>
          <Text style={styles.verticalDivider}>|</Text>
          <Text style={styles.dateText}>{formatDate(question.createdAt)}</Text>
        </View>

        <View style={styles.cardHeaderActions}>
          {canModify && (
            <View style={styles.actionBtns}>
              <TouchableOpacity onPress={() => onEdit(question)} style={styles.iconAction}>
                <Ionicons name="create-outline" size={16} color="#1565C0" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(question._id)} style={styles.iconAction}>
                <Ionicons name="trash-outline" size={16} color="#E53935" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.questionTitle}>{question.text}</Text>

        <View style={{ alignSelf: 'flex-start', marginTop: 10 }}>
          <CategoryBadge category={question.category} />
        </View>

        <View style={styles.cardFooterInfo}>
          <View style={styles.answerCountBubble}>
            <Ionicons name="chatbubbles-outline" size={14} color="#2E7D32" style={{ marginRight: 6 }} />
            <Text style={styles.answerCountText}>{question.answers?.length || 0} answers</Text>
          </View>
          {hasAnswers && (
            <View style={styles.tapIndicator}>
              <Text style={styles.tapToViewText}>View Discussion</Text>
              <Ionicons name="chevron-forward" size={14} color="#2E7D32" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Expert Question Card (Dashboard Mode) ───
const ExpertQuestionCard = ({ question, currentUserId, onAnswer, onDeleteAnswer, onEditAnswer }) => {
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (answerText.trim().length < 5) {
      if (Platform.OS === 'web') window.alert('Please provide a more detailed answer.');
      else Alert.alert('Too short', 'Please provide a more detailed answer.');
      return;
    }
    setIsSubmitting(true);
    await onAnswer(question._id, answerText);
    setAnswerText('');
    setIsSubmitting(false);
  };

  return (
    <View style={styles.expertQuestionCard}>
      <View style={styles.qHeaderRow}>
        <View style={styles.qIconCircle}><Text style={styles.qIconText}>Q</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.qMetaText} numberOfLines={1}>Asked by <Text style={{ fontWeight: '700' }}>{question.authorName}</Text></Text>
          <Text style={styles.dateText}>{new Date(question.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={styles.qText}>{question.text}</Text>

      {/* Existing Answers for Expert to see/manage */}
      {question.answers && question.answers.length > 0 && (
        <View style={styles.expertExistingAnswers}>
          <Text style={styles.existingAnswersTitle}>Current Discussion:</Text>
          {question.answers.map((ans) => {
            const isMyAnswer = currentUserId === (ans.author?._id || ans.author);
            return (
              <View key={ans._id} style={[styles.expertAnsItem, isMyAnswer && styles.expertMyAnsItem]}>
                <View style={styles.ansHeader}>
                  <Text style={styles.ansAuthor}>{ans.authorName} ({ans.authorRole})</Text>
                  {isMyAnswer && (
                    <View style={styles.answerActionBtns}>
                      <TouchableOpacity onPress={() => onEditAnswer(question._id, ans)} style={{ marginRight: 14 }}>
                        <Ionicons name="create-outline" size={16} color="#1565C0" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onDeleteAnswer(question._id, ans._id)}>
                        <Ionicons name="trash-outline" size={16} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <Text style={styles.ansText}>{ans.text}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.qDivider} />
      <Text style={styles.inputLabel}>Post your official answer</Text>
      <TextInput
        style={styles.qAnswerInput}
        placeholder="Type your expert advice here..."
        multiline
        value={answerText}
        onChangeText={setAnswerText}
      />
      <TouchableOpacity style={styles.qSubmitBtn} onPress={handleSubmit} disabled={isSubmitting}>
        <Text style={styles.qSubmitBtnText}>{isSubmitting ? 'Posting...' : 'Post Answer'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── MAIN FORUM SCREEN ───
const ForumScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortKey, setSortKey] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [myQuestionsOnly, setMyQuestionsOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [askText, setAskText] = useState('');
  const [askCategory, setAskCategory] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState(null);
  const [editAnswerText, setEditAnswerText] = useState('');
  const [showEditAnswerModal, setShowEditAnswerModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    apiClient.get('/users/me').then(r => {
      const u = r.data.data.user;
      setUser(u);
      setUserRole(u.role);
      setCurrentUserId(u._id);
    }).catch(() => { });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchQuestions();
    }, [debouncedSearch, sortKey, myQuestionsOnly, selectedCategory])
  );

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        sort: sortKey,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(myQuestionsOnly ? { myQuestions: 'true' } : {}),
        ...(selectedCategory ? { category: selectedCategory } : {}),
      };
      const res = await apiClient.get('/forum', { params });
      setQuestions(res.data.data.questions || []);
    } catch (err) {
      console.log('Fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!askCategory || askText.trim().length < 10) {
      Alert.alert('Incomplete', 'Please select a category and enter your question.');
      return;
    }
    try {
      setSubmittingQuestion(true);
      await apiClient.post('/forum', { text: askText.trim(), category: askCategory });
      setAskText('');
      setAskCategory('');
      fetchQuestions();
      Alert.alert('Success', 'Your question has been posted!');
    } catch (err) {
      Alert.alert('Error', 'Could not post question.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAddAnswer = async (id, text) => {
    if (text.trim().length < 5) return;
    try {
      setSubmittingAnswer(true);
      const res = await apiClient.post(`/forum/${id}/answers`, { text: text.trim() });
      const updatedQ = res.data.data.question;
      setQuestions(prev => prev.map(q => q._id === id ? updatedQ : q));
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || JSON.stringify(err);
      if (Platform.OS === 'web') window.alert(`Could not post answer. Error: ${errorMsg}`);
      else Alert.alert('Error', `Could not post answer. Error: ${errorMsg}`);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleDeleteAnswer = async (questionId, answerId) => {
    try {
      const res = await apiClient.delete(`/forum/${questionId}/answers/${answerId}`);
      const updatedQ = res.data.data.question;
      setQuestions(prev => prev.map(q => q._id === questionId ? updatedQ : q));
    } catch (err) {
      Alert.alert('Error', 'Could not delete answer.');
    }
  };

  const handleOpenEditAnswer = (questionId, answer) => {
    setEditingAnswer({ questionId, answerId: answer._id });
    setEditAnswerText(answer.text || '');
    setShowEditAnswerModal(true);
  };

  const handleSaveEditedAnswer = async () => {
    if (!editingAnswer || editAnswerText.trim().length < 5) {
      Alert.alert('Invalid', 'Answer must be at least 5 characters.');
      return;
    }
    try {
      const res = await apiClient.patch(
        `/forum/${editingAnswer.questionId}/answers/${editingAnswer.answerId}`,
        { text: editAnswerText.trim() }
      );
      const updatedQ = res.data.data.question;
      setQuestions(prev => prev.map(q => q._id === updatedQ._id ? updatedQ : q));
      setShowEditAnswerModal(false);
      setEditingAnswer(null);
      setEditAnswerText('');
    } catch (err) {
      console.error('Answer Update Error:', err.response?.data || err.message);
      if (Platform.OS === 'web') window.alert('Could not update answer.');
      else Alert.alert('Error', 'Could not update answer.');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Delete this question permanently?');
      if (confirmed) {
        try {
          await apiClient.delete(`/forum/${id}`);
          setQuestions(prev => prev.filter(q => q._id !== id));
        } catch (err) {
          window.alert('Could not delete question.');
        }
      }
    } else {
      Alert.alert('Delete', 'Delete this question permanently?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await apiClient.delete(`/forum/${id}`);
              setQuestions(prev => prev.filter(q => q._id !== id));
            } catch (err) {
              Alert.alert('Error', 'Could not delete question.');
            }
          }
        }
      ]);
    }
  };

  const handleOpenEdit = (q) => {
    navigation.navigate('ForumEditQuestion', { question: q });
  };

  const handleOpenDetail = (q) => {
    navigation.navigate('ForumDetail', { question: q });
  };

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label || 'Newest First';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header Section */}
          <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginRight: 15 }}>
                <Ionicons name="menu" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Community Forum</Text>
                <Text style={styles.headerSub}>Ask · Learn · Share with farmers</Text>
              </View>
            </View>
            <View style={styles.headerLeaf}>
              <Ionicons name="leaf" size={28} color="#fff" />
            </View>
          </LinearGradient>

          {/* Search Bar */}
          {userRole !== 'Expert' && (
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={20} color="#888" />
                <TextInput style={styles.searchInput} placeholder="Search questions..." value={searchText} onChangeText={setSearchText} />
              </View>
            </View>
          )}

          {/* Filter Row */}
          <View style={styles.filterRow}>
            {userRole !== 'Expert' && (
              <TouchableOpacity
                style={[styles.filterBtn, myQuestionsOnly && styles.filterBtnActive]}
                onPress={() => setMyQuestionsOnly(!myQuestionsOnly)}
              >
                <Text style={[styles.filterBtnText, myQuestionsOnly && styles.filterBtnTextActive]}>My Questions</Text>
              </TouchableOpacity>
            )}

            <View style={{ flex: 1, zIndex: 1000 }}>
              <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu(!showSortMenu)}>
                <Text style={styles.filterBtnText}>{activeSortLabel}</Text>
                <Ionicons name="chevron-down" size={15} color="#2E7D32" />
              </TouchableOpacity>
              {showSortMenu && (
                <View style={styles.sortDropdown}>
                  {SORT_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt.key} style={styles.sortOption} onPress={() => { setSortKey(opt.key); setShowSortMenu(false); }}>
                      <Text style={styles.sortOptionText}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity onPress={() => setSelectedCategory('')} style={[styles.chip, !selectedCategory && styles.chipActive]}>
              <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={[styles.chip, selectedCategory === cat && styles.chipActive]}>
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Ask Card (Farmer Only) */}
          {userRole !== 'Expert' && (
            <View style={styles.askContainer}>
              <TouchableOpacity style={styles.categoryPickerBtn} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
                <Text style={[styles.categoryPickerText, { color: askCategory ? '#2E7D32' : '#999' }]}>{askCategory || 'Select Category'}</Text>
                <Ionicons name="chevron-down" size={18} color="#333" />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.categoryList}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={styles.categoryItem} onPress={() => { setAskCategory(c); setShowCategoryPicker(false); }}>
                      <Text style={styles.categoryItemText}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TextInput style={styles.askInput} placeholder="What's your question?" placeholderTextColor="#777" value={askText} onChangeText={setAskText} multiline />
              <TouchableOpacity style={styles.askSubmitBtn} onPress={handleAskQuestion}>
                <Text style={styles.askSubmitBtnText}>Post Question</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Discussion Feed */}
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>Community Discussions</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
          ) : (
            questions.map(q => userRole === 'Expert' ? (
              <ExpertQuestionCard
                key={q._id}
                question={q}
                currentUserId={currentUserId}
                onAnswer={handleAddAnswer}
                onDeleteAnswer={handleDeleteAnswer}
                onEditAnswer={handleOpenEditAnswer}
              />
            ) : (
              <QuestionCard key={q._id} question={q} currentUserId={currentUserId} onDelete={handleDeleteQuestion} onEdit={handleOpenEdit} onPress={handleOpenDetail} />
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Answer Modal */}
      <Modal visible={showEditAnswerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Answer</Text>
            <TextInput
              style={styles.editInput}
              value={editAnswerText}
              onChangeText={setEditAnswerText}
              multiline
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEditedAnswer}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEditAnswerModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E8ECE8' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { paddingTop: 48, paddingBottom: 18, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeSmall: { color: '#F5A623', fontSize: 12, letterSpacing: 1, fontWeight: '700', marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6, flexShrink: 1 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20, flexShrink: 1 },
  headerLeaf: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  searchRow: { padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 48, elevation: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, zIndex: 1000, marginTop: 16 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E8F5E9' },
  filterBtnActive: { backgroundColor: '#2E7D32' },
  filterBtnText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  filterBtnTextActive: { color: '#fff' },
  sortBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E8F5E9' },
  sortDropdown: { position: 'absolute', top: 50, right: 0, left: 0, backgroundColor: '#fff', borderRadius: 12, elevation: 4, padding: 8, zIndex: 2000 },
  sortOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  sortOptionText: { fontSize: 13, color: '#333' },
  categoryScroll: { marginVertical: 15, paddingLeft: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#E8F5E9' },
  chipActive: { backgroundColor: '#2E7D32' },
  chipText: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  chipTextActive: { color: '#fff' },
  askContainer: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  categoryPickerBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#2E7D32', marginBottom: 16 },
  categoryPickerText: { fontSize: 14, fontWeight: '600' },
  categoryList: { backgroundColor: '#fff', borderRadius: 10, elevation: 2, marginBottom: 10 },
  categoryItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  categoryItemText: { fontSize: 13, color: '#333' },
  askInput: { backgroundColor: '#fff', borderRadius: 10, padding: 12, minHeight: 90, marginBottom: 15, textAlignVertical: 'top', borderWidth: 1, borderColor: '#000' },
  askSubmitBtn: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, alignItems: 'center' },
  askSubmitBtnText: { color: '#fff', fontWeight: 'bold' },
  feedHeader: { paddingHorizontal: 16, marginTop: 10, marginBottom: 10 },
  feedTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B3A1F' },
  questionCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderLeftWidth: 6, borderLeftColor: '#2E7D32' },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorName: { fontSize: 12, fontWeight: 'bold', color: '#1B5E20' },
  roleBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleBadgeExpert: { backgroundColor: '#FFECB3' },
  roleBadgeUser: { backgroundColor: '#E8F5E9' },
  roleTextExpert: { color: '#F57F17', fontSize: 9, fontWeight: '800' },
  roleTextUser: { color: '#2E7D32', fontSize: 9, fontWeight: '800' },
  verticalDivider: { marginHorizontal: 8, color: '#ccc' },
  dateText: { fontSize: 10, color: '#999' },
  cardHeaderActions: { position: 'absolute', top: -4, right: 0 },
  actionBtns: { flexDirection: 'row', gap: 10 },
  iconAction: { padding: 4 },
  questionTitle: { fontSize: 15, fontWeight: '700', color: '#333', lineHeight: 22 },
  cardFooterInfo: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answerCountBubble: { flexDirection: 'row', alignItems: 'center' },
  answerCountText: { fontSize: 12, color: '#2E7D32', fontWeight: 'bold' },
  tapIndicator: { flexDirection: 'row', alignItems: 'center' },
  tapToViewText: { fontSize: 11, color: '#2E7D32', fontWeight: 'bold', marginRight: 4 },
  expertQuestionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, marginHorizontal: 16, elevation: 3, borderLeftWidth: 6, borderLeftColor: '#2E7D32' },
  qHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  qIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  qIconText: { color: '#2E7D32', fontWeight: 'bold' },
  qMetaText: { fontSize: 12, color: '#666', flex: 1 },
  qText: { fontSize: 15, color: '#333', lineHeight: 22, fontWeight: '500' },
  qDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 15 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  qAnswerInput: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#eee' },
  qSubmitBtn: { backgroundColor: '#2E7D32', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignSelf: 'flex-end', marginTop: 12 },
  qSubmitBtnText: { color: '#fff', fontWeight: 'bold' },
  expertExistingAnswers: { marginTop: 15, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10 },
  existingAnswersTitle: { fontSize: 11, fontWeight: 'bold', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  expertAnsItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  expertMyAnsItem: { borderColor: '#A5D6A7', borderLeftWidth: 3, borderLeftColor: '#2E7D32' },
  ansHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  answerActionBtns: { flexDirection: 'row', alignItems: 'center' },
  ansAuthor: { fontSize: 10, fontWeight: 'bold', color: '#2E7D32' },
  ansText: { fontSize: 12, color: '#444' },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  editInput: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, minHeight: 120, textAlignVertical: 'top', marginBottom: 20 },
  saveBtn: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { padding: 15, alignItems: 'center', marginTop: 5 },
  cancelBtnText: { color: '#666' },
  detailScreen: { flex: 1, backgroundColor: '#F5F8F5' },
  detailScroll: { flex: 1, width: '100%' },
  detailContent: { padding: 16, paddingBottom: 100 },
  detailHeader: { backgroundColor: '#1B5E20', padding: 16, paddingTop: 50 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  detailCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 1, width: '100%' },
  detailTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', lineHeight: 26, marginBottom: 15 },
  responsesTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#444', width: '100%' },
  answerCard: { backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#E8F5E9', width: '100%' },
  answerMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  answerAuthor: { fontSize: 12, fontWeight: 'bold', color: '#1B5E20', marginLeft: 10, flex: 1 },
  answerDate: { fontSize: 10, color: '#999' },
  answerText: { fontSize: 14, color: '#444', lineHeight: 22 },
  answerInputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center', width: '100%' },
  detailInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});

export default ForumScreen;
