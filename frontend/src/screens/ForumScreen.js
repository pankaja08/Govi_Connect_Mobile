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

const getInitials = (name = '') => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};

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

// ─── Answer Card ─────────────────────────────────────────────────────────────
const AnswerCard = ({ answer }) => (
  <View style={styles.cardRow}>
    <View style={styles.leftColumn}>
      <Avatar name={answer.authorName} role={answer.authorRole} />
      <Text style={styles.authorName} numberOfLines={2}>{answer.authorName}</Text>
      <View style={[styles.roleBadge, answer.authorRole === 'Expert' ? styles.roleBadgeExpert : styles.roleBadgeUser]}>
        <Text style={[styles.roleBadgeText, answer.authorRole === 'Expert' ? styles.roleTextExpert : styles.roleTextUser]}>
          {answer.authorRole?.toUpperCase() || 'USER'}
        </Text>
      </View>
      <Text style={styles.dateText}>{formatDate(answer.createdAt)}</Text>
    </View>

    <View style={styles.rightColumn}>
       <View style={styles.answerBox}>
          <Text style={styles.answerBoxText}>{answer.text}</Text>
          {answer.authorRole === 'Expert' && (
            <View style={styles.checkmarkBadge}>
               <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          )}
       </View>
    </View>
  </View>
);

// ─── Question Card ────────────────────────────────────────────────────────────
const QuestionCard = ({ question, onAddAnswer, currentUserId, onDelete, onEdit }) => {
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const isOwner = currentUserId && (question.author === currentUserId || question.author?._id === currentUserId);
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
    setShowInput(false);
  };

  const hasAnswers = question.answers && question.answers.length > 0;
  // Determine title for responses section
  const hasExpert = question.answers?.some(a => a.authorRole === 'Expert');

  return (
    <View style={styles.questionCard}>
      <View style={styles.cardRow}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          <Avatar name={question.authorName} role={question.authorRole} />
          <Text style={styles.authorName} numberOfLines={2}>{question.authorName}</Text>
          <View style={[styles.roleBadge, question.authorRole === 'Expert' ? styles.roleBadgeExpert : styles.roleBadgeUser]}>
            <Text style={[styles.roleBadgeText, question.authorRole === 'Expert' ? styles.roleTextExpert : styles.roleTextUser]}>
              {question.authorRole?.toUpperCase() || 'USER'}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(question.createdAt)}</Text>
        </View>

        {/* Right Column */}
        <View style={styles.rightColumn}>
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

          <Text style={styles.questionTitle}>{question.text}</Text>
          
          <View style={{ alignSelf: 'flex-start', marginTop: 10 }}>
            <CategoryBadge category={question.category} />
          </View>

          <View style={styles.answerCountContainer}>
            <TouchableOpacity style={styles.answerCountBubble} onPress={() => setShowInput(!showInput)}>
              <Ionicons name="chatbubbles-outline" size={14} color="#2E7D32" style={{marginRight: 6}} />
              <Text style={styles.answerCountText}>{question.answers?.length || question.answerCount || 0} answers</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {hasAnswers && <View style={styles.divider} />}

      {hasAnswers && (
        <View style={styles.answersSection}>
          <View style={styles.expertResponsesLabel}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color="#2E7D32" />
            <Text style={styles.expertResponsesText}>{hasExpert ? 'Expert Responses' : 'Responses'}</Text>
          </View>

          {question.answers.map((ans, idx) => (
             <AnswerCard key={ans._id || idx} answer={ans} />
          ))}
        </View>
      )}

      {showInput && (
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
              <Ionicons name="send" size={16} color="#fff" />
            )}
          </TouchableOpacity>
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
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

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
      setCategoryError(true);
      setTimeout(() => setCategoryError(false), 3000);
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
      setSelectedCategory('');
      setSearchText('');
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

  const handleDeleteQuestion = async (questionId) => {
    // Standard confirm for web, Alert for native
    const proceed = Platform.OS === 'web' 
      ? window.confirm("Are you sure you want to delete this question?") 
      : true;

    if (!proceed) return;

    const performDelete = async () => {
      try {
        await apiClient.delete(`/forum/${questionId}`);
        setQuestions(prev => prev.filter(q => q._id !== questionId));
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Could not delete.';
        if (Platform.OS === 'web') alert(errorMsg);
        else Alert.alert('Error', errorMsg);
      }
    };

    if (Platform.OS === 'web') {
      await performDelete();
    } else {
      Alert.alert(
        'Delete Question',
        'Are you sure you want to delete this question?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const handleOpenEdit = (question) => {
    setEditingQuestion(question);
    setEditText(question.text);
    setEditCategory(question.category);
    setShowEditCategoryDropdown(false);
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

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label || 'Newest First';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
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
            <View style={{ position: 'relative', zIndex: 5000, elevation: 5000 }}>
              <TouchableOpacity
                style={[styles.filterBtn, styles.sortBtn]}
                onPress={() => setShowSortMenu(!showSortMenu)}
                activeOpacity={0.7}
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

          {/* ─── ASK A QUESTION CARD ─── */}
          <View style={styles.askContainer}>
            <View style={styles.askHeaderRow}>
              <View style={styles.askAvatarCircle}>
                <Ionicons name="help-circle" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, position: 'relative', zIndex: 10000 }}>
                <TouchableOpacity
                  style={styles.categoryDropdownButton}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                  activeOpacity={0.7}
                >
                  <Text style={askCategory ? styles.categorySelectedText : styles.categoryPlaceholderText} numberOfLines={1}>
                    {askCategory || 'Select Category'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#333" />
                </TouchableOpacity>

                {showCategoryPicker && (
                  <View style={styles.categoryFloatingDropdown}>
                    <View style={styles.categoryListHeader}>
                      <Text style={styles.categoryListHeaderText}>Select Category</Text>
                    </View>
                    <ScrollView style={{ maxHeight: 250 }} bounces={false} showsVerticalScrollIndicator={true}>
                      {CATEGORIES.map(cat => (
                        <TouchableOpacity
                          key={cat}
                          style={styles.categoryItem}
                          onPress={() => { 
                            setAskCategory(cat); 
                            setShowCategoryPicker(false);
                            setCategoryError(false);
                          }}
                        >
                          <Text style={styles.categoryItemText}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {categoryError && (
                  <View style={styles.validationTooltip}>
                    <View style={styles.tooltipPointer} />
                    <View style={styles.tooltipBody}>
                      <View style={styles.tooltipIconBox}>
                        <Ionicons name="warning" size={20} color="#fff" />
                      </View>
                      <Text style={styles.tooltipText}>Please select an item in the list.</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <TextInput
              style={styles.askInputLarge}
              placeholder="What would you like to ask the community?"
              placeholderTextColor="#999"
              value={askText}
              onChangeText={setAskText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.askSubmitBtn, submittingQuestion && { opacity: 0.6 }]}
              onPress={handleAskQuestion}
              disabled={submittingQuestion}
            >
              {submittingQuestion ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.askSubmitBtnText}>Post Question</Text>
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
            
            <View style={{ position: 'relative', zIndex: 3000 }}>
              <TouchableOpacity
                style={styles.editCategoryBtn}
                onPress={() => setShowEditCategoryDropdown(!showEditCategoryDropdown)}
              >
                <Text style={{ color: editCategory ? '#2E7D32' : '#aaa', fontWeight: editCategory ? '700' : '500' }}>
                  {editCategory || 'Select Category'}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#666" />
              </TouchableOpacity>

              {showEditCategoryDropdown && (
                <View style={styles.editCategoryFloatingDropdown}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={styles.editCategoryItem}
                        onPress={() => {
                          setEditCategory(cat);
                          setShowEditCategoryDropdown(false);
                        }}
                      >
                        <Text style={styles.editCategoryItemText}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.editModalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => {
                  setShowEditModal(false);
                  setShowEditCategoryDropdown(false);
                }}
              >
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
  scrollContent: { 
    flexGrow: 1, 
    paddingBottom: 40,
    minHeight: '100%' 
  },

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

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 6,
    alignItems: 'center',
    zIndex: 5000, 
    elevation: 5000,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 5,
  },
  filterBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterBtnText: { color: '#2E7D32', fontWeight: '600', fontSize: 13 },
  filterBtnTextActive: { color: '#fff' },
  sortBtn: { 
    marginLeft: 'auto',
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 16,
  },
  sortDropdown: {
    position: 'absolute',
    top: 50, // Increased to ensure it's below the button
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    zIndex: 6000,
    minWidth: 160,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingVertical: 6,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sortOptionActive: { backgroundColor: '#F9F9F9' },
  sortOptionText: { fontSize: 16, color: '#263238', fontWeight: '400' },

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

  // New Ask Container
  askContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    zIndex: 10000, // Ensure the whole container is highly layered
  },
  askHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 16,
    zIndex: 11000,
  },
  askAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 18,
    height: 52,
    borderWidth: 2,
    borderColor: '#2ecc71',
  },
  categoryPlaceholderText: { color: '#4F4F4F', fontSize: 16, fontWeight: '500' },
  categorySelectedText: { color: '#2E7D32', fontSize: 16, fontWeight: '700' },

  categoryFloatingDropdown: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 4,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    zIndex: 20000,
    borderWidth: 1,
    borderColor: '#AAAAAA',
  },
  categoryListHeader: {
    backgroundColor: '#9E9E9E',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryListHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  categoryItemText: { fontSize: 16, color: '#333', fontWeight: '500' },
  categoryPickerTextPlaceholder: { fontSize: 13, color: '#666', fontWeight: '500' },
  categoryPickerTextSelected: { fontSize: 13, color: '#1B5E20', fontWeight: '700' },
  askInputLarge: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  askSubmitBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  askSubmitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

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
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  cardRow: {
    flexDirection: 'row',
  },
  leftColumn: {
    width: 65,
    alignItems: 'center',
    marginRight: 10,
  },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  authorName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
    marginTop: 6,
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  roleBadgeExpert: { backgroundColor: '#FFECB3' },
  roleBadgeUser: { backgroundColor: '#E8F5E9' },
  roleBadgeText: { fontSize: 8, fontWeight: '800' },
  roleTextExpert: { color: '#F57F17' },
  roleTextUser: { color: '#2E7D32' },
  dateText: {
    fontSize: 9,
    color: '#999',
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  rightColumn: {
    flex: 1,
    position: 'relative',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F5E36',
    lineHeight: 22,
    paddingRight: 40,
  },
  actionBtns: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    right: 0,
    gap: 6,
    zIndex: 10,
  },
  iconAction: {
    padding: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  answerCountContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  answerCountBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  answerCountText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  answersSection: {
    marginTop: 4,
  },
  expertResponsesLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: 75,
    gap: 8,
  },
  expertResponsesText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  answerBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    minHeight: 60,
  },
  answerBoxText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
    fontWeight: '500',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

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

  // Add answer row
  addAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 8,
    marginLeft: 75,
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
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker for better focus
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 550,
    alignSelf: 'center',
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
    borderRadius: 24,
    padding: 20,
    width: '92%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
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
  editCategoryFloatingDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    zIndex: 5000,
    borderWidth: 1,
    borderColor: '#E0E8E0',
    overflow: 'hidden',
  },
  editCategoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  editCategoryItemText: { fontSize: 14, color: '#333', fontWeight: '500' },

  // Validation Tooltip
  validationTooltip: {
    position: 'absolute',
    top: 55,
    left: 0,
    zIndex: 15000,
  },
  tooltipPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#333',
    marginLeft: 20,
  },
  tooltipBody: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 10,
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  tooltipIconBox: {
    width: 32,
    height: 28,
    backgroundColor: '#FF9100', // Orange as in screenshot
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '400',
  },
});

export default ForumScreen;
