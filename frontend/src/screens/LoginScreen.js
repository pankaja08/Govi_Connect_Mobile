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
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Custom Animated Pressable Button for tactile feedback
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LoginScreen = ({ navigation }) => {
  const { signIn, continueAsGuest } = React.useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Focus states for inputs
  const [isUserFocused, setIsUserFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  // Button scale animation
  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  const handleLogin = async () => {
    if (!username || !password) {
      if (Platform.OS === 'web') window.alert('Please fill in all fields');
      else Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', { username, password });
      const { token, data } = response.data;
      const role = data?.user?.role || 'User';
      const status = data?.user?.status || 'Active';
      const userId = data?.user?.id || '';
      
      if (userId) await AsyncStorage.setItem('userId', userId);
      await signIn(token, role, status);
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Something went wrong';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Login Failed', msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a512eff', '#0a2f1cff', '#1a512eff']}
        style={styles.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View 
          entering={FadeInUp.duration(800).springify()} 
          style={styles.glassCard}
        >
          {/* Logo Badge */}
          <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.logoBadge}>
            <Text style={styles.logoText}>G</Text>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).duration(600).springify()} style={styles.title}>
            GOVI CONNECT
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).duration(600).springify()} style={styles.subtitle}>
            Sign in to your account
          </Animated.Text>

          {/* Form */}
          <View style={styles.formContainer}>
            <Animated.View entering={FadeInDown.delay(400).duration(600).springify()}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputWrapper, isUserFocused && styles.inputWrapperFocused]}>
                <Ionicons name="person-outline" size={20} color={isUserFocused ? "#F59E0B" : "rgba(255,255,255,0.6)"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onFocus={() => setIsUserFocused(true)}
                  onBlur={() => setIsUserFocused(false)}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(600).springify()}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, isPassFocused && styles.inputWrapperFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={isPassFocused ? "#F59E0B" : "rgba(255,255,255,0.6)"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setIsPassFocused(true)}
                  onBlur={() => setIsPassFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color={isPassFocused ? "#fff" : "rgba(255, 255, 255, 0.6)"} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Login Button */}
            <Animated.View entering={FadeInDown.delay(600).duration(600).springify()}>
              <AnimatedPressable
                style={[styles.button, buttonAnimatedStyle, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                onPressIn={() => { buttonScale.value = withSpring(0.95); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
              >
                <Text style={styles.buttonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
              </AnimatedPressable>
            </Animated.View>

            {/* Links */}
            <Animated.View entering={FadeInDown.delay(700).duration(600).springify()} style={styles.linksContainer}>
              <TouchableOpacity onPress={async () => await continueAsGuest()} style={styles.guestButton}>
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerWrap}>
                <Text style={styles.linkText}>Don't have an account? <Text style={styles.accentText}>Register here</Text></Text>
              </TouchableOpacity>
            </Animated.View>

          </View>
        </Animated.View>
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
    maxWidth: 420,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 30,
    padding: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 10,
    ...(Platform.OS === 'web' && { backdropFilter: 'blur(20px)' }),
  },
  logoBadge: {
    width: 76,
    height: 76,
    backgroundColor: '#F59E0B', 
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  logoText: {
    color: '#064E3B',
    fontSize: 38,
    fontWeight: '900',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 35,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
    marginRight: -10,
  },
  button: {
    backgroundColor: '#F59E0B',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#064E3B',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  guestButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 20,
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerWrap: {
    marginTop: 25,
    padding: 10,
  },
  linkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  accentText: {
    color: '#F59E0B',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
