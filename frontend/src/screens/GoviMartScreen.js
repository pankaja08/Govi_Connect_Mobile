import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  FlatList, Image, ActivityIndicator, RefreshControl, Modal, Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { productApi } from '../api/productApi';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Seeds', 'Fertilizers', 'Equipment', 'Other'];
const SALE_TYPES = ['All', 'Retail Only', 'Wholesale Only', 'Retail & Wholesale'];

const CATEGORY_ICONS = {
  All: 'apps-outline', Vegetables: 'leaf-outline', Fruits: 'nutrition-outline',
  Grains: 'git-merge-outline', Seeds: 'ellipse-outline', Fertilizers: 'flask-outline',
  Equipment: 'construct-outline', Other: 'grid-outline',
};

const SALE_TYPE_COLORS = {
  'Retail Only': '#2196F3',
  'Wholesale Only': '#FF9800',
  'Retail & Wholesale': '#4CAF50',
};

// ─── Star component ────────────────────────────────────────────────
const Stars = ({ rating, size = 12 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= Math.round(rating) ? 'star' : 'star-outline'}
        size={size}
        color="#FFB300"
        style={{ marginRight: 1 }}
      />
    );
  }
  return <View style={{ flexDirection: 'row' }}>{stars}</View>;
};

// ─── Product Card ──────────────────────────────────────────────────
const ProductCard = ({ product, onPress, rank }) => {
  const saleColor = SALE_TYPE_COLORS[product.saleType] || '#888';
  return (
    <TouchableOpacity style={[styles.card, { width: CARD_WIDTH }]} onPress={() => onPress(product)} activeOpacity={0.85}>
      {rank && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      )}
      <View style={styles.cardImageContainer}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name={CATEGORY_ICONS[product.category] || 'leaf-outline'} size={40} color="#A5D6A7" />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.starsRow}>
          <Stars rating={product.avgRating} size={11} />
          <Text style={styles.ratingText}> {product.avgRating?.toFixed(1)} ({product.numRatings})</Text>
        </View>
        <Text style={styles.cardPrice}>Rs. {product.price?.toFixed(2)} <Text style={styles.cardUnit}>/ {product.unit}</Text></Text>
        <View style={[styles.saleTypeBadge, { backgroundColor: saleColor + '22', borderColor: saleColor }]}>
          <Text style={[styles.saleTypeText, { color: saleColor }]}>{product.saleType}</Text>
        </View>
        <Text style={styles.cardSeller} numberOfLines={1}>
          <Ionicons name="person-outline" size={10} color="#888" /> {product.seller?.name || 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────
const GoviMartScreen = ({ navigation }) => {
  const { userRole } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSaleType, setActiveSaleType] = useState('All');
  const [showTopRated, setShowTopRated] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [view, setView] = useState('home'); // 'home' | 'browse'

  // Filter state
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({});

  const fetchProducts = useCallback(async () => {
    try {
      const params = { ...appliedFilters };
      if (activeCategory !== 'All') params.category = activeCategory;
      if (activeSaleType !== 'All') params.saleType = activeSaleType;
      if (showTopRated) params.topRated = 'true';
      if (showFavorites) params.favorites = 'true';
      const res = await productApi.getAll(params);
      setProducts(res.data?.data?.products || []);
    } catch (err) {
      console.log('Products fetch error:', err.message);
    }
  }, [activeCategory, activeSaleType, showTopRated, showFavorites, appliedFilters]);

  const fetchTopRated = useCallback(async () => {
    try {
      const res = await productApi.getTopRated();
      setTopRated((res.data?.data?.products || []).slice(0, 6));
    } catch (err) {
      console.log('Top rated fetch error:', err.message);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchTopRated()]);
    setLoading(false);
  }, [fetchProducts, fetchTopRated]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const applyFilters = () => {
    const f = {};
    if (search.trim()) f.search = search.trim();
    if (location.trim()) f.location = location.trim();
    if (minPrice !== '') f.minPrice = minPrice;
    if (maxPrice !== '') f.maxPrice = maxPrice;
    setAppliedFilters(f);
    setFilterVisible(false);
  };

  const clearFilters = () => {
    setSearch('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setAppliedFilters({});
    setFilterVisible(false);
  };

  const goToProduct = (product) => {
    navigation.navigate('ProductDetail', { productId: product._id });
  };

  const hasActiveFilters = Object.keys(appliedFilters).length > 0;

  // ── Home Hero ──
  const renderHero = () => (
    <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047', '#26C6DA']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={styles.heroTitle}>Govi Mart</Text>
      <Text style={styles.heroSub}>Sri Lanka's agricultural marketplace. Buy and sell fresh vegetables, fruits, grains, seeds, fertilizers & equipment. Connect directly with farmers and suppliers — no middlemen.</Text>
      <View style={styles.heroButtons}>
        <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => setView('browse')}>
          <Text style={styles.heroBtnPrimaryText}>Browse Products</Text>
        </TouchableOpacity>
        {userRole !== 'Guest' && (
          <TouchableOpacity style={styles.heroBtnSecondary} onPress={() => navigation.navigate('AddProduct')}>
            <Text style={styles.heroBtnSecondaryText}>List a Product</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  // ── Category Pills ──
  const renderCategoryPills = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pillsContainer}>
      {CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat}
          style={[styles.pill, activeCategory === cat && styles.pillActive]}
          onPress={() => setActiveCategory(cat)}
        >
          <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // ── Sale Type Pills ──
  const renderSaleTypePills = () => (
    <View style={styles.saleTypeRow}>
      <Text style={styles.saleTypeLabel}>SALE TYPE:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {SALE_TYPES.map(st => (
          <TouchableOpacity
            key={st}
            style={[styles.saleTypePill, activeSaleType === st && styles.saleTypePillActive]}
            onPress={() => setActiveSaleType(st)}
          >
            <Text style={[styles.saleTypePillText, activeSaleType === st && styles.saleTypePillTextActive]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ── Top-Rated Row ──
  const renderTopRated = () => {
    if (topRated.length === 0) return null;
    return (
      <View style={styles.topRatedSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="star" size={18} color="#FFB300" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Top Rated Items</Text>
            <Text style={styles.sectionSub}>The highest-rated products on Govi Mart this season</Text>
          </View>
        </View>
        <FlatList
          horizontal
          data={topRated}
          keyExtractor={item => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={({ item, index }) => (
            <ProductCard product={item} onPress={goToProduct} rank={index + 1} />
          )}
        />
      </View>
    );
  };

  // ── Filter Modal ──
  const renderFilterModal = () => (
    <Modal visible={filterVisible} transparent animationType="slide">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)} />
      <View style={styles.filterPanel}>
        <View style={styles.filterHeader}>
          <Ionicons name="options-outline" size={20} color="#2E7D32" />
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={() => setFilterVisible(false)}>
            <Ionicons name="close" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.filterLabel}>Search</Text>
        <TextInput style={styles.filterInput} placeholder="Product name..." value={search} onChangeText={setSearch} />

        <Text style={styles.filterLabel}>Location</Text>
        <TextInput style={styles.filterInput} placeholder="e.g. Kandy" value={location} onChangeText={setLocation} />

        <View style={styles.filterRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.filterLabel}>Min Price (Rs.)</Text>
            <TextInput style={styles.filterInput} placeholder="0" keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.filterLabel}>Max Price (Rs.)</Text>
            <TextInput style={styles.filterInput} placeholder="10000" keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
          </View>
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // ── Browse Section ──
  const renderBrowse = () => (
    <View style={styles.browseContainer}>
      {/* Toolbar */}
      <View style={styles.browseToolbar}>
        <TouchableOpacity style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options-outline" size={16} color={hasActiveFilters ? '#fff' : '#2E7D32'} />
          <Text style={[styles.filterBtnText, hasActiveFilters && { color: '#fff' }]}>
            {hasActiveFilters ? 'Filters Active' : 'Filter'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topRatedBtn, showTopRated && styles.topRatedBtnActive]} onPress={() => setShowTopRated(!showTopRated)}>
          <Ionicons name="star" size={14} color={showTopRated ? '#fff' : '#FFB300'} />
          <Text style={[styles.topRatedBtnText, showTopRated && { color: '#fff' }]}>Top Rated</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.favBtn, showFavorites && styles.favBtnActive]} onPress={() => setShowFavorites(!showFavorites)}>
          <Ionicons name="heart" size={14} color={showFavorites ? '#fff' : '#E53935'} />
          <Text style={[styles.favBtnText, showFavorites && { color: '#fff' }]}>My Favorites</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 60 }} />
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySub}>No products match your filters. Try adjusting or clearing them.</Text>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
              <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => <ProductCard product={item} onPress={goToProduct} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <ScrollView 
        style={styles.screen} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
      >
        {renderHero()}
        {renderCategoryPills()}
        {renderSaleTypePills()}

        {/* Top-rated toggle row */}
        <View style={styles.viewToggleRow}>
          <TouchableOpacity style={[styles.viewToggleBtn, showTopRated && styles.viewToggleBtnActive]} onPress={() => { setShowTopRated(!showTopRated); setView('home'); }}>
            <Ionicons name="star" size={14} color={showTopRated ? '#fff' : '#FFB300'} />
            <Text style={[styles.viewToggleText, showTopRated && { color: '#fff' }]}>Top Rated</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.viewToggleBtn, styles.favBtn, showFavorites && styles.favBtnActive]} onPress={() => { setShowFavorites(!showFavorites); setView('browse'); }}>
            <Ionicons name="heart" size={14} color={showFavorites ? '#fff' : '#E53935'} />
            <Text style={[styles.viewToggleText, showFavorites && { color: '#fff' }]}>My Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.browseAllBtn]} onPress={() => setView('browse')}>
            <Text style={styles.browseAllText}>Browse All →</Text>
          </TouchableOpacity>
        </View>

        {/* Top Rated Section (home view) */}
        {view === 'home' && renderTopRated()}

        {/* Browse Section */}
        {renderBrowse()}
        {renderFilterModal()}

        {/* Add Product FAB — only for registered users */}
        {userRole !== 'Guest' && (
          <View style={styles.fabArea}>
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddProduct')}>
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F5' },

  // Hero
  hero: { paddingTop: hp('6%'), paddingBottom: hp('4%'), paddingHorizontal: wp('6%'), alignItems: 'center' },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 1, marginBottom: 12 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  heroButtons: { flexDirection: 'row', gap: 12 },
  heroBtnPrimary: { backgroundColor: '#FFB300', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 30 },
  heroBtnPrimaryText: { color: '#1B5E20', fontWeight: '800', fontSize: 15 },
  heroBtnSecondary: { borderWidth: 2, borderColor: '#fff', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 30 },
  heroBtnSecondaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Pill filters
  pillsScroll: { backgroundColor: '#fff', maxHeight: 52 },
  pillsContainer: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#2E7D32', backgroundColor: '#fff' },
  pillActive: { backgroundColor: '#2E7D32' },
  pillText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  pillTextActive: { color: '#fff' },

  // Sale type
  saleTypeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  saleTypeLabel: { fontSize: 11, fontWeight: '700', color: '#888', marginRight: 8 },
  saleTypePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#fff' },
  saleTypePillActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  saleTypePillText: { fontSize: 12, color: '#555', fontWeight: '500' },
  saleTypePillTextActive: { color: '#fff', fontWeight: '700' },

  // View toggle row
  viewToggleRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 8 },
  viewToggleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#FFB300', gap: 4 },
  viewToggleBtnActive: { backgroundColor: '#FFB300', borderColor: '#FFB300' },
  viewToggleText: { fontSize: 12, fontWeight: '600', color: '#FFB300' },
  browseAllBtn: { marginLeft: 'auto', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E8F5E9' },
  browseAllText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },

  // Favorite button
  favBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E53935', gap: 4 },
  favBtnActive: { backgroundColor: '#E53935', borderColor: '#E53935' },
  favBtnText: { fontSize: 12, fontWeight: '600', color: '#E53935' },

  // Top Rated section
  topRatedSection: { backgroundColor: '#fff', paddingVertical: hp('2%'), marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14, gap: 10 },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  sectionSub: { fontSize: 12, color: '#888', marginTop: 2 },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  rankBadge: { position: 'absolute', top: 8, left: 8, zIndex: 10, backgroundColor: '#FFB300', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  rankText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  cardImageContainer: { width: '100%', height: 110 },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 10 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingText: { fontSize: 10, color: '#888' },
  cardPrice: { fontSize: 14, fontWeight: '800', color: '#1B5E20', marginBottom: 4 },
  cardUnit: { fontSize: 11, fontWeight: '400', color: '#666' },
  saleTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1, marginBottom: 4 },
  saleTypeText: { fontSize: 9, fontWeight: '700' },
  cardSeller: { fontSize: 10, color: '#888' },

  // Browse
  browseContainer: { backgroundColor: '#F5F5F5', minHeight: 400, marginTop: 8 },
  browseToolbar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#2E7D32', gap: 4 },
  filterBtnActive: { backgroundColor: '#2E7D32' },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  topRatedBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#FFB300', gap: 4 },
  topRatedBtnActive: { backgroundColor: '#FFB300' },
  topRatedBtnText: { fontSize: 12, fontWeight: '600', color: '#FFB300' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  clearFiltersBtn: { borderWidth: 1.5, borderColor: '#2E7D32', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  clearFiltersBtnText: { color: '#2E7D32', fontWeight: '700' },

  // Filter modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  filterPanel: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, position: 'absolute', bottom: 0, left: 0, right: 0 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  filterTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  filterInput: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 14, color: '#1A1A1A' },
  filterRow: { flexDirection: 'row' },
  applyBtn: { backgroundColor: '#2E7D32', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  clearBtn: { alignItems: 'center', paddingVertical: 8 },
  clearBtnText: { color: '#888', fontWeight: '600', fontSize: 14 },

  // FAB
  fabArea: { position: 'absolute', bottom: 24, right: 24 },
  fab: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
});

export default GoviMartScreen;
