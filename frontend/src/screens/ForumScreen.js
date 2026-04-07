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

const COMMON_QUESTIONS = [
  'How to identify early stage blight in tomatoes?',
  'Best fertilizers for maximizing rice yield in dry zone?',
  'Market rates for organic papayas this season?',
  'Guide to using the Smart Yield Predictor?',
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First', icon: 'arrow-up-circle-outline' },
  { key: 'oldest', label: 'Oldest First', icon: 'arrow-down-circle-outline' },
  { key: 'mostAnswered', label: 'Most Answered', icon: 'chatbubbles-outline' },
];

// Format relative time
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

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ─── Category Badge ─────────────────────────────────────────────────────────
const CategoryBadge = ({ category }) => {
  const colors = CATEGORY_COLORS[category] || { bg: '#EEE', text: '#333', border: '#CCC' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{category}</Text>
    </View>
  );
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar = ({ name, role, size = 38 }) => {
  const isExpert = role === 'Expert';
  const bg = isExpert ? '#1A6B3E' : '#4CAF50';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{getInitials(name)}</Text>
    </View>
  );
};

// ─── Answer Card ─────────────────────────────────────────────────────────────
const AnswerCard = ({ answer }) => (
  <View style={styles.answerCard}>
    <View style={styles.answerHeader}>
      <Avatar name={answer.authorName} role={answer.authorRole} size={30} />
      <View style={{ marginLeft: 8, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.answerAuthor}>{answer.authorName}</Text>
          {answer.authorRole === 'Expert' && (
            <View style={styles.expertTag}><Text style={styles.expertTagText}>Expert</Text></View>
          )}
        </View>
        <Text style={styles.answerTime}>{formatDate(answer.createdAt)}</Text>
      </View>
    </View>
    <Text style={styles.answerText}>{answer.text}</Text>
  </View>
);

// ─── Question Card ────────────────────────────────────────────────────────────
const QuestionCard = ({ question, onAddAnswer, currentUserId, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  const isOwner = currentUserId && question.author === currentUserId;
  const withinEditWindow = Date.now() - new Date(question.createdAt).getTime() < 3600000;
  const canModify = isOwner && withinEditWindow;

  const handleSubmitAnswer = async () => {
    if (answerText.trim().length < 5) {
      Alert.alert('Too short', 'Answer must be at least 5 characters.');
      return;
    }
    setSubmitting(true);
    await onAddAnswer(question._id, answerText.trim());
    setAnswerText('');
    setSubmitting(false);
  };

  return (
    <View style={styles.questionCard}>
      {/* Header */}
      <View style={styles.questionHeader}>
        <Avatar name={question.authorName} role={question.authorRole} />
        <View style={styles.questionMeta}>
          <Text style={styles.questionAuthor}>{question.authorName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.questionRole}>{question.authorRole?.toUpperCase()}</Text>
            <Text style={styles.questionTime}>  ·  {formatDate(question.createdAt)}</Text>
          </View>
        </View>
        {canModify && (
          <View style={styles.actionBtns}>
            <TouchableOpacity onPress={() => onEdit(question)} style={styles.iconAction}>
              <Ionicons name="create-outline" size={18} color="#1565C0" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(question._id)} style={styles.iconAction}>
              <Ionicons name="trash-outline" size={18} color="#E53935" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Question Text */}
      <Text style={styles.questionText}>{question.text}</Text>

      {/* Category */}
      <CategoryBadge category={question.category} />

      {/* Footer */}
      <TouchableOpacity style={styles.questionFooter} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.answerCountRow}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.answerCountText}>
            {question.answers?.length ?? question.answerCount ?? 0} answers
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-forward" size={18} color="#2E7D32" />
        </Animated.View>
      </TouchableOpacity>

      {/* Expanded: Answers + Add Answer */}
      {expanded && (
        <View style={styles.expandedArea}>
          {/* Expert Responses label */}
          <View style={styles.expertResponsesLabel}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#1A6B3E" />
            <Text style={styles.expertResponsesText}>Expert Responses</Text>
          </View>

          {question.answers && question.answers.length > 0 ? (
            question.answers.map((ans, idx) => <AnswerCard key={idx} answer={ans} />)
          ) : (
            <Text style={styles.noAnswersText}>No answers yet. Be the first!</Text>
          )}

          {/* Add Answer Input */}
          <View style={styles.addAnswerRow}>
            <TextInput
              style={styles.answerInput}
              placeholder="Write your answer..."
              placeholderTextColor="#aaa"
              value={answerText}
              onChangeText={setAnswerText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, submitting && { opacity: 0.5 }]}
              onPress={handleSubmitAnswer}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── MAIN FORUM SCREEN ────────────────────────────────────────────────────────
const ForumScreen = () => {
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch current user
  useEffect(() => {
    apiClient.get('/users/me').then(r => {
      setCurrentUserId(r.data?.data?.user?._id);
    }).catch(() => {});
  }, []);

  // Fetch questions whenever filters change
  useEffect(() => {
    fetchQuestions();
  }, [debouncedSearch, sortKey, myQuestionsOnly, selectedCategory]);

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
      setQuestions(res.data?.data?.questions || []);
    } catch (err) {
      console.log('Forum fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!askCategory) {
      Alert.alert('Select a category', 'Please select a category before asking.');
      return;
    }
    if (askText.trim().length < 10) {
      Alert.alert('Too short', 'Your question must be at least 10 characters.');
      return;
    }
    try {
      setSubmittingQuestion(true);
      await apiClient.post('/forum', { text: askText.trim(), category: askCategory });
      setAskText('');
      setAskCategory('');
      Alert.alert('✅ Success', 'Your question has been posted!');
      fetchQuestions();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not post question.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAddAnswer = async (questionId, text) => {
    try {
      const res = await apiClient.post(`/forum/${questionId}/answers`, { text });
      setQuestions(prev =>
        prev.map(q => q._id === questionId ? res.data.data.question : q)
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not post answer.');
    }
  };

  const handleDeleteQuestion = (questionId) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/forum/${questionId}`);
              setQuestions(prev => prev.filter(q => q._id !== questionId));
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not delete.');
            }
          }
        }
      ]
    );
  };

  const handleOpenEdit = (question) => {
    setEditingQuestion(question);
    setEditText(question.text);
    setEditCategory(question.category);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const res = await apiClient.patch(`/forum/${editingQuestion._id}`, {
        text: editText,
        category: editCategory,
      });
      setQuestions(prev =>
        prev.map(q => q._id === editingQuestion._id ? res.data.data.question : q)
      );
      setShowEditModal(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not edit question.');
    }
  };

  const handleCommonQuestionPress = (text) => {
    setAskText(text);
  };

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label || 'Recents';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ─── HEADER ─── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Community Forum</Text>
              <Text style={styles.headerSub}>Ask · Learn · Share with farmers</Text>
            </View>
            <View style={styles.headerLeaf}>
              <Ionicons name="leaf" size={28} color="#fff" />
            </View>
          </View>

          {/* ─── SEARCH BAR ─── */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for questions..."
                placeholderTextColor="#aaa"
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={18} color="#aaa" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ─── FILTER ROW ─── */}
          <View style={styles.filterRow}>
            {/* My Questions Toggle */}
            <TouchableOpacity
              style={[styles.filterBtn, myQuestionsOnly && styles.filterBtnActive]}
              onPress={() => setMyQuestionsOnly(!myQuestionsOnly)}
            >
              <Ionicons
                name={myQuestionsOnly ? 'person' : 'person-outline'}
                size={15}
                color={myQuestionsOnly ? '#fff' : '#2E7D32'}
              />
              <Text style={[styles.filterBtnText, myQuestionsOnly && styles.filterBtnTextActive]}>
                My Questions
              </Text>
            </TouchableOpacity>

            {/* Sort Dropdown */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={[styles.filterBtn, styles.sortBtn]}
                onPress={() => setShowSortMenu(!showSortMenu)}
              >
                <Text style={styles.filterBtnText}>{activeSortLabel}</Text>
                <Ionicons name="chevron-down" size={15} color="#2E7D32" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              {showSortMenu && (
                <View style={styles.sortDropdown}>
                  {SORT_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.sortOption, sortKey === opt.key && styles.sortOptionActive]}
                      onPress={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={16}
                        color={sortKey === opt.key ? '#2E7D32' : '#555'}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.sortOptionText, sortKey === opt.key && { color: '#2E7D32', fontWeight: '700' }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* ─── CATEGORY CHIPS ─── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryChipsScroll}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
          >
            <TouchableOpacity
              style={[styles.chip, !selectedCategory && styles.chipActive]}
              onPress={() => setSelectedCategory('')}
            >
              <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ─── COMMON QUESTIONS ─── */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>COMMON QUESTIONS YOU CAN ASK</Text>
            <View style={styles.commonQGrid}>
              {COMMON_QUESTIONS.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.commonQChip}
                  onPress={() => handleCommonQuestionPress(q)}
                >
                  <Text style={styles.commonQText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── EDIT WINDOW NOTE ─── */}
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color="#E65100" />
            <Text style={styles.noteText}>  Note: You can edit or delete your question within 1 hour of posting.</Text>
          </View>

          {/* ─── ASK A QUESTION BAR ─── */}
          <View style={styles.askBar}>
            <View style={styles.askAvatarCircle}>
              <Ionicons name="person" size={18} color="#fff" />
            </View>

            {/* Category Picker */}
            <TouchableOpacity
              style={styles.categoryPicker}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={askCategory ? styles.categoryPickerTextSelected : styles.categoryPickerTextPlaceholder}>
                {askCategory || 'Select Category'}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#666" />
            </TouchableOpacity>

            {/* Question Input */}
            <TextInput
              style={styles.askInput}
              placeholder="Ask a question..."
              placeholderTextColor="#aaa"
              value={askText}
              onChangeText={setAskText}
              multiline={false}
            />

            {/* Ask Button */}
            <TouchableOpacity
              style={[styles.askBtn, submittingQuestion && { opacity: 0.6 }]}
              onPress={handleAskQuestion}
              disabled={submittingQuestion}
            >
              {submittingQuestion ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.askBtnText}>Ask</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ─── COMMUNITY DISCUSSIONS ─── */}
          <View style={styles.discussionsHeader}>
            <Text style={styles.discussionsTitle}>Community Discussions</Text>
            <Text style={styles.discussionsCount}>{questions.length} questions</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
          ) : questions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>No questions found</Text>
              <Text style={styles.emptyStateSub}>Be the first to ask something!</Text>
            </View>
          ) : (
            questions.map(q => (
              <QuestionCard
                key={q._id}
                question={q}
                onAddAnswer={handleAddAnswer}
                currentUserId={currentUserId}
                onDelete={handleDeleteQuestion}
                onEdit={handleOpenEdit}
              />
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── CATEGORY PICKER MODAL ─── */}
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select a Category</Text>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.pickerOption, askCategory === cat && styles.pickerOptionActive]}
                onPress={() => { setAskCategory(cat); setShowCategoryPicker(false); }}
              >
                <View style={[styles.pickerDot, { backgroundColor: CATEGORY_COLORS[cat]?.text || '#888' }]} />
                <Text style={[styles.pickerOptionText, askCategory === cat && { color: '#2E7D32', fontWeight: '700' }]}>
                  {cat}
                </Text>
                {askCategory === cat && <Ionicons name="checkmark" size={18} color="#2E7D32" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── EDIT QUESTION MODAL ─── */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>Edit Question</Text>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholder="Edit your question..."
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={styles.editCategoryBtn}
              onPress={() => {
                setShowEditModal(false);
                setTimeout(() => setShowCategoryPicker(true), 300);
              }}
            >
              <Text style={{ color: editCategory ? '#333' : '#aaa' }}>{editCategory || 'Select Category'}</Text>
              <Ionicons name="chevron-down" size={14} color="#666" />
            </TouchableOpacity>
            <View style={styles.editModalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8F5' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerLeaf: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchRow: { paddingHorizontal: 16, marginTop: 16, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E0E8E0',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333', fontWeight: '500' },

  // Filter row
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 6,
    alignItems: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    gap: 5,
  },
  filterBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterBtnText: { color: '#2E7D32', fontWeight: '700', fontSize: 13 },
  filterBtnTextActive: { color: '#fff' },
  sortBtn: { marginLeft: 'auto' },
  sortDropdown: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 999,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    overflow: 'hidden',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortOptionActive: { backgroundColor: '#F1F8E9' },
  sortOptionText: { fontSize: 14, color: '#444', fontWeight: '600' },

  // Category chips
  categoryChipsScroll: { marginBottom: 10 },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
  },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  // Common questions section
  sectionBox: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A9E8A',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  commonQGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  commonQChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    maxWidth: '48%',
  },
  commonQText: { fontSize: 12, color: '#2E7D32', fontWeight: '600', lineHeight: 16 },

  // Note box
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  noteText: { fontSize: 12, color: '#E65100', flex: 1, fontWeight: '500' },

  // Ask bar
  askBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    gap: 8,
  },
  askAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    gap: 4,
  },
  categoryPickerTextPlaceholder: { fontSize: 12, color: '#888' },
  categoryPickerTextSelected: { fontSize: 12, color: '#1B5E20', fontWeight: '700' },
  askInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    borderBottomWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingVertical: 4,
  },
  askBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  askBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Section header
  discussionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  discussionsTitle: { fontSize: 20, fontWeight: '800', color: '#1B3A1F', letterSpacing: -0.3 },
  discussionsCount: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },

  // Question card
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#ECF5EC',
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  questionMeta: { flex: 1 },
  questionAuthor: { fontSize: 14, fontWeight: '700', color: '#222' },
  questionRole: { fontSize: 11, color: '#2E7D32', fontWeight: '700' },
  questionTime: { fontSize: 11, color: '#999', fontWeight: '500' },
  actionBtns: { flexDirection: 'row', gap: 6 },
  iconAction: {
    padding: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  questionText: { fontSize: 15, color: '#1A1A2E', fontWeight: '600', lineHeight: 22, marginBottom: 10 },

  // Badge
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Footer
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  answerCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  answerCountText: { fontSize: 13, color: '#888', fontWeight: '500' },

  // Expanded area
  expandedArea: { marginTop: 14 },
  expertResponsesLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 5,
  },
  expertResponsesText: { fontSize: 12, color: '#1A6B3E', fontWeight: '700', letterSpacing: 0.3 },
  noAnswersText: { fontSize: 13, color: '#aaa', textAlign: 'center', paddingVertical: 10 },

  // Answer card
  answerCard: {
    backgroundColor: '#F9FBF9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  answerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  answerAuthor: { fontSize: 13, fontWeight: '700', color: '#333' },
  expertTag: {
    backgroundColor: '#1A6B3E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  expertTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  answerTime: { fontSize: 11, color: '#999' },
  answerText: { fontSize: 13, color: '#444', lineHeight: 19 },

  // Add answer row
  addAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 8,
  },
  answerInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    minHeight: 36,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyStateText: { fontSize: 18, fontWeight: '700', color: '#aaa', marginTop: 12 },
  emptyStateSub: { fontSize: 13, color: '#ccc', marginTop: 4 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: '#1B3A1F', marginBottom: 16 },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  pickerOptionActive: { backgroundColor: '#F1F8E9', borderRadius: 10, paddingHorizontal: 8 },
  pickerDot: { width: 10, height: 10, borderRadius: 5 },
  pickerOptionText: { flex: 1, fontSize: 15, color: '#444', fontWeight: '600' },

  editModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 24,
    marginTop: 'auto',
  },
  editModalTitle: { fontSize: 18, fontWeight: '800', color: '#1B3A1F', marginBottom: 14 },
  editInput: {
    borderWidth: 1.5,
    borderColor: '#E0E8E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 90,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  editCategoryBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E8E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  editModalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#666', fontWeight: '700', fontSize: 14 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default ForumScreen;
