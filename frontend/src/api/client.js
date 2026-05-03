import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Update this with your actual local IP address for physical device testing
// On Web, localhost is generally safer for CORS and internal routing
const BASE_URL = 'https://goviconnectmobile-production.up.railway.app/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
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
