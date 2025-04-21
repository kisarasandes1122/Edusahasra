import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5000';

const api = axios.create({
  baseURL: 'http://localhost:5000', 
  headers: {
    'Content-Type': 'application/json'
  }
});


api.interceptors.request.use(
  (config) => {
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
            window.location.href = '/school-login';

        } else if (localStorage.getItem('donorInfo')) {
            localStorage.removeItem('donorInfo');
            window.location.href = '/donor-login';
        }
    }
    return Promise.reject(error);
  }
);

export const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Make sure path starts with a slash
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${axios.defaults.baseURL}${path}`;
  };

export default api;