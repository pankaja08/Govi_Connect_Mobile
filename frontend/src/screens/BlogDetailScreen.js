import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';

const BlogDetailScreen = ({ route, navigation }) => {
  const { blog } = route.params;
  const { width } = useWindowDimensions();

  if (!blog) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
          <Ionicons name="arrow-back" size={26} color="#333" />
          <Text style={styles.backBtnText}>Back</Text>
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
            <Text style={styles.metaText}>
              {new Date(blog.createdAt).toLocaleDateString()}
            </Text>
            
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const htmlStyles = {
  body: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
  p: {
    marginBottom: 12,
  },
  strong: {
    color: '#111',
  },
  ul: {
    paddingLeft: 20,
    marginBottom: 10
  },
  li: {
    marginBottom: 6,
  }
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff'
  },
  backBtnWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start', 
    paddingVertical: 5, 
    paddingRight: 15 
  },
  backBtnText: { 
    fontSize: 16, 
    color: '#333', 
    marginLeft: 8, 
    fontWeight: '500' 
  },
  scrollContent: { paddingBottom: 40 },
  heroImage: { width: '100%', height: 250, backgroundColor: '#eee' },
  contentContainer: { padding: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 15, lineHeight: 34 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  authorAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#e8f5ec',
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  authorText: { fontSize: 14, color: '#444', fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: '#666', marginLeft: 4 },
  dot: { marginHorizontal: 10, color: '#ccc' },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 20 }
});

export default BlogDetailScreen;
