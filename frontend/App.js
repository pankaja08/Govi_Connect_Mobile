import 'react-native-gesture-handler';
import React, { useState, useEffect, useMemo, createContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthContext } from './src/context/AuthContext';

export default function App() {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved token on startup
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
    return null; // Or a splash screen
  }

  return (
    <AuthContext.Provider value={authContext}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AppNavigator userToken={userToken} userRole={userRole} userStatus={userStatus} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthContext.Provider>
  );
}
