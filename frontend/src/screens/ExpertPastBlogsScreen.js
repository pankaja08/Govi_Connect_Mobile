import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import apiClient from '../api/client';

const ExpertPastBlogsScreen = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect ensures the list re-fetches when we navigate back from ExpertHome (after making an edit)
  useFocusEffect(
    useCallback(() => {
      fetchMyBlogs();
    }, [])
  );

  const fetchMyBlogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/blogs/me');
      setBlogs(response.data.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch your past blogs.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      'Delete Blog',
      'Are you sure you want to permanently delete this blog?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(id)
        }
      ]
    );
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/blogs/${id}`);
      // Remove from UI
      setBlogs((prev) => prev.filter(blog => blog._id !== id));
      Alert.alert('Success', 'Blog deleted successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not delete the blog.');
    }
  };

  const openBlogReader = (blog) => {
    navigation.navigate('BlogDetail', { blog });
  };

  const renderBlogItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

      <View style={styles.cardContent}>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>{item.cropType}</Text>
          <Text style={styles.badge}>{item.season}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        <Text style={styles.dateText}>
          Published on {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.readMoreBtn}
            onPress={() => openBlogReader(item)}
          >
            <Text style={styles.readMoreText}>Read More</Text>
            <Ionicons name="arrow-forward" size={14} color="#1F9A4E" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <View style={styles.iconActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('ExpertHome', { editData: item })}
            >
              <Ionicons name="create-outline" size={22} color="#1E88E5" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => confirmDelete(item._id)}
            >
              <Ionicons name="trash-outline" size={22} color="#E53935" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Past Blogs</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1F9A4E" />
          <Text style={styles.loadingText}>Loading your publications...</Text>
        </View>
      ) : blogs.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="document-text-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>You haven't published any blogs yet.</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('ExpertHome')}
          >
            <Text style={styles.createBtnText}>Write a Blog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={(item) => item._id}
          renderItem={renderBlogItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

    </SafeAreaView>
  );
};

const htmlStyles = {
  body: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  p: {
    marginBottom: 10,
  },
  strong: {
    color: '#111',
  },
  ul: {
    paddingLeft: 20,
  },
  li: {
    marginBottom: 5,
  }
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F9A4E',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4
  },
  menuIcon: { marginRight: 15 },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: { marginTop: 10, color: '#666' },
  emptyText: { marginTop: 15, color: '#888', fontSize: 16, marginBottom: 20 },
  createBtn: {
    backgroundColor: '#1F9A4E',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8
  },
  createBtnText: { color: '#fff', fontWeight: 'bold' },
  listContent: { padding: 15, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#eee'
  },
  cardContent: {
    padding: 15
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  badge: {
    backgroundColor: '#e8f5ec',
    color: '#1F9A4E',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginRight: 8,
    overflow: 'hidden'
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 5,
    lineHeight: 24
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 15
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  readMoreText: {
    color: '#1F9A4E',
    fontWeight: 'bold',
    fontSize: 14
  },
  iconActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 15,
    padding: 2
  }
});

export default ExpertPastBlogsScreen;
