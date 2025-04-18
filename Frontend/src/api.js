import axios from 'axios';

// Set default base URL
axios.defaults.baseURL = 'http://localhost:5000';

// Create an axios instance with default configurations
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token for protected routes
api.interceptors.request.use(
  (config) => {
    // Check if we're sending FormData and remove Content-Type header if so
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    let token = null;
    const donorInfo = localStorage.getItem('donorInfo');
    const schoolInfo = localStorage.getItem('schoolInfo');

    // Logic to find the correct token
    if (schoolInfo) {
        try {
            const parsedSchoolInfo = JSON.parse(schoolInfo);
            if (parsedSchoolInfo && parsedSchoolInfo.token) {
                token = parsedSchoolInfo.token;
            }
        } catch (e) {
            localStorage.removeItem('schoolInfo');
        }
    } else if (donorInfo) {
         try {
            const parsedDonorInfo = JSON.parse(donorInfo);
            if (parsedDonorInfo && parsedDonorInfo.token) {
                token = parsedDonorInfo.token;
            }
         } catch (e) {
            localStorage.removeItem('donorInfo');
         }
    }

    // Attach token if found
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling global errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('schoolInfo');
        localStorage.removeItem('donorInfo');
        // Uncomment if you want to redirect to login page
        // if (!window.location.pathname.includes('/login')) {
        //     window.location.href = '/school-login';
        // }
    }
    return Promise.reject(error);
  }
);

export default api;