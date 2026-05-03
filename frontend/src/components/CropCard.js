import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVITY_TYPE_COLORS = {
  FERTILIZER: { bg: '#EFF6FF', text: '#2563EB', icon: 'water-outline' },
  PESTICIDE:  { bg: '#FEF3C7', text: '#B45309', icon: 'bug-outline' },
  WEEDING:    { bg: '#ECFDF5', text: '#059669', icon: 'cut-outline' },
  OTHER:      { bg: '#F3F4F6', text: '#6B7280', icon: 'ellipsis-horizontal-outline' },
};

const safeDateStr = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CropCard = ({ crop, onAddActivity, onUpdateYield, onEdit, onDelete, onToggleActivity }) => {
  const [activitiesExpanded, setActivitiesExpanded] = useState(false);

  const completedCount = (crop.activities || []).filter(a => a.isCompleted).length;
  const totalActivities = (crop.activities || []).length;
  const hasYield = crop.yieldAmount > 0;

  return (
    <View style={styles.card}>
      {/* ── Card Header ── */}
      <View style={styles.cardHeader}>
        <View style={styles.seasonBadge}>
          <Text style={styles.seasonText}>{crop.season}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => onEdit(crop)} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(crop._id)} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Crop Name & Variety ── */}
      <Text style={styles.cropName}>{crop.cropName}</Text>
      {crop.seedVariety ? (
        <Text style={styles.seedVariety}>Variety: {crop.seedVariety}</Text>
      ) : null}

      {/* ── Date & Field Info ── */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={14} color="#10B981" />
          <Text style={styles.infoLabel}>Planted</Text>
          <Text style={styles.infoValue}>{safeDateStr(crop.plantedDate)}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color="#F59E0B" />
          <Text style={styles.infoLabel}>Harvest</Text>
          <Text style={styles.infoValue}>{safeDateStr(crop.harvestExpectedDate)}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Ionicons name="map-outline" size={14} color="#3B82F6" />
          <Text style={styles.infoLabel}>Field</Text>
          <Text style={styles.infoValue}>{crop.fieldSize} Ac</Text>
        </View>
      </View>

      {/* ── Yield & Income (if recorded) ── */}
      {hasYield && (
        <View style={styles.yieldRow}>
          <View style={styles.yieldItem}>
            <Text style={styles.yieldLabel}>Total Yield</Text>
            <Text style={styles.yieldValue}>{crop.yieldAmount} Kg</Text>
          </View>
          <View style={styles.yieldItem}>
            <Text style={styles.yieldLabel}>Income</Text>
            <Text style={[styles.yieldValue, { color: '#F59E0B' }]}>Rs {crop.incomeAmount.toLocaleString()}</Text>
          </View>
        </View>
      )}

      {/* ── Activities Section ── */}
      {totalActivities > 0 && (
        <TouchableOpacity
          style={styles.activitiesToggle}
          onPress={() => setActivitiesExpanded(!activitiesExpanded)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="list-outline" size={16} color="#4B5563" style={{ marginRight: 6 }} />
            <Text style={styles.activitiesToggleText}>
              Activities ({completedCount}/{totalActivities} done)
            </Text>
          </View>
          <Ionicons
            name={activitiesExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      )}

      {activitiesExpanded && (
        <View style={styles.activitiesList}>
          {crop.activities.map((act) => {
            const typeStyle = ACTIVITY_TYPE_COLORS[act.activityType] || ACTIVITY_TYPE_COLORS.OTHER;
            return (
              <View key={act._id} style={styles.activityItem}>
                <View style={[styles.activityTypeBadge, { backgroundColor: typeStyle.bg }]}>
                  <Ionicons name={typeStyle.icon} size={14} color={typeStyle.text} />
                  <Text style={[styles.activityTypeText, { color: typeStyle.text }]}>
                    {act.activityType}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityName, act.isCompleted && styles.strikethrough]}>
                    {act.activityName}
                  </Text>
                  <Text style={styles.activityDate}>{safeDateStr(act.activityDate)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onToggleActivity(crop._id, act._id)}
                  style={[styles.statusDot, { backgroundColor: act.isCompleted ? '#10B981' : '#E5E7EB' }]}
                >
                  {act.isCompleted && <Ionicons name="checkmark" size={12} color="#fff" />}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Action Buttons ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAddActivity(crop)}>
          <Ionicons name="add-circle-outline" size={16} color="#10B981" />
          <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Add Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: '#F59E0B20', backgroundColor: '#FFFBEB' }]}
          onPress={() => onUpdateYield(crop)}
        >
          <Ionicons name="analytics-outline" size={16} color="#F59E0B" />
          <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>
            {hasYield ? 'Edit Yield' : 'Log Yield'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seasonBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  seasonText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginLeft: 6,
  },
  cropName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  seedVariety: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  infoDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '700',
    textAlign: 'center',
  },
  yieldRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  yieldItem: {
    flex: 1,
    alignItems: 'center',
  },
  yieldLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  yieldValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  activitiesToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activitiesToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  activitiesList: {
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  activityTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    minWidth: 100,
  },
  activityTypeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  activityDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#ECFDF5',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default React.memo(CropCard);
