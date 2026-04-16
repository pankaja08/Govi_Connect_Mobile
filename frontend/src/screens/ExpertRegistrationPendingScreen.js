import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const ExpertRegistrationPendingScreen = () => {
  const { signOut } = React.useContext(AuthContext);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="hourglass-outline" size={80} color="#2E7D32" />
        </View>
        
        <Text style={styles.title}>Account Under Review</Text>
        <Text style={styles.subtitle}>
          Your expert registration is currently being verified by our agricultural administration team.
        </Text>
        
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#2E7D32" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            We verify all expert credentials to ensure the highest quality of advice for our farming community.
          </Text>
        </View>

        <Text style={styles.message}>
          You will receive an email notification once your account has been approved. This usually takes 1-2 business days.
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.logoutButtonText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default ExpertRegistrationPendingScreen;
