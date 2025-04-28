// frontend/src/api.js

import axios from 'axios';

// Use environment variable for base URL in production, default to localhost for development
// Ensure process.env.REACT_APP_BACKEND_URL is set correctly in your frontend .env file
axios.defaults.baseURL = 'http://localhost:5000'; // This is the base URL of your server

const api = axios.create({
  baseURL: axios.defaults.baseURL, // <--- Removed /api prefix here
  headers: {
    'Content-Type': 'application/json'
  }
});


api.interceptors.request.use(
  (config) => {
    // Check if we're sending FormData and remove Content-Type header if so
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    let token = null;
    // Check for adminInfo first, then school, then donor
    const adminInfo = localStorage.getItem('adminInfo');
    const schoolInfo = localStorage.getItem('schoolInfo');
    const donorInfo = localStorage.getItem('donorInfo');

    // Logic to find the correct token (prioritizing admin > school > donor)
    if (adminInfo) {
        try {
            const parsedAdminInfo = JSON.parse(adminInfo);
            if (parsedAdminInfo && parsedAdminInfo.token) {
                token = parsedAdminInfo.token;
                 // console.log("Using Admin Token"); // Debug log
            }
        } catch (e) {
            console.error("Error parsing adminInfo:", e);
            localStorage.removeItem('adminInfo'); // Clear corrupted data
        }
    } else if (schoolInfo) {
        try {
            const parsedSchoolInfo = JSON.parse(schoolInfo);
            if (parsedSchoolInfo && parsedSchoolInfo.token) {
                token = parsedSchoolInfo.token;
                // console.log("Using School Token"); // Debug log
            }
        } catch (e) {
            console.error("Error parsing schoolInfo:", e);
            localStorage.removeItem('schoolInfo'); // Clear corrupted data
        }
    } else if (donorInfo) {
         try {
            const parsedDonorInfo = JSON.parse(donorInfo);
            if (parsedDonorInfo && parsedDonorInfo.token) {
                token = parsedDonorInfo.token;
                 // console.log("Using Donor Token"); // Debug log
            }
         } catch (e) {
             console.error("Error parsing donorInfo:", e);
            localStorage.removeItem('donorInfo'); // Clear corrupted data
         }
    } else {
        // console.log("No token found in localStorage"); // Debug log
    }


    // Attach token if found
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log("Authorization header set"); // Debug log
    } else {
       // console.warn("No token available for request to:", config.url); // Warn if no token
    }


    return config;
  },
  (error) => {
    console.error("Request Error Interceptor:", error.response || error.message); // Debug log
    // Handle 401 Unauthorized errors specifically for school/donor/admin tokens
    if (error.response && error.response.status === 401) {
        console.log("Received 401 Unauthorized, clearing tokens."); // Debug log
        // Determine which token to clear based on the path being accessed
         if (window.location.pathname.startsWith('/admin')) {
             localStorage.removeItem('adminInfo');
              // If only one user type can be logged in at a time, clear others too.
              // localStorage.removeItem('schoolInfo');
              // localStorage.removeItem('donorInfo');
             window.location.href = '/admin-login'; // Redirect to admin login
         } else if (window.location.pathname.startsWith('/school')) {
             localStorage.removeItem('schoolInfo');
              // localStorage.removeItem('adminInfo');
              // localStorage.removeItem('donorInfo');
             window.location.href = '/school-login'; // Redirect to school login
         } else if (window.location.pathname.startsWith('/donor') || window.location.pathname === '/' || window.location.pathname.startsWith('/my-')) {
             // Assuming most other protected routes are donor routes
             localStorage.removeItem('donorInfo');
             // localStorage.removeItem('adminInfo');
             // localStorage.removeItem('schoolInfo');
             window.location.href = '/donor-login'; // Redirect to donor login (default for donor routes)
         } else {
             // Fallback for other paths that somehow got a 401
             localStorage.removeItem('donorInfo');
             localStorage.removeItem('schoolInfo');
             localStorage.removeItem('adminInfo');
             window.location.href = '/donor-login'; // Default redirect
         }

        // Note: This interceptor might be too aggressive if a user logs out manually but the token is still
        // briefly in storage. A better approach is often handling 401 errors in the components/hooks
        // that make the specific requests. However, for a simple app, this global handler can work.
    }
    // Also handle 403 Forbidden if needed, though protect middleware throws errors handled by errorHandler

    return Promise.reject(error);
  }
);

// --- Helper function to get full image URL for uploaded files ---
// Backend stores path relative to the 'uploads' directory (e.g., 'impact-story-images/filename.jpg')
// Static serving is configured in server.js for /uploads to serve the 'uploads' directory.
// So, the full URL is BASE_URL + '/uploads/' + relativeUploadPath.
export const getFullImageUrl = (relativeUploadPath) => {
    if (!relativeUploadPath) return null;

    // If it's already a full URL (e.g., from an external source or test data)
     if (relativeUploadPath.startsWith('http') || relativeUploadPath.startsWith('/uploads')) {
         // If the backend gives a full /uploads path, use that.
         if (relativeUploadPath.startsWith('/uploads')) {
             // Use the *original* base URL for static files
             return `${axios.defaults.baseURL}${relativeUploadPath}`;
         }
         return relativeUploadPath; // Assume it's an external URL
     }

    // Ensure the path segment doesn't start with a slash if joining with /uploads/
    const cleanPath = relativeUploadPath.startsWith('/') ? relativeUploadPath.substring(1) : relativeUploadPath;

    // Construct the full URL using the original base URL + /uploads/
    // The backend stores paths like 'impact-story-images/filename.jpg'
    // So the frontend needs to request 'http://localhost:5000/uploads/impact-story-images/filename.jpg'
    return `${axios.defaults.baseURL}/uploads/${cleanPath}`;
};


export default api;