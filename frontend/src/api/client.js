import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Update this with your actual local IP address for physical device testing
// On Web, localhost is generally safer for CORS and internal routing
const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000/api'
  : 'http://192.168.1.4:5000/api'; 

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  async (config) => {
    // Disable caching for GET requests, particularly for Web
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }

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
