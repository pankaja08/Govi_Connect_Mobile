import React, { useState, useEffect, useMemo, createContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// --- AUTH CONTEXT ---
export const AuthContext = createContext();

export default function App() {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved token on startup
    const bootstrapAsync = async () => {
      let token;
      let role;
      try {
        token = await AsyncStorage.getItem('userToken');
        role = await AsyncStorage.getItem('userRole');
      } catch (e) {
        console.log('Restoring token failed');
      }
      setUserToken(token);
      setUserRole(role);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const authContext = useMemo(() => ({
    signIn: async (token, role) => {
      await AsyncStorage.setItem('userToken', token);
      if (role) await AsyncStorage.setItem('userRole', role);
      setUserToken(token);
      setUserRole(role);
    },
    signOut: async () => {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      setUserToken(null);
      setUserRole(null);
    },
    continueAsGuest: async () => {
      await AsyncStorage.setItem('userToken', 'GUEST_TOKEN');
      await AsyncStorage.setItem('userRole', 'Guest');
      setUserToken('GUEST_TOKEN');
      setUserRole('Guest');
    }
  }), []);

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <AuthContext.Provider value={authContext}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AppNavigator userToken={userToken} userRole={userRole} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthContext.Provider>
  );
}
