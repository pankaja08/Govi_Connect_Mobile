import React, { useState, useEffect, useMemo, createContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, View, StyleSheet } from 'react-native';

import { AuthContext } from './src/context/AuthContext';

// --- WEB MOBILE FRAME WRAPPER ---
const MobileFrame = ({ children }) => {
  if (Platform.OS !== 'web') return children;

  return (
    <View style={webStyles.pageBackground}>
      <View style={webStyles.phoneFrame}>
        <View style={webStyles.notch} />
        <View style={webStyles.phoneScreen}>
          {children}
        </View>
        <View style={webStyles.homeIndicator} />
      </View>
    </View>
  );
};

const webStyles = Platform.OS === 'web' ? StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: '#0f1a12',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundImage: 'radial-gradient(ellipse at center, #1a2e1e 0%, #0a110c 100%)',
  },
  phoneFrame: {
    width: 390,
    height: 844,
    backgroundColor: '#111',
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#2a2a2a',
    boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.03)',
    position: 'relative',
    flexDirection: 'column',
  },
  notch: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 120,
    height: 30,
    backgroundColor: '#111',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 100,
  },
  phoneScreen: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 42,
    backgroundColor: '#fff',
  },
  homeIndicator: {
    height: 5,
    width: 120,
    backgroundColor: '#444',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 8,
    position: 'absolute',
    bottom: 6,
    zIndex: 100,
  },
}) : {};

export default function App() {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      let role;
      let status;
      try {
        token = await AsyncStorage.getItem('userToken');
        role = await AsyncStorage.getItem('userRole');
        status = await AsyncStorage.getItem('userStatus');
      } catch (e) {
        console.log('Restoring token failed');
      }
      setUserToken(token);
      setUserRole(role);
      setUserStatus(status);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const authContext = useMemo(() => ({
    signIn: async (token, role, status) => {
      await AsyncStorage.setItem('userToken', token);
      if (role) await AsyncStorage.setItem('userRole', role);
      if (status) await AsyncStorage.setItem('userStatus', status);
      setUserToken(token);
      setUserRole(role);
      setUserStatus(status);
    },
    signOut: async () => {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userStatus');
      await AsyncStorage.removeItem('userId');
      setUserToken(null);
      setUserRole(null);
      setUserStatus(null);
    },
    continueAsGuest: async () => {
      await AsyncStorage.setItem('userToken', 'GUEST_TOKEN');
      await AsyncStorage.setItem('userRole', 'Guest');
      await AsyncStorage.setItem('userStatus', 'Active');
      setUserToken('GUEST_TOKEN');
      setUserRole('Guest');
      setUserStatus('Active');
    },
    userRole,
    userStatus
  }), [userRole, userStatus]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MobileFrame>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <AppNavigator userToken={userToken} userRole={userRole} userStatus={userStatus} />
          </SafeAreaProvider>
        </MobileFrame>
      </GestureHandlerRootView>
    </AuthContext.Provider>
  );
}
