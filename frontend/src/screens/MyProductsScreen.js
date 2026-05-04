import React, { useState, useCallback, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    FlatList, Image, ActivityIndicator, RefreshControl, Alert,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { productApi } from '../api/productApi';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const MyProductsScreen = ({ navigation }) => {
    const { userRole } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyProducts = useCallback(async () => {
        try {
            const res = await productApi.getMyProducts();
            setProducts(res.data?.data?.products || []);
        } catch (err) {
            Alert.alert('Error', 'Could not load your listings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchMyProducts();
    }, [fetchMyProducts]));

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyProducts();
        setRefreshing(false);
    };

    const handleEdit = (product) => {
        navigation.navigate('AddProduct', { editProduct: product });
    };

    const handleDelete = (productId) => {
        Alert.alert(
            'Delete Listing',
            'Are you sure you want to delete this product? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await productApi.delete(productId);
                            Alert.alert('Success', 'Product deleted successfully.');
                            fetchMyProducts();
                        } catch (err) {
                            Alert.alert('Error', 'Could not delete product.');
                        }
                    }
                }
            ]
        );
    };

    const handleStatusChange = (product) => {
        Alert.alert(
            'Update Stock Status',
            `Change status for "${product.name}"`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'In Stock',
                    onPress: () => updateStatus(product._id, 'In Stock')
                },
                {
                    text: 'Out of Stock',
                    onPress: () => updateStatus(product._id, 'Out of Stock')
                },
                {
                    text: 'Sold Out',
                    onPress: () => updateStatus(product._id, 'Sold Out')
                }
            ]
        );
    };

    const updateStatus = async (productId, newStatus) => {
        try {
            await productApi.update(productId, { status: newStatus });
            Alert.alert('Success', `Status updated to ${newStatus}`);
            fetchMyProducts();
        } catch (err) {
            Alert.alert('Error', 'Could not update status.');
        }
    };

    const renderProductItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.imageContainer}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={30} color="#A5D6A7" />
                        </View>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.price}>Rs. {item.price?.toFixed(2)} / {item.unit}</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Ionicons name="cube-outline" size={14} color="#666" />
                            <Text style={styles.statText}>{item.quantity} {item.unit}</Text>
                        </View>
                        <View style={styles.stat}>
                            <Ionicons name="star" size={14} color="#FFB300" />
                            <Text style={styles.statText}>{item.avgRating?.toFixed(1)} ({item.numRatings})</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleStatusChange(item)}
                >
                    <Ionicons name="pricetag-outline" size={18} color="#FF9800" />
                    <Text style={[styles.editBtnText, { color: '#FF9800' }]}>Status</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleEdit(item)}
                >
                    <Ionicons name="pencil" size={18} color="#2E7D32" />
                    <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item._id)}
                >
                    <Ionicons name="trash-outline" size={18} color="#E53935" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Product Listings</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct')}>
                    <Ionicons name="add" size={26} color="#2E7D32" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 100 }} />
            ) : products.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="list-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyTitle}>No Listings Yet</Text>
                    <Text style={styles.emptySub}>You haven't listed any products on Govi Mart yet.</Text>
                    <TouchableOpacity
                        style={styles.startBtn}
                        onPress={() => navigation.navigate('AddProduct')}
                    >
                        <Text style={styles.startBtnText}>Add Your First Product</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={item => item._id}
                    renderItem={renderProductItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F5F5F5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', flex: 1 },
    addBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },

    list: { padding: 16, gap: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    cardContent: { flexDirection: 'row', padding: 12 },
    imageContainer: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F1F8E9' },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    name: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
    price: { fontSize: 15, fontWeight: '800', color: '#1B5E20', marginBottom: 6 },
    statsRow: { flexDirection: 'row', gap: 12 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 12, color: '#666', fontWeight: '500' },

    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#FAFAFA'
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6
    },
    editBtn: { borderRightWidth: 1, borderRightColor: '#f0f0f0' },
    editBtnText: { color: '#2E7D32', fontWeight: '700', fontSize: 14 },
    deleteBtnText: { color: '#E53935', fontWeight: '700', fontSize: 14 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 80 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#333', marginTop: 20, marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    startBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    startBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default MyProductsScreen;
