import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

// ── Theme ─────────────────────────────────────────────────────────────────────
const C = {
    primary:  '#115C39',
    accent:   '#1B7A43',
    bg:       '#F4F7F5',
    surface:  '#FFFFFF',
    border:   '#D6E4DC',
    head:     '#E8F5E9',
    text:     '#1A2E22',
    textMid:  '#4A6557',
    textLight:'#8FA89B',
    gold:     '#F59E0B',
    amber:    '#FF8F00',
};

// ── Small helpers ─────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtRs = (n) => `Rs. ${fmt(n)}`;

const StarRating = ({ rating }) => {
    const stars = Math.round(rating);
    return (
        <View style={{ flexDirection: 'row', gap: 1 }}>
            {[1,2,3,4,5].map(i => (
                <Ionicons key={i} name={i <= stars ? 'star' : 'star-outline'} size={10} color={C.gold} />
            ))}
        </View>
    );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ number, title, subtitle }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionNum}>
            <Text style={styles.sectionNumText}>{number}</Text>
        </View>
        <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
    </View>
);

// ── Table ─────────────────────────────────────────────────────────────────────
const Table = ({ columns, rows }) => (
    <View style={styles.table}>
        {/* header row */}
        <View style={[styles.tableRow, styles.tableHeadRow]}>
            {columns.map((col, i) => (
                <Text key={i} style={[styles.tableHeadCell, { flex: col.flex ?? 1 }]}>{col.label}</Text>
            ))}
        </View>
        {rows.length === 0 ? (
            <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: C.textLight, fontStyle: 'italic' }]}>
                    No data available
                </Text>
            </View>
        ) : rows.map((row, ri) => (
            <View key={ri} style={[styles.tableRow, ri % 2 === 1 && styles.tableAltRow]}>
                {columns.map((col, ci) => (
                    <Text key={ci} style={[styles.tableCell, { flex: col.flex ?? 1 }, col.bold && styles.tableCellBold]}>
                        {row[col.key] ?? '—'}
                    </Text>
                ))}
            </View>
        ))}
    </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const AdminReportScreen = ({ navigation }) => {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [genDate, setGenDate] = useState('');

    const generatePDF = async () => {
        if (!data) return;
        setLoading(true);
        try {
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Govi Connect - Analytics Report</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1A2E22; padding: 20px; line-height: 1.4; }
                        .header { text-align: center; border-bottom: 2px solid #115C39; padding-bottom: 10px; margin-bottom: 20px; }
                        .header h1 { color: #115C39; margin: 0; font-size: 24px; }
                        .header p { margin: 5px 0 0; color: #4A6557; font-size: 14px; font-weight: bold; }
                        .meta { font-size: 10px; color: #8FA89B; margin-bottom: 20px; font-style: italic; }
                        .section { margin-bottom: 25px; }
                        .section-title { font-size: 18px; color: #115C39; border-left: 4px solid #115C39; padding-left: 10px; margin-bottom: 10px; font-weight: bold; }
                        .section-subtitle { font-size: 12px; color: #8FA89B; margin-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
                        th { background-color: #115C39; color: white; padding: 8px; text-align: left; }
                        td { border-bottom: 1px solid #D6E4DC; padding: 8px; }
                        tr:nth-child(even) { background-color: #F0F7F3; }
                        .season-badge { background-color: #E8F5E9; color: #115C39; padding: 4px 8px; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 11px; margin-bottom: 5px; border: 1px solid #D6E4DC; }
                        .footer { text-align: center; font-size: 10px; color: #8FA89B; margin-top: 30px; border-top: 1px solid #D6E4DC; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Analytics Report</h1>
                        <p>GOVI CONNECT — Agricultural Insights</p>
                    </div>
                    <div class="meta">Report Generated: ${genDate}</div>

                    <div class="section">
                        <div class="section-title">1. Platform Overview</div>
                        <div class="section-subtitle">Summary of platform activity and user registration metrics.</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Total Users</th>
                                    <th>Farmers</th>
                                    <th>Agri Officers</th>
                                    <th>Districts Involved</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${po.totalUsers}</td>
                                    <td>${po.farmers}</td>
                                    <td>${po.agriOfficers}</td>
                                    <td>${po.districtsInvolved}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">2. Geographical Distribution</div>
                        <div class="section-subtitle">Farmers registered by district.</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>District</th>
                                    <th>Farmer Count</th>
                                    <th>Share (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(geographicStats || []).map(g => `
                                    <tr>
                                        <td><strong>${g.district}</strong></td>
                                        <td>${g.farmerCount}</td>
                                        <td>${po.farmers > 0 ? ((g.farmerCount / po.farmers) * 100).toFixed(1) + '%' : '0%'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">3. Crop Performance & Analytics</div>
                        <div class="section-subtitle">CPS = (Income / Acres) × (Yield / Acres). Higher is better.</div>
                        ${Object.entries(cropsBySeason || {}).length === 0 
                            ? '<p style="font-style: italic; color: #8FA89B;">No crop log data available yet.</p>'
                            : Object.entries(cropsBySeason).map(([season, crops]) => `
                                <div class="season-badge">Season: ${season.toUpperCase()}</div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Crop Name</th>
                                            <th>Total Acres</th>
                                            <th>Total Yield (Kg)</th>
                                            <th>Total Income (LKR)</th>
                                            <th>CPS Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${(crops || []).map(c => `
                                            <tr>
                                                <td><strong>${c.cropName}</strong></td>
                                                <td>${c.totalAcres.toFixed(2)}</td>
                                                <td>${c.totalYield.toFixed(2)}</td>
                                                <td>${c.totalIncome.toFixed(2)}</td>
                                                <td>${c.cpsScore.toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `).join('')
                        }
                    </div>

                    <div class="section">
                        <div class="section-title">4. Market Analytics</div>
                        <div class="section-subtitle">Top Rated Products — currently live on Govi Mart.</div>
                        ${(topProducts || []).length === 0
                            ? '<p style="font-style: italic; color: #8FA89B;">No approved products with ratings yet.</p>'
                            : `
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Rating</th>
                                        <th>Seller</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(topProducts || []).map(p => `
                                        <tr>
                                            <td><strong>${p.name}</strong></td>
                                            <td>${p.category}</td>
                                            <td>Rs. ${p.price}</td>
                                            <td>${p.avgRating} ★ (${p.numRatings})</td>
                                            <td>${p.seller}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            `
                        }
                    </div>

                    <div class="footer">
                        &copy; ${new Date().getFullYear()} Govi Connect Platform. All Rights Reserved.
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            
            if (Platform.OS === 'ios') {
                await Sharing.shareAsync(uri);
            } else {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Download Analytics Report',
                    UTI: 'com.adobe.pdf'
                });
            }
        } catch (err) {
            Alert.alert('Download Error', 'Could not generate PDF. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/users/admin/full-report');
            setData(res.data.data);
            const d = new Date(res.data.generatedAt);
            setGenDate(d.toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            }));
        } catch (err) {
            Alert.alert('Error', 'Could not load report data. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadReport(); }, [loadReport]));

    const { platformOverview: po, geographicStats, cropsBySeason, topProducts } = data || {};

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            {/* ── Header ── */}
            <LinearGradient colors={['#0A3D26', C.primary]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Analytics Report</Text>
                    <Text style={styles.headerSub}>GOVI CONNECT — Agricultural Insights</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={loadReport}>
                    <Ionicons name="refresh" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.refreshBtn, { marginLeft: 8, backgroundColor: C.amber }]} onPress={generatePDF}>
                    <Ionicons name="download-outline" size={18} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={styles.loadingText}>Generating report…</Text>
                </View>
            ) : !data ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color={C.textLight} />
                    <Text style={styles.loadingText}>No data found</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Generated info strip */}
                    <View style={styles.metaStrip}>
                        <MaterialCommunityIcons name="file-chart-outline" size={14} color={C.textMid} />
                        <Text style={styles.metaText}>Report Generated: {genDate}</Text>
                    </View>

                    {/* ── 1. Platform Overview ── */}
                    <SectionHeader
                        number="1"
                        title="Platform Overview"
                        subtitle="Summary of platform activity and user registration metrics."
                    />
                    <Table
                        columns={[
                            { label: 'Total Users',       key: 'totalUsers',      flex: 1 },
                            { label: 'Farmers',           key: 'farmers',         flex: 1 },
                            { label: 'Agri Officers',     key: 'agriOfficers',    flex: 1 },
                            { label: 'Districts Involved',key: 'districts',       flex: 1.2 },
                        ]}
                        rows={[{
                            totalUsers:   po.totalUsers,
                            farmers:      po.farmers,
                            agriOfficers: po.agriOfficers,
                            districts:    po.districtsInvolved,
                        }]}
                    />
                    {po.pendingExperts > 0 && (
                        <View style={styles.noteRow}>
                            <Ionicons name="time-outline" size={13} color={C.amber} />
                            <Text style={styles.noteText}>{po.pendingExperts} expert registration{po.pendingExperts > 1 ? 's' : ''} pending review.</Text>
                        </View>
                    )}

                    {/* ── 2. Geographical Distribution ── */}
                    <SectionHeader
                        number="2"
                        title="Geographical Distribution"
                        subtitle="Farmers registered by district."
                    />
                    <Table
                        columns={[
                            { label: 'District',      key: 'district',     flex: 1.5, bold: true },
                            { label: 'Farmer Count',  key: 'farmerCount',  flex: 1 },
                            { label: 'Share (%)',      key: 'share',        flex: 1 },
                        ]}
                        rows={(geographicStats || []).map(g => ({
                            district:    g.district,
                            farmerCount: g.farmerCount,
                            share:       po.farmers > 0
                                ? ((g.farmerCount / po.farmers) * 100).toFixed(1) + '%'
                                : '0%',
                        }))}
                    />

                    {/* ── 3. Crop Performance & Analytics ── */}
                    <SectionHeader
                        number="3"
                        title="Crop Performance & Analytics"
                        subtitle="CPS = (Income / Acres) × (Yield / Acres). Higher is better."
                    />
                    {Object.entries(cropsBySeason || {}).length === 0 ? (
                        <View style={styles.emptyNote}>
                            <Text style={styles.emptyNoteText}>No crop log data available yet.</Text>
                        </View>
                    ) : (
                        Object.entries(cropsBySeason).map(([season, crops]) => (
                            <View key={season} style={{ marginBottom: 18 }}>
                                <View style={styles.seasonBadge}>
                                    <MaterialCommunityIcons name="weather-sunny" size={13} color={C.primary} />
                                    <Text style={styles.seasonText}>Season: {season.toUpperCase()}</Text>
                                </View>
                                <Table
                                    columns={[
                                        { label: 'Crop Name',         key: 'cropName',    flex: 1.3, bold: true },
                                        { label: 'Total Acres',       key: 'totalAcres',  flex: 1 },
                                        { label: 'Total Yield (Kg)',  key: 'totalYield',  flex: 1.2 },
                                        { label: 'Total Income (LKR)',key: 'totalIncome', flex: 1.4 },
                                        { label: 'CPS Score',         key: 'cpsScore',    flex: 1.2 },
                                    ]}
                                    rows={(crops || []).map(c => ({
                                        cropName:    c.cropName,
                                        totalAcres:  c.totalAcres.toFixed(2),
                                        totalYield:  c.totalYield.toFixed(2),
                                        totalIncome: c.totalIncome.toFixed(2),
                                        cpsScore:    c.cpsScore.toFixed(2),
                                    }))}
                                />
                            </View>
                        ))
                    )}

                    {/* ── 4. Market Analytics ── */}
                    <SectionHeader
                        number="4"
                        title="Market Analytics"
                        subtitle="Top Rated Products — currently live on Govi Mart."
                    />
                    {(topProducts || []).length === 0 ? (
                        <View style={styles.emptyNote}>
                            <Text style={styles.emptyNoteText}>No approved products with ratings yet.</Text>
                        </View>
                    ) : (
                        <Table
                            columns={[
                                { label: 'Product',   key: 'name',       flex: 1.6, bold: true },
                                { label: 'Category',  key: 'category',   flex: 1.2 },
                                { label: 'Price',     key: 'price',      flex: 1 },
                                { label: 'Rating',    key: 'rating',     flex: 1 },
                                { label: 'Seller',    key: 'seller',     flex: 1.3 },
                            ]}
                            rows={(topProducts || []).map(p => ({
                                name:     p.name,
                                category: p.category,
                                price:    `Rs. ${p.price}`,
                                rating:   `${p.avgRating} ★ (${p.numRatings})`,
                                seller:   p.seller,
                            }))}
                        />
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 16,
        gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center', alignItems: 'center',
    },
    refreshBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    headerSub:   { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
    loadingText: { fontSize: 13, color: C.textMid },

    scroll: { padding: 16 },

    metaStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: C.surface,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 20,
    },
    metaText: { fontSize: 11, color: C.textMid, fontStyle: 'italic' },

    // Section
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 8,
        marginBottom: 10,
    },
    sectionNum: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: C.primary,
        justifyContent: 'center', alignItems: 'center',
        marginTop: 2,
    },
    sectionNumText:    { color: '#fff', fontWeight: '900', fontSize: 13 },
    sectionTitle:      { fontSize: 16, fontWeight: '800', color: C.text },
    sectionSubtitle:   { fontSize: 11, color: C.textLight, marginTop: 2, maxWidth: width - 80 },

    // Season badge
    seasonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: C.head,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: C.border,
    },
    seasonText: { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 0.5 },

    // Note rows
    noteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 6,
        marginBottom: 14,
    },
    noteText: { fontSize: 11, color: C.amber, fontStyle: 'italic' },

    emptyNote: {
        backgroundColor: C.surface,
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: C.border,
    },
    emptyNoteText: { fontSize: 13, color: C.textLight, fontStyle: 'italic' },

    // Table
    table: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 6,
        backgroundColor: C.surface,
        // shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tableHeadRow: {
        backgroundColor: C.primary,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    tableAltRow: {
        backgroundColor: '#F0F7F3',
    },
    tableHeadCell: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 9,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    tableCell: {
        fontSize: 11,
        color: C.text,
        paddingHorizontal: 8,
        paddingVertical: 9,
        textAlign: 'center',
    },
    tableCellBold: {
        fontWeight: '700',
        textAlign: 'left',
    },
});

export default AdminReportScreen;
