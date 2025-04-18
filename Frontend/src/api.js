import axios from 'axios';

// Set default base URL - Make sure this matches your backend server address
axios.defaults.baseURL = 'http://localhost:5000'; // Or your actual backend URL

// Create an axios instance with default configurations
const api = axios.create({
  baseURL: 'http://localhost:5000', // Or your actual backend URL
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
    // Prioritize schoolInfo for school-specific routes
    const schoolInfo = localStorage.getItem('schoolInfo');
    const donorInfo = localStorage.getItem('donorInfo');

    // Logic to find the correct token (prioritizing school)
    if (schoolInfo) {
        try {
            const parsedSchoolInfo = JSON.parse(schoolInfo);
            if (parsedSchoolInfo && parsedSchoolInfo.token) {
                token = parsedSchoolInfo.token;
                console.log("Using School Token"); // Debug log
            }
        } catch (e) {
            console.error("Error parsing schoolInfo:", e);
            localStorage.removeItem('schoolInfo');
        }
    } else if (donorInfo) {
         try {
            const parsedDonorInfo = JSON.parse(donorInfo);
            if (parsedDonorInfo && parsedDonorInfo.token) {
                token = parsedDonorInfo.token;
                 console.log("Using Donor Token"); // Debug log
            }
         } catch (e) {
             console.error("Error parsing donorInfo:", e);
            localStorage.removeItem('donorInfo');
         }
    } else {
        console.log("No token found in localStorage"); // Debug log
    }


    // Attach token if found
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Authorization header set"); // Debug log
    } else {
       console.warn("No token available for request to:", config.url); // Warn if no token
    }


    return config;
  },
  (error) => {
    console.error("Request Error Interceptor:", error); // Debug log
    return Promise.reject(error);
  }
);

// Response interceptor for handling global errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Response Error Interceptor:", error.response || error.message); // Debug log
    // Handle 401 Unauthorized errors specifically for school/donor tokens
    if (error.response && error.response.status === 401) {
        console.log("Received 401 Unauthorized, clearing tokens."); // Debug log
        // Check which token might have caused the 401
        if (localStorage.getItem('schoolInfo')) {
             localStorage.removeItem('schoolInfo');
             // Optional: Redirect school to login
             // window.location.href = '/school-login';
        } else if (localStorage.getItem('donorInfo')) {
            localStorage.removeItem('donorInfo');
             // Optional: Redirect donor to login
             // window.location.href = '/donor-login';
        }
        // General redirect if unsure which token failed or if both are relevant
        // if (!window.location.pathname.includes('/login')) {
        //     // Redirect to a generic login or home page
        //     // window.location.href = '/login';
        // }
    }
    return Promise.reject(error);
  }
);

export default api;