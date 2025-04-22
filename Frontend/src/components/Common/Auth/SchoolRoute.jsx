import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const SchoolRoute = () => {
  // Check if school information exists in localStorage
  const schoolInfoString = localStorage.getItem('schoolInfo');
  let isAuthenticated = false;

  if (schoolInfoString) {
    try {
      const schoolInfo = JSON.parse(schoolInfoString);
      // Basic check: Does the info exist and contain a token?
      // Add more checks if needed (e.g., isApproved status if stored, token expiry)
      if (schoolInfo && schoolInfo.token /* && schoolInfo.isApproved */) { // Check for token
        isAuthenticated = true;
      } else {
        // Clear invalid/incomplete info
        localStorage.removeItem('schoolInfo');
      }
    } catch (e) {
      console.error("Error parsing schoolInfo from localStorage:", e);
      // Clear corrupted data
      localStorage.removeItem('schoolInfo');
    }
  }

  console.log("SchoolRoute check: isAuthenticated =", isAuthenticated); // For debugging

  // If authenticated, render the child route element (<Outlet />)
  // Otherwise, redirect to the school login page
  return isAuthenticated ? <Outlet /> : <Navigate to="/school-login" replace />;
};

export default SchoolRoute;