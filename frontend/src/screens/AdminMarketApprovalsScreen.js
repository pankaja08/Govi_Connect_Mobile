import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Modal, RefreshControl, ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { productApi } from '../api/productApi';

const { width } = Dimensions.get('window');

// ── Colour palette (admin deep green) ──────────────────────────────────────
const C = {
    primary:   '#115C39',
    dark:      '#0A3D26',
    accent:    '#1B8C56',
    bg:        '#F4F7F5',
    surface:   '#FFFFFF',
    border:    '#E0EDE6',
    textDark:  '#0F2318',
    textMid:   '#4A6557',
    textLight: '#8FA89B',
    approve:   '#1B5E20',
    reject:    '#B71C1C',
    approveBg: '#E8F5E9',
    rejectBg:  '#FFEBEE',
};

const CATEGORY_COLORS = {
    Vegetables:  '#4CAF50',
    Fruits:      '#FF7043',
    Grains:      '#FF8F00',
    Seeds:       '#8D6E63',
    Fertilizers: '#26A69A',
    Equipment:   '#546E7A',
    Other:       '#9E9E9E',
};

const SALE_TYPE_COLORS = {
    'Retail Only':         '#2196F3',
    'Wholesale Only':      '#FF9800',
    'Retail & Wholesale':  '#4CAF50',
};

// ─────────────────────────────────────────────────────────────────────────────
const AdminMarketApprovalsScreen = ({ navigation }) => {
    const [products,      setProducts]      = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [refreshing,    setRefreshing]    = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // productId being processed

    // Reject note modal
    const [rejectModal,  setRejectModal]  = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);  // product
    const [rejectNote,   setRejectNote]   = useState('');

    const loadPending = useCallback(async () => {
        try {
            const res = await productApi.getPending();
            setProducts(res.data?.data?.products || []);
        } catch (err) {
            Alert.alert('Error', 'Could not load pending products.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadPending(); }, [loadPending]));

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPending();
        setRefreshing(false);
    };

    // ── Approve ──────────────────────────────────────────────────────────────
    const handleApprove = (product) => {
        Alert.alert(
            '✅ Approve Product',
            `Approve "${product.name}" and make it live on the marketplace?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setActionLoading(product._id);
                        try {
                            await productApi.approve(product._id);
                            setProducts(prev => prev.filter(p => p._id !== product._id));
                            Alert.alert('✅ Approved!', `"${product.name}" is now live on Govi Mart.`);
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.message || 'Approval failed.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    // ── Reject ───────────────────────────────────────────────────────────────
    const openRejectModal = (product) => {
        setRejectTarget(product);
        setRejectNote('');
        setRejectModal(true);
    };

    const confirmReject = async () => {
        if (!rejectTarget) return;
        setRejectModal(false);
        setActionLoading(rejectTarget._id);
        try {
            await productApi.reject(rejectTarget._id, rejectNote.trim());
            setProducts(prev => prev.filter(p => p._id !== rejectTarget._id));
            Alert.alert('❌ Rejected', `"${rejectTarget.name}" has been rejected.`);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Rejection failed.');
        } finally {
            setActionLoading(null);
            setRejectTarget(null);
        }
    };

    // ── Card ─────────────────────────────────────────────────────────────────
    const renderCard = ({ item }) => {
        const catColor  = CATEGORY_COLORS[item.category]  || '#888';
        const saleColor = SALE_TYPE_COLORS[item.saleType] || '#888';
        const isProcessing = actionLoading === item._id;

        return (
            <View style={styles.card}>
                {/* Product Image */}
                <View style={styles.imageWrapper}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.productImage, styles.imagePlaceholder]}>
                            <MaterialCommunityIcons name="image-off-outline" size={48} color="#ccc" />
                            <Text style={styles.noImageText}>No Image</Text>
                        </View>
                    )}
                    {/* Status ribbon */}
                    <View style={styles.pendingRibbon}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color="#FF8F00" />
                        <Text style={styles.pendingRibbonText}>PENDING REVIEW</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {/* Category + Sale Type row */}
                    <View style={styles.tagsRow}>
                        <View style={[styles.categoryTag, { backgroundColor: catColor + '22', borderColor: catColor }]}>
                            <Text style={[styles.categoryTagText, { color: catColor }]}>{item.category}</Text>
                        </View>
                        <View style={[styles.saleTag, { backgroundColor: saleColor + '15', borderColor: saleColor }]}>
                            <Text style={[styles.saleTagText, { color: saleColor }]}>{item.saleType}</Text>
                        </View>
                    </View>

                    {/* Product name */}
                    <Text style={styles.productName}>{item.name}</Text>

                    {/* Description */}
                    {!!item.description && (
                        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
                    )}

                    {/* Price + Stock box */}
                    <View style={styles.priceStockRow}>
                        <View style={styles.priceBox}>
                            <Text style={styles.priceLabel}>PRICE</Text>
                            <Text style={styles.priceValue}>Rs. {item.price?.toFixed(2)}</Text>
                            <Text style={styles.priceUnit}>per {item.unit}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stockBox}>
                            <Text style={styles.stockLabel}>QUANTITY</Text>
                            <Text style={styles.stockValue}>{item.quantity}</Text>
                            <Text style={styles.stockUnit}>{item.unit}s available</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stockBox}>
                            <Text style={styles.stockLabel}>STATUS</Text>
                            <View style={[
                                styles.statusBadge,
                                item.status === 'In Stock' ? styles.inStock : styles.outOfStock
                            ]}>
                                <Text style={styles.statusBadgeText}>{item.status}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Seller details */}
                    <View style={styles.sellerCard}>
                        <View style={styles.sellerHeader}>
                            <View style={styles.sellerAvatar}>
                                <Text style={styles.sellerAvatarText}>
                                    {(item.seller?.name || 'S')[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sellerName}>{item.seller?.name || 'Unknown Seller'}</Text>
                                <Text style={styles.sellerEmail}>{item.seller?.email || ''}</Text>
                            </View>
                            <View style={styles.submittedBadge}>
                                <Ionicons name="time-outline" size={11} color={C.textLight} />
                                <Text style={styles.submittedText}>
                                    {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.sellerMeta}>
                            {!!item.location && (
                                <View style={styles.sellerMetaItem}>
                                    <Ionicons name="location-outline" size={13} color={C.textLight} />
                                    <Text style={styles.sellerMetaText}>{item.location}</Text>
                                </View>
                            )}
                            {!!item.contactNumber && (
                                <View style={styles.sellerMetaItem}>
                                    <Ionicons name="call-outline" size={13} color={C.textLight} />
                                    <Text style={styles.sellerMetaText}>{item.contactNumber}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action buttons */}
                    {isProcessing ? (
                        <View style={styles.processingRow}>
                            <ActivityIndicator color={C.primary} />
                            <Text style={styles.processingText}>Processing…</Text>
                        </View>
                    ) : (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => openRejectModal(item)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="close-circle-outline" size={18} color={C.reject} />
                                <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.approveBtn}
                                onPress={() => handleApprove(item)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[C.accent, C.primary]}
                                    style={styles.approveBtnGradient}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                                    <Text style={styles.approveBtnText}>Approve & Go Live</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // ── Empty ─────────────────────────────────────────────────────────────────
    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.emptyIconBg}>
                <MaterialCommunityIcons name="check-all" size={52} color={C.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>No pending products to review at this time.</Text>
        </View>
    );

    return (
        <View style={styles.screen}>
            {/* ── Header ── */}
            <LinearGradient colors={[C.dark, C.primary]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Market Approvals</Text>
                    <Text style={styles.headerSub}>Review and approve pending seller listings</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{products.length}</Text>
                </View>
            </LinearGradient>

            {/* ── Stats bar ── */}
            {!loading && (
                <View style={styles.statsBar}>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#FF8F00" />
                        <Text style={styles.statValue}>{products.length}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statSep} />
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="store-check-outline" size={16} color={C.approve} />
                        <Text style={[styles.statValue, { color: C.approve }]}>Live</Text>
                        <Text style={styles.statLabel}>after approval</Text>
                    </View>
                    <View style={styles.statSep} />
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="shield-check-outline" size={16} color={C.primary} />
                        <Text style={styles.statLabel}>Review all details before approving</Text>
                    </View>
                </View>
            )}

            {/* ── List ── */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={styles.loadingText}>Loading pending listings…</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={item => item._id}
                    renderItem={renderCard}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
                    }
                />
            )}

            {/* ── Reject Modal ── */}
            <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRejectModal(false)} />
                <View style={styles.modalCard}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="close-circle" size={26} color={C.reject} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalTitle}>Reject Listing</Text>
                            <Text style={styles.modalSub} numberOfLines={1}>"{rejectTarget?.name}"</Text>
                        </View>
                        <TouchableOpacity onPress={() => setRejectModal(false)}>
                            <Ionicons name="close" size={22} color={C.textMid} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.noteLabel}>Reason for rejection (optional)</Text>
                    <TextInput
                        style={styles.noteInput}
                        placeholder="e.g. Incomplete description, inappropriate image…"
                        placeholderTextColor={C.textLight}
                        multiline
                        numberOfLines={4}
                        value={rejectNote}
                        onChangeText={setRejectNote}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity style={styles.confirmRejectBtn} onPress={confirmReject}>
                        <Ionicons name="close-circle-outline" size={18} color="#fff" />
                        <Text style={styles.confirmRejectText}>Confirm Rejection</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setRejectModal(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 13, color: C.textMid },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 18,
        paddingHorizontal: 16,
        gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    countBadge: {
        backgroundColor: '#FF8F00',
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },
    countText: { color: '#fff', fontWeight: '900', fontSize: 15 },

    // Stats bar
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        gap: 12,
    },
    statItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statSep:   { width: 1, height: 20, backgroundColor: C.border },
    statValue: { fontSize: 14, fontWeight: '800', color: '#FF8F00' },
    statLabel: { fontSize: 11, color: C.textLight, flexShrink: 1 },

    // List
    list: { padding: 14, gap: 16 },

    // Card
    card: {
        backgroundColor: C.surface,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },

    // Image
    imageWrapper: { position: 'relative' },
    productImage: { width: '100%', height: 200 },
    imagePlaceholder: {
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    noImageText: { fontSize: 12, color: '#bbb' },
    pendingRibbon: {
        position: 'absolute',
        top: 12, right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        borderWidth: 1,
        borderColor: '#FFE082',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
    },
    pendingRibbonText: { fontSize: 10, fontWeight: '800', color: '#FF8F00', letterSpacing: 0.5 },

    // Card body
    cardBody: { padding: 16 },
    tagsRow:  { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    categoryTag: {
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1.5,
    },
    categoryTagText: { fontSize: 11, fontWeight: '700' },
    saleTag: {
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1,
    },
    saleTagText: { fontSize: 10, fontWeight: '600' },

    productName: { fontSize: 20, fontWeight: '900', color: C.textDark, marginBottom: 6 },
    description: { fontSize: 13, color: C.textMid, lineHeight: 19, marginBottom: 12 },

    // Price + Stock
    priceStockRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FBF9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        padding: 12,
        marginBottom: 14,
        alignItems: 'center',
    },
    priceBox:    { flex: 1, alignItems: 'center' },
    stockBox:    { flex: 1, alignItems: 'center' },
    divider:     { width: 1, height: 40, backgroundColor: C.border, marginHorizontal: 8 },
    priceLabel:  { fontSize: 9, fontWeight: '700', color: C.textLight, letterSpacing: 0.5, marginBottom: 3 },
    priceValue:  { fontSize: 16, fontWeight: '900', color: C.primary },
    priceUnit:   { fontSize: 10, color: C.textLight, marginTop: 2 },
    stockLabel:  { fontSize: 9, fontWeight: '700', color: C.textLight, letterSpacing: 0.5, marginBottom: 3 },
    stockValue:  { fontSize: 16, fontWeight: '900', color: C.textDark },
    stockUnit:   { fontSize: 10, color: C.textLight, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 3 },
    inStock:     { backgroundColor: '#E8F5E9' },
    outOfStock:  { backgroundColor: '#FFEBEE' },
    statusBadgeText: { fontSize: 10, fontWeight: '700', color: C.textDark },

    // Seller card
    sellerCard: {
        backgroundColor: '#F8FBF9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        padding: 12,
        marginBottom: 14,
    },
    sellerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    sellerAvatar: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: C.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    sellerAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    sellerName:  { fontSize: 14, fontWeight: '700', color: C.textDark },
    sellerEmail: { fontSize: 11, color: C.textLight, marginTop: 1 },
    submittedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.bg,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 3,
    },
    submittedText: { fontSize: 10, color: C.textLight, fontWeight: '600' },
    sellerMeta:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    sellerMetaItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
    sellerMetaText:{ fontSize: 12, color: C.textMid },

    // Action buttons
    actionRow: { flexDirection: 'row', gap: 10 },
    rejectBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: C.reject,
        backgroundColor: C.rejectBg,
    },
    rejectBtnText:    { fontSize: 14, fontWeight: '700', color: C.reject },
    approveBtn:       { flex: 2, borderRadius: 12, overflow: 'hidden' },
    approveBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 7,
    },
    approveBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
    processingRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
    processingText: { fontSize: 13, color: C.textMid },

    // Empty
    emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
    emptyIconBg: {
        width: 100, height: 100, borderRadius: 50,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle:    { fontSize: 22, fontWeight: '900', color: C.textDark, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: C.textLight, textAlign: 'center', lineHeight: 21 },

    // Reject modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalCard: {
        backgroundColor: C.surface,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        padding: 20,
        paddingBottom: 32,
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
    },
    modalHandle: {
        width: 36, height: 4,
        backgroundColor: C.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 10 },
    modalIconWrap: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: C.rejectBg,
        justifyContent: 'center', alignItems: 'center',
    },
    modalTitle: { fontSize: 17, fontWeight: '800', color: C.textDark },
    modalSub:   { fontSize: 12, color: C.textMid, marginTop: 2 },
    noteLabel:  { fontSize: 13, fontWeight: '700', color: C.textMid, marginBottom: 8 },
    noteInput: {
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: C.textDark,
        height: 100,
        backgroundColor: C.bg,
        marginBottom: 16,
    },
    confirmRejectBtn: {
        backgroundColor: C.reject,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
        marginBottom: 10,
    },
    confirmRejectText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    cancelBtn: { alignItems: 'center', paddingVertical: 10 },
    cancelText: { color: C.textMid, fontWeight: '600', fontSize: 14 },
});

export default AdminMarketApprovalsScreen;
