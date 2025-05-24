import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5000'; 

const api = axios.create({
  baseURL: axios.defaults.baseURL, 
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
    const adminInfo = localStorage.getItem('adminInfo');
    const schoolInfo = localStorage.getItem('schoolInfo');
    const donorInfo = localStorage.getItem('donorInfo');

    if (adminInfo) {
        try {
            const parsedAdminInfo = JSON.parse(adminInfo);
            if (parsedAdminInfo && parsedAdminInfo.token) {
                token = parsedAdminInfo.token;
            }
        } catch (e) {
            console.error("Error parsing adminInfo:", e);
            localStorage.removeItem('adminInfo'); 
        }
    } else if (schoolInfo) {
        try {
            const parsedSchoolInfo = JSON.parse(schoolInfo);
            if (parsedSchoolInfo && parsedSchoolInfo.token) {
                token = parsedSchoolInfo.token;
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
            }
         } catch (e) {
             console.error("Error parsing donorInfo:", e);
            localStorage.removeItem('donorInfo'); 
         }
    } else {
    }


    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
    }


    return config;
  },
  (error) => {
    console.error("Request Error Interceptor:", error.response || error.message); 
    if (error.response && error.response.status === 401) {
        console.log("Received 401 Unauthorized, clearing tokens."); 
         if (window.location.pathname.startsWith('/admin')) {
             localStorage.removeItem('adminInfo');
             window.location.href = '/admin-login'; 
         } else if (window.location.pathname.startsWith('/school')) {
             localStorage.removeItem('schoolInfo');
             window.location.href = '/school-login'; 
         } else if (window.location.pathname.startsWith('/donor') || window.location.pathname === '/' || window.location.pathname.startsWith('/my-')) {
             localStorage.removeItem('donorInfo');
             window.location.href = '/donor-login'; 
         } else {
             localStorage.removeItem('donorInfo');
             localStorage.removeItem('schoolInfo');
             localStorage.removeItem('adminInfo');
             window.location.href = '/donor-login'; 
         }

    }
    return Promise.reject(error);
  }
);

export const getFullImageUrl = (relativeUploadPath) => {
    if (!relativeUploadPath) return null;

     if (relativeUploadPath.startsWith('http') || relativeUploadPath.startsWith('/uploads')) {
         if (relativeUploadPath.startsWith('/uploads')) {
             return `${axios.defaults.baseURL}${relativeUploadPath}`;
         }
         return relativeUploadPath; 
     }

    const cleanPath = relativeUploadPath.startsWith('/') ? relativeUploadPath.substring(1) : relativeUploadPath;

    return `${axios.defaults.baseURL}/uploads/${cleanPath}`;
};


export default api;