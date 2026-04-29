import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
};

const ForumQAScreen = ({ navigation, route }) => {
  const question = route?.params?.question;
  const [currentQuestion, setCurrentQuestion] = useState(question);

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Question Details</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Question not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Q&A</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
        <View style={styles.detailCard}>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>

          {currentQuestion.images && currentQuestion.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {currentQuestion.images.map((img, idx) => (
                <Image key={idx} source={{ uri: img }} style={styles.cardImage} />
              ))}
            </ScrollView>
          )}

          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{currentQuestion.category}</Text>
            </View>
            <Text style={styles.questionMeta}>{currentQuestion.authorName} · {formatDate(currentQuestion.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{currentQuestion.answers?.length || 0} Responses</Text>
        {currentQuestion.answers?.map((answer) => (
          <View key={answer._id} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerAuthor}>{answer.authorName}</Text>
              <Text style={styles.answerRole}>{answer.authorRole}</Text>
            </View>
            <Text style={styles.answerDate}>{formatDate(answer.createdAt)}</Text>
            <Text style={styles.answerText}>{answer.text}</Text>
          </View>
        ))}
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F8F2' },
  headerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32', paddingHorizontal: 16, paddingTop: 26, paddingBottom: 14, minHeight: 82 },
  backButton: { marginRight: 12, padding: 6 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: '#F3F8F2' },
  containerContent: { paddingBottom: 100 },
  detailCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 22, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10, elevation: 3, borderLeftWidth: 6, borderLeftColor: '#2E7D32' },
  questionText: { fontSize: 18, fontWeight: '700', color: '#1C3F21', lineHeight: 26 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 12 },
  categoryBadge: { backgroundColor: '#E8F5E9', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10 },
  categoryText: { color: '#2E7D32', fontSize: 12, fontWeight: '600' },
  questionMeta: { color: '#6F7F6F', fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#21411C', marginTop: 24, marginBottom: 12 },
  answerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E1E8E0' },
  answerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  answerAuthor: { color: '#1D4724', fontWeight: '700' },
  answerRole: { color: '#4F7942', fontSize: 12 },
  answerDate: { color: '#7A8A7C', fontSize: 11, marginBottom: 8 },
  answerText: { color: '#344430', fontSize: 14, lineHeight: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#556B53', fontSize: 16 },
  imageScroll: { marginTop: 15, marginBottom: 5 },
  cardImage: { width: 150, height: 150, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: '#E1E8E0' },
});

export default ForumQAScreen;
