import axios from 'axios';

// Set default base URL
axios.defaults.baseURL = 'http://localhost:5000';

// Create an axios instance with some default configurations
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token for protected routes
api.interceptors.request.use(
  (config) => {
    // Check if there's a stored donor token
    const donorInfo = localStorage.getItem('donorInfo');
    
    if (donorInfo) {
      const { token } = JSON.parse(donorInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;