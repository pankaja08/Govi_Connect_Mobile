import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CropCard = ({ crop, onAddActivity, onUpdateYield, onEdit, onDelete }) => {
  const isYieldCompleted = crop.yieldAmount > 0;
  
  // Sort activities by date descending
  const activities = [...crop.activities].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const doneActivities = activities.filter(a => new Date(a.activityDate) <= today);
  const todoActivities = activities.filter(a => new Date(a.activityDate) > today);

  const getSeasonColor = (season) => {
    switch (season) {
      case 'Yala': return '#10B981'; // green
      case 'Maha': return '#EAB308'; // gold
      default: return '#3b82f6'; // blue
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.cropName}>{crop.cropName}</Text>
          <View style={[styles.badge, { backgroundColor: getSeasonColor(crop.season) + '20' }]}>
             <Text style={[styles.badgeText, { color: getSeasonColor(crop.season) }]}>{crop.season}</Text>
          </View>
        </View>
        <Text style={styles.fieldSize}>{crop.fieldSize} Acres</Text>
      </View>

      {/* Dates Section */}
      <View style={styles.datesRow}>
         <Ionicons name="calendar-outline" size={14} color="#6B7280" />
         <Text style={styles.dateText}>
           Planted: {new Date(crop.plantedDate).toLocaleDateString()}  |  Harvest: {new Date(crop.harvestExpectedDate).toLocaleDateString()}
         </Text>
      </View>

      {/* Analytics Info (if available) */}
      {isYieldCompleted && (
        <View style={styles.analyticsRow}>
           <View style={styles.metric}>
             <Text style={styles.metricLabel}>Yield</Text>
             <Text style={styles.metricValue}>{crop.yieldAmount} Kg</Text>
           </View>
           <View style={styles.metric}>
             <Text style={styles.metricLabel}>Income</Text>
             <Text style={styles.metricValue}>Rs {crop.incomeAmount}</Text>
           </View>
        </View>
      )}

      {/* Action Toolbar */}
      <View style={styles.actionToolbar}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAddActivity(crop)}>
          <Ionicons name="add-circle-outline" size={20} color="#10B981" />
          <Text style={styles.actionText}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onUpdateYield(crop)}>
          <Ionicons name="bar-chart-outline" size={20} color="#EAB308" />
          <Text style={styles.actionText}>Yield</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(crop)}>
          <Ionicons name="create-outline" size={20} color="#3b82f6" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(crop._id)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Activities Section */}
      {activities.length > 0 && (
        <View style={styles.activitiesSection}>
          {/* To-Do Activities */}
          {todoActivities.length > 0 && (
             <View style={styles.activityGroup}>
               <Text style={[styles.activityGroupTitle, { color: '#3b82f6' }]}>Upcoming Actions</Text>
               {todoActivities.map(act => (
                 <View key={act._id} style={styles.activityRow}>
                   <View style={[styles.activityIndicator, { backgroundColor: '#3b82f6' }]} />
                   <View style={styles.activityDetails}>
                     <Text style={styles.activityName}>{act.activityType}: {act.activityName}</Text>
                     <Text style={styles.activityDateText}>{new Date(act.activityDate).toLocaleDateString()}</Text>
                   </View>
                 </View>
               ))}
             </View>
          )}

          {/* Done Activities */}
          {doneActivities.length > 0 && (
             <View style={styles.activityGroup}>
               <Text style={[styles.activityGroupTitle, { color: '#10B981' }]}>Completed Actions</Text>
               {doneActivities.map(act => (
                 <View key={act._id} style={styles.activityRow}>
                   <View style={[styles.activityIndicator, { backgroundColor: '#10B981' }]} />
                   <View style={styles.activityDetails}>
                     <Text style={[styles.activityName, { color: '#6B7280' }]}>{act.activityType}: {act.activityName}</Text>
                     <Text style={styles.activityDateText}>{new Date(act.activityDate).toLocaleDateString()}</Text>
                   </View>
                 </View>
               ))}
             </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldSize: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  analyticsRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  actionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 4,
    fontWeight: '500',
  },
  activitiesSection: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  activityGroup: {
    marginBottom: 12,
  },
  activityGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  activityDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  activityDateText: {
    fontSize: 12,
    color: '#9CA3AF',
  }
});

export default CropCard;
