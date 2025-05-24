import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const DonorRoute = () => {
  const donorInfoString = localStorage.getItem('donorInfo');
  let isAuthenticated = false;

  if (donorInfoString) {
    try {
      const donorInfo = JSON.parse(donorInfoString);
      if (donorInfo && donorInfo.token) {
        isAuthenticated = true;
      } else {
        localStorage.removeItem('donorInfo');
      }
    } catch (e) {
      console.error("Error parsing donorInfo from localStorage:", e);
      localStorage.removeItem('donorInfo');
    }
  }

  console.log("DonorRoute check: isAuthenticated =", isAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/donor-login" replace />;
};

export default DonorRoute;