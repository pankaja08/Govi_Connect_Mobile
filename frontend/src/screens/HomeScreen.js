import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Dimensions,
  Platform,
  FlatList,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

const CAROUSEL_DATA = [
  {
    id: '0',
    badge: 'SRI LANKA AGRICULTURE',
    title: 'Sri Lanka First all in one',
    highlightTitle: 'Agriculture Platform',
    desc: 'Connecting farmers, agricultural officers, and communities across every province of Sri Lanka.',
    image: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: '#166142ff',
    isSpecial: true
  },
  {
    id: '1',
    title: 'Boost Your Harvest!',
    desc: 'Discover modern farming tips, market prices, and expert advice.',
    image: 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: '#FF9800'
  },
  {
    id: '2',
    title: 'Govi Mart: Sell Direct',
    desc: 'Connect with buyers and get the best prices for your produce.',
    image: 'https://images.pexels.com/photos/2255924/pexels-photo-2255924.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: '#4CAF50'
  },
  {
    id: '3',
    title: 'Expert Community',
    desc: 'Join the forum to discuss crop issues with certified agri-officers.',
    image: 'https://images.pexels.com/photos/4505166/pexels-photo-4505166.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: '#2196F3'
  },
  {
    id: '4',
    title: 'Personal Farming',
    desc: 'Smart gardening tools and AI disease identification for your home crops.',
    image: 'https://images.pexels.com/photos/5946101/pexels-photo-5946101.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: '#689F38'
  }
];



const HomeScreen = ({ navigation }) => {
  const { width: windowWidth } = useWindowDimensions();

  // Calculate carousel dimensions dynamically
  const ITEM_WIDTH = windowWidth * 0.82;
  const ITEM_MARGIN = 8;
  const SNAP_INTERVAL = ITEM_WIDTH + (ITEM_MARGIN * 2);
  const SIDE_SPACING = (windowWidth - SNAP_INTERVAL) / 2;

  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchUser();
    fetchLatestBlogs();
  }, []);

  const fetchLatestBlogs = async () => {
    try {
      const response = await apiClient.get('/blogs');
      setBlogs(response.data.data);
    } catch (error) {
      console.log('Failed to fetch blogs', error);
    }
  };

  // Auto-scroll Timer: 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (CAROUSEL_DATA.length > 0) {
        const nextSlide = (activeSlide + 1) % CAROUSEL_DATA.length;
        flatListRef.current?.scrollToIndex({
          index: nextSlide,
          animated: true
        });
        // We don't need to manually call setActiveSlide here 
        // because the onScroll handler will do it when the scroll completes.
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [activeSlide]);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data.data.user);
    } catch (error) {
      console.log('User fetching error or guest mode', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const renderCarouselItem = ({ item }) => {
    const hasError = imageErrors[item.id];

    return (
      <View style={[styles.carouselItem, { width: ITEM_WIDTH, borderColor: item.color || '#C8E6C9' }]}>
        {!hasError ? (
          <Image
            key={item.id}
            source={{ uri: item.image }}
            style={styles.carouselImage}
            resizeMode="cover"
            onError={() => {
              console.log(`Image load failed for ${item.id}`);
              setImageErrors(prev => ({ ...prev, [item.id]: true }));
            }}
          />
        ) : (
          <LinearGradient
            colors={item.isSpecial ? ['#2ed598ff', '#1B4332'] : ['#E8F5E9', '#C8E6C9']}
            style={styles.carouselImage}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        )}

        <LinearGradient
          colors={item.isSpecial ? ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.4)'] : ['transparent', 'rgba(0,0,0,0.7)']}
          style={[
            styles.carouselOverlay,
            item.isSpecial && { justifyContent: 'center', alignItems: 'center', padding: 15 }
          ]}
        >
          <View style={styles.overlayContent}>
            {item.badge && (
              <View style={styles.specialBadge}>
                <Ionicons name="leaf" size={12} color="#1B4332" style={{ marginRight: 5 }} />
                <Text style={styles.specialBadgeText}>{item.badge}</Text>
              </View>
            )}

            {item.highlightTitle ? (
              <View style={{ alignItems: 'center', marginBottom: 5 }}>
                <Text style={[styles.carouselTitle, { textAlign: 'center', fontSize: 26, marginBottom: 0, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }]}>
                  {item.title}
                </Text>
                <Text style={[styles.carouselTitle, { color: '#FFB300', textAlign: 'center', fontSize: 32, marginTop: -5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }]}>
                  {item.highlightTitle}
                </Text>
              </View>
            ) : (
              <Text style={styles.carouselTitle}>{item.title}</Text>
            )}

            <Text style={[styles.carouselDesc, item.isSpecial && { textAlign: 'center', fontSize: 13, color: '#ffffff', fontWeight: '700' }]}>
              {item.desc}
            </Text>

            {!item.isSpecial && (
              <TouchableOpacity style={styles.learnMoreBtn}>
                <Text style={styles.learnMoreText}>Explore More <Ionicons name="arrow-forward" size={14} color="#fff" /></Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const onScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SNAP_INTERVAL);
    if (index !== activeSlide) {
      setActiveSlide(index);
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#2ed598ff', '#d2f39eff', '#c4f48cff']}
        style={styles.gradientBg}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Custom Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerIconBtn}>
              <Ionicons name="menu-outline" size={32} color="#1B4332" />
            </TouchableOpacity>

            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <View style={[styles.profileContainer, { padding: 2, borderRadius: 25 }]}>
                  <Image
                    source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting Section */}
          <View style={styles.greetingContainer}>
            <View style={styles.greetingTexts}>
              <Text style={styles.greetingTitle}>{getTimeGreeting()}</Text>
              <Text style={styles.greetingSubtitle}>Welcome to Govi Connect.</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={28} color="#1B4332" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Carousel Section */}
          <View style={styles.carouselSection}>
            <FlatList
              ref={flatListRef}
              data={CAROUSEL_DATA}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.carouselList}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              ListHeaderComponent={() => <View style={{ width: SIDE_SPACING }} />}
              ListFooterComponent={() => <View style={{ width: SIDE_SPACING }} />}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
            />
            <View style={styles.pagination}>
              {CAROUSEL_DATA.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    activeSlide === i ? styles.activeDot : styles.inactiveDot
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Content Panel (White) */}
          <View style={styles.contentPanel}>

            {/* Search and Filter */}
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={22} color="#888" />
                <TextInput
                  style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' }]}
                  placeholder="Search blogs"
                  placeholderTextColor="#444"
                />
              </View>
              <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="options-outline" size={20} color="#1B4332" />
                <Text style={styles.filterLabel}>Filter</Text>
              </TouchableOpacity>
            </View>

            {/* Latest Blogs */}
            <Text style={styles.sectionHeader}>Latest Blogs</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.blogsList}
              contentContainerStyle={styles.blogsScrollContent}
            >
              {blogs.map((blog) => (
                <View key={blog._id} style={styles.blogItem}>
                  <Image source={{ uri: blog.imageUrl }} style={styles.blogThumb} />
                  <View style={styles.blogDetails}>
                    <Text style={styles.blogTitleText} numberOfLines={2}>{blog.title}</Text>

                    {/* Dynamic metadata requested by user */}
                    <Text style={styles.blogMetaText} numberOfLines={1}>
                      By {blog.expertId?.name || 'Expert'} | {blog.season} • {blog.cropType}
                    </Text>

                    <View style={styles.blogActionRow}>
                      <TouchableOpacity
                        style={styles.readBtn}
                        onPress={() => navigation.navigate('BlogDetail', { blog })}
                      >
                        <Text style={styles.readBtnText}>Read More</Text>
                      </TouchableOpacity>
                      <View style={styles.iconActions}>
                        <TouchableOpacity style={styles.iconSBtn}><Ionicons name="bookmark-outline" size={22} color="#333" /></TouchableOpacity>
                        <TouchableOpacity style={styles.iconSBtn}><Ionicons name="share-social-outline" size={22} color="#333" /></TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={{ height: 80 }} />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  gradientBg: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, paddingTop: Platform.OS === 'android' ? 40 : 10 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerIconBtn: {
    padding: 5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 30,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ffffff'
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  initialsBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#C5E1A5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  initialsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#33691E'
  },

  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 25,
    alignItems: 'flex-start'
  },
  greetingTexts: {
    flex: 1
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: '625',
    color: '#0f1b16ff',
    letterSpacing: -0.5
  },
  greetingSubtitle: {
    fontSize: 16,
    color: '#010101ff',
    marginTop: 4,
    fontWeight: '500'
  },
  notificationBtn: {
    padding: 12,
    backgroundColor: '#5af492ff',
    borderRadius: 25,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#049033ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },

  carouselSection: {
    marginBottom: 20,
  },
  carouselList: {
    paddingVertical: 10,
  },
  carouselItem: {
    height: 210,
    borderRadius: 25,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 8, // Set statically to match ITEM_MARGIN
    borderWidth: 1,
    backgroundColor: '#ffffff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  carouselOverlay: {
    flex: 1,
    padding: 25,
    justifyContent: 'flex-end',
  },
  overlayContent: {
  },
  carouselTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  carouselDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
    maxWidth: '90%'
  },
  learnMoreBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)'
  },
  learnMoreText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5
  },
  specialBadge: {
    backgroundColor: '#FFB300',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1B4332',
    letterSpacing: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#1B4332',
    width: 20,
  },
  inactiveDot: {
    backgroundColor: '#898686ff',
  },

  contentPanel: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 30,
    paddingHorizontal: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    zIndex: 20,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 30,
    alignItems: 'center'
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    paddingHorizontal: 15,
    marginRight: 12,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    overflow: 'hidden'
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1B4332',
    fontWeight: '600'
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 18,
    borderRadius: 18,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#C8E6C9'
  },
  filterLabel: {
    fontWeight: '800',
    color: '#1B4332',
    marginLeft: 6,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  sectionHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B4332',
    marginBottom: 20,
    letterSpacing: -0.5,
    paddingLeft: 5
  },
  blogsList: {
    marginBottom: 15,
  },
  blogsScrollContent: {
    paddingLeft: 5,
    paddingRight: 20,
    paddingBottom: 15
  },
  blogItem: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  blogThumb: {
    width: '100%',
    height: 150,
  },
  blogDetails: {
    padding: 16,
  },
  blogTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
    lineHeight: 24,
  },
  blogMetaText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontWeight: '500'
  },
  blogActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  readBtn: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  readBtnText: {
    color: '#333',
    fontWeight: '800',
    fontSize: 12
  },
  iconActions: {
    flexDirection: 'row',
  },
  iconSBtn: {
    marginLeft: 12,
  }
});

export default HomeScreen;
