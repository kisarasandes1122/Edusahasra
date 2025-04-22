import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const DonorRoute = () => {
  const donorInfoString = localStorage.getItem('donorInfo');
  let isAuthenticated = false;

  if (donorInfoString) {
    try {
      const donorInfo = JSON.parse(donorInfoString);
      // Basic check: Does the info exist and contain a token?
      // You could add more checks here (e.g., token expiry if you store it)
      if (donorInfo && donorInfo.token) {
        isAuthenticated = true;
      } else {
        // Clear invalid/incomplete info
        localStorage.removeItem('donorInfo');
      }
    } catch (e) {
      console.error("Error parsing donorInfo from localStorage:", e);
      // Clear corrupted data
      localStorage.removeItem('donorInfo');
    }
  }

  console.log("DonorRoute check: isAuthenticated =", isAuthenticated); // For debugging

  // If authenticated, render the child route element (<Outlet />)
  // Otherwise, redirect to the donor login page
  return isAuthenticated ? <Outlet /> : <Navigate to="/donor-login" replace />;
  // 'replace' prevents the login page from being added to the history stack,
  // so the user doesn't go back to the protected page after logging in by hitting 'back'.
};

export default DonorRoute;