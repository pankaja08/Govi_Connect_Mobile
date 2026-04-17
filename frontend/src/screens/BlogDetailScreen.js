import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { AuthContext } from '../context/AuthContext';
import { getComments, postComment, toggleCommentLike } from '../api/commentApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────
// Helper: format relative time
// ─────────────────────────────────────────────────────────
const formatTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─────────────────────────────────────────────────────────
// Comment Card Component
// ─────────────────────────────────────────────────────────
const CommentCard = ({ comment, isRegistered, blogId, currentUserId, onLikeToggled }) => {
  const isLiked = comment.likes?.includes(currentUserId);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(comment.likes?.length || 0);
  const [liking, setLiking] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const handleLike = async () => {
    if (!isRegistered) {
      Alert.alert('Login Required', 'You need to be logged in to like comments.');
      return;
    }
    if (liking) return;
    setLiking(true);
    animateHeart();
    const prev = liked;
    const prevCount = likeCount;
    // Optimistic update
    setLiked(!prev);
    setLikeCount(prev ? prevCount - 1 : prevCount + 1);
    try {
      await toggleCommentLike(blogId, comment._id);
      onLikeToggled?.();
    } catch {
      // Revert on failure
      setLiked(prev);
      setLikeCount(prevCount);
    } finally {
      setLiking(false);
    }
  };

  const avatarLetter = comment.userId?.name?.[0]?.toUpperCase() || '?';
  const avatarColors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#009688'];
  const colorIndex = avatarLetter.charCodeAt(0) % avatarColors.length;

  return (
    <View style={styles.commentCard}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColors[colorIndex] }]}>
        <Text style={styles.avatarText}>{avatarLetter}</Text>
      </View>

      {/* Content */}
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{comment.userId?.name || 'User'}</Text>
          <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>

      {/* Like Button */}
      <TouchableOpacity onPress={handleLike} style={styles.likeBtn} activeOpacity={0.7}>
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? '#e53935' : '#aaa'}
          />
        </Animated.View>
        {likeCount > 0 && (
          <Text style={[styles.likeCount, liked && { color: '#e53935' }]}>{likeCount}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────────────────
// Comments Modal Component
// ─────────────────────────────────────────────────────────
const CommentsModal = ({ visible, blogId, onClose, isRegistered }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Animated values
  const slideAnim = useRef(new Animated.Value(600)).current;
  const sendScale = useRef(new Animated.Value(1)).current;
  const sendOpacity = useRef(new Animated.Value(1)).current;
  const sendRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load current user ID from storage
    AsyncStorage.getItem('userId').then(id => setCurrentUserId(id));
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 120,
      }).start();
      fetchComments();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const fetchComments = useCallback(async () => {
    if (!blogId) return;
    setLoading(true);
    try {
      const res = await getComments(blogId);
      setComments(res.data?.data || []);
    } catch (e) {
      console.error('Error fetching comments:', e);
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  const animateSend = () => {
    // Rocket-launch animation: scale up, rotate, then return
    Animated.sequence([
      Animated.parallel([
        Animated.spring(sendScale, { toValue: 1.3, useNativeDriver: true, speed: 80 }),
        Animated.timing(sendRotate, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
        Animated.timing(sendRotate, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!isRegistered) {
      Alert.alert('Login Required', 'Please log in to post a comment.');
      return;
    }
    animateSend();
    setSubmitting(true);
    try {
      const res = await postComment(blogId, text.trim());
      const newComment = res.data?.data;
      if (newComment) {
        setComments(prev => [newComment, ...prev]);
      }
      setText('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const spin = sendRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <Animated.View
            style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {comments.length > 0 ? `${comments.length} Comments` : 'Comments'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={{ height: '100%', maxHeight: 600 }}>
              {/* Comment list */}
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#1F9A4E" />
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No comments yet</Text>
                  <Text style={styles.emptySubtext}>Be the first to share your thoughts!</Text>
                </View>
              ) : (
                <FlatList
                  data={comments}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <CommentCard
                      comment={item}
                      isRegistered={isRegistered}
                      blogId={blogId}
                      currentUserId={currentUserId}
                      onLikeToggled={fetchComments}
                    />
                  )}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              )}

              {/* Input Bar */}
              <View style={styles.inputBar}>
                {isRegistered ? (
                  <>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Add a comment..."
                        placeholderTextColor="#aaa"
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={1000}
                        returnKeyType="default"
                      />
                    </View>

                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={!text.trim() || submitting}
                      style={[
                        styles.sendBtn,
                        (!text.trim() || submitting) && styles.sendBtnDisabled,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Animated.View
                        style={{
                          transform: [{ scale: sendScale }, { rotate: spin }],
                          opacity: sendOpacity,
                        }}
                      >
                        {submitting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="arrow-up" size={20} color="#fff" />
                        )}
                      </Animated.View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.guestBanner}>
                    <Ionicons name="lock-closed-outline" size={16} color="#888" />
                    <Text style={styles.guestBannerText}>
                      Please log in to post a comment
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
// Main: Blog Detail Screen
// ─────────────────────────────────────────────────────────
const BlogDetailScreen = ({ route, navigation }) => {
  const { blog } = route.params;
  const { width } = useWindowDimensions();
  const { userRole } = useContext(AuthContext);
  const isRegistered = userRole && userRole !== 'Guest';

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  // Fetch comment count on mount
  useEffect(() => {
    if (!blog?._id) return;
    getComments(blog._id)
      .then(res => setCommentCount(res.data?.count || 0))
      .catch(() => { });
  }, [blog?._id]);

  if (!blog) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
          <Ionicons name="arrow-back" size={26} color="#333" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCommentBtn}
          onPress={() => setCommentsVisible(true)}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#1F9A4E" />
          {commentCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{commentCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: blog.imageUrl }} style={styles.heroImage} />

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{blog.title}</Text>

          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={16} color="#1F9A4E" />
            </View>
            <Text style={styles.authorText}>
              By {blog.expertId?.name || 'Expert'} • {Math.ceil(blog.content.length / 500)} min read
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{new Date(blog.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{blog.location}</Text>
          </View>

          <View style={[styles.metaRow, { marginTop: -10 }]}>
            <Ionicons name="leaf-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{blog.cropType}</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="cloud-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{blog.season}</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="build-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{blog.farmingMethod}</Text>
          </View>

          <View style={styles.divider} />

          <RenderHtml
            contentWidth={width - 40}
            source={{ html: blog.content }}
            tagsStyles={htmlStyles}
          />

          {/* ── Comments trigger strip ── */}
          <View style={styles.commentTriggerStrip}>
            <View style={styles.commentTriggerLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#1F9A4E" />
              <Text style={styles.commentTriggerLabel}>
                {commentCount > 0 ? `${commentCount} Comments` : 'Comments'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewCommentBtn}
              onPress={() => setCommentsVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewCommentBtnText}>
                {isRegistered ? 'View & Comment' : 'View Comments'}
              </Text>
              <Ionicons name="chevron-up" size={16} color="#1F9A4E" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsVisible}
        blogId={blog._id}
        onClose={() => {
          setCommentsVisible(false);
          // refresh count
          getComments(blog._id)
            .then(res => setCommentCount(res.data?.count || 0))
            .catch(() => { });
        }}
        isRegistered={isRegistered}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const htmlStyles = {
  body: { fontSize: 16, color: '#333', lineHeight: 26 },
  p: { marginBottom: 12 },
  strong: { color: '#111' },
  ul: { paddingLeft: 20, marginBottom: 10 },
  li: { marginBottom: 6 },
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  header: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCommentBtn: {
    padding: 5,
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#e53935',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  backBtnWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingRight: 15,
  },
  backBtnText: { fontSize: 16, color: '#333', marginLeft: 8, fontWeight: '500' },

  scrollContent: { paddingBottom: 60 },
  heroImage: { width: '100%', height: 250, backgroundColor: '#eee' },
  contentContainer: { padding: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 15, lineHeight: 34 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e8f5ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorText: { fontSize: 14, color: '#444', fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: '#666', marginLeft: 4 },
  dot: { marginHorizontal: 10, color: '#ccc' },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 20 },

  // ── Comment trigger strip ──
  commentTriggerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#eef0f3',
  },
  commentTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentTriggerLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginLeft: 6,
  },
  viewCommentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5ec',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  viewCommentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F9A4E',
    marginRight: 4,
  },

  // ── Modal sheet ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: { flex: 1 },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    minHeight: '55%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
  },
  handleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  closeIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Comment cards ──
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' },
  commentUsername: { fontSize: 13, fontWeight: '700', color: '#111', marginRight: 8 },
  commentTime: { fontSize: 11, color: '#aaa' },
  commentText: { fontSize: 14, color: '#333', lineHeight: 20 },
  likeBtn: { alignItems: 'center', paddingLeft: 10, paddingTop: 2, minWidth: 36 },
  likeCount: { fontSize: 11, color: '#aaa', marginTop: 2, fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#f4f4f4', marginLeft: 48 },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 120,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
  },
  textInput: {
    fontSize: 14,
    color: '#222',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1F9A4E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1F9A4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  sendBtnDisabled: {
    backgroundColor: '#b2dfca',
    shadowOpacity: 0,
    elevation: 0,
  },

  // ── Guest / loading / empty ──
  guestBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f6fa',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  guestBannerText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
    fontWeight: '500',
  },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#bbb', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#ccc', marginTop: 6 },
});

export default BlogDetailScreen;
