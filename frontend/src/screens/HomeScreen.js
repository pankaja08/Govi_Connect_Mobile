import React, { useState, useEffect, useRef, useContext } from 'react';
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
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';

const CAROUSEL_DATA = [
  {
    id: '0',
    badge: 'Trending',
    title: 'Sri Lanka First all in one Agriculture Platform',
    articleCount: '34 articles',
    readCount: '1720 reads',
    image: 'https://images.pexels.com/photos/2886937/pexels-photo-2886937.jpeg?auto=compress&cs=tinysrgb&w=1000',
    color: '#166142'
  },
  {
    id: '1',
    badge: 'Featured',
    title: 'Boost Your Harvest with Modern Tips',
    articleCount: '12 articles',
    readCount: '950 reads',
    image: 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1000',
    color: '#FF9800'
  },
  {
    id: '2',
    badge: 'Market',
    title: 'Govi Mart: Sell Direct to Buyers',
    articleCount: '8 articles',
    readCount: '2100 reads',
    image: 'https://images.pexels.com/photos/2255924/pexels-photo-2255924.jpeg?auto=compress&cs=tinysrgb&w=1000',
    color: '#4CAF50'
  },
  {
    id: '3',
    badge: 'Community',
    title: 'Expert Advice for Every Farmer',
    articleCount: '25 articles',
    readCount: '1420 reads',
    image: 'https://images.pexels.com/photos/4505166/pexels-photo-4505166.jpeg?auto=compress&cs=tinysrgb&w=1000',
    color: '#2196F3'
  },
  {
    id: '4',
    badge: 'Smart Assistant',
    title: 'Get your Personalized Crop suggestions',
    articleCount: 'Smart Tips',
    readCount: 'Real-time',
    image: 'https://images.pexels.com/photos/706140/pexels-photo-706140.jpeg?auto=compress&cs=tinysrgb&w=1000',
    color: '#8BC34A'
  },
  {
    id: '5',
    badge: 'Management',
    title: 'Track Your Farm Activities efficiently',
    articleCount: 'Daily Logs',
    readCount: 'Tracker',
    image: 'https://images.pexels.com/photos/259280/pexels-photo-259280.jpeg?auto=compress&cs=tinysrgb&w=1000',
    color: '#FF7043'
  }
];



const FILTER_OPTIONS = {
  cropType: ['All', 'Paddy', 'Vegetables', 'Fruits', 'Export Crops', "Plantation Crop"],
  farmingType: ['All', 'Organic', 'Conventional', 'Hydroponics', 'Integrated/Avenue Planting'],
  season: ['All', 'Maha Season', 'Yala Season', 'Rainy Season'],
  location: ['All', 'All Island', 'Western', 'Central', 'Southern', 'Northern', 'Eastern'],
  sortBy: ['Newly Uploaded', 'Earlier Uploaded'],
  savedStatus: ['All Blogs', 'Saved Blogs']
};

const HomeScreen = ({ navigation }) => {
  const { width: windowWidth } = useWindowDimensions();
  const { userRole, signOut } = useContext(AuthContext);
  const [isLoginPromptVisible, setIsLoginPromptVisible] = useState(false);

  // Calculate carousel dimensions dynamically
  const ITEM_WIDTH = windowWidth * 0.90;
  const ITEM_MARGIN = 8;
  const SNAP_INTERVAL = ITEM_WIDTH + (ITEM_MARGIN * 2);
  const SIDE_SPACING = (windowWidth - SNAP_INTERVAL) / 2 - ITEM_MARGIN;

  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef(null);

  // Filter States
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    cropType: 'All',
    farmingType: 'All',
    season: 'All',
    location: 'All',
    sortBy: 'Newly Uploaded',
    savedStatus: 'All Blogs'
  });

  const toggleFilterOption = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      cropType: 'All',
      farmingType: 'All',
      season: 'All',
      location: 'All',
      sortBy: 'Newly Uploaded',
      savedStatus: 'All Blogs'
    });
  };

  const applyFilters = () => {
    setIsFilterVisible(false);
    fetchLatestBlogs();
  };

  const renderFilterSection = (title, category, options) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterChipContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterChip,
              filters[category] === option && styles.filterChipActive
            ]}
            onPress={() => toggleFilterOption(category, option)}
          >
            <Text
              style={[
                styles.filterChipText,
                filters[category] === option && styles.filterChipTextActive
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  useEffect(() => {
    fetchUser();
    fetchLatestBlogs();
  }, []);

  const fetchLatestBlogs = async () => {
    try {
      const q = [];
      if (filters.cropType !== 'All') q.push(`cropType=${encodeURIComponent(filters.cropType)}`);
      if (filters.farmingType !== 'All') q.push(`farmingMethod=${encodeURIComponent(filters.farmingType)}`);
      if (filters.season !== 'All') q.push(`season=${encodeURIComponent(filters.season)}`);
      if (filters.location !== 'All') q.push(`location=${encodeURIComponent(filters.location)}`);
      if (filters.sortBy) q.push(`sortBy=${filters.sortBy === 'Earlier Uploaded' ? 'old' : 'new'}`);

      if (filters.savedStatus === 'Saved Blogs' && user) {
        q.push(`savedOnly=true&userId=${user._id}`);
      }

      if (searchQuery && searchQuery.trim() !== '') {
        q.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }

      const queryStr = q.length > 0 ? `?${q.join('&')}` : '';
      const response = await apiClient.get(`/blogs${queryStr}`);
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

  const toggleSaveBlog = async (blogId) => {
    try {
      const response = await apiClient.put(`/users/toggle-save-blog/${blogId}`);
      setUser(prev => ({ ...prev, savedBlogs: response.data.data.savedBlogs }));
    } catch (error) {
      console.log('Error toggling save blog:', error);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderCarouselItem = ({ item }) => {
    const hasError = imageErrors[item.id];

    return (
      <View style={[styles.carouselItem, { width: ITEM_WIDTH }]}>
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
            colors={['#2ed598', '#1B4332']}
            style={styles.carouselImage}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
          style={styles.carouselOverlay}
        >
          <View style={styles.carouselBadgeContainer}>
            <View style={styles.carouselBadge}>
              <Text style={styles.carouselBadgeText}>{item.badge}</Text>
            </View>
          </View>

          <View style={styles.carouselBottomContent}>
            <View style={styles.carouselMetadataRow}>
              <Text style={styles.carouselMetadataText}>{item.articleCount}</Text>
              <Text style={styles.carouselMetadataText}>{item.readCount}</Text>
            </View>
            <Text style={styles.carouselTitleMain}>{item.title}</Text>
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      <LinearGradient
        colors={['#15bf80ff', '#d2f39eff', '#b6f56fff']}
        style={styles.gradientBg}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Custom Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerIconBtn}>
              <Ionicons name="menu-outline" size={32} color="#1B4332" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              {/* Notification Bell */}
              <TouchableOpacity
                style={styles.iconCircleBtn}
                onPress={() => {
                  if (userRole === 'Guest') {
                    setIsLoginPromptVisible(true);
                  } else {
                    navigation.navigate('Notifications');
                  }
                }}
              >
                <Ionicons name="notifications-outline" size={24} color="#1B4332" />
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>3</Text>
                </View>
              </TouchableOpacity>

              {/* NEW Profile Icon */}
              <TouchableOpacity
                style={styles.iconCircleBtn}
                onPress={() => {
                  if (userRole === 'Guest') {
                    setIsLoginPromptVisible(true);
                  } else {
                    navigation.navigate('Profile');
                  }
                }}
              >
                <Ionicons name="person-outline" size={24} color="#1B4332" />
              </TouchableOpacity>
            </View>

          </View>

          {/* Greeting Section */}
          <View style={styles.greetingContainer}>
            <View style={styles.greetingTexts}>
              {/* Dynamic Name & Emoji added here */}
              <Text style={styles.greetingTitle}>
                {getTimeGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Farmer'} 👋
              </Text>
              <Text style={styles.greetingSubtitle}>Welcome to Sri Lanka's First Agri-Community Platform</Text>
            </View>

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
              contentContainerStyle={[styles.carouselList, { paddingHorizontal: SIDE_SPACING }]}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="center"
              decelerationRate="fast"
              //ListHeaderComponent={() => <View style={{ width: SIDE_SPACING }} />}
              // ListFooterComponent={() => <View style={{ width: SIDE_SPACING }} />}
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
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={fetchLatestBlogs}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      fetchLatestBlogs();
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons name="search-circle" size={32} color="#187a38" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterVisible(true)}>
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
                  {/* Image Container with Floating Badge */}
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: blog.imageUrl }} style={styles.blogThumb} />
                    <View style={styles.imageBadge}>
                      <Text style={styles.imageBadgeText}>{blog.cropType}</Text>
                    </View>
                  </View>

                  <View style={styles.blogDetails}>
                    <Text style={styles.blogTitleText} numberOfLines={2}>{blog.title}</Text>

                    {/* New Author Row with Avatar */}
                    <View style={styles.authorRow}>

                      <Text style={styles.blogMetaText} numberOfLines={1}>
                        {blog.expertId?.name || 'Agri Expert'} • {blog.season}
                      </Text>
                    </View>

                    <View style={styles.blogActionRow}>
                      {/* Modernized Read Button */}
                      <TouchableOpacity
                        style={styles.readBtn}
                        onPress={() => navigation.navigate('BlogDetail', { blog })}
                      >
                        <Text style={styles.readBtnText}>Read Article</Text>
                        <Ionicons name="arrow-forward" size={16} color="#187a38" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>

                      <View style={styles.iconActions}>
                        {userRole !== 'Guest' && (
                          <TouchableOpacity
                            style={styles.iconSBtn}
                            onPress={() => toggleSaveBlog(blog._id)}
                          >
                            <Ionicons
                              name={user?.savedBlogs?.includes(blog._id) ? "bookmark" : "bookmark-outline"}
                              size={22}
                              color={user?.savedBlogs?.includes(blog._id) ? "#187a38" : "#555"}
                            />
                          </TouchableOpacity>
                        )}
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

      {/* Filter Modal */}
      <Modal
        visible={isFilterVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.filterModalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filter Blogs</Text>
                  <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                    <Ionicons name="close" size={26} color="#1B4332" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.filterScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  {renderFilterSection('Crop Type', 'cropType', FILTER_OPTIONS.cropType)}
                  {renderFilterSection('Farming Type', 'farmingType', FILTER_OPTIONS.farmingType)}
                  {renderFilterSection('Season', 'season', FILTER_OPTIONS.season)}
                  {renderFilterSection('Location', 'location', FILTER_OPTIONS.location)}
                  {renderFilterSection('Sort By', 'sortBy', FILTER_OPTIONS.sortBy)}
                  {userRole !== 'Guest' && renderFilterSection('Saved Status', 'savedStatus', FILTER_OPTIONS.savedStatus)}
                </ScrollView>

                <View style={styles.modalBottomActions}>
                  <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                    <Text style={styles.resetBtnText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.applyFilterBtn} onPress={applyFilters}>
                    <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Login Prompt Modal for Guests */}
      <Modal
        visible={isLoginPromptVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLoginPromptVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsLoginPromptVisible(false)}
        >
          <View style={styles.promptModalContainer}>
            <LinearGradient
              colors={['#1B4332', '#2E7D32']}
              style={styles.promptGradient}
            >
              <View style={styles.promptIconContainer}>
                <Ionicons name="lock-closed" size={50} color="#ffffff" />
              </View>
              <Text style={styles.promptTitle}>Unlock the Full Experience!</Text>
              <Text style={styles.promptSubtitle}>
                Join Govi Connect today to access personalized features, community discussions, and expert insights.
              </Text>

              <TouchableOpacity
                style={[styles.promptLoginBtn, { marginBottom: 12 }]}
                onPress={async () => {
                  setIsLoginPromptVisible(false);
                  await signOut();
                }}
              >
                <Text style={styles.promptLoginBtnText}>Login / Register Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.promptLaterBtn}
                onPress={() => setIsLoginPromptVisible(false)}
              >
                <Text style={styles.promptLaterBtnText}>Maybe Later</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#15bf80ff' },
  gradientBg: { flex: 1 },
  centered: { flex: 2, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, paddingTop: Platform.OS === 'android' ? 40 : 10 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#bdf0d0ff', // Your original vibrant green
    borderRadius: 22,             // Half of 44 to make it a perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,               // Puts breathing room between the two circles
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  headerIconBtn: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
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
  headerNotificationBtn: {
    marginRight: 16,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.4)', // Soft transparent background
    borderRadius: 20,
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#049033', // Strong green for contrast
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5af492ff', // Matches your gradient background to blend in
  },
  headerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  initialsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#33691E'
  },
  headerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  greetingContainer: {
    paddingHorizontal: 20,
    marginBottom: 20, // Slightly reduced since the bell is gone
    alignItems: 'flex-start'
  },
  greetingTexts: {
    flex: 1
  },
  greetingTitle: {
    fontSize: 28, // Slightly reduced to fit the name better
    fontWeight: '700',
    color: '#0f1b16ff',
    letterSpacing: -0.5
  },
  greetingSubtitle: {
    fontSize: 15,
    color: '#04560eff', // Slightly darker green/grey for better readability
    marginTop: 6,
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
    marginBottom: 10,
  },
  carouselList: {
    paddingVertical: 10,
  },

  carouselItem: {
    height: 190,
    borderRadius: 25,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginHorizontal: 12,
    backgroundColor: '#ffffff',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  carouselOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  carouselBadgeContainer: {
    alignItems: 'flex-start',
  },
  carouselBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  carouselBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  carouselBottomContent: {
    width: '100%',
  },
  carouselMetadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  carouselMetadataText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
  },
  carouselTitleMain: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
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
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  blogThumb: {
    width: '100%',
    height: 160, // Slightly taller for a better aspect ratio
  },
  imageBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#187a38',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  blogDetails: {
    padding: 16,
    paddingTop: 12,
  },
  blogTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 10,
    lineHeight: 24,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#E8F5E9',
  },
  blogMetaText: {
    fontSize: 13,
    color: '#666',
    //marginBottom: 15,
    fontWeight: '600',
    flex: 1,
  },
  blogActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5', // Subtle divider line
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  readBtnText: {
    color: '#187a38',
    fontWeight: '800',
    fontSize: 14,
  },
  iconActions: {
    flexDirection: 'row',
  },
  iconSBtn: {
    marginLeft: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20,
    width: '94%',
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B4332'
  },
  filterScroll: {
    paddingBottom: 15
  },
  filterSection: {
    marginBottom: 15
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8
  },
  filterChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  filterChipActive: {
    backgroundColor: '#1B4332',
    borderColor: '#1B4332'
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600'
  },
  filterChipTextActive: {
    color: '#ffffff'
  },
  modalBottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 5
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    alignItems: 'center'
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666'
  },
  applyFilterBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: '#1B4332',
    alignItems: 'center'
  },
  applyFilterBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff'
  },
  promptModalContainer: {
    width: '85%',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  promptGradient: {
    padding: 30,
    alignItems: 'center',
  },
  promptIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  promptSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  promptLoginBtn: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  promptLoginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B4332',
  },
  promptLaterBtn: {
    paddingVertical: 10,
  },
  promptLaterBtnText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  }
});

export default HomeScreen;
