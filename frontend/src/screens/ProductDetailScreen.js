import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
    ActivityIndicator, Alert, Linking, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productApi } from '../api/productApi';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const SALE_TYPE_COLORS = {
    'Retail Only': '#2196F3',
    'Wholesale Only': '#FF9800',
    'Retail & Wholesale': '#4CAF50',
};

// ─── Interactive Star Rating ───────────────────────────────────────
const StarRating = ({ rating, avgRating, numRatings, onRate, disabled }) => {
    const [hover, setHover] = useState(0);
    const display = hover || rating;

    return (
        <View style={styles.ratingBox}>
            <Text style={styles.ratingBoxLabel}>RATE THIS ITEM</Text>
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} disabled={disabled} onPress={() => onRate(star)} activeOpacity={0.7}>
                        <Ionicons
                            name={star <= display ? 'star' : 'star-outline'}
                            size={28}
                            color={disabled ? '#ccc' : (star <= display ? '#FFB300' : '#bbb')}
                            style={{ marginHorizontal: 3 }}
                        />
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.avgRatingText}>
                {avgRating?.toFixed(1) || '0.0'} avg ({numRatings || 0} ratings)
            </Text>
            {disabled && <Text style={styles.ownProductNote}>You cannot rate your own product</Text>}
        </View>
    );
};

// ─── Breadcrumb ────────────────────────────────────────────────────
const Breadcrumb = ({ category, name, onBack }) => (
    <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={onBack}>
            <Text style={styles.breadcrumbLink}>Govi Mart</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color="#888" />
        <Text style={styles.breadcrumbLink}>{category}</Text>
        <Ionicons name="chevron-forward" size={14} color="#888" />
        <Text style={styles.breadcrumbCurrent} numberOfLines={1}>{name}</Text>
    </View>
);

// ─── Main Screen ───────────────────────────────────────────────────
const ProductDetailScreen = ({ route, navigation }) => {
    const { productId } = route.params;
    const { userRole } = useContext(AuthContext);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userRating, setUserRating] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favCount, setFavCount] = useState(0);
    const [ratingLoading, setRatingLoading] = useState(false);

    useEffect(() => {
        loadProduct();
        loadUserId();
    }, [productId]);

    const loadUserId = async () => {
        try {
            const stored = await AsyncStorage.getItem('userId');
            if (stored) setCurrentUserId(stored);
        } catch (_) { }
    };

    const loadProduct = async () => {
        setLoading(true);
        try {
            const res = await productApi.getById(productId);
            const p = res.data?.data?.product;
            setProduct(p);
            setFavCount(p?.favorites?.length || 0);

            // Check if current user has favorited
            const uid = await AsyncStorage.getItem('userId');
            if (uid && p?.favorites) {
                setIsFavorite(p.favorites.some(f => f.toString() === uid || f._id?.toString() === uid));
            }
            // Check user's existing rating
            if (uid && p?.ratings) {
                const myRating = p.ratings.find(r => r.user?.toString() === uid || r.user?._id?.toString() === uid);
                if (myRating) setUserRating(myRating.value);
            }
        } catch (err) {
            Alert.alert('Error', 'Could not load product details.');
        } finally {
            setLoading(false);
        }
    };

    const handleContact = () => {
        const phone = product?.contactNumber || product?.seller?.contactInfo;
        if (!phone) {
            Alert.alert('No Number', 'The seller has not provided a contact number.');
            return;
        }
        // Format: strip leading 0 and add +94 for Sri Lanka if needed
        let formatted = phone.replace(/\s+/g, '');
        if (formatted.startsWith('0')) formatted = '+94' + formatted.slice(1);
        if (!formatted.startsWith('+')) formatted = '+94' + formatted;
        const url = `whatsapp://send?phone=${formatted}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) Linking.openURL(url);
            else Alert.alert('WhatsApp not installed', `You can contact the seller at: ${phone}`);
        });
    };

    const handleRate = async (value) => {
        if (ratingLoading) return;
        setRatingLoading(true);
        try {
            const res = await productApi.rate(productId, value);
            setUserRating(value);
            setProduct(prev => ({
                ...prev,
                avgRating: res.data?.data?.avgRating,
                numRatings: res.data?.data?.numRatings,
            }));
            Alert.alert('Rated!', `You rated this product ${value} star${value > 1 ? 's' : ''}.`);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not submit rating.');
        } finally {
            setRatingLoading(false);
        }
    };

    const handleFavorite = async () => {
        try {
            const res = await productApi.toggleFavorite(productId);
            setIsFavorite(res.data?.data?.isFavorite);
            setFavCount(res.data?.data?.count);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not update favorites.');
        }
    };

    const isOwnProduct = product && currentUserId &&
        (product.seller?._id?.toString() === currentUserId || product.seller?.toString() === currentUserId);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2E7D32" />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Product not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: '#2E7D32', marginTop: 10, fontWeight: '600' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const saleColor = SALE_TYPE_COLORS[product.saleType] || '#888';

    return (
        <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
                {!isOwnProduct && (
                    <TouchableOpacity style={styles.heartBtn} onPress={handleFavorite}>
                        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#E53935' : '#888'} />
                        <Text style={styles.favCount}>{favCount}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Breadcrumb category={product.category} name={product.name} onBack={() => navigation.goBack()} />

            {/* Image */}
            <View style={styles.imageContainer}>
                {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
                ) : (
                    <View style={[styles.productImage, styles.imagePlaceholder]}>
                        <Ionicons name="image-outline" size={80} color="#A5D6A7" />
                    </View>
                )}
            </View>

            {/* Details */}
            <View style={styles.detailsContainer}>
                {/* Status badge */}
                <View style={[
                    styles.statusBadge, 
                    product.status === 'In Stock' ? styles.inStock : 
                    product.status === 'Sold Out' ? styles.soldOut : 
                    styles.outOfStock
                ]}>
                    <Text style={[
                        styles.statusText,
                        product.status === 'In Stock' ? { color: '#2E7D32' } :
                        product.status === 'Sold Out' ? { color: '#E65100' } :
                        { color: '#C62828' }
                    ]}>{product.status}</Text>
                </View>

                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>
                    Rs. {product.price?.toFixed(2)} <Text style={styles.priceUnit}>/ {product.unit}</Text>
                </Text>

                {product.description ? (
                    <Text style={styles.description}>{product.description}</Text>
                ) : null}

                {/* Quantity */}
                <Text style={styles.qtyLabel}>Available Quantity</Text>
                <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{product.quantity} {product.unit}</Text>
                </View>

                {/* Sale Type */}
                <View style={[styles.saleTypeBadge, { backgroundColor: saleColor + '22', borderColor: saleColor }]}>
                    <Text style={[styles.saleTypeText, { color: saleColor }]}>{product.saleType}</Text>
                </View>

                {/* Rating + Contact Seller */}
                <View style={styles.actionRow}>
                    <StarRating
                        rating={userRating}
                        avgRating={product.avgRating}
                        numRatings={product.numRatings}
                        onRate={handleRate}
                        disabled={isOwnProduct || ratingLoading}
                    />
                    {!isOwnProduct && (
                        <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
                            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                            <Text style={styles.contactBtnText}>Contact Seller</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Seller Info */}
                <View style={styles.sellerCard}>
                    <View style={styles.sellerRow}>
                        <Text style={styles.sellerLabel}>Seller:</Text>
                        <View style={styles.sellerAvatar}>
                            <Text style={styles.sellerAvatarText}>{(product.seller?.name || 'S')[0].toUpperCase()}</Text>
                        </View>
                        <Text style={styles.sellerValue}>{product.seller?.name || 'Unknown'}</Text>
                    </View>
                    {product.location ? (
                        <View style={styles.sellerRow}>
                            <Text style={styles.sellerLabel}>Location:</Text>
                            <Text style={styles.sellerValue}>{product.location}</Text>
                        </View>
                    ) : null}
                    <View style={styles.sellerRow}>
                        <Text style={styles.sellerLabel}>Category:</Text>
                        <Text style={[styles.sellerValue, { color: '#2E7D32', fontWeight: '700' }]}>{product.category}</Text>
                    </View>
                    {product.contactNumber ? (
                        <View style={styles.sellerRow}>
                            <Text style={styles.sellerLabel}>Contact:</Text>
                            <Text style={styles.sellerValue}>{product.contactNumber}</Text>
                        </View>
                    ) : null}
                    <View style={styles.sellerRow}>
                        <Text style={styles.sellerLabel}>Listing Date:</Text>
                        <Text style={styles.sellerValue}>
                            {new Date(product.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F9F9F9' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorText: { fontSize: 16, color: '#888' },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
    heartBtn: { flexDirection: 'row', alignItems: 'center', padding: 6, gap: 4 },
    favCount: { fontSize: 13, color: '#888', fontWeight: '600' },

    // Breadcrumb
    breadcrumb: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', gap: 4 },
    breadcrumbLink: { fontSize: 12, color: '#888' },
    breadcrumbCurrent: { fontSize: 12, color: '#333', fontWeight: '600', flex: 1 },

    // Image
    imageContainer: { backgroundColor: '#fff', padding: 16, alignItems: 'center', marginBottom: 8 },
    productImage: { width: width - 32, height: 280, borderRadius: 16 },
    imagePlaceholder: { backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center' },

    // Details
    detailsContainer: { backgroundColor: '#fff', padding: 20, marginBottom: 8 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
    inStock: { backgroundColor: '#E8F5E9' },
    outOfStock: { backgroundColor: '#FFEBEE' },
    soldOut: { backgroundColor: '#FFF3E0' },
    statusText: { fontSize: 12, fontWeight: '700' },
    productName: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
    productPrice: { fontSize: 22, fontWeight: '800', color: '#1B5E20', marginBottom: 10 },
    priceUnit: { fontSize: 15, fontWeight: '400', color: '#666' },
    description: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 16 },

    qtyLabel: { fontSize: 14, fontWeight: '700', color: '#444', marginBottom: 8 },
    qtyBadge: { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 12 },
    qtyText: { fontSize: 15, fontWeight: '700', color: '#333' },

    saleTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, marginBottom: 20 },
    saleTypeText: { fontSize: 12, fontWeight: '700' },

    // Action row
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
    ratingBox: { flex: 1, minWidth: 160, borderWidth: 1.5, borderColor: '#eee', borderRadius: 14, padding: 14, alignItems: 'center' },
    ratingBoxLabel: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 0.8, marginBottom: 8 },
    starsRow: { flexDirection: 'row', marginBottom: 6 },
    avgRatingText: { fontSize: 12, color: '#888' },
    ownProductNote: { fontSize: 10, color: '#E53935', marginTop: 6, textAlign: 'center' },
    contactBtn: { flex: 1, minWidth: 140, backgroundColor: '#2E7D32', borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, padding: 16 },
    contactBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    // Seller card
    sellerCard: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 16 },
    sellerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    sellerLabel: { fontSize: 13, color: '#888', fontWeight: '600', width: 90 },
    sellerAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center' },
    sellerAvatarText: { fontSize: 13, color: '#fff', fontWeight: '800' },
    sellerValue: { fontSize: 14, color: '#333', fontWeight: '500', flex: 1 },
});

export default ProductDetailScreen;
