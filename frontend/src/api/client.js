import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Extract the IP address of the machine running Metro
// On physical devices, hostUri will contain the machine's IP (e.g., '192.168.1.5:8081')
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || 'localhost';

const BASE_URL = Platform.OS === 'web' 
<<<<<<< HEAD
  ? 'http://localhost:5001/api'
  : `http://${localhost}:5001/api`;
=======
  ? 'http://localhost:5000/api'
  : 'http://192.168.1.7:5000/api'; 
>>>>>>> main

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
