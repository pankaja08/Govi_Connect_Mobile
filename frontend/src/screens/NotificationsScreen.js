import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchUserNotifications,
  markAllNotificationsAsRead,
} from '../api/notificationApi';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    try {
      setError(null);
      const res = await fetchUserNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Could not load notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotifications();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'product_approval':
        return 'checkmark-circle-outline';
      case 'forum_reply':
        return 'chatbubbles-outline';
      case 'expert_reply':
      default:
        return 'chatbubble-ellipses-outline';
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
      {!item.isRead && <View style={styles.unreadDot} />}
      <View style={styles.iconContainer}>
        <Ionicons name={getNotificationIcon(item.type)} size={22} color="#2E7D32" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.message}</Text>
        {item.blogId?.title && (
          <Text style={styles.blogRef}>📄 {item.blogId.title}</Text>
        )}
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* States */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadNotifications(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && notifications.length === 0 && (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubText}>When there are updates on your products or forum questions, you'll see them here.</Text>
        </View>
      )}

      {!loading && !error && notifications.length > 0 && (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2E7D32']} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    flex: 1,
  },
  badge: {
    backgroundColor: '#E53935',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
  },
  markAllText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#F1F8E9',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 3,
  },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
    marginBottom: 4,
  },
  blogRef: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 11,
    color: '#999',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    color: '#E53935',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#2E7D32',
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#aaa',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

export default NotificationsScreen;

