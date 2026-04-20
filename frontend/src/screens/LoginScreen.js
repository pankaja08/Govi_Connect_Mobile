import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const { signIn, continueAsGuest } = React.useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      if (Platform.OS === 'web') window.alert('Please fill in all fields');
      else Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      // Backend was updated to accept user by email OR username via the 'username' field conceptually
      // We pass { username, password }
      const response = await apiClient.post('/auth/login', { username, password });
      const { token, data } = response.data;
      const role = data?.user?.role || 'User';
      const status = data?.user?.status || 'Active'; // Default to Active if not provided
      const userId = data?.user?.id || '';
      // Persist userId so comment sections can detect liked state
      if (userId) await AsyncStorage.setItem('userId', userId);
      await signIn(token, role, status);
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Something went wrong';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Login Failed', msg);
    }
  };

  const handleGuestLogin = async () => {
    await continueAsGuest();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#237937ff', '#005c36ff', '#237937ff']}
        style={styles.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Glassmorphism Card */}
        <View style={styles.glassCard}>

          {/* Logo Badge */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>G</Text>
          </View>

          <Text style={styles.title}>GOVI CONNECT</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Form */}
          <View style={styles.formContainer}>

            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="rgba(255, 255, 255, 1)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="rgba(255, 255, 255, 1)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="rgba(255, 255, 255, 1)" />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
            </TouchableOpacity>

            {/* Links */}

            <TouchableOpacity onPress={handleGuestLogin} style={styles.guestButton}>
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerWrap}>
              <Text style={styles.linkText}>Don't have an account? <Text style={styles.accentText}>Register here</Text></Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  glassCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.66)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  logoBadge: {
    width: 70,
    height: 70,
    backgroundColor: '#e1c700ff', // Amber color matching the image
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    color: '#1B4332',
    fontSize: 32,
    fontWeight: '900',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 15,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#0B2010',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 25,
  },
  registerWrap: {
    marginTop: 20,
  },
  linkText: {
    color: '#fff',
    fontSize: 14,
  },
  accentText: {
    color: '#95D5B2',
    fontWeight: 'bold',
  },
  guestButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    marginTop: 20,
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  }
});

export default LoginScreen;
